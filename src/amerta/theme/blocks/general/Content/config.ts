import type { Block, Field } from "payload";

import { FixedToolbarFeature, HeadingFeature, InlineToolbarFeature, lexicalEditor } from "@payloadcms/richtext-lexical";

import { link } from "@/amerta/fields/link/link";

const columnFields: Field[] = [
  {
    name: "size",
    type: "select",
    defaultValue: "12",
    options: [
      {
        label: "1",
        value: "1",
      },
      {
        label: "2",
        value: "2",
      },
      {
        label: "3",
        value: "3",
      },
      {
        label: "4",
        value: "4",
      },
      {
        label: "5",
        value: "5",
      },
      {
        label: "6",
        value: "6",
      },
      {
        label: "7",
        value: "7",
      },
      {
        label: "8",
        value: "8",
      },
      {
        label: "9",
        value: "9",
      },
      {
        label: "10",
        value: "10",
      },
      {
        label: "11",
        value: "11",
      },
      {
        label: "12",
        value: "12",
      },
      {
        label: "Full",
        value: "full",
      },
      {
        label: "twoThirds",
        value: "twoThirds",
      },
    ],
  },
  {
    name: "richText",
    type: "richText",
    localized: true,
    editor: lexicalEditor({
      features: ({ rootFeatures }) => {
        return [...rootFeatures, HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4", "h5"] }), FixedToolbarFeature(), InlineToolbarFeature()];
      },
    }),
    label: false,
  },
  {
    type: "row",
    fields: [
      {
        name: "enableLink",
        type: "checkbox",
        admin: {
          width: "50%",
        },
      },
      {
        name: "className",
        label: "Class Name",
        type: "text",
        required: false,
        admin: {
          width: "50%",
          description: "Custom CSS classes for this column",
        },
      },
    ],
  },
  link({
    overrides: {
      admin: {
        condition: (_, { enableLink }) => Boolean(enableLink),
      },
    },
  }),
];

export const ThemeShopContentBlock: Block = {
  slug: "themeShopContentBlock",
  interfaceName: "ThemeShopContentBlock",
  fields: [
    {
      name: "columns",
      type: "array",
      admin: {
        initCollapsed: true,
      },
      fields: columnFields,
    },
    {
      name: "removeContainer",
      type: "checkbox",
    },
  ],
};
