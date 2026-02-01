import type { CollectionConfig } from "payload";
import { getByCountry } from "./handlers/get-by-country";
import { uniqueDefault } from "./hooks/unique-default";

export const TaxRates: CollectionConfig = {
  slug: "tax-rate",
  labels: {
    plural: "Tax Rates",
    singular: "Tax Rate",
  },
  admin: {
    defaultColumns: ["name", "country", "rate", "code"],
    group: "Ecommerce",
    useAsTitle: "name",
  },
  access: {
    read: () => true,
  },
  hooks: {
    beforeChange: [uniqueDefault],
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "taxType",
      type: "select",
      required: true,
      defaultValue: "default",
      options: [
        {
          label: "Default Tax",
          value: "default",
        },
        {
          label: "Specific Country Tax",
          value: "specific",
        },
      ],
      admin: {
        description: "Choose if this is a default tax rate or specific to certain shipping countries",
      },
    },
    {
      name: "countries",
      type: "relationship",
      relationTo: "country",
      hasMany: true,
      required: true,
      filterOptions: async ({ req }) => {
        const { payload } = req;
        try {
          // Fetch all shipping methods to get their countries
          const shippingMethods = await payload.find({
            collection: "shipping",
            depth: 1,
            limit: 1000,
          });

          // Extract unique country IDs from shipping methods
          const countryIds = new Set<string>();
          shippingMethods.docs.forEach((method: any) => {
            if (method.country) {
              const countryId = typeof method.country === "string" ? method.country : method.country.id;
              if (countryId) countryIds.add(countryId);
            }
          });

          // Return filter to only show these countries
          return {
            id: {
              in: Array.from(countryIds),
            },
          };
        } catch (error) {
          console.error("Error fetching shipping method countries:", error);
          return {
            id: {
              in: [],
            },
          };
        }
      },
      label: "Shipping Countries",
      admin: {
        description: "Select countries from shipping methods",
        condition: (data) => data.taxType === "specific",
      },
    },
    {
      name: "rate",
      label: "Rate (%)",
      type: "number",
      admin: { placeholder: "In percentage %" },
    },
    {
      name: "code",
      type: "text",
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
      path: "/get-by-country",
      method: "get",
      handler: getByCountry,
    },
  ],
};
