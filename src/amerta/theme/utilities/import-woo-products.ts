import { PayloadRequest } from "payload";
import { Readable } from "stream";
import csv from "csv-parser";
import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection } from "lexical";
import { JSDOM } from "jsdom";
import { defaultEditorConfig } from "@payloadcms/richtext-lexical";
import configPromise from "@payload-config";

import { getEnabledNodes, sanitizeServerEditorConfig } from "@payloadcms/richtext-lexical";
import { getSalesChannel } from "./get-sales-channel";

export const htmlToLexical = async (html) => {
  const editor = createHeadlessEditor({
    nodes: [
      ...getEnabledNodes({
        editorConfig: await sanitizeServerEditorConfig(defaultEditorConfig, await configPromise),
      }),
    ],
  });

  editor.update(
    () => {
      // In a headless environment you can use a package such as JSDom to parse the HTML string.
      const dom = new JSDOM(`<html><body><div>${html}</div></body></html>`);

      // Once you have the DOM instance it's easy to generate LexicalNodes.
      const nodes = $generateNodesFromDOM(editor, dom.window.document);
      $getRoot().select();
      const selection = $getSelection();
      selection?.insertNodes(nodes);
    },
    { discrete: true },
  );

  // Do this if you then want to get the editor JSON
  const editorJSON = editor.getEditorState().toJSON();

  // Clear Editor state
  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
    },
    { discrete: true },
  );

  return editorJSON;
};
// Helper: Upload Image from URL (Server-side)
const uploadImageFromUrl = async (payload, url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = url.split("/").pop()?.split("?")[0] || "image.jpg";

    const mediaDoc = await payload.create({
      collection: "product-media", // Ensure this matches your media slug
      data: {
        alt: filename,
      },
      file: {
        data: buffer,
        name: filename,
        mimetype: res.headers.get("content-type") || "image/jpeg",
        size: buffer.length,
      },
    });

    return mediaDoc.id;
  } catch (e) {
    console.error(`Failed to upload ${url}`, e);
    return null;
  }
};

