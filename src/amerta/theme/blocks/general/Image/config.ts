import type { Block } from "payload";
import { FixedToolbarFeature, HeadingFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";

export const ThemeShopImageBlock: Block = {
  slug: "themeShopImageBlock",
  interfaceName: "ThemeShopImageBlock",
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media", // Adjust if your media collection is named differently
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "enableParallax",
          type: "checkbox",
          label: "Enable Parallax Effect",
          defaultValue: false,
          admin: {
            width: "50%",
          },
        },
        {
          name: "height",
          type: "select",
          defaultValue: "medium",
          options: [
            { label: "Small (300px)", value: "small" },
            { label: "Medium (500px)", value: "medium" },
            { label: "Large (700px)", value: "large" },
            { label: "Full Screen", value: "screen" },
          ],
          admin: {
            width: "50%",
          },
        },
      ],
    },
    {
      type: "group",
      name: "contentSettings",
      label: "Content & Overlay",
      fields: [
        {
          name: "text",
          type: "richText",
          localized: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => [...rootFeatures, HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3"] }), FixedToolbarFeature(), InlineToolbarFeature()],
          }),
        },
        {
          type: "row",
          fields: [
            {
              name: "position",
              type: "select",
              defaultValue: "center",
              options: [
                { label: "Left", value: "left" },
                { label: "Center", value: "center" },
                { label: "Right", value: "right" },
              ],
            },
            {
              name: "overlayOpacity",
              type: "select",
              defaultValue: "50",
              options: [
                { label: "None", value: "0" },
                { label: "Light (20%)", value: "20" },
                { label: "Medium (50%)", value: "50" },
                { label: "Dark (80%)", value: "80" },
              ],
            },
          ],
        },
      ],
    },
  ],
};
