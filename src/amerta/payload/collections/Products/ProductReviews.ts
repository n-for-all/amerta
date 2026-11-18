/**
 * @module Collections/Products/ProductReviews
 * @title Product Reviews
 * @description This module defines the collections related to the product reviews functionality in Amerta, including review details, ratings, and associated metadata.
 */

import type { CollectionConfig, PayloadRequest } from "payload";
import { submitReview } from "./handlers/submit-review";
import { admins } from "@/amerta/access/admins";

const productIds = (value: unknown): string[] =>
  (Array.isArray(value) ? value : value ? [value] : []).map((p: any) => String(typeof p === "object" ? p?.id : p)).filter((id) => id && id !== "undefined");

/**
 * Sets each product's `rating` and `reviewCount` from its approved reviews (trashed reviews are left out),
 * so they stay right however a review is added, approved, edited, moved to another product or deleted.
 */
const updateProductRatings = async (req: PayloadRequest, ids: string[]) => {
  for (const id of new Set(ids)) {
    const { docs } = await req.payload.find({
      collection: "product-reviews",
      where: { product: { in: [id] }, status: { equals: "approved" } },
      pagination: false,
      depth: 0,
      select: { rating: true },
      req,
    });
    const reviewCount = docs.length;
    const rating = reviewCount ? docs.reduce((sum, r) => sum + (r.rating || 0), 0) / reviewCount : 0;
    try {
      await req.payload.update({ collection: "products", id, data: { rating, reviewCount }, depth: 0, req });
    } catch (error) {
      req.payload.logger.error({ err: error, msg: `Could not update the rating of product ${id}` });
    }
  }
};

const ProductReviews: CollectionConfig = {
  slug: "product-reviews",
  hooks: {
    afterChange: [
      async ({ doc, previousDoc, req }) => {
        await updateProductRatings(req, [...productIds(doc?.product), ...productIds(previousDoc?.product)]);
        return doc;
      },
    ],
    afterDelete: [
      async ({ doc, req }) => {
        await updateProductRatings(req, productIds(doc?.product));
      },
    ],
  },
  trash: true,
  admin: {
    useAsTitle: "author",
    defaultColumns: ["product", "rating", "author", "status", "createdAt"],
    group: "Products",
  },
  access: {
    read: () => true,
    create: () => true,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: "product",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      required: true,
      admin: {
        position: "sidebar",
        description: "The review shows on every product selected here.",
      },
      hooks: {
        // Reviews saved before this field allowed several products hold a single id
        afterRead: [({ value }) => (value && !Array.isArray(value) ? [value] : value)],
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Review Details",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "author",
                  type: "text",
                  required: true,
                  admin: {
                    placeholder: "Reviewer name",
                  },
                },
                {
                  name: "email",
                  type: "email",
                  admin: {
                    placeholder: "reviewer@example.com",
                  },
                },
              ],
            },
            {
              name: "rating",
              type: "number",
              required: true,
              label: "Rating (1-5)",
              min: 1,
              max: 5,
              admin: {
                step: 1,
              },
            },
            {
              name: "title",
              type: "text",
            },
            {
              name: "content",
              type: "textarea",
              required: true,
            },
            {
              name: "verified",
              type: "checkbox",
              label: "Verified Purchase",
              defaultValue: false,
            },
          ],
        },
        {
          label: "Review Status",
          fields: [
            {
              name: "status",
              type: "select",
              required: true,
              options: [
                {
                  label: "Pending",
                  value: "pending",
                },
                {
                  label: "Approved",
                  value: "approved",
                },
                {
                  label: "Rejected",
                  value: "rejected",
                },
              ],
              defaultValue: "pending",
              admin: {
                position: "sidebar",
              },
            },
            {
              name: "rejectionReason",
              type: "text",
              admin: {
                condition: (data) => data?.status === "rejected",
                placeholder: "Reason for rejection (if applicable)",
              },
            },
          ],
        },
      ],
    },
    {
      name: "createdAt",
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
  endpoints: [
    {
      path: "/submit",
      method: "post",
      handler: submitReview,
    },
  ],
};

export default ProductReviews;
