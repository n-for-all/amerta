import { admins } from "@/amerta/access/admins";
import { CollectionConfig } from "payload";
import { PaymentMethods } from "./PaymentMethods";
import { executeWebhook } from "./PaymentMethods/handlers/execute-webhook";

export const Payments: CollectionConfig = {
  slug: "payments",
  admin: {
    useAsTitle: "transactionId",
    defaultColumns: ["order", "amount", "status", "gateway"],
  },
  access: {
    read: admins,
    update: admins,
    delete: admins,
    create: () => false,
  },
  fields: [
    {
      name: "order",
      type: "relationship",
      relationTo: "orders",
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "amount",
          type: "number",
          required: true,
          admin: {
            description: "Amount paid in the payment currency",
          },
        },
        {
          name: "currency",
          relationTo: "currency",
          type: "relationship",
          required: true,
          admin: {
            description: "Currency used for this payment",
          },
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "amountInDefaultCurrency",
          type: "number",
          required: true,
          admin: {
            description: "Amount converted to sales channel's default currency",
          },
        },
        {
          name: "defaultCurrency",
          relationTo: "currency",
          type: "relationship",
          admin: {
            description: "Sales channel's default currency at time of payment",
          },
        },
      ],
    },
    {
      name: "status",
      type: "select",
      options: ["pending", "success", "failed", "refunded"],
      defaultValue: "pending",
    },
    {
      name: "gateway",
      type: "text",
    },
    {
      name: "paymentMethod",
      type: "relationship",
      relationTo: "payment-method",
      required: true,
    },
    {
      name: "transactionId",
      type: "text",
    },
    {
      name: "rawResponse",
      type: "json",
    },
    {
      name: "salesChannel",
      type: "relationship",
      relationTo: "sales-channel",
      required: true,
      admin: {
        position: "sidebar",
        description: "This payment method will only be available in the selected sales channels.",
      },
    },
  ],
  endpoints: [
    {
      path: "/:name/webhook",
      method: "post",
      handler: executeWebhook,
    },
  ],
};

export default [PaymentMethods, Payments];
