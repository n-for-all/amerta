import { Block } from "payload";
import { FixedToolbarFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { link } from "@/amerta/fields/link/link";

export const ThemeShopBlogPostsBlock: Block = {
  slug: "themeShopBlogPosts",
  interfaceName: "ThemeShopBlogPostsBlock",
  fields: [
    {
      name: "category",
      type: "relationship",
      relationTo: "categories", // Assuming your collection slug is 'collections' or 'categories'
      admin: {
        description: "Select the category to limit posts from",
      },
    },
    {
        name: "type",
        type: "select",
        options: [
          {
            label: "Featured Posts",
            value: "featured",
          },
          {
            label: "Latest Posts",
            value: "latest",
          },
        ],
        defaultValue: "latest",
        admin: {
          description: "Choose to display featured posts or the latest posts",
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
      required: true,
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
      required: false,
      defaultValue: "",
    },
    {
      name: "limit",
      type: "number",
      defaultValue: 8,
      required: false,
      admin: {
        description: "Number of posts to show",
      },
    },
  ],
  labels: {
    singular: "Theme Shop Blog Posts Block",
    plural: "Theme Shop Blog Posts Blocks",
  },
};
