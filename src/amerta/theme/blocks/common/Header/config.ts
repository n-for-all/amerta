import type { GlobalConfig } from "payload";

import { link } from "@/amerta/fields/link/link";
import { revalidateHeader } from "./hooks/revalidateHeader";

export const Header: GlobalConfig = {
  admin: {
    group: "Settings",
  },
  label: {
    singular: "Header",
    plural: "Headers",
  },
  slug: "header",
  access: {
    read: () => true,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "menu",
          label: "Primary Menu",
          type: "relationship",
          relationTo: "menu", // adjust to your menu collection name
          required: false,
          admin: {
            description: "Select a menu to display in the header navigation",
          },
        },
        {
          name: "secondary-menu",
          label: "Secondary Menu",
          type: "relationship",
          relationTo: "menu", // adjust to your menu collection name
          required: false,
          admin: {
            description: "Select a menu to display in the header navigation",
          },
        },
      ],
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
        description: "Custom CSS classes to apply to the logo element",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "enableThemeSwitch",
          label: "Enable Theme Switch",
          type: "checkbox",
          defaultValue: false,
          admin: {
            width: "50%",
            description: "Allow users to toggle between light and dark mode",
          },
        },
        {
          name: "defaultTheme",
          label: "Default Theme",
          type: "select",
          defaultValue: "light",
          options: [
            {
              label: "Light",
              value: "light",
            },
            {
              label: "Dark",
              value: "dark",
            },
            {
              label: "System",
              value: "system",
            },
          ],
          admin: {
            width: "50%",
            description: "Default theme when users first visit the site",
            condition: (_, siblingData) => siblingData?.enableThemeSwitch,
          },
        },
      ],
    },
    link({
      appearances: ["default", "destructive", "ghost", "outline", "link", "secondary"],
      required: false,
      overrides: {
        name: "buttonLink",
        label: "Header Button",
      },
    }),
    {
      name: "className",
      label: "Class Name",
      type: "text",
      required: false,
    },
  ],
  hooks: {
    afterChange: [revalidateHeader],
  },
};
