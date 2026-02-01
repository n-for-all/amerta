"use client";

import { PaymentGatewayProps } from "./types";
import { useImperativeHandle, useState } from "react";

export function MamoPayment({ currencyCode, amount, paymentRef, method }: PaymentGatewayProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useImperativeHandle(paymentRef, () => ({
    validate: async () => {
      if (!amount || amount <= 0) {
        setErrorMessage("Invalid payment amount.");
        return false;
      }
      return true;
    },

    confirm: async (paymentMethodId, billingAddress, orderId, redirectTo) => {
      setErrorMessage(null);

      try {
        const response = await fetch("/api/payment-method/action", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "createPaymentLink",
            orderId: orderId,
            amount: amount,
            currencyCode: currencyCode,
            redirectTo: redirectTo,
            paymentMethodId: paymentMethodId,
            billingAddress: billingAddress,
          }),
        });

        const data = await response.json();

        if (data.error) {
          throw new Error(data.error);
        }

        if (data.result?.paymentUrl) {
          window.location.href = data.result.paymentUrl;

          return new Promise(() => {});
        } else {
          throw new Error("No payment URL returned from Mamo.");
        }
      } catch (err: any) {
        console.error("Mamo Payment Error:", err);
        setErrorMessage(err.message || "Failed to initialize payment.");
        throw err;
      }
    },
  }));

  return (
    <>
      {method.publicDescription ? (
        <div className="p-4 border rounded-md bg-zinc-50 border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <p className="mt-1 text-xs text-zinc-500">{method.publicDescription}</p>
            </div>
          </div>
        </div>
      ) : null}

      {errorMessage && <p className="px-4 py-2 mt-2 text-xs font-medium text-red-600">{errorMessage}</p>}
    </>
  );
}
