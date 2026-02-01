"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getURL } from "@/amerta/utilities/getURL";
import { Currency, Order, ProductMedia } from "@/payload-types";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

type Props = {
  initialOrder: Order;
  initialPayment: any;
  customerEmail: string;
  customerName: string;
  locale: string;
  currency: Currency;
  isCOD: boolean;
  orderKey: string;
};

export const OrderReceived: React.FC<Props> = ({ initialOrder, initialPayment, customerEmail, customerName, locale, currency, isCOD, orderKey }) => {
  const [payment, setPayment] = useState(initialPayment);

  const hasPaymentRecord = !!payment;
  const isConfirmed = isCOD || (hasPaymentRecord && payment?.status === "succeeded");

  useEffect(() => {
    fetch(`/api/cart/clear`, {
      method: "POST",
      credentials: "include",
    });
  }, []);

  useEffect(() => {
    if (isConfirmed) return;

    const intervalId = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/check-status?orderKey=${encodeURIComponent(orderKey)}`);
        const data = await res.json();

        if (data.isPaid) {
          setPayment({
            status: "succeeded",
            amount: data.paymentAmount || initialOrder.total,
            currency: currency,
          });
          clearInterval(intervalId);
        }
      } catch (err) {
        console.error("Polling failed", err);
      }
    }, 3000);

    return () => clearInterval(intervalId);
  }, [isConfirmed, orderKey, initialOrder.total, currency]);

  const country = typeof initialOrder.address?.country === "string" ? initialOrder.address?.country : initialOrder.address?.country?.name || "";

  const paymentMethodName = payment ? (typeof initialOrder.paymentMethod === "object" ? initialOrder.paymentMethod?.name : "Online Payment") : "Online Payment";

  return (
    <div className="max-w-2xl px-4 py-16 mx-auto sm:py-24 lg:max-w-3xl">
      <div>
        <div
          className={`flex w-fit items-center justify-center rounded-full border px-6 py-2.5 text-sm font-medium transition-colors duration-500
          ${isConfirmed ? "border-green-600 bg-green-50 text-green-700" : "border-zinc-900 text-zinc-900"}`}
        >
          <span className="flex items-center gap-2 text-xs uppercase">{isConfirmed ? <>✓ Thanks for ordering</> : <>Order Placed</>}</span>
        </div>

        <h2 className="mt-4 text-3xl font-medium leading-none sm:text-4xl xl:text-5xl/none text-zinc-900">
          {isConfirmed ? (
            <>
              Payment <span className="font-serif italic font-normal text-zinc-500">successful!</span>
            </>
          ) : (
            <>
              Order <span className="font-serif italic font-normal text-zinc-500">received.</span>
            </>
          )}
        </h2>

        <p className="mt-2.5 text-sm text-zinc-500 uppercase leading-6">
          {isConfirmed ? (
            <>
              We sent an email to <span className="font-bold text-zinc-900">{customerEmail}</span> with your order confirmation.
            </>
          ) : (
            <>
              We are <span className="font-bold text-amber-600">verifying your payment</span>. This page will update automatically.
            </>
          )}
        </p>

        <dl className="mt-16 text-sm">
          <dt className="uppercase text-zinc-500">Order ID</dt>
          <dd className="mt-2 font-medium text-zinc-950">#{initialOrder.orderId}</dd>
        </dl>

        <ul role="list" className="mt-6 text-sm font-medium border-t divide-y divide-zinc-200 border-zinc-200 text-zinc-500">
          {(initialOrder.items || []).map((item, index) => {
            const product = typeof item.product === "object" ? item.product : null;
            const image = (item?.image as ProductMedia)?.url || (product?.images?.[0] as ProductMedia)?.url;
            const title = product?.title || "Unknown Product";
            const slug = product?.slug || "#";

            return (
              <li key={index} className="flex py-6 space-x-6">
                <div className="relative aspect-[3/4] w-24 flex-none flex-shrink-0 overflow-hidden rounded-md bg-zinc-100">{image && <ImageMedia src={image} alt={title} fill imgClassName="object-contain w-full h-full" />}</div>
                <div className="flex flex-col flex-auto space-y-1">
                  <h3 className="uppercase text-zinc-900">
                    <Link href={getURL(`/products/${slug}`, locale)}>{title}</Link>
                  </h3>
                  {item.variantText && <p className="text-xs uppercase">{item.variantText}</p>}
                  <p className="mt-auto text-xs uppercase text-zinc-500">Qty {item.quantity}</p>
                </div>
                <p className="flex-none font-medium text-zinc-900">{formatPrice(item.price, initialOrder.customerCurrency as Currency, initialOrder.exchangeRate!)}</p>
              </li>
            );
          })}
        </ul>

        {/* --- UPDATED TOTALS SECTION --- */}
        <dl className="pt-6 space-y-2 text-sm font-medium border-t border-zinc-200 text-zinc-500">
          {/* Subtotal */}
          <div className="flex justify-between">
            <dt className="uppercase">Subtotal</dt>
            <dd className="text-zinc-900">{formatPrice(initialOrder.subtotal || 0, initialOrder.customerCurrency as Currency, initialOrder.exchangeRate!)}</dd>
          </div>

          {/* Shipping */}
          <div className="flex justify-between">
            <dt className="uppercase">Shipping</dt>
            <dd className="text-zinc-900">{initialOrder.isFreeShipping ? "FREE" : formatPrice(initialOrder.shippingTotal || 0, initialOrder.customerCurrency as Currency, initialOrder.exchangeRate!)}</dd>
          </div>

          {/* Discount (Only show if exists) */}
          {initialOrder.discountTotal && initialOrder.discountTotal > 0 ? (
            <div className="flex justify-between text-green-600">
              <dt className="uppercase">Discount {initialOrder.couponCode ? `(${initialOrder.couponCode})` : ""}</dt>
              <dd>-{formatPrice(initialOrder.discountTotal, initialOrder.customerCurrency as Currency, initialOrder.exchangeRate!)}</dd>
            </div>
          ) : null}

          {/* Tax (Only show if exists) */}
          {initialOrder.tax && initialOrder.tax > 0 ? (
            <div className="flex justify-between">
              <dt className="uppercase">Tax</dt>
              <dd className="text-zinc-900">{formatPrice(initialOrder.tax, initialOrder.customerCurrency as Currency, initialOrder.exchangeRate!)}</dd>
            </div>
          ) : null}

          {/* Total */}
          <div className="flex items-center justify-between pt-6 border-t border-zinc-200 text-zinc-900">
            <dt className="text-base uppercase">Total</dt>
            <dd className="text-base">{formatPrice(initialOrder.total || 0, initialOrder.customerCurrency as Currency, initialOrder.exchangeRate!)}</dd>
          </div>
        </dl>

        <dl className="grid grid-cols-2 mt-16 text-sm gap-x-4 text-zinc-600">
          <div>
            <dt className="font-medium uppercase text-zinc-900">Shipping Address</dt>
            <dd className="mt-2">
              <address className="not-italic uppercase">
                <span className="block">{customerName}</span>
                <span className="block">St. {initialOrder.address?.street}</span>
                <span className="block">
                  {initialOrder.address?.city}, {initialOrder.address?.state}
                </span>
                <span className="block">{country}</span>
              </address>
            </dd>
          </div>

          <div>
            <dt className="font-medium uppercase text-zinc-900">Payment Information</dt>
            <dd className="mt-2 space-y-2 sm:flex sm:space-y-0 sm:space-x-4">
              {isCOD ? (
                <div className="flex items-center gap-2">
                  <div className="h-6 w-10 bg-zinc-200 rounded flex items-center justify-center text-[10px] font-bold">CASH</div>
                  <p className="uppercase text-zinc-900">Pay on Delivery</p>
                </div>
              ) : (
                <>
                  <div className="flex-none">
                    <svg width="36" height="24" viewBox="0 0 36 24" aria-hidden="true" className="w-auto h-6">
                      <rect rx="4" fill="#224DBA" width="36" height="24"></rect>
                      <path d="M10.925 15.673H8.874l-1.538-6c-.073-.276-.228-.52-.456-.635A6.575 6.575 0 005 8.403v-.231h3.304c.456 0 .798.347.855.75l.798 4.328 2.05-5.078h1.994l-3.076 7.5zm4.216 0h-1.937L14.8 8.172h1.937l-1.595 7.5zm4.101-5.422c.057-.404.399-.635.798-.635a3.54 3.54 0 011.88.346l.342-1.615A4.808 4.808 0 0020.496 8c-1.88 0-3.248 1.039-3.248 2.481 0 1.097.969 1.673 1.653 2.02.74.346 1.025.577.968.923 0 .519-.57.75-1.139.75a4.795 4.795 0 01-1.994-.462l-.342 1.616a5.48 5.48 0 002.108.404c2.108.057 3.418-.981 3.418-2.539 0-1.962-2.678-2.077-2.678-2.942zm9.457 5.422L27.16 8.172h-1.652a.858.858 0 00-.798.577l-2.848 6.924h1.994l.398-1.096h2.45l.228 1.096h1.766zm-2.905-5.482l.57 2.827h-1.596l1.026-2.827z" fill="#fff"></path>
                    </svg>
                    <p className="sr-only">Visa</p>
                  </div>
                  <div className="flex-auto uppercase">
                    <p className="text-zinc-900">{paymentMethodName}</p>

                    {hasPaymentRecord ? (
                      <p className="mt-1 text-xs transition-all duration-500 text-zinc-500">
                        Paid {formatPrice(payment.amount, initialOrder.customerCurrency as Currency, initialOrder.exchangeRate!)}
                        <span className="ml-2 font-bold text-green-600">(PAID)</span>
                      </p>
                    ) : (
                      <div className="flex items-center gap-2 mt-1 text-xs text-amber-600 animate-pulse">
                        <span className="relative flex w-2 h-2">
                          <span className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping bg-amber-400"></span>
                          <span className="relative inline-flex w-2 h-2 rounded-full bg-amber-500"></span>
                        </span>
                        <span>Confirming payment...</span>
                      </div>
                    )}
                  </div>
                </>
              )}
            </dd>
          </div>
        </dl>

        <div className="py-6 mt-16 text-right border-t border-zinc-200">
          <Link href={getURL("/", locale)} className="text-sm font-medium uppercase text-zinc-950 hover:text-zinc-700">
            Continue Shopping <span aria-hidden="true">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
