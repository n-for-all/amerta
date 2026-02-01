"use client";
import { Product } from "@/payload-types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { getProductPricing } from "@/amerta/theme/utilities/get-product-pricing";
import { formatPrice } from "@/amerta/theme/utilities/format-price";


export const ProductListingPrice = ({ product }: { product: Product }) => {
  const { currency, exchangeRate } = useEcommerce();
  const pricing = getProductPricing(product, currency);
  if (!pricing) return null;

  // For simple products
  if (pricing.type === "simple") {
    const hasDiscount = pricing.salePrice && pricing.salePrice < pricing.price;

    return (
      <div className="flex items-baseline gap-2">
        {hasDiscount ? (
          <>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">{formatPrice(pricing.salePrice || 0, pricing.currency!, exchangeRate!)}</span>
            <span className="text-sm text-red-500 line-through dark:text-red-400">{formatPrice(pricing.price, pricing.currency!, exchangeRate!)}</span>
          </>
        ) : (
          <span className="text-lg font-semibold text-zinc-900 dark:text-white">{formatPrice(pricing.price, pricing.currency!, exchangeRate!)}</span>
        )}
      </div>
    );
  }

  // For variant products
  if (pricing.type === "variant") {
    const hasDiscount = (pricing.variants || []).some((v) => v.salePrice && v.salePrice < v.price);

    return (
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold text-zinc-900 dark:text-white">{formatPrice(pricing.minPrice || 0, pricing.currency!, exchangeRate!)}</span>
        {pricing.minPrice !== pricing.maxPrice && (
          <>
            <span className="text-zinc-500 dark:text-zinc-400">-</span>
            <span className="text-lg font-semibold text-zinc-900 dark:text-white">{formatPrice(pricing.maxPrice || 0, pricing.currency!, exchangeRate!)}</span>
          </>
        )}
        {hasDiscount && <span className="inline-block px-2 py-1 ml-2 text-xs font-semibold text-red-700 bg-red-100 rounded dark:bg-red-900/30 dark:text-red-300">Sale</span>}
      </div>
    );
  }

  return null;
};

export const ProductPrice = ({ product }: { product: Product }) => {
  const { currency, exchangeRate } = useEcommerce();
  const pricing = getProductPricing(product, currency);
  if (!pricing) return null;

  if (pricing.type === "simple") {
    const hasDiscount = pricing.salePrice && pricing.salePrice < pricing.price;
    return (
      <p data-slot="text" className="text-xl uppercase text-sm/6">
        {hasDiscount ? formatPrice(pricing.salePrice || 0, pricing.currency!, exchangeRate!) : formatPrice(pricing.price, pricing.currency!, exchangeRate!)}
      </p>
    );
  }

  if (pricing.type === "variant") {
    return (
      <p data-slot="text" className="text-xl uppercase text-sm/6">
        {formatPrice(pricing.minPrice || 0, pricing.currency!, exchangeRate!)}
        {pricing.minPrice !== pricing.maxPrice && ` - ${formatPrice(pricing.maxPrice || 0, pricing.currency!, exchangeRate!)}`}
      </p>
    );
  }

  return null;
};
