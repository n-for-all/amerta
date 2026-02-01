import type { Block } from "payload";

import { FixedToolbarFeature, HeadingFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { linkGroup } from "@/amerta/fields/link/linkGroup";

export const ThemeShopCallToActionTextBlock: Block = {
  slug: "themeShopCallToActionText",
  interfaceName: "ThemeShopCallToActionTextBlock",
  fields: [
    {
      name: "richText",
      type: "richText",
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] }), FixedToolbarFeature(), InlineToolbarFeature()];
        },
      }),
      label: false,
      localized: true,
    },
    linkGroup({
      appearances: ["default", "destructive", "ghost", "outline", "link", "outline", "secondary"],
      overrides: {
        maxRows: 2,
      },
    }),
  ],
  labels: {
    plural: "Theme Shop Call to Action",
    singular: "Theme Shop Call to Action",
  },
};
