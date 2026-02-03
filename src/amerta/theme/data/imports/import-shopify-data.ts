import { PayloadRequest } from "payload";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { htmlToLexical } from "@/amerta/theme/data/imports/import-woo-products"; // Assuming you have this helper

interface ShopifyCollection {
  id: number;
  handle: string;
  title: string;
  description: string;
  image: { src: string; alt: string } | null;
}

interface ShopifyProduct {
  id: number;
  title: string;
  handle: string;
  body_html: string;
  tags: string;
  variants: Array<{
    id: number;
    title: string;
    price: string;
    sku: string;
    compare_at_price: string;
    requires_shipping: boolean;
    option1: string | null;
    option2: string | null;
    option3: string | null;
  }>;
  options: Array<{ name: string; values: string[] }>;
  images: Array<{ id: number; src: string; alt: string | null }>;
}

// --- Helper: Download Image ---
const downloadAndUploadImage = async (payload: any, url: string, filename: string, alt: string) => {
  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const buffer = Buffer.from(await (response as any).arrayBuffer());
    // Basic ext detection
    const ext = url.includes(".png") ? ".png" : url.includes(".webp") ? ".webp" : ".jpg";
    const mimetype = url.includes(".png") ? "image/png" : url.includes(".webp") ? "image/webp" : "image/jpeg";
    const finalFilename = filename.endsWith(ext) ? filename : filename + ext;

    const mediaDoc = await payload.create({
      collection: "product-media",
      data: { alt: alt || finalFilename },
      file: { data: buffer, mimetype, name: finalFilename },
    });
    return mediaDoc.id;
  } catch (e) {
    return null;
  }
};

