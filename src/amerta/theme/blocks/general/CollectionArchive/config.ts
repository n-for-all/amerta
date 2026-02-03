import { Block } from "payload";
import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { link } from "@/amerta/fields/link/link";

export const ThemeShopCollectionArchive: Block = {
  slug: "themeShopCollectionArchive",
  interfaceName: "ThemeShopCollectionArchiveBlock",
  fields: [
    {
      name: "collectionObj",
      type: "relationship",
      relationTo: "collections",
      admin: {
        description: "Select the collection to display products from",
      },
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
      name: "title",
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
      name: "description",
      type: "textarea",
      localized: true,
      defaultValue: "",
    },
    {
      name: "limit",
      type: "number",
      defaultValue: 8,
      admin: {
        description: "Number of products to show",
      },
    },
  ],
};
