import { type CollectionConfig } from "payload";
import { admins } from "../../access/admins";
import { anyone } from "../../access/anyone";
import adminsAndCustomer from "./access/adminsAndCustomer";
import { phoneField } from "../../fields/phoneField";
import { addressField } from "@/amerta/fields/addressField";
import { getURL } from "@/amerta/utilities/getURL";
import { generateVerificationEmail } from "@/amerta/utilities/emails/generateVerificationEmail";
import { generatePasswordResetEmail } from "@/amerta/utilities/emails/generatePasswordResetEmail";
import { sendNewAccountEmail } from "@/amerta/utilities/emails/sendNewAccountEmail";
import { verifyEmail } from "./handlers/verify-email";
import { getOrders } from "./handlers/get-orders";
import { getMeHandler } from "./handlers/get-me";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { cookies } from "next/headers";
import { CUSTOMER_AUTH_TOKEN } from "@/amerta/constants";

const cookieOptions = {
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 7, // 1 week
};

const CustomerTags: CollectionConfig = {
  slug: "customer-tags",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name"],
    group: "Ecommerce",
    hidden: true,
  },
  access: {
    read: adminsAndCustomer,
    create: anyone,
    update: adminsAndCustomer,
    delete: admins,
  },
  fields: [
    {
      name: "name",
      type: "text",
      required: true,
    },
    {
      name: "description",
      type: "textarea",
    },
  ],
};
const CustomerGroups: CollectionConfig = {
  slug: "customer-groups",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name"],
    group: "Ecommerce",
    hidden: true,
  },
  access: {
    read: adminsAndCustomer,
    create: anyone,
    update: adminsAndCustomer,
    delete: admins,
  },
  fields: [
    {
      name: "name",
      type: "text",
    },
  ],
};
const Customers: CollectionConfig = {
  slug: "customers",
  admin: {
    useAsTitle: "email",
    defaultColumns: ["firstName", "lastName", "email"],
  },
  auth: {
    // disableLocalStrategy: true,
    strategies: [
      {
        name: "amerta-customer-strategy",
        authenticate: async ({ payload, headers }) => {
          const cookies = parse(headers.get("cookie") || "");
          const token = cookies[CUSTOMER_AUTH_TOKEN];
          if (!token) return { user: null };

          try {
            const decoded = jwt.verify(token, payload.secret) as { id: string };

            const user = await payload.findByID({
              collection: "customers",
              id: decoded.id,
              depth: 0,
            });

            if (user) {
              return {
                user: {
                  ...user,
                  collection: "customers",
                  _strategy: "amerta-customer-strategy",
                },
              };
            }
          } catch (err) {
            return { user: null };
          }

          return { user: null };
        },
      },
    ],
    cookies: {
      secure: process.env.NODE_ENV === "production",
    },
    verify: {
      generateEmailHTML: async ({ token, user, req }) => {
        const defaultLocale = (req.payload.config.localization as { defaultLocale: string })?.defaultLocale || "en";

        const locale = req.locale || defaultLocale;
        const url = getURL(`/verify-email?token=${token}`, locale);
        const template = await generateVerificationEmail(user, url);

        return template.html;
      },
      generateEmailSubject: async ({ token, user, req }) => {
        const defaultLocale = (req.payload.config.localization as { defaultLocale: string })?.defaultLocale || "en";

        const locale = req.locale || defaultLocale;
        const url = getURL(`/verify-email?token=${token}`, locale);
        const template = await generateVerificationEmail(user, url);

        return template.subject;
      },
    },
    forgotPassword: {
      generateEmailHTML: async ({ token, user, req } = {}) => {
        if (!token || !user || !req) {
          return "<h1>Error</h1><p>Invalid password reset request.</p>";
        }

        const defaultLocale = (req.payload.config.localization as { defaultLocale: string })?.defaultLocale || "en";

        const locale = req.locale || defaultLocale;
        const resetPasswordUrl = getURL(`/reset-password?token=${token}`, locale);
        const template = await generatePasswordResetEmail(user, resetPasswordUrl);

        return template.html;
      },
      generateEmailSubject: async ({ token, user, req } = {}) => {
        if (!token || !user || !req) {
          return "<h1>Error</h1><p>Invalid password reset request.</p>";
        }

        const defaultLocale = (req.payload.config.localization as { defaultLocale: string })?.defaultLocale || "en";

        const locale = req.locale || defaultLocale;
        const resetPasswordUrl = getURL(`/reset-password?token=${token}`, locale);
        const template = await generatePasswordResetEmail(user, resetPasswordUrl);
        return template.subject;
      },
    },
  },
  hooks: {
    afterLogin: [
      async ({ user, token }) => {
        const cookieStore = await cookies();
        cookieStore.set(CUSTOMER_AUTH_TOKEN, token, cookieOptions);
        return {
          ...user,
          verified: user._verified || false,
          loginTime: new Date().toISOString(),
        };
      },
    ],
    afterChange: [
      async ({ doc, operation, req }) => {
        //! don't send email if an admin is creating the user
        if (operation !== "create" || req.user || doc.hasAccount != "1") return doc;

        await sendNewAccountEmail(doc);
        return doc;
      },
    ],
    afterLogout: [
      async () => {
        const cookieStore = await cookies();
        cookieStore.set(CUSTOMER_AUTH_TOKEN, "", {
          path: "/",
          maxAge: 0,
        });
      },
    ],
  },
  access: {
    read: adminsAndCustomer,
    create: anyone,
    update: adminsAndCustomer,
    delete: admins,
    admin: () => {
      return false;
    },
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "firstName",
          type: "text",
        },
        {
          name: "lastName",
          type: "text",
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          type: "row",
          fields: [
            {
              name: "displayName",
              type: "text",
            },
          ],
        },
        {
          label: "Contact Email (guest checkout email)",
          name: "contact_email",
          type: "email",
          required: false,
        },
      ],
    },
    {
      type: "row",
      fields: [
        {
          name: "email",
          type: "email",
          required: true,
        },
        phoneField,
      ],
    },
    {
      label: false,
      name: "address",
      type: "group",
      fields: [
        {
          name: "items",
          label: "Addresses",
          type: "array",
          interfaceName: "Address",
          labels: {
            singular: "Address",
            plural: "Addresses",
          },
          fields: [addressField],
        },
      ],
    },
    {
      name: "groups",
      label: "Customer Groups",
      type: "relationship",
      relationTo: "customer-groups",
      hasMany: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "tags",
      label: "Customer Tags",
      type: "relationship",
      relationTo: "customer-tags",
      hasMany: true,
      admin: {
        position: "sidebar",
      },
    },
    {
      name: "createdAt",
      label: "Created At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      hooks: {
        beforeChange: [
          ({ value }) => {
            if (!value) {
              return new Date();
            }
            return value;
          },
        ],
      },
    },
    {
      name: "hasAccount",
      label: "Has Account",
      type: "select",
      admin: {
        position: "sidebar",
      },
      defaultValue: "1",
      options: [
        {
          label: "Yes",
          value: "1",
        },
        {
          label: "No",
          value: "0",
        },
      ],
    },
    {
      name: "updatedAt",
      label: "Updated At",
      type: "date",
      admin: {
        readOnly: true,
        position: "sidebar",
      },
      hooks: {
        beforeChange: [
          () => {
            return new Date();
          },
        ],
      },
    },
  ],
  endpoints: [
    {
      path: "/me",
      method: "get",
      handler: getMeHandler,
    },
    {
      path: "/verify",
      method: "post",
      handler: verifyEmail,
    },
    {
      path: "/orders",
      method: "get",
      handler: getOrders,
    },
    {
      path: "/login",
      method: "post",
      handler: async (req) => {
        const { email, password } = req.json ? await req.json() : {};
        const result = await req.payload.login({
          collection: "customers",
          data: { email, password },
          req,
        });

        const token = result.token;
        if (!token) {
          return Response.json({ message: "Authentication failed" }, { status: 401 });
        }

        const cookieStore = await cookies();
        cookieStore.set(CUSTOMER_AUTH_TOKEN, token, cookieOptions);

        return Response.json({ user: result.user, token });
      },
    },
  ],
  timestamps: true,
};

export { Customers, CustomerGroups, CustomerTags };
