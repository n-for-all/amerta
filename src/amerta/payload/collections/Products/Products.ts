/**
 * @module Collections/Products/Products
 * @title Products
 * @description This module defines the collections related to the products functionality in Amerta, including product details, options, collections, brands, tags, media, and reviews.
 */

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
import { adminsOrPublished } from "@/amerta/access/adminsOrPublished";
import { slugField } from "@/amerta/fields/slug";

export const Products: CollectionConfig = {
  slug: "products",
  admin: {
    useAsTitle: "title",
    defaultColumns: ["title", "_status"],
    preview: (doc, { locale }) => {
      return `${getServerSideURL()}/next/preview?url=${encodeURIComponent(`${getServerSideURL()}/${locale}/product/${doc.slug}`)}&secret=${process.env.PAYLOAD_PUBLIC_DRAFT_SECRET}`;
    },
    components: {
      edit: {
        beforeDocumentControls: ["@/amerta/fields/translate/AIAgentButton#AIAgentButton"],
      },
    },
  },
  hooks: {
    afterChange: [revalidateProduct],
  },
  versions: {
    drafts: true,
  },
  access: {
    // Drafts are for admins only; everyone else sees published products
    read: adminsOrPublished,
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
      name: "callout",
      type: "text",
      localized: true,
      admin: {
        description: "An optional callout to display on the product page (e.g. 'Free cream with this coffee')",
      },
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
                {
                  label: "Bundle",
                  value: "bundle",
                },
              ],
            },
            {
              type: "row",
              admin: { condition: (data) => data.type === "bundle" },
              fields: [
                {
                  name: "bundleItemName",
                  label: "This product's item",
                  type: "text",
                  localized: true,
                  admin: { width: "50%", description: "What the bundle itself is, shown under its image, e.g. 7 Wonders Duel. The product title stays the bundle's name." },
                },
                {
                  name: "bundleItemDetail",
                  label: "Item detail",
                  type: "text",
                  localized: true,
                  admin: { width: "50%", description: "Optional second line, e.g. 2 players · 30 min." },
                },
              ],
            },
            {
              name: "bundleItems",
              label: "Included products",
              type: "array",
              minRows: 1,
              labels: { singular: "Product", plural: "Products" },
              validate: (rows: any) => (Array.isArray(rows) && rows.filter((r) => r?.isMain).length > 1 ? "Only one included product can be the main one" : true),
              admin: {
                condition: (data) => data.type === "bundle",
                description: "Products that come with this bundle, e.g. 4 × Kopi Luwak 100g. The bundle itself is a normal product (its own price, images, SKU and stock, e.g. the game); it can be bought while it and every included product are in stock, and an order takes stock from all of them. Tick Main on the product to show first; otherwise the bundle's own image comes first.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "product",
                      type: "relationship",
                      relationTo: "products",
                      required: true,
                      filterOptions: { type: { in: ["simple", "variant"] } },
                      admin: { width: "40%" },
                    },
                    {
                      // Which variant of a variant product (its id); empty for a simple product
                      name: "variant",
                      type: "text",
                      admin: {
                        width: "30%",
                        components: { Field: "@/amerta/components/Product/ProductVariant" },
                      },
                    },
                    {
                      name: "quantity",
                      type: "number",
                      required: true,
                      defaultValue: 1,
                      min: 1,
                      admin: { width: "15%" },
                    },
                    {
                      name: "isMain",
                      label: "Main (shown first)",
                      type: "checkbox",
                      admin: { width: "15%", style: { alignSelf: "center" } },
                    },
                  ],
                },
              ],
            },
            {
              name: "bundleChoices",
              label: "Customer choices",
              type: "array",
              labels: { singular: "Choice", plural: "Choices" },
              admin: {
                condition: (data) => data.type === "bundle",
                description: "Let the customer pick one product per choice, e.g. Choose your game from several games. The chosen product's stock is checked and reduced like the included products. Products only sold this way can be marked Not sold separately.",
              },
              fields: [
                {
                  type: "row",
                  fields: [
                    {
                      name: "label",
                      type: "text",
                      required: true,
                      localized: true,
                      admin: { width: "35%", placeholder: "Choose your game" },
                    },
                    {
                      name: "products",
                      type: "relationship",
                      relationTo: "products",
                      hasMany: true,
                      required: true,
                      filterOptions: { type: { equals: "simple" } },
                      admin: { width: "45%" },
                    },
                    {
                      name: "quantity",
                      type: "number",
                      required: true,
                      defaultValue: 1,
                      min: 1,
                      admin: { width: "20%" },
                    },
                  ],
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
                      jsonSchema: {
                        uri: "a://variant-schema.json",
                        fileMatch: ["*"],
                        schema: {
                          type: "object",
                          description: "Map of Option IDs to selected values",
                          additionalProperties: {
                            type: "object",
                            required: ["name", "value"],
                            properties: {
                              name: { type: "string" },
                              value: { type: "string" },
                            },
                          },
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
                  if (data.type == "simple" || data.type == "bundle") {
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
              name: "notSoldSeparately",
              label: "Not sold separately",
              type: "checkbox",
              admin: {
                condition: (data) => data.type !== "bundle",
                description: "Only sold as a choice inside a bundle (e.g. a game in Game Time). Its page says so and links to the bundle; it is hidden from the shop and can't be added to the cart alone.",
              },
            },
            {
              name: "trackInventory",
              label: "Track Inventory",
              type: "checkbox",
              admin: {
                condition: (data) => {
                  if (data.type == "simple" || data.type == "bundle") {
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
                  if (!data.trackInventory && (data.type == "simple" || data.type == "bundle")) {
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
                  if ((data.type == "simple" || data.type == "bundle") && data.trackInventory) {
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
                  if (data.type == "simple" || data.type == "bundle") {
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
