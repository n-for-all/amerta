/**
 * @module Collections/CartRules
 * @title Cart Rules Collection
 * @description This module defines the collections related to the cart rules functionality in Amerta, including rule types, triggers, applicability, and discount details.
 */

import { CollectionConfig } from "payload";

export const CartRules: CollectionConfig = {
  slug: "cart-rules",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "ruleType", "triggerType", "status", "priority"],
    group: "Collections",
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "Internal name for this rule (e.g., Free Delivery Over $50)",
      },
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
      required: false,
      admin: {
        description: "Name of the offer shown to customers in the cart and order (e.g. 'Free delivery over AED 300'). Falls back to the internal name.",
      },
    },
    {
      name: "ruleType",
      type: "select",
      required: true,
      options: [
        {
          label: "Free Delivery",
          value: "free_delivery",
        },
        {
          label: "Discount",
          value: "discount",
        },
        {
          label: "Free Gift",
          value: "free_gift",
        },
        {
          label: "Buy X Get Y",
          value: "buy_x_get_y",
        },
      ],
      admin: {
        description: "Type of cart rule",
        width: "33%",
      },
    },
    {
      name: "triggerType",
      type: "select",
      required: true,
      options: [
        {
          label: "Minimum Purchase Amount",
          value: "min_amount",
        },
        {
          label: "Minimum Quantity",
          value: "min_quantity",
        },
        {
          label: "Specific Product",
          value: "specific_product",
        },
        {
          label: "Product Collection",
          value: "collection",
        },
      ],
      admin: {
        description: "What triggers this rule",
        width: "33%",
      },
    },
    {
      name: "applicability",
      type: "select",
      required: true,
      defaultValue: "all",
      options: [
        {
          label: "All Customers",
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
        description: "Who this rule applies to",
        width: "33%",
      },
    },
    {
      name: "triggerValue",
      type: "number",
      required: false,
      min: 0,
      admin: {
        condition: (data) => data.triggerType === "min_amount" || data.triggerType === "min_quantity",
        description: "Minimum amount or quantity required",
        width: "50%",
      },
    },
    {
      name: "triggerProducts",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      required: false,
      admin: {
        condition: (data) => data.triggerType === "specific_product",
        description: "Select specific products that trigger this rule",
      },
    },
    {
      name: "triggerCollection",
      type: "relationship",
      relationTo: "collections",
      hasMany: true,
      required: false,
      admin: {
        condition: (data) => data.triggerType === "collection",
        description: "Select categories that trigger this rule",
      },
    },
    {
      name: "discountType",
      type: "select",
      required: false,
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
        condition: (data) => data.ruleType === "discount",
        description: "Type of discount",
      },
    },
    {
      name: "discountValue",
      type: "number",
      required: false,
      min: 0,
      admin: {
        condition: (data) => data.ruleType === "discount",
        description: "Discount amount or percentage",
      },
    },
    {
      name: "stackable",
      type: "checkbox",
      label: "Combine with other discounts",
      defaultValue: false,
      admin: {
        condition: (data) => data.ruleType === "discount",
        description: "When several discount rules match the cart, only the largest one applies, unless they are marked to combine (e.g. 2 bags -10% and 3 bags -15% should not add up).",
      },
    },
    {
      name: "freeGiftProduct",
      type: "relationship",
      relationTo: "products",
      required: false,
      admin: {
        condition: (data) => data.ruleType === "free_gift",
        description: "Product to give for free",
      },
    },
    {
      name: "freeGiftQuantity",
      type: "number",
      required: false,
      min: 1,
      defaultValue: 1,
      admin: {
        condition: (data) => data.ruleType === "free_gift",
        description: "Quantity of gift to give",
      },
    },
    {
      name: "buyXGetYBuyQuantity",
      type: "number",
      required: false,
      min: 1,
      admin: {
        condition: (data) => data.ruleType === "buy_x_get_y",
        description: "Buy quantity",
      },
    },
    {
      name: "buyXGetYBuyProduct",
      type: "relationship",
      relationTo: "products",
      required: false,
      admin: {
        condition: (data) => data.ruleType === "buy_x_get_y",
        description: "Leave empty to count every product of the trigger above, e.g. any coffee size from the selected products or collection",
      },
    },
    {
      name: "buyXGetYGetQuantity",
      type: "number",
      required: false,
      min: 1,
      admin: {
        condition: (data) => data.ruleType === "buy_x_get_y",
        description: "Get quantity (discount or free)",
      },
    },
    {
      name: "buyXGetYGetProduct",
      type: "relationship",
      relationTo: "products",
      required: false,
      admin: {
        condition: (data) => data.ruleType === "buy_x_get_y",
        description: "Product the customer gets (leave empty for the same product). A free reward that isn't in the cart is added automatically.",
      },
    },
    {
      name: "buyXGetYDiscountType",
      type: "select",
      required: false,
      options: [
        {
          label: "Free",
          value: "free",
        },
        {
          label: "Fixed Discount",
          value: "fixed",
        },
        {
          label: "Percentage Discount",
          value: "percentage",
        },
      ],
      admin: {
        condition: (data) => data.ruleType === "buy_x_get_y",
        description: "Discount type for the get product",
      },
    },
    {
      name: "buyXGetYDiscountValue",
      type: "number",
      required: false,
      min: 0,
      admin: {
        condition: (data) => data.ruleType === "buy_x_get_y" && data.buyXGetYDiscountType !== "free",
        description: "Discount amount or percentage",
      },
    },
    {
      name: "customers",
      type: "relationship",
      relationTo: "customers",
      hasMany: true,
      required: false,
      admin: {
        condition: (data) => data.applicability === "specific_customers",
        description: "Select specific customers",
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
        description: "Select customer groups",
      },
    },
    {
      name: "priority",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        description: "Higher priority rules are applied first (0 = lowest)",
        position: "sidebar",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "upsellMessage",
          type: "textarea",
          localized: true,
          required: false,
          admin: {
            description: "Shown in the cart until the rule applies, for amount/quantity triggers. Use {amount} or {quantity} for what is missing, e.g. 'Add {amount} more for free delivery'",
            width: "50%",
          },
        },
        {
          name: "activeMessage",
          type: "textarea",
          localized: true,
          required: false,
          admin: {
            description: "Message shown when rule is active (e.g., 'You qualify for free delivery!')",
            width: "50%",
          },
        },
      ],
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
        description: "Rule status",
        position: "sidebar",
      },
    },
    {
      name: "startDate",
      type: "date",
      required: true,
      admin: {
        description: "Date when rule becomes active",
        position: "sidebar",
      },
    },
    {
      name: "expiryDate",
      type: "date",
      required: false,
      admin: {
        description: "Date when rule expires (leave empty for no expiry)",
        position: "sidebar",
      },
    },
    {
      name: "usageLimit",
      type: "number",
      required: false,
      min: 1,
      admin: {
        description: "Total usage limit (leave empty for unlimited)",
        position: "sidebar",
      },
    },
    {
      name: "timesUsed",
      type: "number",
      required: true,
      defaultValue: 0,
      admin: {
        description: "Number of times this rule has been used",
        readOnly: true,
        position: "sidebar",
      },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data }) => {
        // Check if rule has expired
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
