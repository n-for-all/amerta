/**
 * @module Collections/Pages
 * @title Pages Collection
 * @description This module defines the collections related to the pages functionality in Amerta, including page details, layout sections, SEO metadata, and related hooks and handlers.
 */

import type { Block, CollectionConfig } from "payload";

import { admins } from "@/amerta/access/admins";
import { slugField } from "@/amerta/fields/slug";
import { revalidatePage } from "./hooks/revalidatePage";
import { MetaDescriptionField, MetaImageField, MetaTitleField, OverviewField, PreviewField } from "@payloadcms/plugin-seo/fields";
import { authenticatedOrPublished } from "@/amerta/access/authenticatedOrPublished";
import ThemeShopBlocks from "@/amerta/theme/blocks";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";
import { removeVersion } from "./handlers/remove-version";
import { ensureUniqueHomepage } from "./hooks/ensure-unique-homepage";

const blocksWithHide: Block[] = ThemeShopBlocks.map((block) => {
  return {
    ...block,
    admin: {
      ...block.admin,
      components: {
        ...block.admin?.components,
        // ✅ This is valid on the Field level
        Label: "@/amerta/collections/Pages/Label#Label",
      },
    },
    fields: [
      {
        name: "hideOnFrontend",
        label: "Hide from Frontend",
        type: "checkbox",
        defaultValue: false,
        admin: {
          position: "sidebar",
          description: "Toggle to hide this section from the live website.",
        },
      },
      ...block.fields,
    ],
  };
});

export const Pages: CollectionConfig = {
  slug: "pages",
  trash: true,
  admin: {
    group: "Content",
    useAsTitle: "title",
    defaultColumns: ["title", "slug", "updatedAt"],
    preview: (doc, { locale }) => {
      return `${getServerSideURL()}/next/preview?url=${encodeURIComponent(`${getURL(`/${!doc.isFrontPage ? doc.slug : ""}`, locale)}`)}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`;
    },
    components: {
      edit: {
        beforeDocumentControls: ["@/amerta/fields/translate/AIAgentButton#AIAgentButton"],
      },
    },
  },
  hooks: {
    afterChange: [revalidatePage, ensureUniqueHomepage],
  },
  versions: {
    drafts: {
      autosave: {
        interval: 3000,
      },
      schedulePublish: true,
    },
    maxPerDoc: 10,
  },
  access: {
    read: authenticatedOrPublished,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Title for the page",
      },
      hooks: {
        beforeDuplicate: [
          ({ value }) => {
            return `${value} (Copy)`;
          },
        ],
      },
    },
    {
      name: "publishedOn",
      type: "date",
      admin: {
        position: "sidebar",
        date: {
          pickerAppearance: "dayAndTime",
        },
      },
      hooks: {
        beforeChange: [
          ({ siblingData, value }) => {
            if (siblingData._status === "published" && !value) {
              return new Date();
            }
            return value;
          },
        ],
        beforeDuplicate: [
          () => {
            return null;
          },
        ],
      },
    },
    {
      name: "layout",
      label: "Sections",
      type: "blocks",
      required: false,
      blocks: blocksWithHide,
    },
    ...slugField(undefined, {
      slugHooksOverrides: {
        beforeDuplicate: [
          ({ value }) => {
            return value + "-copy";
          },
        ],
      },
    }),
    {
      name: "isFrontPage",
      type: "checkbox",
      index: true,
      label: "Is frontpage?",
      admin: {
        position: "sidebar",
      },
      hooks: {
        beforeDuplicate: [
          () => {
            return false;
          },
        ],
      },
    },
    {
      name: "meta",
      label: "SEO",
      type: "group",
      localized: true,
      fields: [
        OverviewField({
          titlePath: "meta.title",
          descriptionPath: "meta.description",
          imagePath: "meta.image",
        }),
        MetaTitleField({
          hasGenerateFn: true,
        }),
        MetaImageField({
          relationTo: "media",
        }),

        MetaDescriptionField({}),
        PreviewField({
          hasGenerateFn: true,

          titlePath: "meta.title",
          descriptionPath: "meta.description",
        }),
      ],
    },
  ],
  endpoints: [
    {
      path: "/versions/:versionId",
      method: "delete",
      handler: removeVersion,
    },
  ],
};
