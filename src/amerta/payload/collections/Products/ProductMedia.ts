import type { CollectionConfig } from "payload";

import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { SlateToLexicalFeature } from "@payloadcms/richtext-lexical/migrate";

import { anyone } from "../../access/anyone";
import { authenticated } from "../../access/authenticated";
import { formatAdminURL } from "payload/shared";
import config from "@payload-config";
import { getServerSideURL } from "@/amerta/utilities/getURL";

function generateFilePathOrURL({ collectionSlug, config, filename, relative, serverURL, urlOrPath }) {
  if (urlOrPath) {
    if (!urlOrPath.startsWith("/") && !urlOrPath.startsWith(serverURL || "")) {
      // external url
      return urlOrPath;
    }
  }
  if (filename) {
    // local file url
    return formatAdminURL({
      apiRoute: config.routes?.api || "",
      path: `/${collectionSlug}/file/${encodeURIComponent(filename)}`,
      relative,
      serverURL: config.serverURL,
    });
  }
  return null;
}

export const ProductMedia: CollectionConfig = {
  slug: "product-media",
  labels: {
    singular: "Product File",
    plural: "Product Files",
  },
  admin: {
    group: "Products",
    components: {
      beforeListTable: ["@/amerta/components/UnsplashImport#UnsplashImportProductMedia"],
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
    // Upload to the public/products directory in Next.js making them publicly accessible even outside of Payload
    staticDir: "public/products",
    adminThumbnail: (originalDoc: any) => {
      let size = "medium";
      if (originalDoc?.sizes?.thumbnail) {
        size = "thumbnail";
      }

      if(!originalDoc.sizes?.[size]) {
        return null;
      }

      return generateFilePathOrURL({
        collectionSlug: "product-media",
        config,
        filename: originalDoc.sizes?.[size]?.filename,
        relative: false,
        serverURL: getServerSideURL(),
        urlOrPath: originalDoc.sizes?.[size]?.url,
      });
    },
    focalPoint: true,
    imageSizes: [
      {
        name: "thumbnail",
        width: 400,
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
