import { savePayment } from "@/amerta/theme/utilities/save-payment";
import { PaymentAdapter } from "../types";
import { PaymentMethod } from "@/payload-types";

export const CODAdapter: PaymentAdapter = {
  slug: "cod",
  label: "Cash on Delivery",

  settingsFields: [
    {
      name: "instructions",
      type: "textarea",
      defaultValue: "",
      admin: {
        description: "Instructions shown to user on the Thank You page",
      },
    },
  ],

  async confirm(orderAmount, orderCurrency, orderId, redirectUrl, locale, order) {
    const id = `cod-${Date.now()}`;
    await savePayment({
      transactionId: id,
      gateway: (order.paymentMethod as PaymentMethod).type,
      amount: orderAmount,
      currency: orderCurrency,
      status: "success",
      orderId: order.id,
      rawResponse: order,
      paymentMethodId: (order.paymentMethod as PaymentMethod).id,
    });
    return {
      success: true,
      redirectUrl,
    };
  },
  async executeAction(actionName, actionData, method) {
    throw new Error(`Unknown action: ${actionName}`);
  },

  async onSaveSettings({ data }) {
    return data;
  },
};
