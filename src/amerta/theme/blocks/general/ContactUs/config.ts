import { socialLinksField } from "@/amerta/fields/socialLinks";
import type { Block } from "payload";

export const ThemeShopContactUsBlock: Block = {
  slug: "themeShopContactUs",
  interfaceName: "ThemeShopContactUsBlock",
  labels: {
    singular: "Theme Shop Contact Us Block",
    plural: "Theme Shop Contact Us Blocks",
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "titlePrefix",
          label: "Title Prefix (e.g., Contact)",
          type: "text",
          required: true,
          localized: true,
          defaultValue: "Contact",
        },
        {
          name: "titleSuffix",
          label: "Title Suffix (e.g., US)",
          type: "text",
          required: true,
          localized: true,
          defaultValue: "US",
        },
      ],
    },
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      label: "Feature Image",
    },
    {
      type: "group",
      name: "contactDetails",
      label: "Contact Information",
      fields: [
        {
          name: "email",
          type: "text",
          localized: true,
          required: false,
        },
        {
          name: "phone",
          type: "text",
          localized: true,
          required: false,
        },
        {
          name: "address",
          type: "textarea",
          localized: true,
          required: false,
        },
      ],
    },
    {
      ...socialLinksField
    },
    {
      name: "form",
      label: "Select Form",
      type: "relationship",
      relationTo: "forms",
      admin: {
        description: "Select the form to display in the contact section",
      },
    },
  ],
};
