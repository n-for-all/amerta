/**
 * @module Payments/Functions
 * @title Get Payment Adapters
 * @description This module provides utility functions related to payment adapters, including retrieving available payment adapters and fetching a specific adapter by its slug. It serves as a central point for managing payment gateway integrations within the Amerta application.
 */

import { StripeAdapter } from "./gateway/stripe";
import { CODAdapter } from "./gateway/cod";
import { PaymentAdapter } from "./types";
import { MamoPayAdapter } from "./gateway/mamo";


/**
 * List of available payment adapters in the system.
 * Each adapter implements the {@link PaymentAdapter} interface and represents a different payment gateway integration.
 */
export const PAYMENT_ADAPTERS: PaymentAdapter[] = [StripeAdapter, CODAdapter, MamoPayAdapter];

/**
 * Gets a payment adapter by its slug.
 *
 * @param slug - The unique identifier for the payment adapter (e.g., "stripe", "cod")
 * @returns The payment adapter matching the provided slug, or undefined if not found
 */
export const getPaymentAdapter = (slug: string): PaymentAdapter | undefined => PAYMENT_ADAPTERS.find((a) => a.slug === slug);
