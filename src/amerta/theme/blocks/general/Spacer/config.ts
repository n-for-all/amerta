import type { Block } from "payload";

export const ThemeShopSpacerBlock: Block = {
  slug: "themeShopSpacerBlock",
  interfaceName: "ThemeShopSpacerBlock",
  labels: {
    singular: "Spacer",
    plural: "Spacers",
  },
  fields: [
    {
      name: "size",
      type: "select",
      label: "Desktop Size",
      defaultValue: "medium",
      required: true,
      options: [
        { label: "Small (16px)", value: "small" },
        { label: "Medium (32px)", value: "medium" },
        { label: "Large (64px)", value: "large" },
        { label: "X-Large (128px)", value: "xlarge" },
      ],
      admin: {
        width: "50%",
      },
    },
    {
      type: "group",
      name: "responsive",
      label: "Responsive Overrides (Optional)",
      admin: {
        description: "Leave blank to inherit the Desktop Size behavior.",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "tabletSize",
              type: "select",
              label: "Tablet / iPad",
              options: [
                { label: "Hidden", value: "hidden" },
                { label: "Small (16px)", value: "small" },
                { label: "Medium (32px)", value: "medium" },
                { label: "Large (64px)", value: "large" },
              ],
              admin: {
                width: "50%",
              },
            },
            {
              name: "mobileSize",
              type: "select",
              label: "Mobile",
              options: [
                { label: "Hidden", value: "hidden" },
                { label: "Small (16px)", value: "small" },
                { label: "Medium (32px)", value: "medium" },
                { label: "Large (64px)", value: "large" },
              ],
              admin: {
                width: "50%",
              },
            },
          ],
        },
      ],
    },
  ],
};
