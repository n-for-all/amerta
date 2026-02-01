import { revalidatePath } from "next/cache";
import { GlobalConfig } from "payload";

export const EcommerceSettings: GlobalConfig = {
  slug: "ecommerce-settings",
  label: {
    singular: "Settings",
    plural: "Settings",
  },
  admin: {
    group: "Ecommerce",
  },
  typescript: {
    interface: "EcommerceSettings",
  },
  access: {
    read: () => true,
  },
  hooks: {
    afterChange: [
      async () => {
        revalidatePath("/(.*)", "layout");
      },
    ],
  },
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Orders",
          fields: [
            {
              name: "enableGuestCheckout",
              type: "checkbox",
              label: "Enable Guest Checkout",
              defaultValue: true,
              admin: {
                description: "Allow customers to place orders without creating an account",
              },
            },
            {
              name: "orderIdTemplate",
              type: "text",
              label: "Order ID Template",
              defaultValue: "ORD-{YYYY}{MM}{DD}-{COUNTER}",
              required: true,
              admin: {
                description: "Template for generating order IDs. Available variables: {YYYY} - year, {MM} - month, {DD} - day, {COUNTER} - sequential number",
                placeholder: "ORD-{YYYY}{MM}{DD}-{COUNTER}",
              },
            },
            {
              name: "startOrderIdFrom",
              type: "number",
              label: "Start Order ID From",
              defaultValue: 1000,
              required: true,
              min: 1,
              admin: {
                description: "The starting number for order IDs (e.g., 1000 will start from ORD-20260107-1000)",
                step: 1,
              },
            },
            {
              name: "allowOrderNotes",
              type: "checkbox",
              label: "Allow Order Notes",
              defaultValue: true,
              admin: {
                description: "Allow customers to add notes to their orders",
              },
            },
            {
              name: "autoConfirmOrders",
              type: "checkbox",
              label: "Auto-Confirm Orders",
              defaultValue: false,
              admin: {
                description: "Automatically confirm orders after successful payment",
              },
            }
          ],
        }
      ],
    },
  ],
};
