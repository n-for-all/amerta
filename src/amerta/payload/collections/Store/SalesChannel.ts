import { CollectionConfig } from "payload";

export const SalesChannel: CollectionConfig = {
  slug: "sales-channel",
  labels: {
    plural: "Sales Channels",
    singular: "Sales Channel",
  },
  admin: {
    group: "Ecommerce",
    useAsTitle: "name",
  },
  access: {
    read: () => true,
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
        },
        {
          name: "enabled",
          type: "select",
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
      ],
    },
    {
      name: "currencies",
      type: "array",
      required: true,
      maxRows: 6,
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (!value || !Array.isArray(value)) return value;

            // Count how many currencies are marked as default
            const defaultCount = value.filter((currency) => currency.isDefault === true).length;

            if (defaultCount > 1) {
              throw new Error("Only one currency can be marked as default");
            }

            if (defaultCount === 0 && value.length > 0) {
              throw new Error("At least one currency must be marked as default");
            }

            return value;
          },
        ],
      },
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "currency",
              label: "Currency",
              type: "relationship",
              relationTo: "currency",
            },
            {
              name: "exchangeRate",
              label: "Exchange Rate",
              type: "number",
              admin: {
                description: "Exchange rate relative to USD (Important), it will automatically convert the price in the frontend. E.g., 1 USD = 0.85 EUR, so for EUR enter 0.85, for USD enter 1, for AED enter 3.67 etc...",
              },
            },
            {
              name: "isDefault",
              type: "checkbox",
              admin: {
                style: {
                  alignSelf: "end",
                },
              },
            },
          ],
        },
      ],
    },
    {
      name: "description",
      type: "textarea",
      localized: true,
    },
    {
      name: "isDefault",
      type: "checkbox",
      unique: true,
      admin: {
        description: "Only one sales channel can be marked as default",
        position: "sidebar",
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
    },
    {
      name: "updatedAt",
      label: "Updated At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
    },
  ],
};
