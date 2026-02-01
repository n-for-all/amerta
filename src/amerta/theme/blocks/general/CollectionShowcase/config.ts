import type { Block } from "payload";

export const ThemeShopCollectionShowcase: Block = {
  slug: "themeShopCollectionShowcase",
  interfaceName: "ThemeShopCollectionShowcaseBlock",
  
  fields: [
    {
      name: "title",
      label: "Title",
      type: "text",
      required: false,
      localized: true,
      admin: {
        description: "Main heading for the collections showcase section",
      },
    },
    {
      name: "subtitle",
      label: "Subtitle",
      type: "textarea",
      localized: true,
      required: false,
      admin: {
        description: "Subtitle/description text displayed below title",
      },
    },
    {
      name: "collections",
      label: "Collections",
      type: "relationship",
      relationTo: "collections",
      hasMany: true,
      maxDepth: 4,   
      required: false,
      admin: {
        description: "Select product collections to display in the carousel",
      },
    },
    {
      name: "className",
      label: "Class Name",
      type: "text",
      required: false,
      admin: {
        description: "Additional CSS classes for custom styling",
      },
    },
  ],
  labels: {
    plural: "Theme Shop Collection Showcase Blocks",
    singular: "Theme Shop Collection Showcase Block",
  },
};
