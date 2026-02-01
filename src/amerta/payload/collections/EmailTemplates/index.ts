import { CollectionConfig } from "payload";

export const ADMIN_EMAILS = ["new_order", "cancelled_order", "failed_order", "new_account"];

export const EmailTemplates: CollectionConfig = {
  slug: "email-templates",
  admin: {
    useAsTitle: "type",

    defaultColumns: ["type", "category", "enabled"],
    group: "Ecommerce",
    description: "Manage transactional emails.",
    pagination: {
      defaultLimit: 50,
      limits: [50, 100],
    },
  },
  access: {
    read: () => true,
    update: ({ req }) => !!req.user,
  },
  fields: [
    {
      name: "body",
      type: "code",
      label: "Email Content",
      required: true,
      admin: {
        language: "html",
        components: {
          Field: "@/amerta/components/EmailTemplate/index#EmailBuilder",
        },
      },
    },
    {
      name: "category",
      type: "text",
      virtual: true,
      admin: {
        hidden: true,
      },
      hooks: {
        afterRead: [
          ({ data }) => {
            if (!data?.type) return "";

            const adminTypes = ADMIN_EMAILS;

            if (adminTypes.includes(data.type)) return "Admin Staff";

            return "Customer";
          },
        ],
      },
    },
    {
      name: "enabled",
      type: "checkbox",
      label: "Enable Notification",
      defaultValue: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "type",
      type: "select",
      required: true,
      unique: true,
      label: "Event Type",
      admin: {
        position: "sidebar",
        description: "Determines when this email is sent.",
      },
      validate: async (value, { id, req }: { id?: string | number; req: any }) => {
        if (!value) return true;
        const existingDocs = await req.payload.find({
          collection: "email-templates",
          where: {
            type: { equals: value },

            id: { not_equals: id },
          },
          limit: 1,
        });

        if (existingDocs.totalDocs > 0) {
          return "This Event Type is already in use. Please edit the existing record instead of creating a new one.";
        }

        return true;
      },
      options: [
        { label: "New Order (Admin)", value: "new_order" },
        { label: "Cancelled Order (Admin)", value: "cancelled_order" },
        { label: "Cancelled Order", value: "customer_cancelled_order" },

        { label: "Failed Order (Admin)", value: "failed_order" },
        { label: "Failed Order", value: "customer_failed_order" },

        { label: "Order On-Hold", value: "customer_on_hold_order" },
        { label: "Order Processing", value: "customer_processing_order" },
        { label: "Order Completed", value: "customer_completed_order" },
        { label: "Order Shipped", value: "customer_shipped_order" },
        { label: "Order Refunded", value: "customer_refunded_order" },
        { label: "Order Invoice / Details", value: "customer_invoice" },
        { label: "New Account (Admin)", value: "new_account" },
        { label: "New Account", value: "customer_new_account" },
        { label: "Verify Email", value: "customer_verify_email" },
        { label: "Reset Password", value: "customer_reset_password" },
      ],
    },
    {
      name: "subject",
      type: "textarea",
      required: true,
      localized: true,
      label: "Subject Line",
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "staffRecipients",
      type: "relationship",
      relationTo: "users",
      hasMany: true,
      label: "Recipients (Staff)",
      admin: {
        position: "sidebar",
        description: "Who receives this alert?",
        condition: (data, siblingData) => {
          const adminTypes = ["new_order", "cancelled_order", "failed_order", "new_account"];
          return adminTypes.includes(siblingData.type);
        },
      },
    },
    {
      name: "bccAddress",
      type: "text",
      label: "BCC (Optional)",
      admin: {
        position: "sidebar",
        placeholder: "archive@store.com",
        description: "comma separated email addresses to BCC on this email",
        condition: (data, siblingData) => {
          const internalOnly = ["new_order", "cancelled_order"];
          return !internalOnly.includes(siblingData.type);
        },
      },
    },
  ],
};
