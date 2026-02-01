import { createPayment } from "@/amerta/theme/utilities/create-payment";
import { PaymentAdapter } from "../types";
import { getCurrencyByCode } from "@/amerta/theme/utilities/get-currency-by-code";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";

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

  async executeAction(actionName, actionData, method) {
    switch (actionName) {
      case "createTransaction": {
        const salesChannel = await getSalesChannel();
        if (!salesChannel) {
          throw new Error("Sales channel not found");
        }
        const currency = await getCurrencyByCode(actionData.currencyCode!, salesChannel);
        const id = `cod-${Date.now()}`;
        await createPayment({
          transactionId: id,
          gateway: method.type,
          amount: actionData.amount,
          currency: currency?.id,
          status: "success",
          orderId: actionData.orderId!,
          rawResponse: actionData,
          paymentMethodId: method.id,
        });
        return {
          success: true,
          transactionId: id,
        };
      }
      default:
        throw new Error(`Unknown action: ${actionName}`);
    }
  },

  async onSaveSettings({ data }) {
    return data;
  },
};
