"use client";
import React from "react";
import type { Currency, Order, Payment, Product } from "@/payload-types";
import Link from "next/link";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { ImageOrPlaceholder } from "@/amerta/theme/components/Thumbnail";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export const OrderItems: React.FC<{ currency?: Currency; order: Order; locale: string; payment?: Payment }> = ({ currency, order, payment }) => {
  const { __ } = useEcommerce();
  if (!order) return null;

  const subtotal = order.subtotal;
  const shippingTotal = order.shippingTotal;
  const discountTotal = order.discountTotal || 0;
  const couponCode = order.couponCode || "";
  const isFreeShipping = order.isFreeShipping || false;
  const total = order.total || subtotal - discountTotal + shippingTotal;
  const taxTotal = order.tax || 0;
  const exchangeRate = order.exchangeRate || 1;

  return (
    <div className="pt-5 pb-2 mt-6 mb-6 border-t border-zinc-200 dark:border-zinc-800">
      <div className="grid grid-cols-[minmax(0,1fr)_120px_60px_140px] text-base font-semibold text-zinc-500 border-b border-zinc-200 dark:border-zinc-800 pb-2 mb-2">
        <div>{__("Item")}</div>
        <div className="text-right">{__("Price")}</div>
        <div className="text-center">{__("Qty")}</div>
        <div className="text-right">{__("Total")}</div>
      </div>

      {order.items?.map((item: any, idx) => {
        const product: Product | null = item.product && typeof item.product === "object" ? item.product : null;
        const lineTotal = (item.price || 0) * (item.quantity || 0);

        // Ensure metaData is handled safely
        const metaData = item.metaData && typeof item.metaData === "object" ? item.metaData : {};

        // Get product image
        const productImage = product?.images && product.images.length > 0 ? (product.images[0]! as any).url : null;

        // Get product slug for link
        const productSlug = product?.slug || null;

        return (
          <div key={idx} className="grid grid-cols-[minmax(0,1fr)_120px_60px_140px] items-start py-3 border-b border-zinc-100 dark:border-zinc-900">
            <div className="flex items-center gap-6">
              {/* Product Image */}
              {productImage ? (
                <Link href={productSlug ? `/products/${productSlug}` : "#"} className="relative flex-shrink-0 w-24 h-32 ">
                  <ImageOrPlaceholder image={productImage} alt={item.productName || ""} className="object-contain w-full h-full rounded-md" />
                </Link>
              ) : (
                <div className="flex items-center justify-center flex-shrink-0 w-20 h-20 rounded-md bg-zinc-100 dark:bg-zinc-800">
                  <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
              )}

              <div className="flex flex-col gap-1">
                <div>
                  {productSlug ? (
                    <Link href={`/products/${productSlug}`} className="text-base font-semibold hover:underline">
                      {item.productName || metaData?.title || product?.title || ""}
                    </Link>
                  ) : (
                    <div className="text-base font-semibold">{item.productName || metaData?.title || product?.title || ""}</div>
                  )}
                  {item.variantText && <div className="text-sm">{item.variantText}</div>}
                  {metaData?.subtitle && <div className="text-sm">{metaData?.subtitle}</div>}
                  <div className="text-sm text-zinc-600 dark:text-zinc-400">
                    <span className="font-semibold">{__("SKU:")} </span>
                    <span>{item.productSKU || metaData?.sku || product?.sku || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="text-base text-right">{formatPrice(item.price || 0, (payment?.currency || currency) as Currency, exchangeRate)}</div>
            <div className="text-center">× {item.quantity || 0}</div>
            <div className="text-base text-right">{formatPrice(lineTotal, (payment?.currency || currency) as Currency, exchangeRate)}</div>
          </div>
        );
      })}

      {/* Shipping line */}
      <div className="grid grid-cols-[30px_minmax(0,1fr)_140px] items-center py-3 pb-5 border-b border-zinc-200 dark:border-zinc-800">
        <div className="text-xl">🚚</div>
        <div className="text-xl">
          <div className="text-base font-semibold">
            {order.shippingMethodName ?? __("Shipping")}
            {isFreeShipping && <span className="inline-block px-2 py-1 ml-2 text-xs font-semibold tracking-wider text-white uppercase bg-green-600 rounded">{__("FREE")}</span>}
          </div>
        </div>
        <div className="text-right">{isFreeShipping ? <span className="mr-1 line-through text-zinc-400">{formatPrice(Number(shippingTotal), (payment?.currency || currency) as Currency, exchangeRate)}</span> : <span>{formatPrice(Number(shippingTotal), (payment?.currency || currency) as Currency, exchangeRate)}</span>}</div>
      </div>

      {/* Totals */}
      <div className="mt-5 ml-auto max-w-[260px] text-base">
        <div className="flex justify-between mb-1.5">
          <span>{__("Items Subtotal:")}</span>
          <span>{formatPrice(subtotal, (payment?.currency || currency) as Currency, exchangeRate)}</span>
        </div>
        {discountTotal > 0 && (
          <div className="flex justify-between mb-1.5">
            <span>
              {__("Discount")}
              {couponCode && <span className="text-sm font-normal text-zinc-600 dark:text-zinc-400"> ({couponCode})</span>}:
            </span>
            <span className="font-semibold text-green-600">-{formatPrice(discountTotal, (payment?.currency || currency) as Currency, exchangeRate)}</span>
          </div>
        )}
        <div className="flex justify-between mb-1.5">
          <span>{__("Shipping:")}</span>
          <span>
            {isFreeShipping ? (
              <>
                <span className="mr-1 line-through text-zinc-400">{formatPrice(Number(shippingTotal), (payment?.currency || currency) as Currency, exchangeRate)}</span>
                <span className="font-semibold text-green-600"> {__("FREE")}</span>
              </>
            ) : (
              <span>{formatPrice(Number(shippingTotal), (payment?.currency || currency) as Currency, exchangeRate)}</span>
            )}
          </span>
        </div>
        <div className="flex justify-between mb-1.5">
          <span>{__("Taxes:")}</span>
          <span>
            <span>{formatPrice(Number(taxTotal), (payment?.currency || currency) as Currency, exchangeRate)}</span>
          </span>
        </div>
        <div className="flex justify-between mb-1.5">
          <span>{__("Order Total:")}</span>
          <span className="font-semibold">{formatPrice(total, (payment?.currency || currency) as Currency, exchangeRate)}</span>
        </div>
      </div>
    </div>
  );
};
