"use client";
import { useEffect, useState } from "react";
import { Elements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { CheckoutForm } from "./stripe/CheckoutForm";
import { PaymentGatewayProps } from "./types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { Loader2 } from "lucide-react";

export function StripePayment({ paymentRef, onError, method, currencyCode, countryCode, amount, orderId, onValid }: PaymentGatewayProps) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<any>(null);
  const { locale } = useEcommerce();

  useEffect(() => {
    fetch("/api/payment-method/action", {
      method: "POST",
      body: JSON.stringify({
        action: "getClientSettings",
        locale,
        amount,
        orderId,
        currencyCode,
        paymentMethodId: method.id,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        setStripePromise(loadStripe(data.result?.publishableKey));
      });
  }, []);

  useEffect(() => {
    if (!amount || !currencyCode) return;

    const isUpdate = !!paymentIntentId;

    fetch("/api/payment-method/action", {
      method: "POST",
      body: JSON.stringify({
        action: isUpdate ? "updatePaymentIntent" : "createPaymentIntent",
        amount,
        orderId,
        locale,
        currencyCode,
        paymentMethodId: method.id,
        paymentIntentId: paymentIntentId,
      }),
      headers: { "Content-Type": "application/json" },
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.result?.clientSecret) {
          setClientSecret((prev) => {
            if (prev !== data.result.clientSecret) return data.result.clientSecret;
            return prev;
          });
        }

        if (data.result?.paymentIntentId) {
          setPaymentIntentId(data.result.paymentIntentId);
        }
      });
  }, [amount, orderId, method, currencyCode, locale, paymentIntentId]);

  if (!clientSecret || !stripePromise)
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-6 h-6 animate-spin" />
      </div>
    );

  return (
    <div className="p-4 duration-200 border-t bg-zinc-50/80 border-zinc-100 animate-in slide-in-from-top-2">
      {method.publicDescription ? (
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <p className="mt-1 text-xs text-zinc-500">{method.publicDescription}</p>
          </div>
        </div>
      ) : null}
      <Elements stripe={stripePromise} options={{ clientSecret }}>
        <CheckoutForm onValid={onValid} countryCode={countryCode} currencyCode={currencyCode} amount={amount} clientSecret={clientSecret} paymentRef={paymentRef} onError={onError} />
      </Elements>
    </div>
  );
}
