"use client";

import { forwardRef } from "react";
import { Control } from "react-hook-form";
import { PaymentMethodRenderer } from "./PaymentMethodRenderer";
import { Radio, RadioField, RadioGroup } from "@/amerta/theme/ui/radio";
import { FormControl, FormField, FormItem, FormMessage } from "@/amerta/theme/ui/form";
import { PaymentMethod } from "@/amerta/theme/types";
import { PaymentHandle } from "./gateways/types";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

interface PaymentsProps {
  control: Control<any>;
  name: string;
  paymentMethods: PaymentMethod[];
  orderId?: string;
  amount: number;
  currencyCode: string;
  onError: (msg: string) => void;
  onValid: () => void;
  countryCode?: string;
}

// 1. Wrap in forwardRef to expose the handle
export const Payments = forwardRef<PaymentHandle, PaymentsProps>(({ control, name, paymentMethods, orderId, amount, currencyCode, onError, onValid, countryCode }, ref) => {
  if (!paymentMethods?.length) {
    return (
      <div className="p-4 mt-6 border border-yellow-200 rounded-lg bg-yellow-50">
        <p className="text-sm text-yellow-800">No payment methods available for this currency.</p>
      </div>
    );
  }

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup className="mt-6 space-y-4" value={field.value} onChange={field.onChange}>
              {paymentMethods.map((method) => {
                const isSelected = field.value === method.id;
                return (
                  <div key={method.id} className={`border rounded-lg transition-all overflow-hidden ${isSelected ? "border-black ring-1 ring-black" : "border-zinc-200 hover:border-zinc-300"}`}>
                    <RadioField onClick={() => field.onChange(method.id)} className="flex items-center w-full gap-4 p-4 bg-white cursor-pointer">
                      <Radio value={method.id} className="self-start w-4 h-4 mt-1 rtl:self-end" />

                      <div className="flex-1 text-left rtl:text-right">
                        <span className="block text-sm font-semibold text-zinc-950">{method.label}</span>
                      </div>

                      {method.icons && method.icons.length > 0 && (
                        <div className="flex items-center gap-2 shrink-0">
                          {method.icons.map((iconItem, idx) => {
                            const iconUrl = typeof iconItem.image === "object" && iconItem.image !== null ? iconItem.image.url : null;

                            return iconUrl ? (
                              <div key={idx} className="relative w-8 h-5">
                                <ImageMedia src={iconUrl} alt={method.label} fill imgClassName="object-contain" />
                              </div>
                            ) : null;
                          })}
                        </div>
                      )}
                    </RadioField>
                    {isSelected && <PaymentMethodRenderer ref={ref} method={method} orderId={orderId} amount={amount || 0} currencyCode={currencyCode} onError={onError} countryCode={countryCode} onValid={onValid} />}
                  </div>
                );
              })}
            </RadioGroup>
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  );
});

Payments.displayName = "Payments";
