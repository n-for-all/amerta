import { Field } from "payload";

export const LocalizationFields: Field[] = [
  {
    name: "locales",
    type: "json",
    label: "Available Locales",
    admin: {
      description: "Configure which locales are enabled on your site. These locales are loaded from your payload.config.ts file.",
      components: {
        Field: "@/amerta/fields/localeSelector/index#LocaleSelector",
      },
    },
    jsonSchema: {
      uri: "a://variant-schema.json",
      fileMatch: ["*"],
      schema: {
        type: "array",
        description: "Simple list of variant values",
        items: {
          type: "string",
        },
      },
    },
  },
];
