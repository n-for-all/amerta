import { Currency } from "@/payload-types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { AppliedCoupon, CartWithCalculations } from "@/amerta/theme/types";
import { Button } from "@/amerta/theme/ui/button";
import { Input } from "@/amerta/theme/ui/input";
import { applyCoupon, removeCoupon } from "@/amerta/theme/utilities/cart.client";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { cn } from "@/amerta/utilities/ui";
import { AlertCircle, Loader2 } from "lucide-react";
import { useState } from "react";

export const CouponForm = ({ cart, onCartUpdate, currency, className, showLabel = true, compact = false }: { cart: CartWithCalculations; onCartUpdate: (cart: CartWithCalculations) => void; currency: Currency; className?: string; showLabel?: boolean; compact?: boolean }) => {
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const discountAmount = cart?.discount || 0;
  const { __, locale, exchangeRate } = useEcommerce();
  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!couponCode.trim()) return;

    setCouponLoading(true);
    setCouponError(null);

    const { cart: updatedCart, error: apiError } = await applyCoupon(couponCode, locale);

    if (apiError) {
      setCouponError(apiError.message);
      setCouponLoading(false);
      setTimeout(() => {
        setCouponError(null);
      }, 5000);
      return;
    }

    if (updatedCart) {
      onCartUpdate(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      setCouponCode("");
    }

    setCouponLoading(false);
  };

  const handleRemoveCoupon = async () => {
    setCouponLoading(true);
    setCouponError(null);

    const { cart: updatedCart, error: apiError } = await removeCoupon(locale);

    if (apiError) {
      setCouponError(apiError.message);
      setCouponLoading(false);
      return;
    }

    if (updatedCart) {
      onCartUpdate(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: updatedCart }));
    }

    setCouponLoading(false);
  };
  return (
    <div className={cn("pb-2 mb-2", className)}>
      {cart.appliedCoupon ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-zinc-900 dark:text-white">
              {__("Coupon:")} <span className="font-semibold text-green-600 dark:text-green-400">{(cart.appliedCoupon as AppliedCoupon).code}</span>
              <span className="ml-2 text-xs text-zinc-500 dark:text-zinc-400">(-{formatPrice(discountAmount, currency, exchangeRate)})</span>
            </span>
            <Button type="button" variant={"ghost"} onClick={handleRemoveCoupon} disabled={couponLoading} className="text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50">
              {__("Remove")}
            </Button>
          </div>
        </div>
      ) : (
        <div className="space-y-1">
          {showLabel && (
            <label htmlFor="coupon" className="block text-sm font-medium text-zinc-900 dark:text-white">
              {__("Have a coupon?")}
              {compact ? (
                <span className="ml-1 underline cursor-pointer text-zinc-400" onClick={() => setCollapsed(!collapsed)}>
                  {__("Click here to enter your code")}
                </span>
              ) : null}
            </label>
          )}
          <div className={"flex gap-2 transition transition-all duration-300 overflow-hidden" + (compact ? (collapsed ? " max-h-0" : " max-h-48") : "")}>
            <Input id="coupon" type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder={__("Enter your coupon code...")} disabled={couponLoading} className="flex-1 px-3 py-2 text-sm bg-white border rounded outline-none dark:bg-zinc-800 border-zinc-900/10 dark:border-white/10 focus:outline-1 -outline-offset-1 focus:outline-zinc-900 dark:focus:outline-white disabled:opacity-50" />
            <Button onClick={handleApplyCoupon} disabled={!couponCode.trim() || couponLoading}>
              {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : __("Apply")}
            </Button>
          </div>
        </div>
      )}
      {couponError && (
        <div className="flex items-center gap-3 px-2 py-1 mt-4 mb-2 border border-red-200 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-800">
          <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700 dark:text-red-300">{couponError}</p>
        </div>
      )}
    </div>
  );
};
