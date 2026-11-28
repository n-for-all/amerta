/**
 * @module Collections/Media
 * @title Media Collection
 * @description This module defines the collections related to the media functionality in Amerta, including media details, file uploads, and related handlers.
 */

import type { CollectionAfterChangeHook, CollectionBeforeOperationHook, CollectionConfig } from "payload";
import fs from "fs";
import path from "path";
import sharp from "sharp";

import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { SlateToLexicalFeature } from "@payloadcms/richtext-lexical/migrate";

import { anyone } from "../access/anyone";
import { authenticated } from "../access/authenticated";

/**
 * Folder that holds uploaded files. The production server runs from `.next/standalone`, which every
 * `npm run build` deletes and recreates, so uploads are kept in the project's own `public/` folder instead.
 */
export const uploadDir = (folder: string) => {
  const cwd = process.cwd();
  const root = cwd.endsWith(path.join(".next", "standalone")) ? path.resolve(cwd, "../..") : cwd;
  return path.join(root, "public", folder);
};

/**
 * Same picture, same dimensions, same format, fewer kilobytes (what a tool like TinyPNG does).
 * A photo saved as PNG typically drops to a quarter of its weight. Returns null when the picture
 * is not a PNG or JPEG, is animated, or would not get smaller.
 */
const compressPicture = async (data: Buffer, mimeType?: string | null): Promise<Buffer | null> => {
  let compressed: Buffer | null = null;
  if (mimeType === "image/png") {
    const { pages } = await sharp(data).metadata();
    if (!pages || pages === 1) compressed = await sharp(data).png({ palette: true, quality: 80, effort: 7, compressionLevel: 9 }).toBuffer();
  } else if (mimeType === "image/jpeg") {
    // rotate() applies the camera's orientation, which would otherwise be lost with the rest of the metadata
    compressed = await sharp(data).rotate().jpeg({ quality: 82, mozjpeg: true }).toBuffer();
  }
  return compressed && compressed.length < data.length ? compressed : null;
};

/** Compresses an uploaded PNG or JPEG before it is saved. Anything that fails leaves the upload as it was. */
export const compressUpload: CollectionBeforeOperationHook = async ({ args, operation, req }) => {
  const file = req.file;
  if ((operation !== "create" && operation !== "update") || !file?.data?.length) return args;

  try {
    const compressed = await compressPicture(file.data, file.mimetype);
    if (compressed) {
      file.data = compressed;
      file.size = compressed.length;
    }
  } catch (error) {
    req.payload.logger.warn({ err: error, msg: `Could not compress the uploaded picture "${file.name}"; it is saved as uploaded.` });
  }
  return args;
};

/**
 * Compresses the resized copies sharp made of a new upload (thumbnail, medium, ...), in place and in
 * their own format, then records their new weight. Only for files kept in the collection's folder on this server.
 */
export const compressUploadSizes =
  (folder: string): CollectionAfterChangeHook =>
  async ({ collection, doc, req }) => {
    if (!req.file || !doc?.sizes) return doc;

    let changed = false;
    for (const size of Object.values<any>(doc.sizes)) {
      if (!size?.filename) continue;
      const filePath = path.join(uploadDir(folder), size.filename);
      try {
        if (!fs.existsSync(filePath)) continue;
        const compressed = await compressPicture(await fs.promises.readFile(filePath), size.mimeType);
        if (!compressed) continue;
        await fs.promises.writeFile(filePath, compressed);
        size.filesize = compressed.length;
        changed = true;
      } catch (error) {
        req.payload.logger.warn({ err: error, msg: `Could not compress "${size.filename}"; it is kept as it was.` });
      }
    }

    if (changed) await req.payload.db.updateOne({ collection: collection.slug, id: doc.id, data: { sizes: doc.sizes }, req });
    return doc;
  };

export const Media: CollectionConfig = {
  slug: "media",
  hooks: {
    beforeOperation: [compressUpload],
    afterChange: [compressUploadSizes("media")],
  },
  labels: {
    singular: "File",
    plural: "Files",
  },
  admin: {
    group: "Content",
    components: {
      beforeListTable: ["@/amerta/components/UnsplashImport#UnsplashImport"],
    },
  },
  access: {
    create: authenticated,
    delete: authenticated,
    read: anyone,
    update: authenticated,
  },
  fields: [
    {
      name: "title",
      type: "text",
      localized: true,
      //required: true,
    },
    {
      name: "alt",
      type: "text",
      localized: true,
      //required: true,
    },
    {
      name: "caption",
      type: "richText",
      localized: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature(), SlateToLexicalFeature({})];
        },
      }),
    },
  ],
  upload: {
    // Upload to the public/media directory in Next.js making them publicly accessible even outside of Payload
    staticDir: uploadDir("media"),
    adminThumbnail: "thumbnail",
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 300,
      },
      {
        name: "square",
        width: 500,
        height: 500,
      },
      {
        name: "small",
        width: 600,
      },
      {
        name: "medium",
        width: 900,
      },
      {
        name: "large",
        width: 1400,
      },
      {
        name: "xlarge",
        width: 1920,
      },
      {
        name: "og",
        width: 1200,
        height: 630,
        crop: "center",
      },
    ],
  },
};
