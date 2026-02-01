import { Config } from "payload";
import { BoldFeature, ItalicFeature, LinkFeature, OrderedListFeature, ParagraphFeature, lexicalEditor, UnderlineFeature, UnorderedListFeature, BlocksFeature, HeadingFeature, HorizontalRuleFeature, FixedToolbarFeature } from "@payloadcms/richtext-lexical";
import { SlateToLexicalFeature } from "@payloadcms/richtext-lexical/migrate";

export const defaultLexical: Config["editor"] = lexicalEditor({
  features: () => {
    return [
      ParagraphFeature(),
      HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4", "h5", "h6"] }),
      UnderlineFeature(),
      BoldFeature(),
      ItalicFeature(),
      UnorderedListFeature(),
      OrderedListFeature(),
      HorizontalRuleFeature(),
      FixedToolbarFeature(),
      LinkFeature({
        enabledCollections: ["pages", "posts"],
        fields: ({ defaultFields }) => {
          const defaultFieldsWithoutUrl = defaultFields.filter((field) => {
            if ("name" in field && field.name === "url") return false;
            return true;
          });

          return [
            ...defaultFieldsWithoutUrl,
            {
              name: "url",
              type: "text",
              admin: {
                condition: ({ linkType }) => linkType !== "internal",
              },
              label: ({ t }) => t("fields:enterURL"),
              required: true,
              validate: (value: any, options: any) => {
                if (options?.siblingData?.linkType === "internal") {
                  return true; // no validation needed, as no url should exist for internal links
                }
                return value ? true : "URL is required";
              },
            },
          ];
        },
      }),
      SlateToLexicalFeature({}),
      BlocksFeature({
        blocks: [
          {
            slug: "formBlock",
            interfaceName: "FormBlock",
            fields: [
              {
                name: "form",
                type: "relationship",
                relationTo: "forms",
                required: true,
                label: "Select Form",
              },
            ],
            labels: {
              singular: "Form Block",
              plural: "Form Blocks",
            },
          },
        ],
      }),
    ];
  },
});
