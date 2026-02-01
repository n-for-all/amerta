import type { Block } from "payload";
import { link } from "@/amerta/fields/link/link";

export const ThemeShopCTAFeatureBlock: Block = {
  slug: "themeShopCtaFeature",
  interfaceName: "ThemeShopCTAFeatureBlock",
  fields: [
    {
      type: "tabs",
      tabs: [
        {
          label: "Content",
          fields: [
            {
              name: "title",
              label: "Title",
              type: "text",
              required: false,
              localized: true,
              admin: {
                description: "Main headline for the CTA section",
              },
            },
            {
              name: "description",
              label: "Description",
              type: "textarea",
              required: false,
              localized: true,
              admin: {
                description: "Detailed description text",
              },
            },
            link({
              appearances: ["default", "destructive", "ghost", "outline", "link", "outline", "secondary"],
              required: false,
            }),
          ],
        },
        {
          label: "Images",
          fields: [
            {
              name: "leftImage",
              label: "Left Side Image (3/4 Aspect)",
              type: "upload",
              relationTo: "media",
              required: false,
              admin: {
                description: "Main feature image on left side (recommended: 325x335px or similar 3:4 ratio)",
              },
            },
            {
              name: "rightImage",
              label: "Right Side Image (Full Height)",
              type: "upload",
              relationTo: "media",
              required: false,
              admin: {
                description: "Large feature image on right side (recommended: 495x530px)",
              },
            },
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
            {
              name: "backgroundColor",
              label: "Background Color",
              type: "select",
              options: [
                { label: "White", value: "white" },
                { label: "Off White", value: "off-white" },
                { label: "Light Gray", value: "light-gray" },
              ],
              defaultValue: "white",
            },
          ],
        },
      ],
    },
  ],
  labels: {
    plural: "Theme Shop CTA Features",
    singular: "Theme Shop CTA Feature",
  },
};
