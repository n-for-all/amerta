/**
 * @module Collections/Countries
 * @title Countries Collection
 * @description This module defines the collections related to the countries functionality in Amerta, including country details such as name, ISO codes, and status.
 */

import type { CollectionConfig } from "payload";

export const Countries: CollectionConfig = {
  slug: "country",
  labels: {
    plural: "Countries",
    singular: "Country",
  },
  defaultSort: '-active',
  admin: {
    defaultColumns: ['display_name', 'active', 'iso_2', 'iso_3'],

    // hidden: true,
    group: "Ecommerce",
    useAsTitle: "display_name",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
    {
      name: "display_name",
      type: "text",
    },
    {
      name: "iso_2",
      type: "text",
    },
    {
      name: "iso_3",
      type: "text",
    },
    {
      name: "num_code",
      type: "number",
    },
    {
      name: "active",
      type: "select",
      admin: {
        position: "sidebar",
      },
      options: [
        {
          label: "Active",
          value: "1",
        },
        {
          label: "Inactive",
          value: "0",
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
          ({ siblingData, value }) => {
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
