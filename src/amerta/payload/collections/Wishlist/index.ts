/**
 * @module Collections/Wishlist
 * @title Wishlist Collection
 * @description This module defines the collections related to the wishlist functionality in Amerta, including wishlist details, customer associations, and related handlers.
 */

import { customerOrAnonymous } from "@/amerta/access/customerOrAnonymous";
import { CollectionConfig } from "payload";

export const Wishlist: CollectionConfig = {
  slug: "wishlist",
  admin: {
    useAsTitle: "wishlistId",
    defaultColumns: ["wishlistId", "customer", "createdAt"],
    group: "Ecommerce",
  },
  access: {
    read: () => true,
    create: customerOrAnonymous,
    update: customerOrAnonymous,
    delete: customerOrAnonymous,
  },
  fields: [
    {
      name: "wishlistId",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: {
        readOnly: true,
        description: "Unique wishlist identifier for anonymous users",
      },
      hooks: {
        beforeValidate: [
          ({ value }) => {
            if (!value) {
              return `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            }
            return value;
          },
        ],
      },
    },
    {
      name: "customer",
      type: "relationship",
      relationTo: "customers",
      required: false,
      index: true,
      admin: {
        position: "sidebar",
        description: "Customer linked when logged in",
      },
    },
    {
      name: "sessionId",
      type: "text",
      required: false,
      index: true,
      admin: {
        description: "Session identifier for anonymous wishlists",
      },
    },
    {
      name: "items",
      type: "array",
      required: false,
      fields: [
        {
          name: "product",
          type: "relationship",
          relationTo: "products",
          required: true,
          index: true,
        },
        {
          name: "addedAt",
          type: "date",
          admin: {
            readOnly: true,
            date: {
              pickerAppearance: "dayAndTime",
            },
          },
          hooks: {
            beforeChange: [
              ({ value }) => {
                if (!value) {
                  return new Date().toISOString();
                }
                return value;
              },
            ],
          },
        },
      ],
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req, operation }) => {
        if (data.customer && operation === "update") {
          const existing = await req.payload.find({
            collection: "wishlist",
            where: {
              and: [
                {
                  customer: {
                    equals: data.customer,
                  },
                },
                {
                  id: {
                    not_equals: data.id,
                  },
                },
              ],
            },
            limit: 1,
          });

          if (existing.totalDocs > 0) {
            const existingWishlist = existing.docs[0]!;
            const existingProductIds = new Set((existingWishlist.items || []).map((item: any) => (typeof item.product === "string" ? item.product : item.product.id)));

            const newItems = (data.items || []).filter((item: any) => {
              const productId = typeof item.product === "string" ? item.product : item.product.id;
              return !existingProductIds.has(productId);
            });

            if (newItems.length > 0) {
              await req.payload.update({
                collection: "wishlist",
                id: existingWishlist.id,
                data: {
                  items: [...(existingWishlist.items || []), ...newItems],
                },
              });
            }

            await req.payload.delete({
              collection: "wishlist",
              id: data.id,
            });

            throw new Error("Wishlist merged with existing customer wishlist");
          }
        }

        return data;
      },
    ],
  },
  timestamps: true,
};
