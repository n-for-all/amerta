import { Block } from "payload";

export const ThemeShopReviewsBlock: Block = {
  slug: "themeShopReviews",
  interfaceName: "ThemeShopReviewsBlock",
  labels: {
    singular: "Theme Shop Reviews",
    plural: "Theme Shop Reviews",
  },
  fields: [
    {
      name: "eyebrow",
      type: "text",
      localized: true,
      admin: { description: "Small label above the heading" },
    },
    {
      name: "heading",
      type: "text",
      localized: true,
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "source",
      type: "select",
      defaultValue: "all",
      required: true,
      options: [
        { label: "All approved reviews", value: "all" },
        { label: "Reviews of selected products", value: "products" },
      ],
    },
    {
      name: "products",
      type: "relationship",
      relationTo: "products",
      hasMany: true,
      admin: {
        condition: (_, siblingData) => siblingData?.source === "products",
      },
    },
    {
      type: "row",
      fields: [
        {
          name: "limit",
          type: "number",
          defaultValue: 6,
          min: 1,
          max: 50,
          admin: { description: "Most recent first" },
        },
        {
          name: "showSummary",
          type: "checkbox",
          defaultValue: true,
          label: "Show the average rating",
        },
      ],
    },
  ],
};
