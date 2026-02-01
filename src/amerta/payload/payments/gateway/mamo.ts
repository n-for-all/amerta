import { PaymentAdapter } from "../types";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { getExchangeRate } from "@/amerta/theme/utilities/get-exchange-rate";
import { getCurrencyByCode } from "@/amerta/theme/utilities/get-currency-by-code";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { getOrderById } from "@/amerta/theme/utilities/get-order-by-id";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import { createPayment } from "@/amerta/theme/utilities/create-payment";

export const MamoPayAdapter: PaymentAdapter = {
  slug: "mamo-pay",
  label: "Mamo Pay",

  settingsFields: [
    {
      name: "liveApiKey",
      type: "text",
      label: "Live API Key",
      admin: {
        condition: (data, siblingData) => !siblingData?.testMode,
      },
    },
    {
      name: "testApiKey",
      type: "text",
      label: "Sandbox Test Key",
      admin: {
        condition: (data, siblingData) => siblingData?.testMode,
      },
    },
    {
      name: "testMode",
      type: "checkbox",
      label: "Enable Sandbox Mode",
      defaultValue: false,
    },
    {
      name: "webhookId",
      type: "text",
      admin: {
        readOnly: true,
        hidden: true,
      },
    },
  ],

  async onSaveSettings({ data }) {
    const settings = data.mamoPaySettings;

    // 1. Get the correct key based on mode
    const apiKey = settings?.testMode ? settings?.testApiKey : settings?.liveApiKey;

    // If no key or already has a webhook, skip
    if (!settings || !apiKey || settings?.webhookId) {
      return data;
    }

    // 2. Determine URL
    const baseUrl = settings.testMode ? "https://sandbox.dev.business.mamopay.com/manage_api/v1" : "https://business.mamopay.com/manage_api/v1";

    const myWebhookUrl = `${getServerSideURL()}/api/payments/mamo-pay/webhook`;

    try {
      // 3. Call Mamo API to create webhook
      const response = await fetch(`${baseUrl}/webhooks`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          url: myWebhookUrl,
          events: ["charge.succeeded", "charge.failed"],
          active: true,
          name: "Order Sync",
        }),
      });

      if (!response.ok) {
        const err = await response.text();
        console.error("Failed to auto-create Mamo Webhook:", err);
        // We don't throw error here to allow saving the settings even if webhook fails
        return data;
      }

      const webhookData = await response.json();

      // 4. Save the ID back to settings so we don't create it again next time
      if (webhookData.id) {
        data.mamoPaySettings!.webhookId = webhookData.id;
      }
    } catch (error) {
      console.error("Error creating Mamo webhook:", error);
    }

    return data;
  },

  async handleWebhook(req) {
    const payload = req.payload;

    // 1. Find the Mamo Pay configuration
    const salesChannel = await getSalesChannel();
    const paymentMethod = await payload.find({
      collection: "payment-method",
      where: { type: { equals: "mamo-pay" }, salesChannels: { equals: salesChannel?.id || "" } },
      limit: 1,
    });

    if (paymentMethod.totalDocs === 0) {
      return new Response("Mamo payment method not found", { status: 404 });
    }

    const method = paymentMethod.docs[0];
    const settings = method.mamoPaySettings;
    const apiKey = settings?.testMode ? settings?.testApiKey : settings?.liveApiKey;

    if (!apiKey) {
      return new Response("Mamo API Key configuration missing", { status: 500 });
    }

    // 2. Parse the Incoming Webhook Data
    // Mamo sends a JSON body with the transaction details
    let event: any;
    try {
      event = await req.json();
    } catch (err) {
      console.error("Webhook Error: Invalid JSON", err);
      return new Response("Invalid JSON payload", { status: 400 });
    }

    // 3. Validate Event Type (Looking for 'captured')
    // Based on PHP code: if ( 'captured' === $payment_status )
    const status = event.status;
    const transactionId = event.id; // Mamo Transaction ID
    const customData = event.custom_data; // This is where we stored woo_orderid / orderId

    if (status !== "captured") {
      // We only care about successful captures for now
      return new Response(JSON.stringify({ received: true, status: "ignored" }), { status: 200 });
    }

    if (!customData?.orderId) {
      console.error("Webhook Error: Missing Order ID in Mamo custom_data", event);
      return new Response("Missing Order ID", { status: 400 });
    }

    const orderId = customData.orderId;
    const amount = event.amount; // Mamo sends 10.50 (float), not 1050 (cents)
    const currencyCode = event.currency;

    try {
      // 4. Currency Conversion & Store Logic
      const salesChannel = await getSalesChannel();
      const currencyDoc = await getCurrencyByCode(currencyCode, salesChannel!);

      if (!currencyDoc) {
        console.error("Webhook Error: Currency not found for code", currencyCode);
        return new Response("Currency Not Found", { status: 400 });
      }

      const defaultCurrency = getDefaultCurrency(salesChannel!);
      const exchangeRate = getExchangeRate(defaultCurrency, currencyDoc, salesChannel!);

      // Calculate amount in default currency
      // Note: Mamo amounts are usually floats already, unlike Stripe
      let finalAmount = amount / exchangeRate;
      finalAmount = Math.round(finalAmount * 100) / 100;

      // 5. Check for Duplicate Transaction
      const existingTx = await req.payload.find({
        collection: "payments",
        where: { transactionId: { equals: transactionId } },
      });

      if (existingTx.totalDocs > 0) {
        return new Response(JSON.stringify({ received: true, message: "Duplicate" }), { status: 200 });
      }

      await createPayment({
        orderId: orderId,
        transactionId: transactionId,
        gateway: "mamo-pay",
        status: "success",
        amount: finalAmount,
        currency: currencyDoc?.id,
        rawResponse: event,
        paymentMethodId: method.id,
      });

      // 7. Update Order Status
      await req.payload.update({
        collection: "orders",
        id: orderId,
        data: { _status: "paid", paidAt: new Date().toISOString() },
      });
    } catch (dbError: any) {
      console.error("DB Error in Mamo Webhook", dbError);
      return new Response("DB Error", { status: 500 });
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 });
  },

  async executeAction(actionName, actionData, method) {
    const settings = method.mamoPaySettings;
    const apiKey = settings?.testMode ? settings?.testApiKey : settings?.liveApiKey;
    const isTestMode = settings?.testMode;

    if (!apiKey) {
      throw new Error("Mamo API Key is missing in payment method settings.");
    }

    // Determine Environment URL
    const baseUrl = isTestMode ? "https://sandbox.dev.business.mamopay.com/manage_api/v1" : "https://business.mamopay.com/manage_api/v1";

    switch (actionName) {
      case "createPaymentLink": {
        const { amount, currencyCode, orderId, billingAddress, redirectTo } = actionData;
        const returnUrl = `${redirectTo}`;

        const order = await getOrderById({ id: orderId || "0" });
        if (!order) {
          throw new Error("Order not found for creating Mamo payment link.");
        }

        const payload = {
          name: `Order #${order.orderId}`,
          description: `Payment for Order #${order.orderId}`,
          amount: amount, // Send float (e.g. 10.50)
          currency: currencyCode,
          active: true,
          return_url: returnUrl,
          custom_data: {
            orderId: orderId,
          },

          first_name: billingAddress?.firstName || "",
          last_name: billingAddress?.lastName || "",
        };

        const response = await fetch(`${baseUrl}/links`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Mamo API Error: ${errorText}`);
        }

        const data = await response.json();
        return {
          paymentUrl: data.payment_url,
          paymentLinkId: data.id,
        };
      }

      case "getClientSettings":
        return {
          isTestMode: isTestMode,
        };
    }

    return null;
  },
};
