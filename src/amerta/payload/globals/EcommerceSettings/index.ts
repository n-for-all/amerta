import { revalidatePath } from "next/cache";
import { GlobalConfig } from "payload";
import { link } from "@/amerta/fields/link/link";
import { socialLinksField } from "@/amerta/fields/socialLinks";
import { admins } from "@/amerta/access/admins";

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
    update: admins,
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
            }
          ],
        },
        {
          label: "Announcement Bar",
          name: "announcementBar",
          fields: [
            {
              type: "row",
              fields: [
                {
                  name: "enabled",
                  label: "Enable Announcement Bar",
                  type: "checkbox",
                  defaultValue: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "showButtons",
                  label: "Show Carousel Buttons",
                  type: "checkbox",
                  defaultValue: true,
                },
                {
                  name: "showSocial",
                  label: "Show Social Icons",
                  type: "checkbox",
                  defaultValue: false,
                },
                {
                  name: "autoRotate",
                  label: "Auto Rotate Messages",
                  type: "checkbox",
                  defaultValue: true,
                },
              ],
            },
            {
              type: "row",
              fields: [
                {
                  name: "direction",
                  label: "Animation Direction",
                  type: "select",
                  defaultValue: "scrollTop",
                  options: [
                    { label: "Scroll Up (Vertical)", value: "scrollTop" },
                    { label: "Scroll Left (Horizontal)", value: "scrollLeft" },
                  ],
                },
                {
                  name: "speed",
                  label: "Rotation Speed (Seconds)",
                  type: "number",
                  defaultValue: 5,
                  min: 1,
                  max: 20,
                  admin: {
                    condition: (_, siblingData) => siblingData.autoRotate,
                    width: "50%",
                  },
                },
              ],
            },
            {
              name: "announcements",
              label: "Messages",
              type: "array",
              minRows: 1,
              labels: {
                singular: "Message",
                plural: "Messages",
              },
              fields: [
                {
                  name: "text",
                  label: "Text",
                  type: "text",
                  required: true,
                  localized: true,
                },
                link({
                  appearances: ["default", "destructive", "ghost", "outline", "link", "secondary"],
                  required: false,
                  overrides: {
                    name: "link",
                    label: "Link",
                  },
                }),
              ],
            },
            {
              ...socialLinksField,
            },
          ],
        },
      ],
    },
  ],
};
