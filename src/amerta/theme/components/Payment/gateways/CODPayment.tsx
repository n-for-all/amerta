import { PaymentGatewayProps } from "./types";
import { useImperativeHandle } from "react";
import { confirmPayment } from "../utils/confirm-payment";

export function CODPayment({ currencyCode, amount, paymentRef, method, locale }: PaymentGatewayProps) {
  useImperativeHandle(paymentRef, () => ({
    validate: async () => true,
    confirm: async (orderId: string) => {
      const { error: actionError, redirectTo } = await confirmPayment(orderId, locale);
      if (actionError || !redirectTo) {
        console.error("Failed to confirm COD payment:", actionError);
        throw new Error("Failed to create transaction for cash on delivery.");
      }

      window.location.href = redirectTo;
      return new Promise(() => {});
    },
  }));

  return method.publicDescription ? (
    <div className="p-4 border rounded-b-md bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <p className="mt-1 text-xs text-zinc-500">{method.publicDescription}</p>
        </div>
      </div>
    </div>
  ) : null;
}
