import { type CollectionConfig } from "payload";

import { admins } from "../../access/admins";
import { adminsOrOrderedBy } from "./access/adminsOrOrderedBy";
import { populateOrderedBy } from "./hooks/populateOrderedBy";
import { addressField } from "@/amerta/fields/addressField";
import { createOrder } from "./handlers/create-order";
import { populateOrderData } from "./hooks/populateOrderData";
import { checkPaymentStatus } from "./handlers/check-status";
import { sendOrderEmailHandler } from "./handlers/send-email-handler";
import { withGuard } from "@/amerta/utilities/withGuard";

export const Orders: CollectionConfig = {
  slug: "orders",
  versions: false,
  admin: {
    group: "",
    useAsTitle: "orderId",
    defaultColumns: ["orderId", "createdAt", "orderedBy", "status"],
    components: {
      edit: {
        beforeDocumentControls: [
          {
             path: "@/amerta/components/Order/Actions/index#OrderActions", 
             exportName: 'OrderActions'
          }
        ]
      }
    }
  },
  hooks: {
    beforeChange: [populateOrderData],
  },
  access: {
    read: adminsOrOrderedBy,
    update: admins,
    create: admins,
    delete: admins,
  },
  fields: [
    {
      name: "orderId",
      type: "text",
      label: "Order ID",
      unique: true,
      admin: {
        position: "sidebar",
        readOnly: true,
        description: "Automatically generated order ID",
      },
    },
    {
      name: "orderCounter",
      type: "number",
      admin: {
        hidden: true,
      },
    },
    {
      name: "orderedBy",
      type: "relationship",
      relationTo: "customers",
      required: true,
      hooks: {
        beforeChange: [populateOrderedBy],
      },
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "salesChannel",
      type: "relationship",
      relationTo: "sales-channel",
      required: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      options: [
        {
          label: "Pending",
          value: "pending",
        },
        {
          label: "Processing",
          value: "processing",
        },
        {
          label: "Shipped",
          value: "shipped",
        },
        {
          label: "Completed",
          value: "completed",
        },
        {
          label: "Cancelled",
          value: "cancelled",
        },
        {
          label: "Refunded",
          value: "refunded",
        },
        {
          label: "On Hold",
          value: "on-hold",
        },
      ],
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "orderNote",
      type: "textarea",
      label: "Order Note",
      admin: {
        readOnly: true,
        position: "sidebar",
        description: "Customer's notes or special instructions for this order",
      },
    },
    {
      type: "tabs",
      tabs: [
        {
          label: "Details",
          fields: [
            {
              type: "row",
              fields: [],
              admin: {
                components: {
                  Field: "@/amerta/components/Order#OrderAdmin",
                },
              },
            },
          ],
          admin: {
            components: {
              Field: "@/amerta/components/Order#OrderAdmin",
            },
            custom: { currency: "" },
          },
        },
        {
          label: "Edit",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "subtotal",
                  type: "number",
                  required: true,
                  min: 0,
                  admin: {
                    width: "50%",
                    readOnly: true,
                    description: "Automatically calculated from items",
                  },
                },
                {
                  name: "shippingTotal",
                  type: "number",
                  required: true,
                  min: 0,
                  admin: {
                    width: "50%",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "discountTotal",
                  type: "number",
                  defaultValue: 0,
                  min: 0,
                  admin: {
                    width: "50%",
                    description: "Discount amount applied to this order",
                  },
                },
                {
                  name: "couponCode",
                  type: "text",
                  admin: {
                    width: "50%",
                    description: "Coupon code used for discount",
                  },
                },
              ],
            },
            {
              name: "isFreeShipping",
              type: "checkbox",
              defaultValue: false,
              admin: {
                description: "Whether free shipping was applied to this order",
              },
            },
            {
              type: "row",
              fields: [
                {
                  name: "total",
                  type: "number",
                  required: true,
                  min: 0,
                  admin: {
                    readOnly: true,
                    description: "Automatically calculated: subtotal - discount + shipping",
                  },
                },
                {
                  name: "tax",
                  type: "number",
                  required: true,
                  min: 0,
                  admin: {
                    description: "Taxes applied to this order",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "customerTotal",
                  type: "number",
                  label: "Presented Total",
                  required: true,
                  admin: {
                    description: "Amount shown to user (e.g. 100.00)",
                  },
                },
                {
                  name: "customerCurrency",
                  type: "relationship",
                  relationTo: "currency",
                  label: "Presented Currency",
                  required: true,
                  admin: {
                    description: "Currency shown to user (e.g. USD)",
                  },
                },
                {
                  name: "exchangeRate",
                  type: "number",
                  label: "Exchange Rate Used",
                  required: true,
                  defaultValue: 1,
                  admin: {
                    description: "Exchange rate from sales channel currency to customer currency at the time of order",
                  },
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "shippingMethod",
                  type: "relationship",
                  relationTo: "shipping",
                  required: true,
                  admin: {
                    width: "50%",
                  },
                },
                {
                  name: "paymentMethod",
                  type: "relationship",
                  relationTo: "payment-method",
                  required: true,
                  admin: {
                    width: "50%",
                  },
                },
              ],
            },
            {
              name: "shippingMethodName",
              type: "text",
              admin: {
                hidden: true,
              },
            },
            {
              name: "paymentMethodName",
              type: "text",
              admin: {
                hidden: true,
              },
            },
            {
              name: "paidAt",
              type: "date",
              admin: {
                date: {
                  pickerAppearance: "dayAndTime",
                },
              },
            },
            {
              name: "items",
              type: "array",
              fields: [
                {
                  name: "product",
                  type: "relationship",
                  relationTo: "products",
                  required: true,
                },
                {
                  name: "variant",
                  type: "select",
                  admin: {
                    components: {
                      Field: "@/amerta/components/Product/ProductVariant", // <--- Renders your Dynamic Dropdown
                    },
                  },
                  options: [],
                },
                {
                  name: "image",
                  type: "relationship",
                  relationTo: "product-media",
                },
                {
                  name: "metaData",
                  type: "json",
                  admin: {
                    description: "Metadata for the products.",
                    readOnly: true,
                  },
                },
                {
                  name: "productName",
                  type: "text",
                  admin: {
                    hidden: true,
                  },
                },
                {
                  name: "productSKU",
                  type: "text",
                  admin: {
                    hidden: true,
                  },
                },
                {
                  name: "variantText",
                  type: "text",
                  admin: {
                    hidden: true,
                    description: "Human readable variant options (e.g., 'Color: Red, Size: Large')",
                  },
                },
                {
                  type: "row",
                  fields: [
                    {
                      name: "price",
                      type: "number",
                      admin: {
                        readOnly: true,
                      },
                      required: true,
                      min: 0,
                    },
                    {
                      name: "quantity",
                      type: "number",
                      min: 1,
                      defaultValue: 1,
                    },
                  ],
                },
              ],
            },
            {
              name: "address",
              type: "group",
              label: "Shipping Address",
              fields: [
                addressField,
                {
                  name: "countryName",
                  type: "text",
                  admin: {
                    hidden: true,
                  },
                },
              ],
            },
            {
              name: "billingAddress",
              type: "group",
              label: "Billing Address",
              fields: [
                addressField,
                {
                  name: "countryName",
                  type: "text",
                  admin: {
                    hidden: true,
                  },
                },
              ],
            },
          ],
        },
      ],
    },
  ],
  endpoints: [
    {
      path: "/create",
      method: "post",
      handler: createOrder,
    },
    {
      path: "/check-status",
      method: "get",
      handler: checkPaymentStatus,
    },
    {
        path: "/:id/send-email",
        method: "post",
        handler: withGuard(sendOrderEmailHandler)
    }
  ],
};
