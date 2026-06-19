import { type CollectionConfig } from "payload";
import { admins } from "../../access/admins";

export const EmailLogs: CollectionConfig = {
  slug: "email-logs",
  admin: {
    group: "Settings",
    useAsTitle: "subject",
    defaultColumns: ["to", "subject", "createdAt"],
  },
  access: {
    read: admins,
    create: admins,
    update: admins,
    delete: admins,
  },
  fields: [
    {
      name: "to",
      type: "text",
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "from",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "subject",
      type: "text",
      required: true,
      admin: {
        readOnly: true,
      },
    },
    {
      name: "html",
      type: "textarea",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "bcc",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "replyTo",
      type: "text",
      admin: {
        readOnly: true,
      },
    },
    {
      name: "status",
      type: "select",
      defaultValue: "sent",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      options: [
        { label: "Sent", value: "sent" },
        { label: "Failed", value: "failed" },
      ],
    },
    {
      name: "error",
      type: "textarea",
      admin: {
        readOnly: true,
        condition: (data) => data.status === "failed",
      },
    },
  ],
};
