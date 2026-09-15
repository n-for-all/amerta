import { AmertaApp } from "../types";
import {
  awardOrderPoints,
  clawbackOrderPoints,
  awardWelcomeBonus,
} from "./services/loyaltyEngine";
import {
  getLoyaltySettingsEndpoint,
  updateLoyaltySettingsEndpoint,
} from "./endpoints/settings";
import { getCustomerLoyaltyStatusEndpoint } from "./endpoints/customer";
import {
  adminSearchLoyaltyCustomersEndpoint,
  adminGetLoyaltyOrdersEndpoint,
  adminAdjustPointsEndpoint,
  adminUpdateCustomerEndpoint,
} from "./endpoints/admin";
import { LoyaltyCheckoutRedemption } from "./components/storefront/LoyaltyCheckoutRedemption";
import { CustomerAccountLoyaltyCard } from "./components/storefront/CustomerAccountLoyaltyCard";
import { ProductPointsBadge } from "./components/storefront/ProductPointsBadge";

export const loyaltyApp: AmertaApp = {
  name: "Loyalty & VIP Circle",
  slug: "loyalty",
  description:
    "Complete loyalty rewards program with VIP tier ladder, checkout point redemption, customer account dashboard cards, and admin manager.",
  version: "1.0.0",
  adminNavigation: {
    label: "Loyalty & VIP",
    path: "/admin/loyalty-settings",
  },
  hooks: {
    onOrderPaid: async (order, payload) => {
      await awardOrderPoints(order, payload);
    },
    onOrderCancelled: async (order, payload) => {
      await clawbackOrderPoints(order, payload);
    },
    onCustomerCreated: async (customer, payload) => {
      await awardWelcomeBonus(String(customer.id), payload);
    },
  },
  storefrontExtensions: [
    {
      target: "checkout.order_summary.before_totals",
      Component: LoyaltyCheckoutRedemption,
    },
    {
      target: "account.dashboard.cards",
      Component: CustomerAccountLoyaltyCard,
    },
    {
      target: "product.price.after",
      Component: ProductPointsBadge,
    },
  ],
  extendConfig: (config) => {
    return {
      ...config,
      admin: {
        ...(config.admin || {}),
        components: {
          ...(config.admin?.components || {}),
          views: {
            ...(config.admin?.components?.views || {}),
            LoyaltySettingsPage: {
              Component:
                "@/amerta/apps/loyalty/components/LoyaltySettingsView#LoyaltySettingsView",
              path: "/loyalty-settings",
            },
          },
        },
      },
      endpoints: [
        ...(config.endpoints || []),
        getLoyaltySettingsEndpoint,
        updateLoyaltySettingsEndpoint,
        getCustomerLoyaltyStatusEndpoint,
        adminSearchLoyaltyCustomersEndpoint,
        adminGetLoyaltyOrdersEndpoint,
        adminAdjustPointsEndpoint,
        adminUpdateCustomerEndpoint,
      ],
    };
  },
};
