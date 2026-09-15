"use client";

import React from "react";
import { LoyaltyCheckoutRedemption } from "./loyalty/components/storefront/LoyaltyCheckoutRedemption";
import { CustomerAccountLoyaltyCard } from "./loyalty/components/storefront/CustomerAccountLoyaltyCard";
import { ProductPointsBadge } from "./loyalty/components/storefront/ProductPointsBadge";

export interface StorefrontExtensionEntry {
  appSlug: string;
  target: string;
  Component: React.ComponentType<any>;
}

/**
 * Pure client-side registry for storefront UI extensions.
 * Isolates React frontend widgets from Payload CMS server endpoints and database code.
 */
export const storefrontExtensionsRegistry: StorefrontExtensionEntry[] = [
  {
    appSlug: "loyalty",
    target: "checkout.order_summary.before_totals",
    Component: LoyaltyCheckoutRedemption,
  },
  {
    appSlug: "loyalty",
    target: "account.dashboard.cards",
    Component: CustomerAccountLoyaltyCard,
  },
  {
    appSlug: "loyalty",
    target: "product.price.after",
    Component: ProductPointsBadge,
  },
];
