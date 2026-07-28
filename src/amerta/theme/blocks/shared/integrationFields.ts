import type { Field } from "payload";

/**
 * Shared editor fields for integration-focused theme blocks.
 *
 * Keeping the content model separate lets future integration layouts reuse the
 * same Payload data without duplicating the schema.
 */
export const integrationFields: Field[] = [
  {
    name: "heading",
    type: "text",
    required: true,
    localized: true,
  },
  {
    name: "subtext",
    type: "textarea",
    localized: true,
  },
  {
    name: "integrations",
    type: "array",
    required: true,
    minRows: 2,
    maxRows: 12,
    admin: {
      initCollapsed: true,
    },
    fields: [
      {
        name: "logo",
        type: "upload",
        relationTo: "media",
        required: true,
      },
      {
        name: "name",
        type: "text",
        required: true,
      },
      {
        name: "description",
        type: "textarea",
        localized: true,
      },
      {
        name: "href",
        type: "text",
      },
    ],
  },
];
