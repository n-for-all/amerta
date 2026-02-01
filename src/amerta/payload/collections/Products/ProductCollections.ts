import { getServerSideURL } from "@/amerta/utilities/getURL";
import { MetaDescriptionField } from "@payloadcms/plugin-seo/dist/fields/MetaDescription";
import { MetaImageField } from "@payloadcms/plugin-seo/dist/fields/MetaImage";
import { MetaTitleField } from "@payloadcms/plugin-seo/dist/fields/MetaTitle";
import { OverviewField } from "@payloadcms/plugin-seo/dist/fields/Overview";
import { PreviewField } from "@payloadcms/plugin-seo/dist/fields/Preview";
import { CollectionConfig } from "payload";
import { FixedToolbarFeature, HeadingFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical/dist";
import { SlateToLexicalFeature } from "@payloadcms/richtext-lexical/dist/exports/server/migrate";
import { slugField } from "@/amerta/fields/slug";

export const ProductCollections: CollectionConfig = {
  slug: "collections",
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
  },
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status"],
    preview: (doc, {locale}) => {
      return `${getServerSideURL()}/next/preview?url=${encodeURIComponent(`${getServerSideURL()}/${locale}/collections/${doc.slug}`)}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`;
    },
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "product-media",
    },
    {
      name: "description",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4", "h5", "h6"] }), FixedToolbarFeature(), InlineToolbarFeature(), SlateToLexicalFeature({})];
        },
      }),
      localized: true,
      required: false,
    },
    {
      name: "publishedOn",
      type: "date",
      admin: {
        readOnly: true,
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
      },
    },
    ...slugField(),
    {
      label: "Sales Channels",
      name: "salesChannels",
      type: "relationship",
      relationTo: "sales-channel",
      hasMany: true,
      defaultValue: async ({ req }) => {
        const defaultSalesChannels = await req.payload.find({
          collection: "sales-channel",
          where: {
            enabled: { equals: "1" },
          },
        });
        if (!defaultSalesChannels || defaultSalesChannels.docs.length == 0) {
          return [];
        }
        return defaultSalesChannels.docs.map((s) => s.id);
      },
      admin: {
        position: "sidebar",
        description: "This collection will only be available in the selected sales channels.",
      },
      required: true,
    },
    {
      name: "parent",
      type: "relationship",
      relationTo: "collections",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "createdAt",
      label: "Created At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (!value) {
              return new Date();
            }
            return value;
          },
        ],
      },
    },
    {
      name: "updatedAt",
      label: "Updated At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      hooks: {
        beforeChange: [
          () => {
            return new Date();
          },
        ],
      },
    },
    {
      type: "group",
      name: "meta",
      label: "SEO",
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
};