import type { Block } from "payload";

export const ThemeShopMediaBlock: Block = {
  slug: "themeShopMediaBlock",
  interfaceName: "ThemeShopMediaBlock",
  fields: [
    {
      name: "media",
      type: "upload",
      relationTo: "media",
      required: true,
    },
    {
      name: "position",
      type: "number",
      defaultValue: 0,
      required: false,
    },
  ],
};
