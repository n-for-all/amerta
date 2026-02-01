import deepmerge from "deepmerge";
import type { CollapsibleField, Field, GroupField } from "payload";

export type LinkAppearances = "default" | "outline" | "destructive" | "ghost" | "link" | "secondary";

export const appearanceOptions: Record<LinkAppearances, { label: string; value: string }> = {
  default: {
    label: "Default",
    value: "default",
  },
  outline: {
    label: "Outline",
    value: "outline",
  },
  destructive: {
    label: "Destructive",
    value: "destructive",
  },
  ghost: {
    label: "Ghost",
    value: "ghost",
  },
  link: {
    label: "Link",
    value: "link",
  },
  secondary: {
    label: "Secondary",
    value: "secondary",
  },
};

type LinkType = (options?: { appearances?: LinkAppearances[] | false; required?: boolean; disableLabel?: boolean; overrides?: Partial<GroupField> }) => Field;

export const link: LinkType = ({ appearances, disableLabel = false, required = true, overrides = {} } = {}) => {
  const linkCollapsableResult: CollapsibleField = {
    type: "collapsible",
    label: "Link Options",
    admin: {
      initCollapsed: true,
      components: {
        Label: "@/amerta/fields/link/RowLabel#Label",
      },
    },
    fields: [],
  };
  const linkResult: GroupField = {
    name: "link",
    type: "group",
    admin: {
      hideGutter: true,
    },
    fields: [
      {
        type: "row",
        fields: [
          {
            name: "type",
            type: "radio",
            admin: {
              layout: "horizontal",
              width: appearances !== false ? "25%" : "50%",
            },
            defaultValue: "reference",
            options: [
              {
                label: "Internal link",
                value: "reference",
              },
              {
                label: "Custom URL",
                value: "custom",
              },
            ],
          },
        ],
      },
    ],
  };

  const linkTypes: Field[] = [
    {
      name: "reference",
      type: "relationship",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "reference",
      },
      label: "Document to link to",
      relationTo: ["pages", "posts", "categories", "products", "collections", "product-brands"],
      required: required,
    },
    {
      name: "url",
      type: "text",
      admin: {
        condition: (_, siblingData) => siblingData?.type === "custom",
        description: "use {locale} to insert the current locale code into the URL",
      },
      label: "Custom URL",
      required: required,
    },
    {
      name: "newTab",
      type: "checkbox",
      admin: {
        style: {
          alignSelf: "flex-end",
        },
        width: "25%",
      },
      label: "Open in new tab",
    },
  ];

  if (!disableLabel) {
    linkTypes.map((linkType) => ({
      ...linkType,
      admin: {
        ...linkType.admin,
        width: "50%",
      },
    }));

    linkResult.fields.push({
      type: "row",
      fields: [
        ...linkTypes,
        {
          name: "label",
          type: "text",
          admin: {
            width: "50%",
            components: {
               Field: "@/amerta/fields/link/AutoLabel#AutoLabel", 
            }
          },
          label: "Label",
          localized: true,
          required: required,
        },
      ],
    });
  } else {
    linkResult.fields = [...linkResult.fields, ...linkTypes];
  }

  if (appearances !== false) {
    let appearanceOptionsToUse = [appearanceOptions.default, appearanceOptions.outline, appearanceOptions.secondary, appearanceOptions.destructive, appearanceOptions.ghost, appearanceOptions.link];

    if (appearances) {
      appearanceOptionsToUse = appearances.map((appearance) => appearanceOptions[appearance]);
    }

    const row: Field[] = [
      {
        name: "size",
        type: "select",
        admin: {
          description: "Choose how the link size.",
        },
        defaultValue: "default",
        options: [
          { label: "X Small", value: "xs" },
          { label: "Small", value: "sm" },
          { label: "Default", value: "default" },
          { label: "Large", value: "lg" },
        ],
      },
    ];
    row.push({
      name: "appearance",
      type: "select",
      admin: {
        description: "Choose how the link should be rendered.",
      },
      defaultValue: "default",
      options: appearanceOptionsToUse,
    });

    (linkResult.fields[0]! as any).fields?.push(...row);
  }
  linkCollapsableResult.fields.push(deepmerge(linkResult, overrides));

  return linkCollapsableResult;
};
