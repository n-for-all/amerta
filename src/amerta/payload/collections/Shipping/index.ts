/**
 * @module Collections/Shipping
 * @title Shipping Collection
 * @description This module defines the collections related to the shipping functionality in Amerta, including shipping methods, supported countries, and related handlers.
 */

import type { CollectionConfig } from "payload";
import { admins } from "@/amerta/access/admins";
import { getShippingMethods } from "./handlers/get-shipping-methods";
import { getSupportedCountries } from "./handlers/get-supported-countries";

export const Shipping: CollectionConfig = {
  slug: "shipping",
  labels: {
    plural: "Shipping Methods",
    singular: "Shipping Method",
  },
  admin: {
    useAsTitle: "name",
    group: "Ecommerce",
    defaultColumns: ["name", "country", "citiesType", "cost", "active"],
  },
  access: {
    read: () => true,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
      admin: {
        description: "e.g., Standard Shipping, Express Delivery",
      },
    },
    {
      name: "label",
      type: "text",
      required: true,
      localized: true,
      admin: {
        description: "Label displayed to customers (e.g., 'Standard - 5-7 days')",
      },
    },
    {
      name: "description",
      type: "text",
      localized: true,
      admin: {
        description: "Optional description of the shipping method",
      },
    },
    {
      name: "country",
      type: "relationship",
      relationTo: "country",
      required: true,
      admin: {
        description: "Select the country this shipping method applies to",
      },
    },
    {
      name: "citiesType",
      type: "select",
      required: true,
      options: [
        {
          label: "All Cities",
          value: "all",
        },
        {
          label: "Specific Cities",
          value: "specific",
        },
      ],
      admin: {
        description: "Choose whether this applies to all cities or specific ones",
      },
    },
    {
      name: "specificCities",
      type: "array",
      admin: {
        condition: (data) => data.citiesType === "specific",
        description: "Define specific cities for this shipping method",
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "city",
              type: "text",
              required: true,
              localized: true,
              admin: {
                description: "City name",
              },
            },
            {
              name: "code",
              type: "text",
              required: true,
              admin: {
                description: "City code or slug to match the customer's city",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "cost",
              type: "number",
              required: true,
              min: 0,
              admin: {
                description: "Shipping cost for this city (e.g., 5.00 for $5)",
                step: 0.01,
              },
            },
            {
              name: "estimatedDaysMin",
              type: "number",
              required: true,
              min: 1,
              admin: {
                description: "Minimum delivery days",
              },
            },
            {
              name: "estimatedDaysMax",
              type: "number",
              required: true,
              min: 1,
              admin: {
                description: "Maximum delivery days",
              },
            },
          ],
        },
        {
          type: "row",
          fields: [
            {
              name: "active",
              type: "checkbox",
              defaultValue: true,
              admin: {
                description: "Enable or disable shipping to this city",
              },
            },
            {
              name: "freeThreshold",
              type: "number",
              min: 0,
              admin: {
                description: "Order amount for free shipping (optional)",
                step: 0.01,
              },
            },
          ],
        },
      ],
    },
    {
      type: "row",
      admin: {
        condition: (data) => data.citiesType === "all",
      },
      fields: [
        {
          name: "cost",
          type: "number",
          required: true,
          min: 0,
          admin: {
            description: "Shipping cost in currency units (e.g., 5.00 for $5)",
            step: 0.01,
          },
        },
        {
          name: "estimatedDaysMin",
          type: "number",
          required: true,
          min: 1,
          admin: {
            description: "Minimum delivery days",
          },
        },
        {
          name: "estimatedDaysMax",
          type: "number",
          required: true,
          min: 1,
          admin: {
            description: "Maximum delivery days",
          },
        },
      ],
    },
    {
      name: "taxable",
      type: "checkbox",
      defaultValue: false,
      admin: {
        description: "Whether this shipping cost is subject to tax",
      },
    },
    {
      name: "taxRate",
      type: "number",
      min: 0,
      max: 100,
      admin: {
        condition: (data) => data.taxable === true,
        description: "Tax rate as percentage (e.g., 8.7 for 8.7%)",
        step: 0.01,
      },
    },
    {
      name: "freeThreshold",
      type: "number",
      min: 0,
      admin: {
        condition: (data) => data.citiesType === "all",
        description: "Order amount above which shipping is free (leave empty for no free shipping)",
        step: 0.01,
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Enable or disable this shipping method",
      },
    },
    {
      name: "salesChannel",
      type: "relationship",
      relationTo: "sales-channel",
      required: true,
      admin: {
        position: "sidebar",
        description: "This shipping method will only be available in the selected sales channels.",
      },
    },
    {
      name: "sortOrder",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Order in which to display shipping options",
      },
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
  endpoints: [
    {
      path: "/supported-countries",
      method: "get",
      handler: getSupportedCountries,
    },
    {
      path: "/get",
      method: "get",
      handler: getShippingMethods,
    },
  ],
};