export const importWooProductsHandler = async (req: PayloadRequest): Promise<Response> => {
  try {
    const formData = await req.formData!();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const stream = Readable.from(buffer);

    const rows: any[] = [];
    await new Promise((resolve, reject) => {
      stream
        .pipe(csv())
        .on("data", (data) => rows.push(data))
        .on("error", reject)
        .on("end", resolve);
    });

    // 4. Group Variations (Logic moved to server)
    const variationsMap: Record<string, any[]> = {};
    const parents: any[] = [];

    rows.forEach((row) => {
      if (row.Type === "variation") {
        const parentId = row.Parent?.replace("id:", "").trim();
        if (parentId) {
          if (!variationsMap[parentId]) variationsMap[parentId] = [];
          variationsMap[parentId].push(row);
        }
      } else {
        parents.push(row);
      }
    });

    const logs: string[] = [
      `Parsed ${rows.length} rows. Found ${parents.length} products.`,
      `Variations grouped: ${Object.keys(variationsMap).length} parents have variations`,
    ];

    // Log variation counts for debugging
    Object.entries(variationsMap).forEach(([parentId, variations]) => {
      logs.push(`  - Parent ID ${parentId} has ${variations.length} variation(s)`);
    });

    // 5. Import Categories as Collections
    const uniqueCategories = new Set<string>();
    const collectionMap: Record<string, string> = {}; // category name -> collection ID

    parents.forEach((row) => {
      if (row.Categories) {
        const cats = row.Categories.split(",").map((c: string) => c.trim());
        cats.forEach((cat: string) => uniqueCategories.add(cat));
      }
    });

    const salesChannel = await getSalesChannel();

    for (const catName of uniqueCategories) {
      try {
        // Check if collection exists
        const existing = await req.payload.find({
          collection: "collections",
          where: { title: { equals: catName } },
          limit: 1,
        });

        if (existing.docs.length > 0) {
          collectionMap[catName] = existing.docs[0]!.id;
          logs.push(`✓ Collection exists: ${catName}`);
        } else {
          // Create collection
          const newCollection = await req.payload.create({
            collection: "collections",
            data: {
              title: catName,
              _status: "published",
              salesChannels: salesChannel ? [salesChannel.id] : [],
            },
            draft: false,
          });
          collectionMap[catName] = newCollection.id;
          logs.push(`✅ Created collection: ${catName}`);
        }
      } catch (e: any) {
        logs.push(`❌ Error with collection ${catName}: ${e.message}`);
      }
    }

    // 6. Import Attributes as ProductOptions
    const uniqueAttributes = new Map<string, Set<string>>(); // attribute name -> set of values
    const productOptionMap: Record<string, string> = {}; // attribute name -> product option ID

    parents.forEach((row) => {
      if (row["Attribute 1 name"] && row["Attribute 1 value(s)"]) {
        const attrName = row["Attribute 1 name"].trim();
        const attrValues = row["Attribute 1 value(s)"]
          .split(",")
          .map((v: string) => v.trim());

        if (!uniqueAttributes.has(attrName)) {
          uniqueAttributes.set(attrName, new Set());
        }
        attrValues.forEach((val: string) => uniqueAttributes.get(attrName)!.add(val));
      }
    });

    for (const [attrName, valuesSet] of uniqueAttributes) {
      try {
        const values = Array.from(valuesSet);
        
        // Check if product option exists
        const existing = await req.payload.find({
          collection: "product-options",
          where: { name: { equals: attrName } },
          limit: 1,
        });

        if (existing.docs.length > 0) {
          const existingOption = existing.docs[0]!;
          productOptionMap[attrName] = existingOption.id;

          // Add new values if they don't exist
          const existingValues = existingOption.options?.map((opt: any) => opt.option) || [];
          const newValues = values.filter((v) => !existingValues.includes(v));

          if (newValues.length > 0) {
            const updatedOptions = [
              ...(existingOption.options || []),
              ...newValues.map((val) => ({ option: val, label: val })),
            ];

            await req.payload.update({
              collection: "product-options",
              id: existingOption.id,
              data: {
                options: updatedOptions,
              },
            });
            logs.push(`✅ Updated product option: ${attrName} (added ${newValues.length} values)`);
          } else {
            logs.push(`✓ Product option exists: ${attrName}`);
          }
        } else {
          // Create product option
          const newOption = await req.payload.create({
            collection: "product-options",
            data: {
              label: attrName,
              name: attrName,
              type: "dropdown",
              showInFilter: true,
              showInSearch: true,
              options: values.map((val) => ({ option: val, label: val })),
            },
          });
          productOptionMap[attrName] = newOption.id;
          logs.push(`✅ Created product option: ${attrName} with ${values.length} values`);
        }
      } catch (e: any) {
        logs.push(`❌ Error with product option ${attrName}: ${e.message}`);
      }
    }

    // 7. Process Product Imports
    for (const row of parents) {
      // A. Parent Images
      const imageUrls = row.Images ? row.Images.split(",").map((s: string) => s.trim()) : [];
      const imageIds: string[] = [];

      for (const url of imageUrls) {
        const id = await uploadImageFromUrl(req.payload, url);
        if (id) imageIds.push(id);
      }

      // B. Get Collections
      const productCollectionIds: string[] = [];
      if (row.Categories) {
        const cats = row.Categories.split(",").map((c: string) => c.trim());
        cats.forEach((cat: string) => {
          if (collectionMap[cat]) {
            productCollectionIds.push(collectionMap[cat]);
          }
        });
      }

      // C. Variants
      // Access ID - try multiple possible column names
      const productId = row.ID || row.id || row['﻿ID'] || ''; // BOM character might be present
      const myVariations = variationsMap[productId] || [];
      const formattedVariants: any[] = [];

      // Debug log
      logs.push(`Processing product "${row.Name}" (ID: ${productId}): Found ${myVariations.length} variation(s)`);

      for (const vRow of myVariations) {
        let vImageId = null;
        if (vRow.Images) {
          const vImgId = await uploadImageFromUrl(req.payload, vRow.Images.split(",")[0]);
          if (vImgId) vImageId = vImgId;
        }

        // Build variant attributes object (keyed by product option ID)
        const variantAttrs: Record<string, any> = {};
        
        if (vRow["Attribute 1 name"] && vRow["Attribute 1 value(s)"]) {
          const attrName = vRow["Attribute 1 name"].trim();
          const optionId = productOptionMap[attrName];
          if (optionId) {
            // Get the product option to determine type
            const existingOption = await req.payload.findByID({
              collection: "product-options",
              id: optionId,
            });
            
            variantAttrs[optionId] = {
              name: attrName,
              type: existingOption.type,
              value: vRow["Attribute 1 value(s)"].trim(),
            };
          }
        }
        
        if (vRow["Attribute 2 name"] && vRow["Attribute 2 value(s)"]) {
          const attrName = vRow["Attribute 2 name"].trim();
          const optionId = productOptionMap[attrName];
          if (optionId) {
            // Get the product option to determine type
            const existingOption = await req.payload.findByID({
              collection: "product-options",
              id: optionId,
            });
            
            variantAttrs[optionId] = {
              name: attrName,
              type: existingOption.type,
              value: vRow["Attribute 2 value(s)"].trim(),
            };
          }
        }

        formattedVariants.push({
          variant: variantAttrs,
          price: parseFloat(vRow["Regular price"] || "0"),
          salePrice: vRow["Sale price"] ? parseFloat(vRow["Sale price"]) : null,
          sku: vRow.SKU,
          stockStatus: vRow["In stock?"] == "1" ? "in_stock" : "out_of_stock",
          quantity: vRow.Stock ? parseInt(vRow.Stock) : 0,
          trackInventory: !!vRow.Stock,
          image: vImageId,
          requires_shipping: true,
        });
      }

      // D. Create Product
      try {
        // Clean excerpt: remove HTML tags and replace literal \n with actual newlines
        const cleanExcerpt = row["Short description"]
          ? row["Short description"]
              .replace(/<[^>]*>/g, '') // Remove HTML tags
              .replace(/\\n/g, '\n') // Replace literal \n with actual newlines
              .trim()
          : '';

        // Clean description: replace literal \n with actual newlines
        const cleanDescription = row["Description"]
          ? row["Description"].replace(/\\n/g, '\n')
          : '';

        await req.payload.create({
          collection: "products",
          data: {
            title: row.Name,
            type: myVariations.length > 0 ? "variant" : "simple",
            excerpt: cleanExcerpt,
            description: await htmlToLexical(cleanDescription) as any, // Convert HTML to Lexical JSON
            price: parseFloat(row["Regular price"] || "0"),
            sku: row.SKU,
            stockStatus: row["In stock?"] == "1" ? "in_stock" : "out_of_stock",
            isFeatured: row["Is featured?"] == "1",
            images: imageIds,
            collections: productCollectionIds,
            variants: formattedVariants,
            _status: "published",
            salesChannels: salesChannel ? [salesChannel.id] : [],
          },
        });
        logs.push(`✅ Created: ${row.Name}`);
      } catch (e: any) {
        logs.push(`❌ Error creating ${row.Name}: ${e.message}`);
      }
    }

    return Response.json({ success: true, logs });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
