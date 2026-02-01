import type { Block } from "payload";
import { link } from "@/amerta/fields/link/link";
import { colorPickerField } from "@/amerta/fields/color";

export const ThemeShopGridShowcaseBlock: Block = {
  slug: "themeShopGridShowcase",
  interfaceName: "ThemeShopGridShowcaseBlock",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Left Section",
          fields: [
            {
              name: "leftTitle",
              label: "Title",
              type: "text",
              required: false,
              localized: true,
              admin: {
                description: "Main title for the left section",
              },
            },
            {
              name: "leftDescription",
              label: "Description",
              type: "textarea",
              required: false,
              localized: true,
              admin: {
                description: "Description text below title",
              },
            },
            {
              name: "leftImage",
              label: "Decorative Image",
              type: "upload",
              relationTo: "media",
              required: false,
              admin: {
                description: "Decorative image (e.g., circle-line pattern)",
              },
            },
            colorPickerField({
              name: "leftBackgroundColor",
              label: "Background Color",
              required: false,
              defaultValue: "#ECFF9F",
              admin: {
                description: "Hex color code for background",
              },
            })
          ],
        },
        {
          label: "Center Image",
          fields: [
            {
              name: "centerImage",
              label: "Center Hero Image",
              type: "upload",
              relationTo: "media",
              required: false,
              admin: {
                description: "Main hero image in center (square aspect ratio recommended)",
              },
            },
          ],
        },
        {
          label: "Right Section",
          fields: [
            {
              name: "rightTopImage",
              label: "Right Top Image",
              type: "upload",
              relationTo: "media",
              required: false,
              admin: {
                description: "Top image on right side",
              },
            },
            {
              name: "rightBottomTitle",
              label: "Right Bottom Title",
              type: "text",
              localized: true,
              required: false,
              admin: {
                description: "Title for the bottom right content",
              },
            },
            {
              name: "rightBottomDescription",
              label: "Right Bottom Description",
              type: "textarea",
              required: false,
              localized: true,
              admin: {
                description: "Description text for bottom right section",
              },
            },
            link({
              appearances: ["default"],
              overrides: {
                admin: {
                  description: "Optional button link for right section",
                },
              },
            }),
          ],
        },
        {
          label: "Settings",
          fields: [
            {
              name: "className",
              label: "Custom CSS Classes",
              type: "text",
              required: false,
              admin: {
                description: "Additional Tailwind classes for custom styling",
              },
            },
          ],
        },
      ],
    },
  ],
  labels: {
    plural: "Theme Shop Grid Showcases",
    singular: "Theme Shop Grid Showcase",
  },
};
