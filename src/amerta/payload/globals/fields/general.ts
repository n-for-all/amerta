import { Field } from "payload";

export const GeneralFields: Field[] = [
  {
    name: "siteTitle",
    type: "text",
    label: "Site Title",
    localized: true,
    required: true,
    admin: {
      description: "The main title of your website",
    },
  },
  {
    name: "siteDescription",
    type: "textarea",
    label: "Site Description",
    localized: true,
    required: true,
    admin: {
      description: "A brief description of your website for search engines and social media",
    },
  },
  {
    name: "siteKeywords",
    type: "text",
    label: "Site Keywords",
    localized: true,
    admin: {
      description: "Comma-separated keywords relevant to your site (e.g., 'ecommerce, fashion, clothing')",
    },
  },
  {
    name: "dateFormat",
    type: "text",
    label: "Date Format",
    localized: true,
    defaultValue: "MMM dd, yyyy",
    admin: {
      description: "Format for displaying dates throughout the site (e.g., 'MMM dd, yyyy')",
    },
  },
  {
    name: "favicon",
    type: "upload",
    label: "Favicon",
    relationTo: "media",
    admin: {
      description: "Site favicon (.ico, .png, or .svg format, 32x32 pixels recommended)",
    },
  },
  {
    name: "appleTouchIcon",
    type: "upload",
    label: "Apple Touch Icon",
    relationTo: "media",
    admin: {
      description: "Apple touch icon for iOS devices (180x180 pixels recommended)",
    },
  },
  {
    name: "androidIcon",
    type: "upload",
    label: "Android Icon",
    relationTo: "media",
    admin: {
      description: "Android icon for home screen (192x192 pixels recommended)",
    },
  },
];
