/**
 * @module Collections/Coupons
 * @title Coupons Collection
 * @description This module defines the collections related to the coupons functionality in Amerta, including coupon codes, discount types, values, and usage restrictions.
 */

import { CollectionConfig } from "payload";

export const Coupons: CollectionConfig = {
  slug: "coupons",
  admin: {
    useAsTitle: "code",
    defaultColumns: ["code", "discountType", "discountValue", "status", "expiryDate"],
  },
  fields: [
    {
      name: "code",
      type: "text",
      required: true,
      unique: true,
      admin: {
        description: "Coupon code (e.g., SUMMER20)",
      },
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
      required: false,
      admin: {
        description: "Internal description of the coupon",
      },
    },
    {
      name: "discountType",
      type: "select",
      required: true,
      options: [
        {
          label: "Fixed Amount",
          value: "fixed",
        },
        {
          label: "Percentage",
          value: "percentage",
        },
      ],
      admin: {
        description: "Type of discount",
      },
    },
    {
      name: "discountValue",
      type: "number",
      required: true,
      min: 0,
      admin: {
        description: "Discount amount (fixed currency) or percentage (0-100)",
      },
    },
    {
      name: "applicability",
      type: "select",
      required: true,
      defaultValue: "all",
      options: [
        {
          label: "Any Customer",
          value: "all",
        },
        {
          label: "Specific Customers",
          value: "specific_customers",
        },
        {
          label: "Customer Groups",
          value: "customer_groups",
        },
      ],
      admin: {
        description: "Who can use this coupon",
      },
    },
    {
      name: "customers",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      required: false,
      admin: {
        condition: (data) => data.applicability === "specific_customers",
        description: "Select specific customers who can use this coupon",
      },
    },
    {
      name: "customerGroups",
      type: "relationship",
      relationTo: "customer-groups",
      hasMany: true,
      required: false,
      admin: {
        condition: (data) => data.applicability === "customer_groups",
        description: "Select customer groups that can use this coupon",
      },
    },
    {
      name: "minimumPurchase",
      type: "number",
      required: false,
      min: 0,
      admin: {
        description: "Minimum cart total to apply coupon (leave empty for no minimum)",
      },
    },
    {
      name: "canCombineWithProductDiscounts",
      type: "checkbox",
      required: true,
      defaultValue: false,
      admin: {
        description: "Allow this coupon to be combined with product discounts",
      },
    },
    {
      name: "usageLimit",
      type: "number",
      required: false,
      min: 1,
      admin: {
        description: "Total number of times coupon can be used (leave empty for unlimited)",
      },
    },
    {
      name: "usagePerCustomer",
      type: "number",
      required: false,
      min: 1,
      defaultValue: 1,
      admin: {
        description: "How many times a single customer can use this coupon",
      },
    },
    {
      name: "timesUsed",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        description: "Number of times this coupon has been used",
        readOnly: true,
      },
    },
    {
      name: "status",
      type: "select",
      required: true,
      defaultValue: "active",
      options: [
        {
          label: "Active",
          value: "active",
        },
        {
          label: "Inactive",
          value: "inactive",
        },
        {
          label: "Expired",
          value: "expired",
        },
      ],
      admin: {
        description: "Coupon status",
      },
    },
    {
      name: "startDate",
      type: "date",
      required: true,
      admin: {
        description: "Date when coupon becomes active",
      },
    },
    {
      name: "expiryDate",
      type: "date",
      required: false,
      admin: {
        description: "Date when coupon expires (leave empty for no expiry)",
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Check if coupon has expired
        if (data.expiryDate && data.status !== "expired") {
          const expiryDate = new Date(data.expiryDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expiryDate.setHours(0, 0, 0, 0);

          if (expiryDate < today) {
            data.status = "expired";
          }
        }

        // Check if usage limit reached
        if (data.usageLimit && data.timesUsed >= data.usageLimit && data.status !== "expired") {
          data.status = "inactive";
        }

        return data;
      },
    ],
  },
  timestamps: true,
};
