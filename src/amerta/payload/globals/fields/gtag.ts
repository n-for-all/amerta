import { Field } from "payload";

export const GTagFields: Field[] = [
  {
    name: "gtagEnabled",
    type: "checkbox",
    label: "Enable Google GTag",
    defaultValue: false,
    admin: {
      description: "Enable Google Analytics 4 tracking via GTag",
    },
  },
  {
    name: "gtagConsentEnabled",
    type: "checkbox",
    label: "Enable Consent Mode",
    defaultValue: false,
    admin: {
      description: "Enable Google Consent Mode for GDPR compliance",
    },
  },
  {
    name: "gtagId",
    type: "text",
    label: "GTag ID",
    admin: {
      description: "Your Google Analytics 4 Measurement ID (e.g., GTM-XXXXXXXX)",
      condition: (data) => data.gtagEnabled,
    },
    validate: (value, { data }) => {
      if (data.gtagEnabled && !value) {
        return "GTag ID is required when GTag is enabled";
      }
      return true;
    },
  },
  {
    name: "consentPrivacyPolicy",
    type: "relationship",
    relationTo: "pages",
    label: "Consent Privacy Policy URL",
    admin: {
      description: "URL to your privacy policy for consent purposes",
      condition: (data) => data.gtagConsentEnabled,
    },
    validate: (value, { data }) => {
      if (data.gtagConsentEnabled && !value) {
        return "Privacy Policy URL is required when Consent Mode is enabled";
      }
      return true;
    },
  },
];
