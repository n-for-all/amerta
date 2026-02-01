import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical/dist";
import { Block } from "payload";

export const ThemeShopNewsletterBlock: Block = {
  slug: "themeShopNewsletterBlock",
  interfaceName: "ThemeShopNewsletterBlock",
  fields: [
    {
      name: "headline",
      type: "richText",
      required: true,
      localized: true,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()];
        },
      }),
    },
    {
      name: "baseForm",
      label: "Form",
      type: "group",
      fields: [
        {
          name: "form",
          label: "Select Form",
          type: "relationship",
          relationTo: "forms", // adjust to your forms collection name
          required: false,
        },
        {
          name: "title",
          label: "Form Title",
          type: "text",
          localized: true,
          required: false,
        },
        {
          name: "description",
          label: "Form Description",
          type: "textarea",
          localized: true,
          required: false,
          admin: {
            description: "Optional description text above the form",
          },
        },
      ],
    },
    {
      name: "formText",
      type: "richText",
      localized: true,
      required: false,
      editor: lexicalEditor({
        features: ({ rootFeatures }) => {
          return [...rootFeatures, FixedToolbarFeature(), InlineToolbarFeature()];
        },
      }),

      defaultValue: {
        root: {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: "normal",
                  style: "",
                  text: "We care about your data. Read our privacy policy.",
                  type: "text",
                  version: 1,
                },
              ],
              direction: "ltr",
              format: "",
              indent: 0,
              type: "paragraph",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "root",
          version: 1,
        },
      },
    },
  ],
};
