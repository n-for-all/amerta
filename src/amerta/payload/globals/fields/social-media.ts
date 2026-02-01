import { AUTH_PROVIDERS } from "@/amerta/auth";
import { camelSlug } from "@/amerta/utilities/camelSlug";
import { Field, Tab } from "payload";

export const SocialMediaFields: Field[] = [
  {
    name: "twitterHandle",
    type: "text",
    label: "Twitter Handle",
    admin: {
      description: "Your Twitter username (without @)",
    },
  },
  {
    name: "facebookAppId",
    type: "text",
    label: "Facebook App ID",
    admin: {
      description: "Facebook App ID for Open Graph",
    },
  },
  {
    name: "ogType",
    type: "select",
    label: "Default Open Graph Type",
    defaultValue: "website",
    options: [
      { label: "Website", value: "website" },
      { label: "Article", value: "article" },
    ],
  },
  {
    name: "enableWhatsappChat",
    type: "checkbox",
    label: "Enable WhatsApp Chat",
    defaultValue: false,
    admin: {
      description: "Toggle to enable or disable WhatsApp chat support on the site",
    },
  },
  {
    name: "whatsappChatLink",
    type: "text",
    label: "WhatsApp Chat Link",
    defaultValue: "",
    admin: {
      description: "Link to enable WhatsApp chat support on the site",
      condition: (data) => Boolean(data?.enableWhatsappChat),
    },
  },
  {
    type: "tabs",
    tabs: [
      ...(AUTH_PROVIDERS.map((adapter) => {
        const groupKey = `${camelSlug(adapter.slug)}Settings`; // e.g. "googleSettings"

        return {
          label: adapter.label,
          fields: [
            {
              name: groupKey,
              label: ``,
              type: "group",
              fields: [
                {
                  name: "enabled",
                  type: "checkbox",
                  label: `Enable ${adapter.label} Login`,
                  defaultValue: false,
                } as Field,
                ...adapter.settingsFields.map((field: Field): Field => {
                  return {
                    ...field,
                    admin: {
                      ...field.admin,
                      condition: (_data, siblingData) => Boolean(siblingData?.enabled),
                    },
                  } as Field;
                }),
              ],
            },
          ],
        };
      }) as Tab[]),
    ],
  },
];
