import { slugField } from "@/amerta/fields/slug";
import { CollectionConfig } from "payload";

export const ProductBrand: CollectionConfig = {
  slug: "product-brands",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title"],
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
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    ...slugField(),
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "logo",
      label: "Logo",
      type: "upload",
      relationTo: "product-media",
    },
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
      admin: {
        position: "sidebar",
        description: "This brand will only be available in the selected sales channels.",
      },
      required: true,
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
