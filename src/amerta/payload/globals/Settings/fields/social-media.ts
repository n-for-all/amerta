import { Field } from "payload";

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
];
