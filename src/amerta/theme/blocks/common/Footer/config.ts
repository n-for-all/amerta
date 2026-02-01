import type { GlobalConfig } from "payload";

import { link } from "@/amerta/fields/link/link";
import { revalidateFooter } from "./hooks/revalidateFooter";

export const Footer: GlobalConfig = {
  slug: "footer",
  admin: {
    group: "Settings",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "title",
      label: "Footer Title",
      type: "text",
      localized: true,
      required: false,
      admin: {
        description: "Optional title to display above the logo",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "logoLight",
          label: "Logo (Light Mode)",
          type: "upload",
          relationTo: "media",
          required: false,
          admin: {
            width: "50%",
            description: "Logo to display in light mode. SVG recommended for best quality.",
          },
          filterOptions: {
            mimeType: {
              in: ["image/svg+xml", "image/png", "image/jpeg", "image/webp"],
            },
          },
        },
        {
          name: "logoDark",
          label: "Logo (Dark Mode)",
          type: "upload",
          relationTo: "media",
          required: false,
          admin: {
            width: "50%",
            description: "Logo to display in dark mode. SVG recommended for best quality.",
          },
          filterOptions: {
            mimeType: {
              in: ["image/svg+xml", "image/png", "image/jpeg", "image/webp"],
            },
          },
        },
      ],
    },
    {
      name: "logoClassName",
      label: "Logo Class Name",
      type: "text",
      required: false,
      admin: {
        description: "Custom CSS classes to apply to the footer logo element",
      },
    },
    {
      name: "description",
      label: "Footer Description",
      type: "textarea",
      localized: true,
      required: false,
      admin: {
        description: "Description text to display under the logo",
      },
    },
    link({
      appearances: ["default", "destructive", "ghost", "outline", "link", "secondary"],
      required: false,
      overrides: {
        name: "footerButton",
        label: "Footer Button",
      },
    }),
    {
      name: "footerMenus",
      label: "Footer Menus",
      type: "array",
      fields: [
        {
          name: "title",
          label: "Menu Title",
          type: "text",
          localized: true,
          required: true,
          admin: {
            description: "Custom title for this menu section",
          },
        },
        {
          name: "menu",
          label: "Menu",
          type: "relationship",
          relationTo: "menu", // adjust to your menu collection name
          required: false,
          admin: {
            description: "Select a menu to display in this footer section",
          },
        },
      ],
      maxRows: 4,
      admin: {
        initCollapsed: true,
        components: {
          RowLabel: "@/amerta/theme/blocks/common/Footer/RowLabel#RowLabel",
        },
      },
    }, {
      name: "footerBottomMenu",
      label: "Footer Bottom Menu",
      type: "group",
      fields: [
        {
          name: "menu",
          label: "Menu",
          type: "relationship",
          relationTo: "menu", // adjust to your menu collection name
          required: false,
          admin: {
            description: "Select a menu to display in this footer section",
          },
        },
      ]
    },
    {
      name: "footerForm",
      label: "Footer Form",
      type: "group",
      fields: [
        {
          name: "enable",
          label: "Enable Form (ex: Newsletter)",
          type: "checkbox",
          defaultValue: false,
          admin: {
            description: "Enable a form in the footer (e.g., newsletter signup, contact form)",
          },
        },
        {
          name: "form",
          label: "Select Form",
          type: "relationship",
          relationTo: "forms", // adjust to your forms collection name
          required: false,
          admin: {
            condition: (_, siblingData) => siblingData?.enable,
            description: "Select which form to display in the footer",
          },
        },
        {
          name: "title",
          label: "Form Title",
          type: "text",
          required: false,
          localized: true,
          admin: {
            condition: (_, siblingData) => siblingData?.enable,
            description: "Optional custom title for the form section",
          },
        },
        {
          name: "description",
          label: "Form Description",
          type: "textarea",
          required: false,
          localized: true,
          admin: {
            condition: (_, siblingData) => siblingData?.enable,
            description: "Optional description text above the form",
          },
        },
      ],
    },
    {
      name: "socialMedia",
      label: "Social Media Links",
      type: "array",
      admin: {
        initCollapsed: true,
        description: "Add links to your social media profiles to display in the footer",
        components: {
          RowLabel: "@/amerta/theme/blocks/common/Footer/RowLabel#SocialMediaRowLabel",
        },
      },
      fields: [
        {
          name: "platform",
          label: "Platform",
          type: "select",
          required: true,
          options: [
            { label: "Facebook", value: "facebook" },
            { label: "Twitter", value: "twitter" },
            { label: "Instagram", value: "instagram" },
            { label: "LinkedIn", value: "linkedin" },
            { label: "YouTube", value: "youtube" },
            { label: "TikTok", value: "tiktok" },
            { label: "GitHub", value: "github" },
            { label: "Discord", value: "discord" },
          ],
        },
        {
          name: "url",
          label: "URL",
          type: "text",
          required: true,
          validate: (val) => {
            if (!val) return "URL is required";
            try {
              new URL(val);
              return true;
            } catch {
              return "Please enter a valid URL";
            }
          },
        },
      ],
      maxRows: 8,
    },
    {
      name: "copyright",
      label: "Copyright Text",
      type: "text",
      required: false,
      localized: true,
      defaultValue: "© 2024 Your Company Name. All rights reserved.",
      admin: {
        description: "Copyright notice displayed at the bottom of the footer",
      },
    },
    {
      name: "className",
      label: "Footer Class Name",
      type: "text",
      required: false,
      admin: {
        description: "Custom CSS classes to apply to the footer element",
      },
    },
  ],
  hooks: {
    afterChange: [revalidateFooter],
  },
};
