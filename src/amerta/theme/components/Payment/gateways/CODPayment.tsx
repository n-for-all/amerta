import { PaymentGatewayProps } from "./types";
import { useImperativeHandle } from "react";

export function CODPayment({ currencyCode, amount, paymentRef, method }: PaymentGatewayProps) {
  useImperativeHandle(paymentRef, () => ({
    validate: async () => true,
    confirm: async (paymentMethodId, billingAddress, orderId: string, redirectTo: string) => {
      const { error: actionError } = await fetch("/api/payment-method/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "createTransaction",
          orderId: orderId,
          amount: amount,
          currencyCode: currencyCode,
          paymentMethodId: paymentMethodId,
          billingAddress: billingAddress,
          redirectTo: redirectTo,
        }),
      }).then((res) => res.json());

      console.log("Action Error:", actionError);
      if (actionError) throw new Error("Failed to create transaction for cash on delivery.");

      window.location.href = redirectTo;

      return new Promise(() => {});
    },
  }));

  return method.publicDescription ? (
    <div className="p-4 border rounded-md bg-zinc-50 border-zinc-200">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="mt-1 text-xs text-zinc-500">{method.publicDescription}</p>
        </div>
      </div>
    </div>
  ) : null;
}
