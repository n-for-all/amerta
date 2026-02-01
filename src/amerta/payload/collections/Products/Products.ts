import ThemeShopBlocks from "@/amerta/theme/blocks";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import { MetaDescriptionField } from "@payloadcms/plugin-seo/dist/fields/MetaDescription";
import { MetaImageField } from "@payloadcms/plugin-seo/dist/fields/MetaImage";
import { MetaTitleField } from "@payloadcms/plugin-seo/dist/fields/MetaTitle";
import { OverviewField } from "@payloadcms/plugin-seo/dist/fields/Overview";
import { PreviewField } from "@payloadcms/plugin-seo/dist/fields/Preview";
import { CollectionConfig } from "payload";
import { revalidateProduct } from "./hooks/revalidateProduct";
import { admins } from "@/amerta/access/admins";
import { slugField } from "@/amerta/fields/slug";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status"],
    preview: (doc, { locale }) => {
      return `${getServerSideURL()}/next/preview?url=${encodeURIComponent(`${getServerSideURL()}/${locale}/product/${doc.slug}`)}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`;
    },
  },
  hooks: {
    afterChange: [revalidateProduct],
  },
  versions: {
    drafts: true,
  },
  access: {
    read: () => true,
    create: admins,
    update: admins,
    delete: admins,
    admin: admins,
  },
  fields: [
    {
      name: "title",
      type: "text",
      required: true,
      localized: true,
    },
    {
      name: "images",
      type: "upload",
      relationTo: "product-media",
      hasMany: true,
      localized: true,
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Product Details",
          fields: [
            {
              name: "type",
              type: "select",
              defaultValue: "simple",
              options: [
                {
                  label: "Simple",
                  value: "simple",
                },
                {
                  label: "Variant",
                  value: "variant",
                },
              ],
            },
            {
              name: "excerpt",
              type: "textarea",
              localized: true,
              required: false,
            },
            {
              name: "description",
              type: "richText",
              localized: true,
              required: false,
            },

            {
              name: "variants",
              label: "Variants",
              type: "array",
              admin: {
                condition: (data) => {
                  if (data.type == "variant") {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
              labels: {
                singular: "Variant",
                plural: "Variants",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      label: false,
                      name: "variant",
                      type: "json",
                      required: true,
                      admin: {
                        components: {
                          Field: "@/amerta/components/VariantField/",
                        },
                      },
                    },
                    {
                      label: "Regular Price",
                      type: "number",
                      required: true,
                      admin: {
                        components: {
                          Field: "@/amerta/components/Price/",
                        },
                      },
                      name: "price",
                    },
                    {
                      label: "Sale Price",
                      type: "number",
                      name: "salePrice",
                      admin: {
                        components: {
                          Field: "@/amerta/components/Price/",
                        },
                      },
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      label: "SKU (Stock Keeping Unit)",
                      name: "sku",
                      type: "text",
                    },
                    {
                      label: "Barcode (ISBN, UPC, GTIN, etc.)",
                      name: "barcode",
                      type: "text",
                    },
                  ],
                },
                {
                  label: "Image",
                  name: "image",
                  type: "upload",
                  relationTo: "product-media",
                  localized: true,
                },
                {
                  label: "Track inventory",
                  name: "trackInventory",
                  type: "checkbox",
                },
                {
                  type: "row",
                  fields: [
                    {
                      label: "Quantity",
                      name: "quantity",
                      type: "number",
                      required: true,
                      admin: {
                        condition: (data, siblingData) => {
                          if (siblingData.trackInventory) {
                            return true;
                          } else {
                            return false;
                          }
                        },
                      },
                    },
                    {
                      label: "Stock Status",
                      name: "stockStatus",
                      type: "select",
                      required: true,
                      options: [
                        {
                          label: "In Stock",
                          value: "in_stock",
                        },
                        {
                          label: "Out of Stock",
                          value: "out_of_stock",
                        },
                        {
                          label: "On Back Order",
                          value: "on_backorder",
                        },
                      ],
                      admin: {
                        condition: (data, siblingData) => {
                          if (!siblingData.trackInventory) {
                            return true;
                          } else {
                            return false;
                          }
                        },
                      },
                    },
                  ],
                },
                {
                  label: "Requires shipping (if not, Customers won't enter shipping details at checkout)",
                  name: "requires_shipping",
                  defaultValue: true,
                  type: "checkbox",
                },
                {
                  type: "collapsible",
                  label: "Dimensions (HxWxL in cm/inch, Weight in kg/lb)",
                  fields: [
                    {
                      type: "row",
                      fields: [
                        {
                          label: "Width",
                          name: "width",
                          type: "number",
                        },
                        {
                          label: "Length",
                          name: "length",
                          type: "number",
                        },
                      ],
                    },
                    {
                      type: "row",
                      fields: [
                        {
                          label: "Height",
                          name: "height",
                          type: "number",
                        },
                        {
                          label: "Weight",
                          name: "weight",
                          type: "number",
                          localized: true,
                        },
                      ],
                    },
                  ],
                  admin: {
                    initCollapsed: true,
                  },
                },
              ],
            },
            {
              type: "row",
              admin: {
                condition: (data) => {
                  if (data.type == "simple") {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
              fields: [
                {
                  label: "Regular Price",
                  type: "number",
                  required: true,
                  admin: {
                    components: {
                      Field: "@/amerta/components/Price/",
                    },
                  },
                  name: "price",
                },
                {
                  label: "Sale Price",
                  type: "number",
                  name: "salePrice",
                  admin: {
                    components: {
                      Field: "@/amerta/components/Price/",
                    },
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  label: "SKU (Stock Keeping Unit)",
                  name: "sku",
                  type: "text",
                },
                {
                  label: "Barcode (ISBN, UPC, GTIN, etc.)",
                  name: "barcode",
                  type: "text",
                },
              ],
            },
            {
              name: "trackInventory",
              label: "Track Inventory",
              type: "checkbox",
              admin: {
                condition: (data) => {
                  if (data.type == "simple") {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            },
            {
              label: "Stock Status",
              name: "stockStatus",
              type: "select",
              defaultValue: "in_stock",
              required: true,
              options: [
                {
                  label: "In Stock",
                  value: "in_stock",
                },
                {
                  label: "Out of Stock",
                  value: "out_of_stock",
                },
                {
                  label: "On Back Order",
                  value: "on_backorder",
                },
              ],
              admin: {
                condition: (data) => {
                  if (!data.trackInventory && data.type == "simple") {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            },
            {
              label: "Quantity",
              name: "quantity",
              type: "number",
              admin: {
                condition: (data) => {
                  if (data.type == "simple" && data.trackInventory) {
                    return true;
                  } else {
                    return false;
                  }
                },
              },
            },
            {
              type: "collapsible",
              label: "Dimensions (HxWxL in cm/inch, Weight in kg/lb)",
              admin: {
                condition: (data) => {
                  if (data.type == "simple") {
                    return true;
                  } else {
                    return false;
                  }
                },
                initCollapsed: true,
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      label: "Width",
                      name: "width",
                      type: "number",
                    },
                    {
                      label: "Length",
                      name: "length",
                      type: "number",
                    },
                  ],
                },
                {
                  type: "row",
                  fields: [
                    {
                      label: "Height",
                      name: "height",
                      type: "number",
                    },
                    {
                      label: "Weight",
                      name: "weight",
                      type: "number",
                    },
                  ],
                },
              ],
            },
          ],
        },
        {
          label: "Content",
          fields: [
            {
              name: "layout",
              type: "blocks",
              required: false,
              blocks: [...ThemeShopBlocks],
            },
            {
              name: "showProductDetails",
              label: "Show Product Details",
              type: "checkbox",
              defaultValue: true,
            },
            {
              name: "productDetails",
              label: "Product Details",
              type: "array",
              admin: {
                condition: (data) => data.showProductDetails === true,
              },
              labels: {
                singular: "Detail",
                plural: "Details",
              },
              fields: [
                {
                  name: "detail",
                  type: "text",
                  required: true,
                  localized: true,
                },
              ],
            },
            {
              name: "showProductFeatures",
              label: "Show Product Features",
              type: "checkbox",
              defaultValue: true,
            },
            {
              name: "productFeatures",
              label: "Product Features",
              type: "array",
              admin: {
                condition: (data) => data.showProductFeatures === true,
              },
              labels: {
                singular: "Feature",
                plural: "Features",
              },
              fields: [
                {
                  name: "feature",
                  type: "text",
                  required: true,
                  localized: true,
                },
              ],
            },
            {
              name: "showBenefits",
              label: "Show Benefits",
              type: "checkbox",
              defaultValue: true,
            },
            {
              name: "benefits",
              label: "Benefits",
              type: "array",
              admin: {
                condition: (data) => data.showBenefits === true,
              },
              labels: {
                singular: "Benefit",
                plural: "Benefits",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "icon",
                      label: "Icon",
                      type: "text",
                      required: false,
                      admin: {
                        components: {
                          Field: "@/amerta/fields/icon/IconField",
                        },
                      },
                    },
                    {
                      name: "title",
                      type: "text",
                      required: true,
                      admin: {
                        width: "40%",
                      },
                      localized: true,
                    },
                    {
                      name: "description",
                      type: "text",
                      required: true,
                      admin: {
                        width: "40%",
                      },
                      localized: true,
                    },
                  ],
                },
              ],
            },
            {
              name: "showFAQs",
              label: "Show FAQs",
              type: "checkbox",
              defaultValue: true,
            },
            {
              name: "faqs",
              label: "FAQs",
              type: "array",
              admin: {
                condition: (data) => data.showFAQs === true,
              },
              labels: {
                singular: "FAQ",
                plural: "FAQs",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "question",
                      type: "text",
                      required: true,
                      admin: {
                        width: "50%",
                      },
                      localized: true,
                    },
                    {
                      name: "answer",
                      type: "textarea",
                      required: true,
                      admin: {
                        width: "50%",
                      },
                      localized: true,
                    },
                  ],
                },
              ],
            },
            {
              name: "showPairWith",
              label: "Show Pair It With",
              type: "checkbox",
              defaultValue: true,
            },
            {
              name: "pairWithProducts",
              label: "Pair It With (Related Products)",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
              admin: {
                condition: (data) => data.showPairWith === true,
              },
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                };
              },
            },
            {
              name: "relatedProducts",
              type: "relationship",
              relationTo: "products",
              hasMany: true,
              filterOptions: ({ id }) => {
                return {
                  id: {
                    not_in: [id],
                  },
                };
              },
            },
          ],
        },
      ],
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
          relationTo: "product-media",
        }),
        MetaDescriptionField({}),
        PreviewField({
          hasGenerateFn: true,
          titlePath: "meta.title",
          descriptionPath: "meta.description",
        }),
      ],
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
      },
    },
    {
      name: "collections",
      type: "relationship",
      relationTo: "collections",
      hasMany: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "isFeatured",
      type: "checkbox",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "brand",
      type: "relationship",
      relationTo: "product-brands",
      hasMany: false,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "tags",
      type: "relationship",
      relationTo: "product-tags",
      hasMany: true,
      admin: {
        position: "sidebar",
      },
    },
    ...slugField(),
    {
      name: "stores",
      type: "relationship",
      relationTo: "store",
      hasMany: true,
      defaultValue: async ({ req }) => {
        const defaultStores = await req.payload.find({
          collection: "store",
          where: {
            enabled: { equals: "1" },
          },
        });
        if (!defaultStores || defaultStores.docs.length == 0) {
          return [];
        }
        return defaultStores.docs.map((s) => s.id);
      },
      admin: {
        position: "sidebar",
      },
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
        description: "This product will only be available in the selected sales channels.",
      },
      required: true,
    },
    {
      label: "Only allow in these Countries",
      name: "countries",
      type: "relationship",
      relationTo: "country",
      hasMany: true,
      admin: {
        position: "sidebar",
        description: "If set, this product will only be available to customers from the selected countries, this will only work if the theme supports it.",
      },
    },

    {
      name: "skipSync",
      label: "Skip Sync",
      type: "checkbox",
      admin: {
        position: "sidebar",
        readOnly: true,
        hidden: true,
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
      name: "rating",
      label: "Average Rating",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "reviewCount",
      label: "Review Count",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
      },
    },
  ],
};
