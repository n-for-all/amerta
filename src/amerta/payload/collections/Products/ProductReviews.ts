/**
 * @module Collections/Products/ProductReviews
 * @title Product Reviews
 * @description This module defines the collections related to the product reviews functionality in Amerta, including review details, ratings, and associated metadata.
 */

import type { CollectionConfig } from "payload";
import { submitReview } from "./handlers/submit-review";
import { admins } from "@/amerta/access/admins";

const ProductReviews: CollectionConfig = {
  slug: "product-reviews",
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
      required: true,
      admin: {
        position: "sidebar",
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
                  required: true,
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
