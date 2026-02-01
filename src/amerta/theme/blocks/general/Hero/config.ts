import type { Block } from "payload";
import { link } from "@/amerta/fields/link/link";
import { colorPickerField } from "@/amerta/fields/color";

export const ThemeShopHero: Block = {
  slug: "themeShopHero",
  interfaceName: "ThemeShopHeroBlock",

  fields: [
    colorPickerField({
      name: "backgroundColor",
      label: "Background Color",
      defaultValue: "#ECFF9F",
      required: false,
      admin: {
        description: "HEX color code (e.g., #ECFF9F)",
      },
    }),
    {
      name: "image",
      label: "Hero Image",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "Hero image displayed on the right side. Recommended size: 815x987px",
      },
      filterOptions: {
        mimeType: {
          in: ["image/svg+xml", "image/png", "image/jpeg", "image/webp"],
        },
      },
    },
    link({
      appearances: ["default", "destructive", "ghost", "outline", "link", "secondary"],
      required: false,
      overrides: { name: "logoLink", label: "Logo Link" },
    }),
    {
      name: "logo",
      label: "Logo",
      type: "upload",
      relationTo: "media",
      required: false,
      admin: {
        description: "SVG recommended for best quality. PNG, JPG also supported.",
      },
      filterOptions: {
        mimeType: {
          in: ["image/svg+xml", "image/png", "image/jpeg", "image/webp"],
        },
      },
    },
    {
      name: "topTitle",
      label: "Top Title",
      type: "text",
      required: false,
      localized: true,
    },
    {
      name: "title",
      label: "Title",

      type: "text",
      required: false,
      localized: true,
    },
    {
      ...link({
        appearances: ["default", "destructive", "ghost", "outline", "link", "secondary"],
        required: false,
        overrides: {
          name: "buttonPrimary",
          label: "Primary Button",
        },
      }),
    },
    {
      ...link({
        appearances: ["default", "destructive", "ghost", "outline", "link", "secondary"],
        required: false,
        overrides: {
          name: "buttonSecondary",
          label: "Secondary Button",
        },
      }),
    },
    {
      name: "subtitle",
      label: "Sub Title",
      type: "textarea",
      required: false,
      localized: true,
    },
    {
      name: "className",
      label: "Class Name",
      type: "text",
      required: false,
    },
  ],
  labels: {
    plural: "Theme Shop Hero Blocks",
    singular: "Theme Shop Hero Block",
  },
};
