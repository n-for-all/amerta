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
    // Signature is (order, previousOrder, payload) — see AmertaAppHooks in apps/types.ts.
    // These previously took (order, payload), so `payload` was actually the previous order and
    // points were never awarded or clawed back.
    onOrderPaid: async (order, _previousOrder, payload) => {
      await awardOrderPoints(order, payload);
    },
    onOrderCancelled: async (order, _previousOrder, payload) => {
      await clawbackOrderPoints(order, payload);
    },
    onCustomerCreated: async (customer, payload) => {
      await awardWelcomeBonus(String(customer.id), payload);
    },
  },
  // Storefront UI extensions are registered client-side in apps/storefront-extensions.ts
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
