import { getServerSideURL } from "@/amerta/utilities/getURL";
import { PaymentAdapter } from "../types";
import Stripe from "stripe";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { getExchangeRate } from "@/amerta/theme/utilities/get-exchange-rate";
import { getCurrencyByCode } from "@/amerta/theme/utilities/get-currency-by-code";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { savePayment } from "@/amerta/theme/utilities/save-payment";
const ZERO_DECIMAL_CURRENCIES = ["jpy", "krw", "ugx", "vnd", "clp", "pyg", "xaf", "xof", "bif", "djf", "gnf", "kmf", "mga", "rwf", "vuv", "xpf"];

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

        await savePayment({
          transactionId: paymentIntent.id,
          gateway: "stripe",
          amount: finalAmount,
          currency: currencyDoc?.id,
          status: "success",
          orderId: metadata.orderId,
          rawResponse: paymentIntent,
          paymentMethodId: method.id,
        });

        await req.payload.update({
          collection: "orders",
          id: metadata.orderId,
          data: { status: "processing", paidAt: new Date().toISOString() },
        });
      } catch (dbError: any) {
        console.error(dbError);
        return new Response("DB Error", { status: 500 });
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  },

  async confirm(orderAmount, orderCurrency, orderId, redirectUrl, locale, order) {
    //! stripe handles everything in the frontend, so we just need to redirect only to order received and wait for the webhook to update the order status and payment transaction. 
    return {
      success: true,
      redirectUrl,
    };
  },

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
