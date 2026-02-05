import { ExecutePaymentMethodConfirmRequest, ExecutePaymentMethodConfirmResponse } from "@/amerta/collections/Payment/PaymentMethods/handlers/execute-payment-method-confirm";

export const confirmPayment: (orderId: string, locale: string) => Promise<ExecutePaymentMethodConfirmResponse> = async (orderId: string, locale: string) => {
  return await fetch("/api/payment-method/confirm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      orderId: orderId,
      locale,
    } as ExecutePaymentMethodConfirmRequest),
  }).then((res) => res.json());
};
