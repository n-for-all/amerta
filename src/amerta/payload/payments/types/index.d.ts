/**
 * Payment Types and Interfaces Module
 * 
 * This module defines the core types and interfaces used throughout the payment system.
 * It provides type definitions for payment results, adapters, and payment gateway integration.
 * 
 * @module payments/types
 */

import { Order, PaymentMethod } from "@/payload-types";

/**
 * Represents the result of a payment operation.
 * 
 * The result can have one of three states:
 * - `success`: Payment completed successfully with a transaction ID
 * - `redirect`: Payment requires user redirect to an external URL (e.g., for authentication)
 * - `pending`: Payment is pending confirmation with an optional session ID
 * 
 * @example
 * // Successful payment
 * const result: PaymentResult = {
 *   status: "success",
 *   transactionId: "txn_123456"
 * };
 * 
 * @example
 * // Redirect required
 * const result: PaymentResult = {
 *   status: "redirect",
 *   url: "https://payment-gateway.com/pay",
 *   sessionId: "sess_789"
 * };
 */
export type PaymentResult =
  | {
      status: "success";
      transactionId: string;
    }
  | {
      status: "redirect";
      url: string;
      sessionId?: string;
    }
  | {
      status: "pending";
      message: string;
      transactionId: string;
    };

/**
 * Payment Adapter Interface
 * 
 * Defines the contract for payment gateway adapters. Each payment provider
 * (Stripe, PayPal, etc.) must implement this interface to integrate with the system.
 * 
 * @interface PaymentAdapter
 * 
 * @property {string} slug - Unique identifier for the payment adapter (e.g., "stripe", "paypal")
 * @property {string} label - Human-readable name of the payment provider
 * 
 * @property {Field[]} settingsFields - Dynamic form fields for payment provider configuration
 * 
 * @property {Function} onSaveSettings - Callback when payment settings are saved
 * @property {Function} executeAction - Execute a payment action (charge, refund, etc.)
 * @property {Function} confirm - Confirm payment after customer submission
 * @property {Function} [handleWebhook] - Optional webhook handler for payment notifications
 * @property {Function} [callback] - Optional server-side callback for payment gateway confirmations
 * 
 * @example
 * // Implementing a payment adapter
 * const stripeAdapter: PaymentAdapter = {
 *   slug: "stripe",
 *   label: "Stripe",
 *   settingsFields: [...],
 *   onSaveSettings: async (args) => { ... },
 *   executeAction: async (action, data, method) => { ... },
 *   confirm: async (amount, currency, orderNumber, redirectUrl, locale, order) => { ... }
 * };
 */
export interface PaymentAdapter {
  slug: string;
  label: string;

  settingsFields: Field[];

  /**
   * Called when payment settings are saved in the admin panel.
   * Use this to validate and process payment method configuration.
   * 
   * @param args.data - The payment method data being saved
   * @param args.operation - The database operation (create or update)
   * @param args.originalDoc - The original document (for updates)
   * @param args.req - The Payload request object
   * @returns Promise resolving to any processed data
   */
  onSaveSettings: (args: { data: Partial<PaymentMethod>; operation: CreateOrUpdateOperation; originalDoc?: T; req: PayloadRequest }) => Promise<any>;

  /**
   * Execute a payment action on the payment gateway.
   * 
   * @param actionName - The action to perform (e.g., "charge", "authorize", "refund")
   * @param actionData - Data for the action including amount and optional currency code
   * @param method - The payment method configuration
   * @returns Promise resolving to the action result
   */
  executeAction: (actionName: string, actionData: { amount: number; currencyCode?: string; [key: string]: any }, method: PaymentMethod) => Promise<any>;

  /**
   * Confirm a payment after the customer submits payment details.
   * Called after the customer completes payment on the frontend.
   * 
   * @param amount - The payment amount in the smallest currency unit (e.g., cents)
   * @param currency - The currency code (e.g., "USD", "EUR")
   * @param orderNumber - The order number for reference
   * @param redirectUrl - The URL to redirect to after payment
   * @param locale - The customer's locale
   * @param order - The complete order object
   * @returns Promise with success status and redirect URL
   */
  confirm: (
    amount: number,
    currency: Currency,
    orderNumber: string,
    redirectUrl: string,
    locale: string,
    order: Order,
  ) => Promise<{
    success: boolean;
    redirectUrl: string;
  }>;

  /**
   * Optional webhook handler for payment notifications.
   * Called when the payment gateway sends webhook events to the server.
   * 
   * @param req - The Payload request object containing webhook data
   * @returns Promise resolving to an HTTP response
   */
  handleWebhook?: (req: PayloadRequest) => Promise<Response>;

  /**
   * Optional server-side callback for payment gateway confirmations.
   * URL to redirect to /api/payments/action/:locale/:orderId/callback
   * 
   * 
   * This callback is called after the payment process completes and the gateway
   * sends a server-side confirmation. It differs from the `confirm` method in that:
   * - `confirm`: Called immediately after customer submission, before payment verification
   * - `callback`: Called when the gateway confirms payment success/failure server-side
   * 
   * Use this to update the order/payment status based on final gateway confirmation.
   * This is essential for payment gateways like Stripe and Mamo that provide
   * asynchronous payment confirmation.
   * 
   * @param req - The Payload request object
   * @param order - The order being paid
   * @returns Promise resolving to callback result
   * 
   * @example
   * callback: async (req, order) => {
   *   const paymentStatus = await stripe.retrievePaymentIntent(order.paymentIntentId);
   *   if (paymentStatus.status === "succeeded") {
   *     await updateOrderStatus(order.id, "paid");
   *   }
   * }
   */
  callback?: (req: PayloadRequest, order: Order) => Promise<any>;
}
