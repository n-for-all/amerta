import { Field } from "payload";

export const AIFields: Field[] = [
  {
    name: "aiModel",
    type: "select",
    label: "AI Model",
    options: [
      {
        label: "Gemini 2.0 Flash",
        value: "gemini-2.0-flash",
      },
      {
        label: "Gemini 2.5 Flash",
        value: "gemini-2.5-flash",
      },
      {
        label: "Gemini 2.0 Flash Lite",
        value: "gemini-2.0-flash-lite",
      },
      {
        label: "Gemini Flash Latest",
        value: "gemini-flash-latest",
      },
      {
        label: "Gemini Pro",
        value: "gemini-pro-latest",
      },
    ],
    defaultValue: "gemini-2.0-flash-lite",
    admin: {
      description: "Select the AI model to use for content generation",
    },
  },
  {
    name: "geminiTranslateApiKey",
    type: "text",
    label: "Gemini API Key",
    admin: {
      description: "API key for the selected AI service",
    },
  },
];
