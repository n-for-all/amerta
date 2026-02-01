import { StripeAdapter } from "./gateway/stripe";
import { CODAdapter } from "./gateway/cod";
import { PaymentAdapter } from "./types";
import { MamoPayAdapter } from "./gateway/mamo";

// Add new gateways here to automatically register them
export const PAYMENT_ADAPTERS = [
  StripeAdapter,
  CODAdapter,
  MamoPayAdapter
];

// Helper to get adapter by slug
export const getPaymentAdapter = (slug: string): PaymentAdapter | undefined => 
  PAYMENT_ADAPTERS.find(a => a.slug === slug);