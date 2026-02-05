"use client";

import { useContext, useEffect } from "react";
import { CheckoutContext } from "./hooks/useCheckout"; // Ensure path matches where you saved the context
import { AddressManager } from "@/amerta/theme/components/AddressManager";
import { PaymentMethods } from "./PaymentMethods";

import { Switch } from "@/amerta/theme/ui/switch";
import { DeliverySection } from "./DeliverySection";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export function CustomerCheckoutForm() {
  const { form, customer, checkoutState, data, paymentMethodRef } = useContext(CheckoutContext);
  const { handleCountryChange, total, useShippingAsBilling, setUseShippingAsBilling } = checkoutState;
  const { currency, exchangeRate, __, locale } = useEcommerce();

  // Auto-select default shipping on mount
  useEffect(() => {
    if (customer?.address?.items) {
      const defaultAddr = customer.address.items.find((a) => a.isDefaultShipping) || customer.address.items[0];
      if (defaultAddr) {
        form.setValue("addressId", defaultAddr.id || "");
        if (defaultAddr.country) {
          handleCountryChange(typeof defaultAddr.country === "string" ? defaultAddr.country : defaultAddr.country.id);
        }
      }
    }
  }, [customer, handleCountryChange, form]);

  // Clear billing address ID when "Same as shipping" is enabled
  useEffect(() => {
    if (useShippingAsBilling) {
      form.setValue("billingAddressId", "");
    }
  }, [useShippingAsBilling, form]);

  return (
    <div className="space-y-10">
      <div className="mt-8">
        <AddressManager
          compact
          title={__("Shipping Address")}
          type="shipping"
          selected={form.watch("addressId")}
          onSelect={(id) => {
            form.setValue("addressId", id);
            const addr = customer?.address?.items?.find((a) => a.id === id);
            if (addr?.country) {
              handleCountryChange(typeof addr.country === "string" ? addr.country : addr.country.id);
            }
          }}
        />
      </div>
      <div className="p-4 mt-10 border rounded-lg bg-zinc-50 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-800">
        <label className="flex items-center gap-3 cursor-pointer">
          <Switch checked={useShippingAsBilling} onChange={setUseShippingAsBilling} className="data-[state=checked]:bg-zinc-900" />
          <span className="text-sm font-medium">{__("Billing address is same as shipping")}</span>
        </label>

        {!useShippingAsBilling && (
          <div className="pt-6 mt-6 border-t border-zinc-200 animate-in slide-in-from-top-2">
            <AddressManager compact title={__("Billing Address")} type="billing" selected={form.watch("billingAddressId")} onSelect={(id) => form.setValue("billingAddressId", id)} />
          </div>
        )}
      </div>

      {/* 3. Delivery Method */}
      <DeliverySection />

      <PaymentMethods locale={locale} form={form} paymentMethods={data.paymentMethods} paymentMethodRef={paymentMethodRef} total={total} currency={currency} exchangeRate={exchangeRate} />
    </div>
  );
}
