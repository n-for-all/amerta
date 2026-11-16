import { Currency } from "@/payload-types";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";
import { AppliedCoupon, CartWithCalculations } from "@/amerta/core/types";
import { Button } from "@/amerta/theme/ui/button";
import { Input } from "@/amerta/theme/ui/input";
import { applyCoupon, removeCoupon } from "@/amerta/core/utilities/cart.client";
import { formatPrice } from "@/amerta/core/utilities/format-price";
import { cn } from "@/amerta/utilities/ui";
import { AlertCircle, Gift, Loader2, Tag } from "lucide-react";
import { ImageOrPlaceholder } from "@/amerta/theme/components/Thumbnail";
import { useState } from "react";
import { bundleParts } from "@/amerta/core/utilities/is-in-stock";

export const CouponForm = ({ cart, onCartUpdate, currency, className, showLabel = true, compact = false }: { cart: CartWithCalculations; onCartUpdate: (cart: CartWithCalculations) => void; currency: Currency; className?: string; showLabel?: boolean; compact?: boolean }) => {
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponError, setCouponError] = useState<string | null>(null);
  const [collapsed, setCollapsed] = useState(true);
  const discountAmount = cart?.couponDiscount ?? cart?.discount ?? 0;
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

/**
 * Offer messages from cart rules: what is unlocked ("Free delivery unlocked") and how close the customer is
 * to the next offer ("Add AED 50 more for free delivery"; {amount} / {quantity} are filled in here).
 */
export const CartOfferMessages = ({ cart, currency, className }: { cart: CartWithCalculations | null | undefined; currency: Currency; className?: string }) => {
  const { exchangeRate } = useEcommerce();
  const messages = cart?.offerMessages;
  if (!messages || (!messages.active.length && !messages.upsell.length)) return null;
  return (
    <div className={cn("space-y-1.5", className)}>
      {messages.active.map((message, i) => (
        <p key={`active-${i}`} className="flex items-start gap-2 text-xs text-green-700 dark:text-green-400">
          <Gift className="size-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{message}</span>
        </p>
      ))}
      {messages.upsell.map((upsell) => (
        <p key={`upsell-${upsell.rule}`} className="flex items-start gap-2 text-xs text-zinc-700 dark:text-zinc-300">
          <Tag className="size-3.5 mt-0.5 shrink-0" aria-hidden="true" />
          <span>{upsell.message.replace(/\{amount\}/g, formatPrice(upsell.remaining, currency, exchangeRate)).replace(/\{quantity\}/g, String(upsell.remaining))}</span>
        </p>
      ))}
    </div>
  );
};

/** Products added for free by offers (cart rules). They can't be changed: they come and go with the offer. */
export const CartGiftLines = ({ cart, className }: { cart: CartWithCalculations | null | undefined; className?: string }) => {
  const { __ } = useEcommerce();
  if (!cart?.gifts?.length) return null;
  return (
    <ul role="list" className={cn("divide-y divide-zinc-200 dark:divide-zinc-800", className)}>
      {cart.gifts.map((gift) => (
        <li key={`${gift.rule}-${gift.product.id}`} className="flex items-center gap-4 py-4">
          <div className="relative w-16 h-20 overflow-hidden rounded-md shrink-0">
            <ImageOrPlaceholder image={gift.product.images?.[0]} alt={gift.product.title} className="object-contain size-full" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium uppercase text-sm/6 text-zinc-900 dark:text-white">{gift.product.title}</p>
            {gift.variantOptions?.length ? <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">{gift.variantOptions.map((o) => o.value).join(" / ")}</p> : null}
            <p className="text-xs uppercase text-zinc-500 dark:text-zinc-400">
              {__("Qty:")} {gift.quantity}
            </p>
          </div>
          <span className="px-2 py-1 text-xs font-semibold text-white uppercase bg-green-600 rounded-full shrink-0">{__("Free gift")}</span>
        </li>
      ))}
    </ul>
  );
};

/** A bundle line's contents: every included and chosen product, e.g. "×4 Kopiluwak 100 · 100g" and "×1 Catan". */
export const CartBundleContents = ({ item, className }: { item: any; className?: string }) => {
  const product = item?.product;
  if (!product || typeof product !== "object" || product.type !== "bundle") return null;
  const { parts } = bundleParts(product, item.bundleChoices);
  if (!parts.length) return null;
  return (
    <ul className={cn("mt-1.5 space-y-1", className)}>
      {parts.map((p) => (
        <li key={p.key} className="flex items-center gap-2 text-xs/5 text-zinc-500 dark:text-zinc-400">
          <span className="relative block size-6 shrink-0 overflow-hidden rounded bg-zinc-100 dark:bg-zinc-800">
            <ImageOrPlaceholder image={p.image} alt={p.title} className="object-contain size-full" />
          </span>
          <span className="tabular-nums">×{p.quantity * (item.quantity || 1)}</span>
          <span className="truncate uppercase">
            {p.title}
            {p.detail && !p.choice ? ` · ${p.detail}` : ""}
          </span>
        </li>
      ))}
    </ul>
  );
};

/**
 * Discount breakdown: one line per offer (with the offer's name), free delivery, then the coupon.
 * `definitionList` renders <dt>/<dd> for use inside a <dl>.
 */
export const CartDiscountLines = ({ cart, currency, rowClassName, labelClassName, valueClassName, definitionList = false }: { cart: CartWithCalculations; currency: Currency; rowClassName?: string; labelClassName?: string; valueClassName?: string; definitionList?: boolean }) => {
  const { __, exchangeRate } = useEcommerce();
  const Label = definitionList ? "dt" : "span";
  const Value = definitionList ? "dd" : "span";
  const offers = (cart.offers || []).filter((offer) => offer.discount > 0 || offer.ruleType === "free_delivery");
  const couponDiscount = cart.couponDiscount ?? (cart.offers?.length ? 0 : cart.discount || 0);
  return (
    <>
      {offers.map((offer) => (
        <div key={offer.id} className={cn("flex items-center justify-between gap-4 text-green-600 dark:text-green-400", rowClassName)}>
          <Label className={labelClassName}>{offer.name}</Label>
          <Value className={cn("whitespace-nowrap", valueClassName)}>{offer.ruleType === "free_delivery" ? __("Free delivery") : `-${formatPrice(offer.discount, currency, exchangeRate)}`}</Value>
        </div>
      ))}
      {couponDiscount > 0 && (
        <div className={cn("flex items-center justify-between gap-4 text-green-600 dark:text-green-400", rowClassName)}>
          <Label className={labelClassName}>{__("Discount")}</Label>
          <Value className={cn("whitespace-nowrap", valueClassName)}>-{formatPrice(couponDiscount, currency, exchangeRate)}</Value>
        </div>
      )}
    </>
  );
};
