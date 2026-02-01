import { Block } from "payload";

export const ThemeShopBenefitsBlock: Block = {
  slug: "themeShopBenefitsBlock",
  interfaceName: "ThemeShopBenefitsBlock",
  labels: {
    singular: "Theme Shop Benefits Grid",
    plural: "Theme Shop Benefits Grids",
  },
  fields: [
    {
      name: "items",
      type: "array",
      label: "Benefit Items",
      minRows: 1,
      maxRows: 5,
      fields: [
        {
          name: "title",
          type: "text",
          required: true,
          label: "Title",
          localized: true,
        },
        {
          name: "description",
          type: "textarea",
          required: true,
          label: "Description",
          localized: true,
        },
        {
          name: "icon",
          label: "Icon",
          type: "text",
          required: false,
          admin: {
            components: {
              Field: "@/amerta/fields/icon/IconField",
            },
          },
        },
      ],
    },
  ],
};
