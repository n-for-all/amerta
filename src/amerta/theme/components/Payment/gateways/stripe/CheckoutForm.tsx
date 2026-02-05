"use client";

import { useImperativeHandle } from "react";
import { PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { PaymentHandle } from "../types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { Country } from "@/payload-types";
import { confirmPayment } from "../../utils/confirm-payment";

interface Props {
  paymentRef: React.Ref<PaymentHandle>;
  onError: (msg: string) => void;
  onValid: () => void;
  clientSecret: string;
  countryCode?: string;
  currencyCode?: string;
  amount?: number;
  paymentMethodId: string;
}

export function CheckoutForm({ paymentRef, currencyCode, amount, countryCode, onError, clientSecret, onValid, paymentMethodId }: Props) {
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

    confirm: async (orderId: string) => {
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
          paymentMethodId,
        }),
      }).then((res) => res.json());

      if (actionError) {
        console.error("Failed to update payment intent:", actionError);
        throw new Error("Failed to create stripe payment");
      }

      //!call the confirm payment just to get the redirect url and billing address, stripe will handle the rest in the frontend and webhook will update the order status and payment transaction.
      const { error, redirectTo, billingAddress } = await confirmPayment(orderId, locale);

      if (error) {
        onError(error);
        throw new Error(error);
      }

      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        clientSecret,
        confirmParams: {
          return_url: redirectTo!,
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

      if (stripeError) {
        onError(stripeError.message || "Payment failed");
        throw error;
      }

      return new Promise(() => {});
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
