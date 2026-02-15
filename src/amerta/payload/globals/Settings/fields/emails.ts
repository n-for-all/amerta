import { colorPickerField } from "@/amerta/fields/color";
import { Field } from "payload";

export const EmailFields: Field[] = [
  {
    type: "row",
    fields: [
      {
        name: "fromEmail",
        type: "email",
        label: "From Email Address",
        admin: {
          description: "Default sender email address for all outgoing emails",
        },
      },
      {
        name: "fromName",
        type: "text",
        label: "From Name",
        admin: {
          description: "Default sender name for all outgoing emails",
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "SMTP Configuration",
    fields: [
      {
        name: "smtpEnabled",
        type: "checkbox",
        label: "Enable SMTP",
        defaultValue: false,
        admin: {
          description: "Enable SMTP to send emails",
        },
      },
      {
        name: "smtpHost",
        type: "text",
        label: "SMTP Host",
        admin: {
          condition: (data) => data.smtpEnabled,
          description: "SMTP server hostname (e.g., smtp.gmail.com)",
        },
      },
      {
        name: "smtpPort",
        type: "number",
        label: "SMTP Port",
        defaultValue: 587,
        admin: {
          condition: (data) => data.smtpEnabled,
          description: "SMTP port number (typically 587 for TLS or 465 for SSL)",
        },
      },
      {
        name: "smtpSecure",
        type: "checkbox",
        label: "Use Secure Connection (SSL/TLS)",
        defaultValue: true,
        admin: {
          condition: (data) => data.smtpEnabled,
          description: "Enable SSL/TLS encryption for SMTP connection",
        },
      },
      {
        name: "smtpUsername",
        type: "text",
        label: "SMTP Username",
        admin: {
          condition: (data) => data.smtpEnabled,
          description: "Username for SMTP authentication",
        },
      },
      {
        name: "smtpPassword",
        type: "text",
        label: "SMTP Password",
        admin: {
          condition: (data) => data.smtpEnabled,
          description: "Password for SMTP authentication",
        },
      },
      {
        name: "testEmailPlaceholder",
        type: "ui",
        admin: {
          condition: (data) => data.smtpEnabled,
          components: {
            Field: "@/amerta/components/SendTestEmailButton/index#SendTestEmailButton",
          },
        },
      },
    ],
  },
  {
    type: "collapsible",
    label: "Email Logo & Footer",
    fields: [
      {
        name: "emailLogo",
        type: "upload",
        label: "Email Logo",
        relationTo: "media",
        admin: {
          description: "Logo to display at the top of emails (recommended: max 600px wide, optimal height: 80-100px)",
        },
        filterOptions: {
          mimeType: {
            in: ["image/jpeg", "image/png", "image/gif"],
          },
        },
      },
      colorPickerField({
        name: "emailThemeColor",
        label: "Email Theme Color",
        defaultValue: "#6F8FAF",
        admin: {
          description: "Choose a color for this email theme",
        },
      }),
      {
        type: "collapsible",
        label: "Email Footer",
        fields: [
          {
            name: "emailFooterAddress",
            type: "text",
            label: "Footer Address",
            admin: {
              description: "Business address to display in email footer",
            },
          },
          {
            name: "emailFooterEmail",
            type: "email",
            label: "Footer Email Address",
            admin: {
              description: "Contact email to display in email footer",
            },
          },
          {
            name: "emailFooterPhone",
            type: "text",
            label: "Footer Phone Number",
            admin: {
              description: "Phone number to display in email footer",
            },
          },
          {
            name: "emailFooterHtml",
            type: "richText",
            label: "Footer Custom HTML",
            admin: {
              description: "Additional custom HTML to append at the end of all emails (e.g., social media links, legal text)",
            },
          },
        ],
      },
    ],
  },
];
