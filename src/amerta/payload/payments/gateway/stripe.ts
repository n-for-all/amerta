/**
 * @module Payments/Stripe
 * @title Stripe Payment Adapter
 * @description This adapter implements the {@link PaymentAdapter} interface to handle credit card payments via Stripe.
 * It supports both frontend (Client Secret) and backend payment processing with automatic webhook setup.
 *
 * ## Features
 * - PCI-compliant credit card processing
 * - Support for multiple payment methods (cards, wallets, etc.)
 * - Automatic webhook creation and management
 * - Multi-currency support with zero-decimal currency handling
 * - Duplicate transaction detection
 * - Server-side payment intent management
 * - Currency conversion with exchange rates
 *
 * ## Configuration
 * - **slug**: "stripe"
 * - **label**: "Credit Card (Stripe)"
 * - **Settings**: Publishable key, secret key, webhook ID, webhook secret
 *
 * ## Payment Flow
 * 1. Frontend creates/updates payment intent using client secret
 * 2. User completes payment on frontend with Stripe Elements
 * 3. Stripe sends webhook to confirm payment
 * 4. Backend processes webhook, verifies transaction, and updates order
 * 5. User is redirected to order confirmation page
 *
 * ## Webhook Events Handled
 * - `payment_intent.succeeded` - Payment successfully completed
 * - `payment_intent.payment_failed` - Payment failed
 * - `charge.refunded` - Payment refunded
 *
 */

import { getServerSideURL } from "@/amerta/utilities/getURL";
import { PaymentAdapter } from "../types";
import Stripe from "stripe";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { getExchangeRate } from "@/amerta/theme/utilities/get-exchange-rate";
import { getCurrencyByCode } from "@/amerta/theme/utilities/get-currency-by-code";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { saveOrderPayment } from "@/amerta/theme/utilities/save-order-payment";
const ZERO_DECIMAL_CURRENCIES = ["jpy", "krw", "ugx", "vnd", "clp", "pyg", "xaf", "xof", "bif", "djf", "gnf", "kmf", "mga", "rwf", "vuv", "xpf"];

/**
 * Stripe Payment Adapter
 *
 * @remarks
 * This adapter implements the {@link PaymentAdapter} interface to handle credit card payments via Stripe.
 * It supports both frontend (Client Secret) and backend payment processing with automatic webhook setup.
 *
 * ## Features
 * - PCI-compliant credit card processing
 * - Support for multiple payment methods (cards, wallets, etc.)
 * - Automatic webhook creation and management
 * - Multi-currency support with zero-decimal currency handling
 * - Duplicate transaction detection
 * - Server-side payment intent management
 * - Currency conversion with exchange rates
 *
 * ## Configuration
 * - **slug**: "stripe"
 * - **label**: "Credit Card (Stripe)"
 * - **Settings**: Publishable key, secret key, webhook ID, webhook secret
 *
 * ## Payment Flow
 * 1. Frontend creates/updates payment intent using client secret
 * 2. User completes payment on frontend with Stripe Elements
 * 3. Stripe sends webhook to confirm payment
 * 4. Backend processes webhook, verifies transaction, and updates order
 * 5. User is redirected to order confirmation page
 *
 * ## Webhook Events Handled
 * - `payment_intent.succeeded` - Payment successfully completed
 * - `payment_intent.payment_failed` - Payment failed
 * - `charge.refunded` - Payment refunded
 *
 */
