import { slugField } from "@/amerta/fields/slug";
import { CollectionConfig } from "payload";

export const ProductTags: CollectionConfig = {
  slug: "product-tags",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name"],
    group: "Products",
  },
  access: {
    read: () => true,
  },
  versions: {
    drafts: true,
    maxPerDoc: 5,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "image",
      type: "upload",
      relationTo: "product-media",
    },
    ...slugField("name"),
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
            enabled: {
              equals: "1",
            },
          },
        });
        if (!defaultSalesChannels || defaultSalesChannels.docs.length == 0) {
          return [];
        }
        return defaultSalesChannels.docs.map((s) => s.id);
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
  ],
};
