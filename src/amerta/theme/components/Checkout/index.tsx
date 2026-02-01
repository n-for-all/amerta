"use client";
import { useRef, useState } from "react";
import Link from "next/link";
import * as z from "zod";
import { CartWithCalculations, PaymentMethod } from "@/amerta/theme/types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { Input } from "@/amerta/theme/ui/input";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/amerta/theme/ui/form";
import { Customer, EcommerceSettings } from "@/payload-types";
import { LoginDialog } from "./LoginDialog";
import { PaymentHandle } from "../Payment/gateways/types";
import { ErrorDialog } from "./ErrorDialog";
import { OrderSummary } from "./OrderSummary";
import { CheckoutContext, checkoutSchema, loggedInCheckoutSchema, useCheckout } from "./hooks/useCheckout";
import { CustomerCheckoutForm } from "./CustomerCheckoutForm";
import { GuestCheckoutForm } from "./GuestCheckoutForm";
import { OrderNote } from "./OrderNote";
import { getURL } from "@/amerta/utilities/getURL";
import { useAuth } from "@/amerta/providers/Auth";

interface SupportedCountry {
  id: string;
  name: string;
  display_name: string;
  iso_2: string;
  iso_3: string;
  citiesType: "all" | "specific";
  cities: Array<{ city: string; code?: string; active: boolean }>;
}

export const requiredString = (message: string) => z.string({ error: message }).min(1, message);

type CheckoutSchemaType = z.infer<typeof checkoutSchema>;
type CheckoutSchemaLoggedInType = z.infer<typeof loggedInCheckoutSchema>;

interface CheckoutProps {
  ecommerceSettings: EcommerceSettings;
  data: { countries: SupportedCountry[]; paymentMethods: PaymentMethod[] };
  cart: CartWithCalculations | null;
  logo: React.ReactNode;
}

export type CheckoutFormValues = CheckoutSchemaType | CheckoutSchemaLoggedInType;
export type CheckoutFormGuestValues = CheckoutSchemaType;
export type CheckoutFormLoggedInValues = CheckoutSchemaLoggedInType;

export default function CheckoutNew({ ecommerceSettings, data, cart: cartData, logo }: CheckoutProps) {
  const { currency, locale, exchangeRate, __ } = useEcommerce();
  const [showLoginDialog, setShowLoginDialog] = useState(false);
  const paymentMethodRef = useRef<PaymentHandle>(null);
  const { user: customer } = useAuth() as { user: Customer | null };

  const checkoutState = useCheckout({
    cart: cartData,
    customer,
    data,
    paymentMethodRef,
    locale,
  });

  const { form, deliveryMethods, loadingDeliveryMethods, setCart, onSubmit, onInvalid, total, tax, shippingCost, orderTaxPercentage, loadingTaxes, qualifiesForFree } = checkoutState;

  if (!checkoutState.subtotal || checkoutState.subtotal === 0) {
    return (
      <div className="px-4 py-12 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
        <h1 className="text-2xl font-semibold text-zinc-900">Your cart is empty</h1>
        <p className="mt-2 text-zinc-600">Add items to your cart before checking out.</p>
        <Link href={getURL("/", locale)} className="inline-block px-6 py-3 mt-6 font-medium text-white rounded-full bg-zinc-900 hover:bg-zinc-800">
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <CheckoutContext.Provider
      value={{
        form,
        checkoutState,
        data,
        customer,
        ecommerceSettings,
        deliveryMethods,
        loadingDeliveryMethods,
        locale,
        paymentMethodRef,
      }}
    >
      <div>
        <h1 className="text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none font-medium mb-8">
          <span className="font-serif italic rtl:not-italic">{__("Checkout")}</span>
        </h1>

        {form.formState.errors.root && (
          <div className="flex items-center justify-between p-4 mb-6 border border-red-200 rounded-lg bg-red-50">
            <p className="text-sm font-medium text-red-800">{form.formState.errors.root.message}</p>
            <button onClick={() => form.clearErrors()} className="ml-4 text-sm font-medium text-red-600 hover:text-red-700">
              Dismiss
            </button>
          </div>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit, onInvalid)}>
            <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">
              <div>
                <div className="mb-6">
                  <h3 className="text-2xl font-medium text-zinc-950">
                    <span className="font-serif italic">Contact</span> information
                  </h3>
                  <div className="mt-10">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem className="space-y-1">
                          <div className="flex items-center">
                            <FormLabel className="flex-1 text-sm">
                              Your email address {customer && (
                                <>
                                  (<Link href={`/logout`} className="px-0.5 text-sm text-blue-600 hover:underline">
                                    Logout
                                  </Link>)
                                </>
                              )}
                            </FormLabel>
                            {!customer && (
                              <span className="text-sm">
                                Have an account? <button type="button" onClick={() => setShowLoginDialog(true)} className="text-blue-600 hover:underline">
                                  Log in
                                </button>
                              </span>
                            )}
                          </div>
                          <FormControl>
                            <Input {...field} type="email" placeholder="you@example.com" readOnly={!!customer} className={"w-full rounded-full px-3.5 py-2 text-sm border border-zinc-300 hover:border-zinc-400 bg-transparent focus:outline-hidden focus:ring-2 focus:ring-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed" + (customer ? " cursor-not-allowed bg-zinc-100 text-zinc-500" : "")} />
                          </FormControl>
                          <FormMessage />
                          <p className="pl-3 mt-1 text-xs text-sm text-zinc-500">We&apos;ll send you tracking info when your order has shipped or updated.</p>
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {customer ? <CustomerCheckoutForm /> : <GuestCheckoutForm />}
                {ecommerceSettings?.allowOrderNotes ? <OrderNote form={form} /> : null}
              </div>
              <div className="mt-10 lg:mt-0">
                <OrderSummary exchangeRate={exchangeRate} cart={cartData!} currency={currency} locale={locale} shippingCost={shippingCost} onCartUpdate={setCart} orderTaxPercentage={orderTaxPercentage} tax={tax} loadingTaxes={loadingTaxes} qualifiesForFree={!!qualifiesForFree} total={total} isSubmitting={form.formState.isSubmitting} isValid={form.formState.isValid} />
              </div>
            </div>
          </form>
        </Form>
        {showLoginDialog && <LoginDialog logo={logo} onClose={() => setShowLoginDialog(false)} />}
        <ErrorDialog title="Please check your details" open={checkoutState.showErrorDialog} onClose={() => checkoutState.setShowErrorDialog(false)} errors={form.formState.errors} />
      </div>
    </CheckoutContext.Provider>
  );
}
