import { Payments } from "../Payment/Payments";
import { PaymentMethod } from "@/amerta/theme/types";
import { PaymentHandle } from "../Payment/gateways/types";
import { UseFormReturn } from "react-hook-form";
import { CheckoutFormValues } from ".";

export const PaymentMethods = ({ form, paymentMethods, total, currency, paymentMethodRef, exchangeRate }: { form: UseFormReturn<CheckoutFormValues>; paymentMethods: PaymentMethod[]; total: number; currency: { code?: string | null }; paymentMethodRef: React.RefObject<PaymentHandle | null>; exchangeRate: number }) => {
  return (
    <div className="pt-10 mt-10 border-t border-zinc-200">
      <h3 className="text-2xl font-medium text-zinc-950">
        <span className="font-serif italic">Payment</span> method
      </h3>
      {paymentMethods && paymentMethods.length > 0 ? (
        <Payments
          control={form.control}
          name="paymentMethodId"
          paymentMethods={paymentMethods} // Fetched from Payload
          //   orderId={orderId}        // If you have it
          amount={total * exchangeRate} // Needed for Stripe
          currencyCode={currency.code!}
          onError={(msg) => {
            form.setError("paymentMethodId", { message: msg });
            form.setError("root", {
              type: "general",
              message: msg,
            });
          }}
          onValid={() => {
            form.clearErrors("paymentMethodId");
            form.clearErrors("root");
          }}
          ref={paymentMethodRef}
          countryCode={form.getValues("country")}
        />
      ) : (
        <div className="p-4 mt-10 border border-yellow-200 rounded-lg bg-yellow-50">
          <p className="text-sm text-yellow-800">No payment methods available</p>
        </div>
      )}
    </div>
  );
};
