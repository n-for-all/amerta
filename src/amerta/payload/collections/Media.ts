/**
 * @module Collections/Media
 * @title Media Collection
 * @description This module defines the collections related to the media functionality in Amerta, including media details, file uploads, and related handlers.
 */

import type { CollectionConfig } from "payload";
import path from "path";

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

export const Media: CollectionConfig = {
  slug: "media",
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
