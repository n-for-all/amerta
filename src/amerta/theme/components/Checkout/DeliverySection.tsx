"use client";
import { useContext } from "react";
import { CheckoutContext } from "./hooks/useCheckout";
import { FormField, FormItem, FormControl, FormMessage } from "@/amerta/theme/ui/form";
import { Loader2 } from "lucide-react";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export function DeliverySection() {
  const { form, deliveryMethods, loadingDeliveryMethods, checkoutState } = useContext(CheckoutContext);
  const { currency, exchangeRate, __ } = useEcommerce();
  const { qualifiesForFree } = checkoutState;
  return (
    <div className="pt-10 mt-10 border-t border-zinc-200">
      <h3 className="text-2xl font-medium text-zinc-950">
        <span className="font-serif italic">{__("Delivery")}</span> {__("method")}
      </h3>

      {loadingDeliveryMethods ? (
        <div className="flex items-center p-4 mt-6 text-sm bg-white border border-dashed rounded dark:bg-zinc-900 text-zinc-600 border-zinc-200 dark:border-zinc-700 dark:text-zinc-400">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> {__("Loading methods...")}
        </div>
      ) : deliveryMethods.length > 0 ? (
        <FormField
          control={form.control}
          name="deliveryMethodId"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <div className="grid grid-cols-1 mt-6 gap-y-4 sm:grid-cols-2 sm:gap-x-4">
                  {deliveryMethods.map((method) => {
                    const isSelected = field.value === method.id;
                    return (
                      <button key={method.id} type="button" onClick={() => field.onChange(method.id)} className={`relative rounded-lg border-2 p-4 text-left transition-all ${isSelected ? "border-zinc-900 bg-white" : "border-zinc-200 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600"}`}>
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-medium">{method.label}</p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {method.estimatedDaysMin}-{method.estimatedDaysMax} {__("days")}
                            </p>
                            {qualifiesForFree && method.cost > 0 ? (
                              <p className="mt-2 text-sm font-semibold">
                                <span className="line-through">{formatPrice(method.cost, currency, exchangeRate)}</span> <span className="px-2 py-1 text-xs font-semibold text-white uppercase bg-green-600 rounded-full">{__("Free")}</span>
                              </p>
                            ) : method.cost === 0 ? (
                              <p className="mt-2 text-sm font-semibold uppercase">{__("Free")}</p>
                            ) : (
                              <p className="mt-2 text-sm font-semibold">{formatPrice(method.cost, currency, exchangeRate)}</p>
                            )}
                          </div>
                          {isSelected && <div className="w-4 h-4 bg-black rounded-full" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      ) : (
        <div className="p-4 mt-6 text-sm text-yellow-800 border border-yellow-200 rounded-md bg-yellow-50">{__("Select a valid address to see delivery options.")}</div>
      )}
    </div>
  );
}
