"use client";

import { confirmPayment } from "../utils/confirm-payment";
import { PaymentGatewayProps } from "./types";
import { useImperativeHandle, useState } from "react";

export function MamoPayment({ currencyCode, amount, paymentRef, method, locale }: PaymentGatewayProps) {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useImperativeHandle(paymentRef, () => ({
    validate: async () => {
      if (!amount || amount <= 0) {
        setErrorMessage("Invalid payment amount.");
        return false;
      }
      return true;
    },

    confirm: async (orderId) => {
      setErrorMessage(null);

      try {
        const { error, redirectTo } = await confirmPayment(orderId, locale);

        if (error) {
          throw new Error(error);
        }

        if (redirectTo) {
          window.location.href = redirectTo;
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
        <div className="p-4 border rounded-b-md bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
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
