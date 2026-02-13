/**
 * @module Payments/COD
 * @title Cash on Delivery Payment Adapter
 * @description This adapter implements the {@link PaymentAdapter} interface to handle cash on delivery payments.
 * It immediately marks orders as paid without requiring external payment processing.
 *
 * ## Features
 * - No external payment gateway integration
 * - Immediate payment confirmation
 * - Customizable instructions for the Thank You page
 * - Suitable for local or store pickup orders
 *
 * ## Configuration
 * - **slug**: "cod"
 * - **label**: "Cash on Delivery"
 *
 */

import { saveOrderPayment } from "@/amerta/theme/utilities/save-order-payment";
import { PaymentAdapter } from "../types";
import { PaymentMethod } from "@/payload-types";

/**
 * Cash on Delivery (COD) Payment Adapter
 * @interface CODAdapter
 * @group Adapters
 * @remarks
 * This adapter implements the {@link PaymentAdapter} interface to handle cash on delivery payments.
 * It immediately marks orders as paid without requiring external payment processing.
 *
 * ## Features
 * - No external payment gateway integration
 * - Immediate payment confirmation
 * - Customizable instructions for the Thank You page
 * - Suitable for local or store pickup orders
 *
 * ## Configuration
 * - **slug**: "cod"
 * - **label**: "Cash on Delivery"
 *
 */
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

  /**
   * Confirms a COD payment for an order
   *
   * @param orderAmount - The total amount to be paid
   * @param orderCurrency - The currency code (e.g., "USD")
   * @param orderId - The order identifier
   * @param redirectUrl - URL to redirect user after payment confirmation
   * @param locale - The user's locale/language
   * @param order - The complete order object containing payment method details
   *
   * @returns A confirmation object with success status and redirect URL
   *
   * @remarks
   * This method immediately creates a successful payment record without requiring
   * payment gateway interaction. The payment is marked as "success" with a transaction ID.
   */
  async confirm(orderAmount, orderCurrency, orderId, redirectUrl, locale, order) {
    const id = `cod-${Date.now()}`;
    await saveOrderPayment({
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

  /**
   * Executes a payment action for COD orders
   *
   * @param actionName - The name of the action to execute
   * @param actionData - Additional data for the action
   * @param method - The payment method details
   *
   * @throws Always throws an error as COD does not support custom actions
   *
   * @remarks
   * COD adapter does not support any custom payment actions. All action requests
   * will result in an error. This method is required by the {@link PaymentAdapter} interface.
   */
  async executeAction(actionName, actionData, method) {
    throw new Error(`Unknown action: ${actionName}`);
  },

  /**
   * Validates and processes payment settings before saving
   *
   * @param options - Configuration object containing the settings data
   * @param options.data - The payment settings to validate and process
   *
   * @returns The processed settings data
   *
   * @remarks
   * For COD adapter, this method performs minimal validation and returns the data as-is.
   * It serves as a hook for potential future validation logic.
   */
  async onSaveSettings({ data }) {
    return data;
  },
};
