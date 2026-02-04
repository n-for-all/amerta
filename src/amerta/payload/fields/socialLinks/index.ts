import { Field } from "payload";

export const socialLinksField: Field = {
  name: "socialLinks",
  type: "array",
  label: "Social Media Links",
  fields: [
    {
      name: "platform",
      type: "select",
      options: [
        { label: "Facebook", value: "facebook" },
        { label: "Instagram", value: "instagram" },
        { label: "X (Twitter)", value: "x" },
        { label: "GitHub", value: "github" },
        { label: "YouTube", value: "youtube" },
      ],
      required: true,
    },
    {
      name: "url",
      type: "text",
      required: true,
    },
  ],
};