export const StripeAdapter: PaymentAdapter = {
  slug: "stripe",
  label: "Credit Card (Stripe)",

  settingsFields: [
    {
      name: "publishableKey",
      type: "text",
      required: true,
    },
    {
      name: "secretKey",
      type: "text",
      required: true,
      admin: {
        description: "Stripe Secret Key (sk_...)",
      },
    },
    {
      name: "webhookId",
      type: "text",
    },
    {
      name: "webhookSecret",
      type: "text",
    },
  ],

  /**
   * Validates payment settings and creates webhook on save
   *
   * @param options - Configuration object containing the settings data
   * @param options.data - The payment settings to validate and process
   *
   * @returns The processed settings data with webhook credentials if newly created
   *
   * @remarks
   * This method performs several important tasks:
   * 1. Returns early if webhook credentials are already configured
   * 2. Skips webhook creation for test keys (sk_test_*) to prevent failures
   * 3. Automatically creates a webhook endpoint on Stripe if using live keys
   * 4. Stores webhook ID and secret in settings for signature verification
   * 5. Subscribes to relevant payment events for order synchronization
   *
   * @throws May throw errors from Stripe API if webhook creation fails
   */
  async onSaveSettings({ data }) {
    if (data.stripeSettings?.webhookSecret && data.stripeSettings?.webhookId) {
      return data;
    }

    //! if no secret key or it's a test key, skip webhook creation because it will fail
    if (!data.stripeSettings?.secretKey || data.stripeSettings?.secretKey.startsWith("sk_test_")) {
      return;
    }
    async function createWebhook() {
      const stripe = new Stripe(data.stripeSettings!.secretKey!);

      const webhookEndpoint = await stripe.webhookEndpoints.create({
        url: getServerSideURL() + "/api/payments/stripe/webhook/",
        enabled_events: ["payment_intent.succeeded", "payment_intent.payment_failed", "charge.refunded"],
        description: "Production Order Sync",
      });

      data.stripeSettings!.webhookSecret = webhookEndpoint.secret;
      data.stripeSettings!.webhookId = webhookEndpoint.id;
      return data;
    }

    return await createWebhook();
  },

  /**
   * Handles incoming webhooks from Stripe
   *
   * @param req - The webhook request object containing headers and body data
   *
   * @returns Response object with status 200 on success, error status on failure
   *
   * @remarks
   * This method:
   * 1. Validates the webhook signature using Stripe's secret key
   * 2. Handles payment_intent.succeeded events to confirm successful payments
   * 3. Extracts order ID from payment intent metadata
   * 4. Performs currency conversion from transaction currency to default store currency
   * 5. Handles zero-decimal currencies (JPY, KRW, etc.) correctly
   * 6. Detects and ignores duplicate transactions
   * 7. Saves payment record to database
   *
   * ## Webhook Events Handled
   * - `payment_intent.succeeded` - Processes successful payment
   * - `payment_intent.payment_failed` - Logged but not actively processed
   * - `charge.refunded` - Logged but not actively processed
   *
   * ## Zero-Decimal Currencies
   * Stripe uses different decimal precision for certain currencies. This method
   * automatically handles the conversion based on the {@link ZERO_DECIMAL_CURRENCIES} list.
   *
   * @throws Does not throw errors; returns appropriate HTTP error responses
   */
  async handleWebhook(req) {
    const payload = req.payload;

    const salesChannel = await getSalesChannel();
    const paymentMethod = await payload.find({
      collection: "payment-method",
      where: { type: { equals: "stripe" }, salesChannels: { equals: salesChannel?.id || "" } },
      limit: 1,
    });

    if (paymentMethod.totalDocs === 0) {
      return new Response("Stripe payment method not found", { status: 404 });
    }

    const method = paymentMethod.docs[0];
    if (!method || !method.stripeSettings?.secretKey) {
      return new Response("Stripe Secret Key is not configured in this payment method", { status: 500 });
    }

    const stripe = new Stripe(method.stripeSettings!.secretKey!);
    const signature = req.headers.get("stripe-signature");
    const bodyText = await req.text();
    let event: Stripe.Event;

    try {
      event = stripe.webhooks.constructEvent(bodyText, signature!, method.stripeSettings!.webhookSecret!);
    } catch (err: any) {
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const { metadata, amount, currency: stripeCurrency } = paymentIntent;

      if (!metadata?.orderId) {
        console.error("Webhook Error: Missing Order ID in payment intent metadata", paymentIntent);
        return new Response("Missing Order ID", { status: 400 });
      }

      try {
        const salesChannel = await getSalesChannel();
        const currencyDoc = await getCurrencyByCode(stripeCurrency, salesChannel!);
        if (!currencyDoc) {
          console.error("Webhook Error: Currency not found for code", stripeCurrency);
          return new Response("Currency Not Found", { status: 400 });
        }

        const defaultCurrency = getDefaultCurrency(salesChannel!);

        const isZeroDecimal = ZERO_DECIMAL_CURRENCIES.includes(stripeCurrency.toLowerCase());

        let amountInMainUnits = amount;
        if (!isZeroDecimal) {
          amountInMainUnits = amount / 100;
        }

        let finalAmount = amountInMainUnits;

        const exchangeRate = getExchangeRate(defaultCurrency, currencyDoc, salesChannel!);

        finalAmount = amountInMainUnits / exchangeRate;
        finalAmount = Math.round(finalAmount * 100) / 100;

        const existingTx = await req.payload.find({
          collection: "payments",
          where: { transactionId: { equals: paymentIntent.id } },
        });

        if (existingTx.totalDocs > 0) {
          return new Response(JSON.stringify({ received: true }), { status: 200 });
        }

        await saveOrderPayment({
          transactionId: paymentIntent.id,
          gateway: "stripe",
          amount: finalAmount,
          currency: currencyDoc?.id,
          status: "success",
          orderId: metadata.orderId,
          rawResponse: paymentIntent,
          paymentMethodId: method.id,
        });
      } catch (dbError: any) {
        console.error(dbError);
        return new Response("DB Error", { status: 500 });
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  },

  /**
   * Confirms a Stripe payment (frontend-handled flow)
   *
   * @param orderAmount - The total amount to be paid
   * @param orderCurrency - The currency code (e.g., "USD")
   * @param orderId - The order identifier
   * @param redirectUrl - URL to redirect user after payment confirmation
   * @param locale - The user's locale/language
   * @param order - The complete order object
   *
   * @returns Confirmation object with success status and redirect URL
   *
   * @remarks
   * This method returns early without complex processing because:
   * 1. Stripe handles all payment processing on the frontend
   * 2. The actual payment confirmation is handled via webhook
   * 3. User is redirected to order confirmation page immediately
   * 4. Webhook processing updates the order payment status asynchronously
   *
   * The real payment validation happens in {@link handleWebhook} when Stripe
   * sends the `payment_intent.succeeded` event.
   */
  async confirm(orderAmount, orderCurrency, orderId, redirectUrl) {
    //! stripe handles everything in the frontend, so we just need to redirect only to order received and wait for the webhook to update the order status and payment transaction.
    return {
      success: true,
      redirectUrl,
    };
  },

  /**
   * Executes custom payment actions for Stripe
   *
   * @param actionName - The name of the action to execute
   * @param actionData - Data object containing parameters for the action
   * @param method - The payment method configuration object
   *
   * @returns Action result object, or null if action is not supported
   *
   * @throws Error if secret key is missing from payment method settings
   *
   * @remarks
   * Supported actions:
   * - **createPaymentIntent**: Creates a new Stripe PaymentIntent for checkout
   *   - Params: `amount`, `currencyCode`, `orderId`
   *   - Returns: `{ clientSecret }`
   *   - Enables automatic payment methods for maximum compatibility
   * - **updatePaymentIntent**: Updates an existing PaymentIntent with new amount
   *   - Params: `amount`, `currencyCode`, `orderId`, `paymentIntentId`
   *   - Returns: `{ clientSecret }`
   *   - Creates new intent if update fails
   * - **getClientSettings**: Retrieves client-side configuration
   *   - Returns: `{ publishableKey }`
   *
   * ## Amount Handling
   * Amounts are converted to Stripe's minor units (cents) automatically:
   * - Regular currencies: multiplied by 100 (e.g., 99.99 USD → 9999 cents)
   * - Zero-decimal currencies: used as-is (e.g., 9999 JPY → 9999)
   *
   * @example
   * ```typescript
   * // Create a payment intent
   * const { clientSecret } = await executeAction('createPaymentIntent', {
   *   amount: 99.99,
   *   currencyCode: 'usd',
   *   orderId: 'order-123'
   * }, stripeMethod);
   *
   * // Get publishable key for frontend
   * const { publishableKey } = await executeAction('getClientSettings', {}, stripeMethod);
   * ```
   */
  async executeAction(actionName, actionData, method) {
    const secretKey = method.stripeSettings?.secretKey;

    if (!secretKey) {
      throw new Error("Stripe Secret Key is missing in payment method settings.");
    }

    const stripe = new Stripe(secretKey);

    switch (actionName) {
      case "createPaymentIntent": {
        const { amount, currencyCode, orderId } = actionData;

        const intent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100),
          currency: currencyCode!,
          automatic_payment_methods: {
            enabled: true,
          },
          metadata: {
            orderId: orderId || "",
          },
        });

        return { clientSecret: intent.client_secret };
      }
      case "updatePaymentIntent": {
        const { amount, currencyCode, orderId, paymentIntentId } = actionData;
        try {
          const updatedIntent = await stripe.paymentIntents.update(paymentIntentId, {
            amount: Math.round(amount * 100),
            currency: currencyCode!,
            metadata: {
              orderId: orderId || "",
            },
          });
          return { clientSecret: updatedIntent.client_secret };
        } catch (error) {
          console.warn("Failed to update intent, creating new one", error);
        }
        break;
      }

      case "getClientSettings":
        return {
          publishableKey: method.stripeSettings?.publishableKey,
        };
    }

    return null;
  },
};
