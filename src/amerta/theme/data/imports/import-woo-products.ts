import { PayloadRequest } from "payload";
import csv from "csv-parser";
import { createHeadlessEditor } from "@lexical/headless";
import { $generateNodesFromDOM } from "@lexical/html";
import { $getRoot, $getSelection } from "lexical";
import { JSDOM } from "jsdom";
import { defaultEditorConfig } from "@payloadcms/richtext-lexical";
import configPromise from "@payload-config";

import { getEnabledNodes, sanitizeServerEditorConfig } from "@payloadcms/richtext-lexical";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import fs from "fs";
import path from "path";
import os from "os";

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
      const dom = new JSDOM(`<html><body><div>${html}</div></body></html>`);

      const nodes = $generateNodesFromDOM(editor, dom.window.document);
      $getRoot().select();
      const selection = $getSelection();
      selection?.insertNodes(nodes);
    },
    { discrete: true },
  );

  const editorJSON = editor.getEditorState().toJSON();

  editor.update(
    () => {
      const root = $getRoot();
      root.clear();
    },
    { discrete: true },
  );

  return editorJSON;
};

const uploadImageFromUrl = async (payload, url: string) => {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const filename = url.split("/").pop()?.split("?")[0] || "image.jpg";

    const mediaDoc = await payload.create({
      collection: "product-media",
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
  let tempFilePath = "";

  try {
    const formData = await req.formData!();
    const file = formData.get("file") as File;

    if (!file) {
      return Response.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const tempDir = os.tmpdir();
    const fileName = `woo-import-${Date.now()}.csv`;
    tempFilePath = path.join(tempDir, fileName);

    fs.writeFileSync(tempFilePath, buffer);

    const result = await importWooProductsFromCSV(req, tempFilePath);

    return Response.json(result);
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  } finally {
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
      } catch (e) {
        console.error("Failed to cleanup temp file:", e);
      }
    }
  }
};

export const importWooProductsFromCSV = async (req: PayloadRequest, filePath: string): Promise<{ success: boolean; logs: string[] }> => {
  const rows: any[] = [];
  await new Promise((resolve, reject) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (data) => rows.push(data))
      .on("error", reject)
      .on("end", resolve);
  });

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

  const logs: string[] = [`Parsed ${rows.length} rows. Found ${parents.length} products.`, `Variations grouped: ${Object.keys(variationsMap).length} parents have variations`];

  Object.entries(variationsMap).forEach(([parentId, variations]) => {
    logs.push(`  - Parent ID ${parentId} has ${variations.length} variation(s)`);
  });

  const uniqueCategories = new Set<string>();
  const collectionMap: Record<string, string> = {};

  parents.forEach((row) => {
    if (row.Categories) {
      const cats = row.Categories.split(",").map((c: string) => c.trim());
      cats.forEach((cat: string) => uniqueCategories.add(cat));
    }
  });

  const salesChannel = await getSalesChannel();

  for (const catName of uniqueCategories) {
    try {
      const existing = await req.payload.find({
        collection: "collections",
        where: { title: { equals: catName } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        collectionMap[catName] = existing.docs[0]!.id;
        logs.push(`✓ Collection exists: ${catName}`);
      } else {
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

  const uniqueAttributes = new Map<string, Set<string>>();
  const productOptionMap: Record<string, string> = {};

  parents.forEach((row) => {
    if (row["Attribute 1 name"] && row["Attribute 1 value(s)"]) {
      const attrName = row["Attribute 1 name"].trim();
      const attrValues = row["Attribute 1 value(s)"].split(",").map((v: string) => v.trim());

      if (!uniqueAttributes.has(attrName)) {
        uniqueAttributes.set(attrName, new Set());
      }
      attrValues.forEach((val: string) => uniqueAttributes.get(attrName)!.add(val));
    }
  });

  for (const [attrName, valuesSet] of uniqueAttributes) {
    try {
      const values = Array.from(valuesSet);

      const existing = await req.payload.find({
        collection: "product-options",
        where: { name: { equals: attrName } },
        limit: 1,
      });

      if (existing.docs.length > 0) {
        const existingOption = existing.docs[0]!;
        productOptionMap[attrName] = existingOption.id;

        const existingValues = existingOption.options?.map((opt: any) => opt.option) || [];
        const newValues = values.filter((v) => !existingValues.includes(v));

        if (newValues.length > 0) {
          const updatedOptions = [...(existingOption.options || []), ...newValues.map((val) => ({ option: val, label: val }))];

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

  for (const row of parents) {
    const imageUrls = row.Images ? row.Images.split(",").map((s: string) => s.trim()) : [];
    const imageIds: string[] = [];

    for (const url of imageUrls) {
      const id = await uploadImageFromUrl(req.payload, url);
      if (id) imageIds.push(id);
    }

    const productCollectionIds: string[] = [];
    if (row.Categories) {
      const cats = row.Categories.split(",").map((c: string) => c.trim());
      cats.forEach((cat: string) => {
        if (collectionMap[cat]) {
          productCollectionIds.push(collectionMap[cat]);
        }
      });
    }

    const productId = row.ID || row.id || row["﻿ID"] || "";
    const myVariations = variationsMap[productId] || [];
    const formattedVariants: any[] = [];

    logs.push(`Processing product "${row.Name}" (ID: ${productId}): Found ${myVariations.length} variation(s)`);

    for (const vRow of myVariations) {
      let vImageId = null;
      if (vRow.Images) {
        const vImgId = await uploadImageFromUrl(req.payload, vRow.Images.split(",")[0]);
        if (vImgId) vImageId = vImgId;
      }

      const variantAttrs: Record<string, any> = {};

      if (vRow["Attribute 1 name"] && vRow["Attribute 1 value(s)"]) {
        const attrName = vRow["Attribute 1 name"].trim();
        const optionId = productOptionMap[attrName];
        if (optionId) {
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

    try {
      const cleanExcerpt = row["Short description"]
        ? row["Short description"]
            .replace(/<[^>]*>/g, "")
            .replace(/\\n/g, "\n")
            .trim()
        : "";

      const cleanDescription = row["Description"] ? row["Description"].replace(/\\n/g, "\n") : "";

      await req.payload.create({
        collection: "products",
        data: {
          title: row.Name,
          type: myVariations.length > 0 ? "variant" : "simple",
          excerpt: cleanExcerpt,
          description: (await htmlToLexical(cleanDescription)) as any,
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

  return { success: true, logs };
};

const safeSplit = (str: any): string[] => {
  if (!str) return [];
  const s = String(str);
  
  // Split by pipe or comma
  const rawValues = s.includes("|") ? s.split("|") : s.split(",");
  
  // 1. Trim whitespace
  // 2. Filter out empty strings
  // 3. Remove duplicates using Set
  const cleanValues = rawValues
    .map((i) => i.trim())
    .filter((i) => i.length > 0);

  return Array.from(new Set(cleanValues));
};

type ImportOptions = {
  signal?: AbortSignal;
  onProgress?: (data: { progress: number; message: string; logs?: string[] }) => void;
};

export const importWooProductsJSON = async (
  req: PayloadRequest,
  products: any[],
  options: {
    signal?: AbortSignal;
    onProgress?: (data: { progress: number; message: string; logs?: string[] }) => void;
  } = {}
): Promise<{ success: boolean; logs: string[] }> => {
  const logs: string[] = [];
  const { signal, onProgress } = options;

  try {
    // -------------------------------------------------------
    // 1. Grouping: Map Variations to Parent SKUs
    // -------------------------------------------------------
    const variationsMap: Record<string, any[]> = {}; // Key: Parent SKU -> Value: Array of Variation Rows
    const parents: any[] = [];

    // First pass: Organize data
    products.forEach((row) => {
      // Normalize Type
      const type = row.Type?.toLowerCase() || "simple";
      
      if (type === "variation" || type === "variable-subscription") {
        // This is a child. It should have a "Parent" field pointing to a SKU (e.g. "MH01")
        const parentSku = row.Parent?.trim();
        if (parentSku) {
          if (!variationsMap[parentSku]) variationsMap[parentSku] = [];
          variationsMap[parentSku].push(row);
        } else {
          logs.push(`⚠️ Warning: Variation ${row.SKU || row.Name} has no Parent SKU. Skipping.`);
        }
      } else {
        // This is a Parent (Variable) or Simple product
        parents.push(row);
      }
    });

    logs.push(`Found ${parents.length} main products and ${Object.values(variationsMap).flat().length} variations.`);

    // -------------------------------------------------------
    // 2. Setup: Collections & Attributes
    // -------------------------------------------------------
    const uniqueCategories = new Set<string>();
    const uniqueAttributes = new Map<string, Set<string>>();
    const collectionMap: Record<string, string> = {};
    const productOptionMap: Record<string, string> = {};

    // Gather unique Collections & Attributes from PARENTS only
    // (Parents usually define the full set of attributes like "XS|S|M|L")
    parents.forEach((row) => {
      // Categories
      if (row.Categories) {
        safeSplit(row.Categories).forEach((path) => {
          const leaf = path.split(">").pop()?.trim();
          if (leaf) uniqueCategories.add(leaf);
        });
      }
      
      // Attributes (1-5)
      for (let i = 1; i <= 5; i++) {
        const name = row[`Attribute ${i} name`]?.trim();
        const vals = row[`Attribute ${i} value(s)`];
        if (name && vals) {
          if (!uniqueAttributes.has(name)) uniqueAttributes.set(name, new Set());
          safeSplit(vals).forEach((v) => uniqueAttributes.get(name)!.add(v));
        }
      }
    });

    // Helper for progress
    const totalSteps = uniqueCategories.size + uniqueAttributes.size + parents.length;
    let currentStep = 0;
    const tick = (msg: string) => {
      currentStep++;
      const p = Math.min(99, Math.round((currentStep / totalSteps) * 100));
      if (onProgress) onProgress({ progress: p, message: msg, logs: [...logs] });
    };

    const salesChannel = await getSalesChannel();

    // Import Collections
    for (const catName of uniqueCategories) {
      if (signal?.aborted) throw new Error("Cancelled");
      try {
        const existing = await req.payload.find({
          collection: "collections",
          where: { title: { equals: catName } },
          limit: 1,
        });
        if (existing.docs.length > 0) {
          collectionMap[catName] = existing.docs[0]!.id;
        } else {
          const newDoc = await req.payload.create({
            collection: "collections",
            data: { title: catName, _status: "published", salesChannels: salesChannel ? [salesChannel.id] : [] },
          });
          collectionMap[catName] = newDoc.id;
          logs.push(`✅ Created Collection: ${catName}`);
        }
      } catch (e) { /* ignore */ }
      tick(`Collection: ${catName}`);
    }

    // Import Attributes (Product Options)
    for (const [attrName, valSet] of uniqueAttributes) {
      if (signal?.aborted) throw new Error("Cancelled");
      try {
        const values = Array.from(valSet);
        if (!values.length) continue;

        const existing = await req.payload.find({
          collection: "product-options",
          where: { name: { equals: attrName } },
          limit: 1,
        });

        if (existing.docs.length > 0) {
          const doc = existing.docs[0]!;
          productOptionMap[attrName] = doc.id;
          // Update existing with new values if needed
          const currentOpts = doc.options?.map((o: any) => o.option) || [];
          const newOpts = values.filter((v) => !currentOpts.includes(v));
          if (newOpts.length > 0) {
             const merged = [...(doc.options || []), ...newOpts.map(v => ({ option: v, label: v }))];
             await req.payload.update({ collection: "product-options", id: doc.id, data: { options: merged } });
          }
        } else {
          const newDoc = await req.payload.create({
            collection: "product-options",
            data: {
              name: attrName,
              label: attrName,
              type: "dropdown", // Default
              options: values.map(v => ({ option: v, label: v })),
              showInFilter: true
            },
          });
          productOptionMap[attrName] = newDoc.id;
          logs.push(`✅ Created Option: ${attrName}`);
        }
      } catch (e) { /* ignore */ }
      tick(`Option: ${attrName}`);
    }

    // -------------------------------------------------------
    // 3. Create Products (Parents + Variations)
    // -------------------------------------------------------
    for (const parentRow of parents) {
      if (signal?.aborted) throw new Error("Cancelled");

      const parentSKU = parentRow.SKU;
      const parentType = parentRow.Type?.toLowerCase();
      
      // Look up children using the SKU
      const variationRows = parentSKU ? (variationsMap[parentSKU] || []) : [];
      
      // Determine Payload Product Type
      // If it is marked "variable" OR has children, treat as variant product
      const isVariable = parentType === "variable" || variationRows.length > 0;
      const payloadType = isVariable ? "variant" : "simple";

      // A. Parent Images
      const imageIds: string[] = [];
      for (const url of safeSplit(parentRow.Images)) {
        try {
          const id = await uploadImageFromUrl(req.payload, url);
          if (id) imageIds.push(id);
        } catch (e) {}
      }

      // B. Collections
      const collectionIds: string[] = [];
      if (parentRow.Categories) {
        safeSplit(parentRow.Categories).forEach(path => {
          const leaf = path.split(">").pop()?.trim();
          if (leaf && collectionMap[leaf]) collectionIds.push(collectionMap[leaf]);
        });
      }

      // C. Build Variants Array
      const variantsData: any[] = [];
      
      if (isVariable) {
        for (const vRow of variationRows) {
          // Variant Image (usually just 1)
          let vImageId = null;
          const vUrls = safeSplit(vRow.Images);
          if (vUrls.length > 0) {
             vImageId = await uploadImageFromUrl(req.payload, vUrls[0]!);
          }

          // Variant Attributes
          const variantAttrs: Record<string, any> = {};
          
          for (let i = 1; i <= 5; i++) {
             const name = vRow[`Attribute ${i} name`]?.trim();
             const val = vRow[`Attribute ${i} value(s)`]?.trim();
             
             if (name && val && productOptionMap[name]) {
               const optionId = productOptionMap[name];
               variantAttrs[optionId] = {
                 name: name,
                 value: val // Specific value for this variant (e.g. "L")
               };
             }
          }

          variantsData.push({
            variant: variantAttrs,
            price: parseFloat(vRow["Regular price"] || parentRow["Regular price"] || "0"),
            sku: vRow.SKU,
            stockStatus: String(vRow["In stock?"]) === "1" ? "in_stock" : "out_of_stock",
            image: vImageId,
            requires_shipping: true
          });
        }
      }

      // D. Create the Product
      try {
        const cleanDesc = parentRow.description ? parentRow.description.replace(/\\n/g, "\n") : "";
        
        await req.payload.create({
          collection: "products",
          data: {
            title: parentRow.Name,
            type: payloadType, // 'simple' or 'variant'
            sku: parentRow.SKU,
            price: parseFloat(parentRow["Regular price"] || "0"),
            description: await htmlToLexical(cleanDesc) as any,
            excerpt: parentRow["Short description"] || "",
            stockStatus: String(parentRow["In stock?"]) === "1" ? "in_stock" : "out_of_stock",
            images: imageIds,
            collections: collectionIds,
            variants: variantsData, // <-- The linked variations
            _status: "published",
            salesChannels: salesChannel ? [salesChannel.id] : [],
          }
        });
        logs.push(`✅ Created ${payloadType}: ${parentRow.Name} (${variantsData.length} variants)`);
      } catch (e: any) {
        logs.push(`❌ Failed ${parentRow.Name}: ${e.message}`);
      }

      tick(`Product: ${parentRow.Name}`);
    }

    return { success: true, logs };

  } catch (error: any) {
    if (signal?.aborted) return { success: false, logs: [...logs, "❌ Cancelled"] };
    return { success: false, logs: [...logs, `Error: ${error.message}`] };
  }
};
