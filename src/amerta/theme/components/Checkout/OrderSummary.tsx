import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { ImageOrPlaceholder } from "../Thumbnail";
import { CouponForm } from "../CouponForm";
import { CircleAlert, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/amerta/theme/ui/button";
import { getURL } from "@/amerta/utilities/getURL";
import { CartWithCalculations } from "@/amerta/theme/types";
import { Currency } from "@/payload-types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export const OrderSummary = ({ cart, exchangeRate, currency, locale, shippingCost, onCartUpdate, tax, loadingTaxes, qualifiesForFree, total, isSubmitting, isValid }: { cart: CartWithCalculations; exchangeRate: number; currency: Currency; locale?: string; shippingCost: number; onCartUpdate: (cart: CartWithCalculations) => void; orderTaxPercentage: number; tax: number; loadingTaxes: boolean; qualifiesForFree: boolean; total: number; isSubmitting: boolean; isValid: boolean }) => {
  const { __ } = useEcommerce();
  return (
    <div className="sticky mt-10 lg:mt-0 top-24">
      <h3 className="text-2xl font-medium text-zinc-950">{__("Order Summary")}</h3>
      <div className="relative sticky mt-5 bg-white border rounded-lg top-24 border-zinc-200">
        <h3 className="sr-only">Items in your cart</h3>
        <ul role="list" className="divide-y divide-zinc-200">
          {cart.items!.map((item) => {
            const product = typeof item.product === "object" ? item.product : null;
            if (!product) return null;

            const productImage = product.images && product.images.length > 0 ? product.images[0] : product.images && product.images.length > 0 ? product.images[0] : null;

            return (
              <li key={product.id} className="flex px-4 py-6 sm:px-6">
                <div className="relative w-24 h-32 overflow-hidden rounded-md shrink-0">
                  <ImageOrPlaceholder image={productImage} alt={product.title} className="object-contain size-full" />
                </div>
                <div className="flex flex-col flex-1 ms-4">
                  <div className="flex justify-between font-medium">
                    <h3 className="leading-tight uppercase text-sm/6">{product.title}</h3>
                    <p className="uppercase ms-4 text-sm/6">{formatPrice(product.price || 0, currency, exchangeRate)}</p>
                  </div>

                  {item.variantOptions && item.variantOptions.length > 0 && (
                    <div className="mt-1.5 flex gap-2 text-sm">
                      {item.variantOptions.map((variant, idx) => (
                        <div key={idx} className="flex gap-1">
                          <p className="uppercase text-zinc-500 text-sm/6">{typeof variant.option === "string" ? variant.option : (variant.option as any)?.label || "Option"}</p>
                          {idx < (item.variantOptions || []).length - 1 && <p className="uppercase text-zinc-300 text-sm/6">/</p>}
                          <p className="uppercase text-zinc-500 text-sm/6">{variant.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-xs uppercase text-zinc-500">Qty: {item.quantity}</p>
                  <p className="mt-1 text-xs uppercase text-zinc-500">{formatPrice((product.price || 0) * (item.quantity || 1), currency, exchangeRate)}</p>
                </div>
              </li>
            );
          })}
        </ul>
        <CouponForm showLabel={false} cart={cart} onCartUpdate={onCartUpdate} currency={currency} className={"px-6 border-t border-zinc-200 py-4 bg-zinc-50 mb-0"} />
        <dl className="px-4 py-6 space-y-2 border-t border-zinc-200 sm:px-6">
          <div className="flex items-center justify-between">
            <dt className="text-sm uppercase">Subtotal</dt>
            <dd className="text-sm font-medium text-zinc-900">{formatPrice(cart.subtotal, currency, exchangeRate)}</dd>
          </div>

          <div className="flex items-center justify-between">
            <dt className="text-sm uppercase">Shipping</dt>
            <dd className="flex items-center gap-2 text-sm font-medium text-zinc-900">
              {formatPrice(shippingCost, currency, exchangeRate)}
              {qualifiesForFree ? <span className="px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-full">FREE</span> : null}
            </dd>
          </div>

          {cart.discount > 0 && (
            <div className="flex items-center justify-between">
              <dt className="text-sm uppercase">Discount</dt>
              <dd className="text-sm font-medium text-green-600">-{formatPrice(cart.discount, currency, exchangeRate)}</dd>
            </div>
          )}

          <div className="flex items-center justify-between">
            <dt className="text-sm uppercase">Taxes</dt>
            <dd className="text-sm font-medium text-zinc-900">
              {loadingTaxes ? (
                <span className="flex items-center gap-1">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Loading...
                </span>
              ) : (
                formatPrice(tax, currency, exchangeRate)
              )}
            </dd>
          </div>
          <div className="flex items-center justify-between pt-6 border-t border-zinc-200">
            <dt className="text-base font-medium uppercase">Total</dt>
            <dd className="text-base font-medium text-zinc-900">{formatPrice(total, currency, exchangeRate)}</dd>
          </div>
        </dl>
        <div className="px-4 py-6 border-t border-zinc-200 sm:px-6">
          <Button size="lg" type="submit" disabled={isSubmitting} variant={!isValid ? "destructive" : "default"} className={"w-full"}>
            {isSubmitting ? <Loader2 className="w-5 h-5 mr-2 animate-spin" /> : !isValid ? <CircleAlert className="w-5 h-5 mr-2" /> : null}
            {isSubmitting ? "Processing..." : "Confirm Order"}
          </Button>

          <div className="flex justify-center mt-4 text-sm text-center text-zinc-500">
            <span className="text-xs">
              or <Link href={getURL("/", locale)} className="text-xs font-medium uppercase text-zinc-900 hover:underline">
                Continue Shopping →
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
