import { Field } from "payload";

export const NotificationsFields: Field[] = [
  {
    type: "collapsible",
    label: "Products Reviews Notifications",
    fields: [
      {
        name: "reviewNotificationsEnabled",
        type: "checkbox",
        label: "Enable Review Notifications",
        defaultValue: true,
        admin: {
          description: "Enable email notifications when product reviews are submitted",
        },
      },
      {
        name: "reviewNotificationEmails",
        type: "array",
        label: "Review Notification Email Addresses",
        admin: {
          condition: (data) => data.reviewNotificationsEnabled,
          description: "Add email addresses that should receive product review notifications",
        },
        fields: [
          {
            name: "email",
            type: "email",
            label: "Email Address",
            required: true,
          },
        ],
      },
      {
        name: "reviewNotificationTemplate",
        type: "richText",
        label: "Review Notification Email Template",
        defaultValue: {
          root: {
            type: "root",
            children: [
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "New Product Review Submitted",
                    bold: true,
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "",
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "Product: {productName}",
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "Rating: {reviewRating} out of 5 stars",
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "Author: {reviewAuthor}",
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "",
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "Review:",
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "{reviewContent}",
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "",
                  },
                ],
              },
              {
                type: "paragraph",
                children: [
                  {
                    type: "text",
                    text: "Submitted on: {timestamp}",
                    italic: true,
                  },
                ],
              },
            ],
          },
        },
        admin: {
          condition: (data) => data.reviewNotificationsEnabled,
          description: "Template for review notification emails. Use {productName}, {reviewAuthor}, {reviewRating}, {reviewContent}, {timestamp} as placeholders",
        },
      },
    ],
  },
];
