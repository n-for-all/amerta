import { Field } from "payload";
import { phoneField } from "./phoneField";

export const addressField: Field = {
  type: "group",
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "title",
          type: "text",
          label: "Address Title e.g Home or Work",
        },
        {
          name: "type",
          type: "select",
          label: "Type",
          defaultValue: "2",
          options: [
            {
              label: "Shipping & Billing",
              value: "2",
            },
            {
              label: "Shipping Only",
              value: "0",
            },
            {
              label: "Billing Only",
              value: "1",
            },
          ],
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "firstName",
          type: "text",
          required: true,
        },
        {
          name: "lastName",
          type: "text",
          required: true,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "country",
          type: "relationship",
          relationTo: "country",
          required: true,
        },
        {
          name: "city",
          type: "text",
          label: "City",
          required: true,
        },
      ],
    },
    {
      name: "address",
      type: "textarea",
      label: "Address (Area/Landmark)",
      required: true,
    },
    {
      name: "street",
      type: "text",
      label: "Street",
      required: true,
    },
    {
      type: "row",
      fields: [
        {
          name: "apartment",
          type: "text",
          label: "Apartment/Villa No.",
          required: true,
        },
        {
          name: "building",
          type: "text",
          label: "Building",
        },
        {
          name: "floor",
          type: "text",
          label: "Floor",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "state",
          type: "text",
          label: "State / Province",
        },
        {
          name: "postalCode",
          type: "text",
          label: "Postal code",
        },
      ],
    },
    phoneField,
    {
      type: "row",
      fields: [
        {
          name: "lat",
          type: "number",
          label: "Latitude",
        },
        {
          name: "lng",
          type: "number",
          label: "Longitude",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "isDefaultShipping",
          type: "checkbox",
          label: "Is Default Shipping",
          hooks: {
            beforeChange: [
              ({ data }) => {
                const items = data?.address?.items?.map((item) => item.isDefaultShipping);

                if (items && items.filter(Boolean).length > 1) {
                  // Prevent setting another default if one already exists
                  // You might need to implement logic to unset the other default here
                  throw new Error("Another default shipping address already exists, Please make sure there is only one default address");
                }
              },
            ],
          },
        },
        {
          name: "isDefaultBilling",
          type: "checkbox",
          label: "Is Default Billing",
          hooks: {
            beforeChange: [
              ({data }) => {
                const items = data?.address?.items?.map((item) => item.isDefaultBilling);

                if (items && items.filter(Boolean).length > 1) {
                  // Prevent setting another default if one already exists
                  // You might need to implement logic to unset the other default here
                  throw new Error("Another default billing address already exists, Please make sure there is only one default address");
                }
              },
            ],
          },
        },
      ],
    },
  ],
};
