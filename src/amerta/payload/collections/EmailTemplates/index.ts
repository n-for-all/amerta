/**
 * @module Collections/EmailTemplates
 * @title Email Templates Collection
 * @description This module defines the collections related to the email templates functionality in Amerta, including template content, categories, and notification settings.
 */

import { CollectionConfig } from "payload";

export const ADMIN_EMAILS = ["new_order", "cancelled_order", "failed_order", "new_account"] as const;

export const EMAIL_OPTIONS = [
  { label: "New Customer Order (Admin)", value: "new_order", for: "admin" },
  { label: "Cancelled Order (Admin)", value: "cancelled_order", for: "admin" },
  { label: "Cancelled Order", value: "customer_cancelled_order", for: "customer" },
  { label: "Failed Order (Admin)", value: "failed_order", for: "admin" },
  { label: "Failed Order", value: "customer_failed_order", for: "customer" },
  { label: "Order On-Hold", value: "customer_on_hold_order", for: "customer" },
  { label: "Order Processing (New Order)", value: "customer_processing_order", for: "customer" },
  { label: "Order Completed", value: "customer_completed_order", for: "customer" },
  { label: "Order Shipped", value: "customer_shipped_order", for: "customer" },
  { label: "Order Refunded", value: "customer_refunded_order", for: "customer" },
  { label: "Order Invoice / Details", value: "customer_invoice", for: "customer" },
  { label: "New Account (Admin)", value: "new_account", for: "admin" },
  { label: "New Account", value: "customer_new_account", for: "customer" },
  { label: "Verify Email", value: "customer_verify_email", for: "customer" },
  { label: "Reset Password", value: "customer_reset_password", for: "customer" },
] as const;

export const CUSTOMER_EMAILS = EMAIL_OPTIONS.filter((option) => !option.for || option.for !== "admin").map((option) => option.value);

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
      options: [...EMAIL_OPTIONS],
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
