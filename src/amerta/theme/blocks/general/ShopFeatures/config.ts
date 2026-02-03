import { Block } from "payload";
import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";

export const ThemeShopFeaturesBlock: Block = {
  slug: "themeShopFeaturesBlock",
  interfaceName: "ThemeShopFeaturesBlock",
  fields: [
    {
      name: "image",
      type: "upload",
      relationTo: "media",
      admin: {
        description: "Image displayed on the left side. Recommended aspect ratio: 1:1 or 4:5.",
      },
    },
    {
      name: "headline",
      type: "richText",
      localized: true,
      editor: lexicalEditor({
        features: ({ defaultFeatures }) => [...defaultFeatures.filter((feature) => ["bold", "italic"].includes(feature.key)), FixedToolbarFeature(), InlineToolbarFeature()],
      }),
      admin: {
        description: "Use Bold for 'Dimmed' text and Italic for 'Serif' text.",
      },
    },
    {
      name: "features",
      type: "array",
      required: true,
      minRows: 1,
      maxRows: 6,
      fields: [
        {
          name: "title",
          type: "text",
          localized: true,
        },
        {
          name: "description",
          type: "richText",
          localized: true,
          editor: lexicalEditor({
            features: ({ rootFeatures }) => {
              return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()];
            },
          }),
        },
      ],
    },
  ],
};
