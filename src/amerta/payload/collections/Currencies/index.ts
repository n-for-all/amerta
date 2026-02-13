/**
 * @module Collections/Currencies
 * @title Currencies Collection
 * @description This module defines the collections related to the currencies functionality in Amerta, including currency codes, symbols, formatting, and status.
 */

import type { CollectionConfig } from "payload";

export const Currencies: CollectionConfig = {
  slug: "currency",
  labels: {
    plural: "Currencies",
    singular: "Currency",
  },
  admin: {
    // hidden: true,
    group: "Ecommerce",
    useAsTitle: "name",
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
      type: "row",
      fields: [
        {
          name: "code",
          type: "text",
        },
        {
          name: "symbol",
          type: "text",
        },
        {
          name: "symbolNative",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "decimalDigits",
          type: "number",
        },
        {
          name: "rounding",
          type: "number",
        },
      ],
    },

    {
      name: "raw_rounding",
      type: "json",
    },
    {
      name: "format",
      type: "text",
      admin: { description: "Use {{amount}} as a placeholder for the amount. E.g. {{amount}} USD" },
    },
    {
      name: "enabled",
      type: "select",
      admin: {
        position: "sidebar",
      },
      required: true,
      options: [
        {
          label: "Enabled",
          value: "1",
        },
        {
          label: "Disabled",
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
