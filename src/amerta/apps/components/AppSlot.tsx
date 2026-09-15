"use client";

import React from "react";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";
import { storefrontExtensionsRegistry } from "../storefront-extensions";

export interface AppSlotProps {
  /** The target identifier (e.g. 'checkout.order_summary.before_totals', 'account.dashboard.cards') */
  target: string;
  className?: string;
}

/**
 * Universal AppSlot component.
 * Renders frontend UI extensions registered by currently active apps for a given target.
 * Extension components internally use standard hooks (useCart, useCustomer, useEcommerce).
 * Requires zero data props from the parent template.
 */
export const AppSlot: React.FC<AppSlotProps> = ({ target, className }) => {
  const { activeApps = [] } = useEcommerce();

  const matchingExtensions = storefrontExtensionsRegistry
    .filter((ext) => activeApps.includes(ext.appSlug) && ext.target === target)
    .map((ext) => ({
      key: `${ext.appSlug}-${ext.target}`,
      Component: ext.Component,
    }));

  if (matchingExtensions.length === 0) {
    return null;
  }

  return (
    <div className={className || "app-slot-container"}>
      {matchingExtensions.map(({ key, Component }) => (
        <Component key={key} />
      ))}
    </div>
  );
};
