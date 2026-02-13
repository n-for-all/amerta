/**
 * @module Collections/Products/ProductOptions
 * @title Product Options
 * @description This module defines the collections related to the product options functionality in Amerta, including option details, types, and associated metadata.
 */

import { CollectionConfig } from "payload";

export const ProductOptions: CollectionConfig = {
  slug: "product-options",
  trash: true,
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "type", "showInFilter", "showInSearch", "createdAt"],
    group: "Products",
    // hidden: true,
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "type",
          type: "select",
          required: true,
          options: [
            {
              label: "Text",
              value: "text",
            },
            {
              label: "Image",
              value: "image",
            },
            {
              label: "Dropdown",
              value: "dropdown",
            },
            {
              label: "Radio",
              value: "radio",
            },
            {
              label: "Color",
              value: "color",
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "showInFilter",
          defaultValue: "1",
          type: "checkbox",
          admin: {
            width: "25%",
            style: {
              alignSelf: "end",
            },
          },
        },
        {
          name: "showInSearch",
          defaultValue: "1",
          type: "checkbox",
          admin: {
            width: "25%",
            style: {
              alignSelf: "end",
            },
          },
        },
      ],
    },
    {
      name: "images",
      label: "Images",
      type: "array",
      admin: {
        condition: (data) => {
          if (data.type == "image") {
            return true;
          } else {
            return false;
          }
        },
      },
      labels: {
        singular: "Image",
        plural: "Images",
      },
      fields: [
        {
          name: "label",
          type: "text",
          required: true,
          localized: true,
        },
        {
          name: "image",
          type: "upload",
          relationTo: "product-media",
          required: true,
        },
      ],
    },
    {
      name: "colors",
      label: "Colors",
      type: "array",
      admin: {
        condition: (data) => {
          if (data.type == "color") {
            return true;
          } else {
            return false;
          }
        },
      },
      labels: {
        singular: "Color",
        plural: "Colors",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "label",
              type: "text",
              required: true,
              localized: true,
            },
            {
              name: "color",
              type: "text",
              required: true,
              admin: {
                components: {
                  Field: "@/amerta/components/ColorPicker/",
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: "options",
      label: "Options",
      type: "array",
      admin: {
        condition: (data) => {
          if (data.type == "dropdown" || data.type == "radio") {
            return true;
          } else {
            return false;
          }
        },
      },
      labels: {
        singular: "Option",
        plural: "Options",
      },
      fields: [
        {
          name: "option",
          type: "text",
          required: true,
        },
        {
          name: "label",
          type: "text",
          required: false,
          localized: true,
        },
      ],
    },
    {
      name: "createdAt",
      label: "Created At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (!value) {
              return new Date();
            }
            return value;
          },
        ],
      },
    },
    {
      name: "updatedAt",
      label: "Updated At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      hooks: {
        beforeChange: [
          () => {
            return new Date();
          },
        ],
      },
    },
  ],
};
