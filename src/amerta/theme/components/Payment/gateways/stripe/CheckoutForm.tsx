"use client";

import { useImperativeHandle } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PaymentHandle } from "../types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { Country } from "@/payload-types";

interface Props {
  paymentRef: React.Ref<PaymentHandle>;
  onError: (msg: string) => void;
  onValid: () => void;
  clientSecret: string;
  countryCode?: string;
  currencyCode?: string;
  amount?: number;
}

export function CheckoutForm({ paymentRef, currencyCode, amount, countryCode, onError, clientSecret, onValid }: Props) {
  const stripe = useStripe();
  const elements = useElements();
  const { locale } = useEcommerce();

  useImperativeHandle(paymentRef, () => ({
    validate: async () => {
      if (!stripe || !elements) return false;

      const { error } = await elements.submit();

      if (error) {
        onError(error.message || "Please check your payment details.");
        return false;
      }

      return true;
    },

    confirm: async (paymentMethodId, billingAddress, orderId: string, redirectTo: string) => {
      if (!stripe || !elements) return;
      const paymentIntentId = clientSecret.split("_secret_")[0];
      const { error: actionError } = await fetch("/api/payment-method/action", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "updatePaymentIntent",
          locale: locale,
          orderId: orderId,
          amount: amount,
          currencyCode: currencyCode,
          paymentIntentId: paymentIntentId,
          paymentMethodId: paymentMethodId,
        }),
      }).then((res) => res.json());

      console.log("Action Error:", actionError);
      if (actionError) throw new Error("Failed to create stripe payment");

      const { error } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: redirectTo,
          payment_method_data: {
            billing_details: {
              address: {
                country: (billingAddress?.country as Country).iso_2 || "US", // Must be a 2-letter ISO code (e.g. from your address form state)
                postal_code: billingAddress?.postalCode || "00000", // Optional: if you disabled zip too
              },
            },
          },
        },
      });

      if (error) {
        onError(error.message || "Payment failed");
        throw error;
      }
    },
  }));

  return (
    <div id="payment-form">
      <PaymentElement
        id="payment-element"
        onChange={(event) => {
          if (event.complete) {
            onValid();
          }
        }}
        options={{
          layout: "tabs",
          defaultValues: {
            billingDetails: {
              address: {
                country: countryCode,
              },
            },
          },
          fields: {
            billingDetails: {
              address: {
                country: "never",
                postalCode: "never",
              },
            },
          },
        }}
      />
    </div>
  );
}
