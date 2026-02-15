import { GlobalConfig } from "payload";
import { admins } from "@/amerta/access/admins";
import { withGuard } from "@/amerta/utilities/withGuard";
import { testN8N } from "./handlers/test-n8n";

export const Integrations: GlobalConfig = {
  slug: "integrations",
  label: "Integrations",
  admin: { group: "Ecommerce" },
  typescript: {
    interface: "Integrations",
  },
  access: { update: admins, read: () => true },
  endpoints: [
    {
      path: "/test-n8n",
      method: "post",
      handler: withGuard(testN8N),
    },
  ],
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "n8n Automation",
          fields: [
            { name: "enabled", type: "checkbox", label: "Enable Automation", defaultValue: false },
            {
              type: "row",
              fields: [
                { name: "webhookUrl", type: "text", label: "Webhook URL", required: true },
                {
                  name: "environment",
                  type: "select",
                  options: [
                    { label: "Prod", value: "prod" },
                    { label: "Dev", value: "dev" },
                  ],
                },
              ],
            },
            { name: "secretToken", type: "text", label: "Secret Token" },
            {
              name: "testOrder",
              type: "relationship",
              relationTo: "orders",
              label: "Select Order for Testing",
              admin: { description: "Choose an order to send as a test payload to n8n." },
            },
            {
              name: "testTrigger",
              type: "ui",
              admin: {
                components: {
                  Field: "@/amerta/globals/Integrations/fields/N8NTestButton#N8NTestButton",
                },
              },
            },
            {
              name: "setupInstructions",
              type: "ui",
              admin: {
                components: {
                  Field: "@/amerta/globals/Integrations/fields/N8NHelp#N8NHelp",
                },
              },
            },
          ],
        },
      ],
    },
  ],
};
