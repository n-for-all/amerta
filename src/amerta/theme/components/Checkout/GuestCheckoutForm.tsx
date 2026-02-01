"use client";

import { useContext } from "react";
import { GuestAddressSection } from "./GuestAddressSection";
import { PaymentMethods } from "./PaymentMethods";
import { Switch } from "@/amerta/theme/ui/switch";
import { DeliverySection } from "./DeliverySection";
import { CheckoutContext } from "./hooks/useCheckout"; // Adjust import path if needed
import { UseFormReturn } from "react-hook-form";
import { CheckoutFormGuestValues } from ".";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export function GuestCheckoutForm() {
  const { form, data, checkoutState, paymentMethodRef } = useContext(CheckoutContext);
  const { cities, hasSpecificCities, total, useShippingAsBilling, setUseShippingAsBilling } = checkoutState;
  const { currency, exchangeRate } = useEcommerce();

  return (
    <div className="space-y-10">
      {/* 2. Shipping Address */}
      <div className="pt-10 border-t border-zinc-200">
        <h3 className="mb-6 text-2xl font-medium text-zinc-950">
          <span className="font-serif italic">Shipping</span> address
        </h3>
        <GuestAddressSection form={form as UseFormReturn<CheckoutFormGuestValues>} countries={data.countries} cities={cities} hasSpecificCities={hasSpecificCities} />
      </div>

      {/* 3. Billing Address Toggle */}
      <div className="p-4 mt-6 border rounded-lg bg-zinc-50 border-zinc-100">
        <label className="flex items-center gap-3 cursor-pointer">
          <Switch checked={useShippingAsBilling} onChange={setUseShippingAsBilling} />
          <span className="text-sm font-medium text-zinc-900">Billing address is same as shipping</span>
        </label>

        {!useShippingAsBilling && (
          <div className="pt-6 mt-6 border-t border-zinc-200 animate-in slide-in-from-top-2">
            <GuestAddressSection form={form as UseFormReturn<CheckoutFormGuestValues>} countries={data.countries} cities={cities} hasSpecificCities={hasSpecificCities} />
          </div>
        )}
      </div>

      {/* 4. Delivery Method */}
      <DeliverySection />

      <PaymentMethods form={form} paymentMethods={data.paymentMethods} paymentMethodRef={paymentMethodRef} total={total} currency={currency} exchangeRate={exchangeRate} />
    </div>
  );
}
