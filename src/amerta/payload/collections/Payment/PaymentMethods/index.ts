import { admins } from "@/amerta/access/admins";
import { PAYMENT_ADAPTERS } from "@/amerta/payments";
import { CollectionConfig, Field } from "payload";
import { getPaymentMethods } from "./handlers/get-payment-methods";
import { executePaymentMethodAction } from "./handlers/execute-payment-method-action";
import { saveAdapterSettings } from "./hooks/save-adapter-settings";
import { filterCurrencies } from "./filters/filter-currencies";
import { preventDuplicate } from "./hooks/prevent-duplicate";
import { camelSlug } from "@/amerta/utilities/camelSlug";

export const PaymentMethods: CollectionConfig = {
  slug: "payment-method",
  admin: {
    useAsTitle: "name",
    defaultColumns: ["name", "label", "type", "active"],
    group: "Ecommerce",
  },
  access: {
    read: () => true,
    create: admins,
    update: admins,
    delete: admins,
  },
  hooks: {
    beforeChange: [preventDuplicate, saveAdapterSettings],
  },
  fields: [
    {
      type: "row",
      fields: [
        {
          name: "name",
          type: "text",
          required: true,
          admin: {
            description: "Internal name for the payment method (e.g., 'Credit Card', 'PayPal')",
          },
        },
        {
          name: "label",
          type: "text",
          required: true,
          localized: true,
          admin: {
            description: "Label visible to customers at checkout",
          },
        },
      ],
    },
    {
      name: "type",
      type: "select",
      required: true,
      unique: true,
      options: PAYMENT_ADAPTERS.map((adapter) => ({
        label: adapter.label,
        value: adapter.slug,
      })),
      admin: {
        description: "Type of payment method",
      },
    },
    ...PAYMENT_ADAPTERS.map(
      (adapter): Field => ({
        name: `${camelSlug(adapter.slug)}Settings`, // e.g. "stripeSettings"
        type: "group",
        fields: adapter.settingsFields,
        admin: {
          // Only show this group if the 'type' dropdown matches this adapter
          condition: (data) => data?.type === adapter.slug,
        },
      }),
    ),
    {
      name: "salesChannels",
      type: "relationship",
      relationTo: "sales-channel",
      hasMany: true,
      required: true,
      admin: {
        description: "This payment method will only be available in the selected sales channels.",
      },
    },
    {
      name: "currencies",
      type: "relationship",
      relationTo: "currency",
      label: "Supported currencies by the payment gateway",
      hasMany: true,
      filterOptions: filterCurrencies,
      admin: {
        description: "If the sales channel currency is not supported by the payment method, the currency conversion will be handled at checkout using the first supported currency.",
        condition: (data) => !!data?.salesChannels,
      },
    },
    {
      name: "description",
      type: "textarea",
      admin: {
        description: "Internal description of this payment method",
      },
    },
    {
      name: "publicDescription",
      type: "textarea",
      localized: true,
      admin: {
        description: "Description visible to customers",
      },
    },
    {
      name: "active",
      type: "checkbox",
      defaultValue: true,
      admin: {
        position: "sidebar",
        description: "Enable or disable this payment method",
      },
    },
    {
      name: "order",
      type: "number",
      defaultValue: 0,
      admin: {
        position: "sidebar",
        description: "Order of this payment method in the list",
      },
    },
    {
      name: "icons",
      type: "array",
      fields: [
        {
          name: "image",
          type: "upload",
          relationTo: "media",
          localized: true,
          required: true,
        },
      ],
      admin: {
        description: "Images/icons for this payment method",
        position: "sidebar",
      },
    },
  ],
  endpoints: [
    {
      path: "/get",
      method: "get",
      handler: getPaymentMethods,
    },
    {
      path: "/action",
      method: "post",
      handler: executePaymentMethodAction,
    },
  ],
};
