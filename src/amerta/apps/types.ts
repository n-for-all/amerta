import { Config, Payload } from "payload";
import React from "react";

export interface AmertaAppHooks {
  onOrderPaid?: (order: any, previousOrder: any, payload: Payload) => Promise<void>;
  onOrderCreated?: (order: any, payload: Payload) => Promise<void>;
  onOrderCancelled?: (order: any, previousOrder: any, payload: Payload) => Promise<void>;
  onCustomerCreated?: (customer: any, payload: Payload) => Promise<void>;
}

export interface StorefrontExtension {
  target: string;
  Component: React.ComponentType<any>;
}

export interface AmertaApp {
  /** The human-readable name of the app */
  name: string;
  /** Unique identifier for the app (e.g., 'google-merchant', 'loyalty') */
  slug: string;
  /** Short description of what the app does */
  description: string;
  /** Version string */
  version: string;
  /** Navigation details to inject a link in the Payload admin sidebar */
  adminNavigation?: {
    /** The text to display in the menu */
    label: string;
    /** The path to navigate to (e.g., '/admin/google-merchant') */
    path: string;
  };
  /** Lifecycle backend hooks */
  hooks?: AmertaAppHooks;
  /** Frontend UI extensions rendered into AppSlots */
  storefrontExtensions?: StorefrontExtension[];
  /** Optional: Modify the Payload config dynamically */
  extendConfig?: (config: Config) => Config;
}

