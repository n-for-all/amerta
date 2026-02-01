import { Field } from "payload";

export const phoneField: Field = {
  type: "collapsible",
  label: "Phone Number",
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "phoneCountryCode",
          type: "text",
          admin: {
            description: "Country code (e.g., +1)",
            components: {
              Field: "@/amerta/fields/phone/PhoneFieldComponent",
            },
          },
          defaultValue: "+1",
        },
        {
          label: false,
          name: "phone",
          type: "number",
          admin: {
            placeholder: "Enter phone number",
          },
        },
      ],
    },
  ],
};