export const importShopifyData = async (
  req: PayloadRequest,
  storeUrl: string,
  options: {
    onProgress: (data: { progress: number; message: string; logs?: string[] }) => void;
  },
) => {
  const { payload } = req;
  const logs: string[] = [];

  // Helper to log and update UI
  const log = (msg: string) => {
    logs.push(msg);
    if (logs.length > 100) logs.shift(); // Keep logs memory efficient
  };

  // 1. Sanitize URL
  const API_URL = storeUrl.replace(/\/$/, "");

  try {
    // --- Step A: Setup & Pre-fetch ---
    options.onProgress({ progress: 1, message: "Initializing...", logs });

    // Fetch all available Payload Product Options (Size, Color, etc.) for mapping later
    const allOptions = await payload.find({ collection: "product-options", limit: 1000 });
    const optionsByName: { [key: string]: any } = {};
    for (const option of allOptions.docs) {
      optionsByName[option.name.toLowerCase()] = option;
    }
    log(`Loaded ${allOptions.totalDocs} global product options from database.`);

    // --- Step B: Collections ---
    options.onProgress({ progress: 5, message: "Fetching collections...", logs });

    const colRes = await fetch(`${API_URL}/collections.json`);
    if (!colRes.ok) throw new Error(`Failed to fetch collections from ${API_URL}`);
    const { collections } = (await colRes.json()) as { collections: ShopifyCollection[] };

    log(`Found ${collections.length} collections`);

    let processedCount = 0;
    const totalItems = collections.length;

    // Loop through Collections
    for (const collection of collections) {
      processedCount++;
      // Calculate progress (Scale 10% -> 90%)
      const currentProgress = 10 + Math.floor((processedCount / totalItems) * 80);

      options.onProgress({
        progress: currentProgress,
        message: `Processing collection: ${collection.title}`,
        logs,
      });

      // 1. Create/Find Collection
      let collectionDocID: string | null = null;
      const existing = await payload.find({
        collection: "collections",
        where: { slug: { equals: collection.handle } },
      });

      if (existing.docs.length > 0) {
        collectionDocID = existing.docs[0]!.id;
        log(`Collection "${collection.title}" exists. Using ID: ${collectionDocID}`);
      } else {
        // Download Image
        let imgId = null;
        if (collection.image?.src) {
          imgId = await downloadAndUploadImage(payload, collection.image.src, `col-${collection.handle}-${Date.now()}`, collection.title);
        }

        const salesChannel = await getSalesChannel();

        let description: any = null;
        try {
          description = await htmlToLexical(collection.description);
        } catch (e) {}

        const newCol = await payload.create({
          collection: "collections",
          data: {
            title: collection.title,
            slug: collection.handle,
            description: description,
            image: imgId,
            salesChannels: salesChannel ? [salesChannel.id] : [],
            _status: "published",
          },
        });
        collectionDocID = newCol.id;
        log(`Created collection: "${collection.title}"`);
      }

      // 2. Fetch Products for this Collection
      const prodRes = await fetch(`${API_URL}/collections/${collection.handle}/products.json`);
      if (!prodRes.ok) {
        log(`Warning: Failed to fetch products for ${collection.title}`);
        continue;
      }
      const { products } = (await prodRes.json()) as { products: ShopifyProduct[] };
      log(`Found ${products.length} products in "${collection.title}"`);

      // 3. Process Products
      for (const product of products) {
        const existingProd = await payload.find({
          collection: "products",
          where: { slug: { equals: product.handle } },
        });

        if (existingProd.docs.length > 0) {
          log(`> Product "${product.title}" already exists. Skipping.`);
          continue;
        }

        // --- Handle Images ---
        const imageIds: string[] = [];
        for (const img of product.images) {
          const id = await downloadAndUploadImage(payload, img.src, `prod-${product.handle}-${img.id}`, img.alt || product.title);
          if (id) imageIds.push(id);
        }

        // --- Handle Variants & Options Mapping ---
        const variants = product.variants.map((variant) => {
          const variantObject: any = {};
          const optionNames = product.options.map((opt) => opt.name);

          // Helper to map option1/2/3 to Payload Option IDs
          const mapVariantOption = (idx: number, val: string | null) => {
            if (!val || !optionNames[idx]) return;
            const optName = optionNames[idx].toLowerCase();
            const productOption = optionsByName[optName];

            if (productOption) {
              const optId = productOption.id;
              // Type: Dropdown / Radio
              if (["dropdown", "radio"].includes(productOption.type)) {
                const match = productOption.options?.find((o: any) => o.option?.toLowerCase() === val.toLowerCase());
                variantObject[optId] = { option: val, label: match?.label || val };
              }
              // Type: Color
              else if (productOption.type === "color") {
                const match = productOption.colors?.find((c: any) => c.label?.toLowerCase() === val.toLowerCase());
                variantObject[optId] = { label: val, color: match?.color || "#000000" };
              }
              // Type: Text / Other
              else {
                variantObject[optId] = val;
              }
            }
          };

          mapVariantOption(0, variant.option1);
          mapVariantOption(1, variant.option2);
          mapVariantOption(2, variant.option3);

          return {
            variant: variantObject,
            sku: variant.sku || null,
            barcode: "",
            price: parseFloat(variant.price),
            salePrice: variant.compare_at_price ? parseFloat(variant.compare_at_price) : null,
            trackInventory: true,
            quantity: 100,
            stockStatus: "in_stock" as const,
            requires_shipping: variant.requires_shipping,
          };
        });

        // --- Handle Tags ---
        const tagArray = Array.isArray(product.tags)
          ? product.tags
          : product.tags
              .split(",")
              .map((t) => t.trim())
              .filter(Boolean);

        const tagIds: string[] = [];
        for (const t of tagArray) {
          const tagQuery = await payload.find({ collection: "product-tags", where: { name: { equals: t } }, limit: 1 });
          if (tagQuery.docs[0]) {
            tagIds.push(tagQuery.docs[0].id);
          } else {
            const newTag = await payload.create({ collection: "product-tags", data: { name: t } });
            tagIds.push(newTag.id);
          }
        }

        // --- Create Product ---
        try {
          // Description
          let description: any = null;
          try {
            description = await htmlToLexical(product.body_html);
          } catch (e) {
            description = product.body_html?.substring(0, 500);
          }

          const salesChannels = await payload.find({ collection: "sales-channel", where: { enabled: { equals: "1" } } });

          await payload.create({
            collection: "products",
            data: {
              title: product.title,
              slug: product.handle,
              type: "variant",
              price: variants[0]?.price || 0,
              salePrice: variants[0]?.salePrice || null,
              images: imageIds,
              description: description,
              variants: variants,
              collections: collectionDocID ? [collectionDocID] : [],
              tags: tagIds,
              salesChannels: salesChannels.docs.map((d) => d.id),
              _status: "published",
            },
          });
          log(`Imported product: ${product.title}`);
        } catch (prodError: any) {
          log(`Error creating product "${product.title}": ${prodError.message}`);
        }
      }
    }

    options.onProgress({ progress: 100, message: "Import Complete!", logs });
  } catch (e: any) {
    throw new Error(e.message);
  }
};

export const importShopifyDataHandler = async (req: PayloadRequest): Promise<Response> => {
  const encoder = new TextEncoder();

  // 1. Parse Body to get URL
  let storeUrl = "";
  try {
    const body = await req.json!();
    storeUrl = body.url;
  } catch (e) {
    return new Response("Invalid JSON body", { status: 400 });
  }

  if (!storeUrl) {
    return new Response("Missing 'url' in body", { status: 400 });
  }

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // 2. Call the logic function
        await importShopifyData(req, storeUrl, {
          onProgress: (data) => {
            const jsonString = JSON.stringify(data);
            controller.enqueue(encoder.encode(jsonString + "\n"));
          },
        });

        // 3. Close stream
        controller.enqueue(encoder.encode(JSON.stringify({ done: true }) + "\n"));
        controller.close();
      } catch (error: any) {
        const errorJson = JSON.stringify({ error: error.message });
        controller.enqueue(encoder.encode(errorJson + "\n"));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "application/json",
      "Transfer-Encoding": "chunked",
    },
  });
};
