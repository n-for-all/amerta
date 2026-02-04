"use client";
import React from "react";
import type { Order, Payment, Currency, Country } from "@/payload-types";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { printf } from "fast-printf";

export const OrderDetails: React.FC<{ order: Order; locale: string; payment?: Payment; currency: Currency }> = ({ order, payment }) => {
  const { __ } = useEcommerce();
  if (!order) return null;

  const liveStatus = order.status;
  const liveCreatedAt = order.createdAt;
  const savedAddr = order.address || {};
  const addr = {
    firstName: savedAddr.firstName,
    lastName: savedAddr.lastName,
    country: savedAddr.country,
    address: savedAddr.address,
    city: savedAddr.city,
    phoneCountryCode: savedAddr.phoneCountryCode,
    phone: savedAddr.phone,
    apartment: savedAddr.apartment,
    building: savedAddr.building,
    floor: savedAddr.floor,
    street: savedAddr.street,
    state: savedAddr.state,
    postalCode: savedAddr.postalCode,
    countryName: savedAddr.countryName,
  };

  const countryVal = addr.countryName;
  const countryLabel = countryVal && typeof countryVal === "object" && "name" in countryVal ? (countryVal as Country).name : ((countryVal as string) ?? "");
  const exchangeRate = order.exchangeRate || 1;

  return (
    <div className="mb-8">
      <h2 className="mb-1 text-xl font-semibold">{printf(__("Order #%s details"), order.orderId)}</h2>

      <p className="flex flex-wrap items-center gap-2 mb-5 text-base text-zinc-500">
        {printf(__("Payment via %s"), order.paymentMethodName || "")} • {printf(__("Shipping via %s"), order.shippingMethodName || "")} •
        {order.isFreeShipping && <span className="inline-block px-2 py-1 text-xs font-semibold tracking-wider text-white uppercase bg-green-600 rounded">{__("FREE SHIPPING")}</span>}
      </p>

      <div className="grid gap-8 md:grid-cols-3">
        
        <div className="text-base">
          <h3 className="mb-3 text-xl font-semibold">{__("General")}</h3>

          <div className="mb-3">
            <div className="mb-1 text-base font-semibold text-zinc-500">{__("Date created:")}</div>
            <div className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">{liveCreatedAt ? new Date(liveCreatedAt).toLocaleDateString() : "—"}</div>
          </div>

          <div className="mb-3">
            <div className="mb-1 text-base font-semibold text-zinc-500">{__("Status:")}</div>
            <div className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">{liveStatus ?? "—"}</div>
          </div>
        </div>

        {payment ? (
          <div className="text-base">
            <h3 className="mb-3 text-xl font-semibold">{__("Payment")}</h3>

            <div className="mb-3">
              <div className="mb-1 text-base font-semibold text-zinc-500">{__("Amount:")}</div>
              <div className="mb-1 text-zinc-500">{formatPrice(payment?.amount, payment?.currency as Currency, exchangeRate)}</div>
            </div>

            <div className="mb-3">
              <div className="mb-1 text-base font-semibold text-zinc-500">{__("Status:")}</div>
              <div className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">{payment?.status || "—"}</div>
            </div>
          </div>
        ) : null}

        
        <div className="text-base">
          <h3 className="mb-3 text-xl font-semibold">{__("Shipping")}</h3>

          
          {addr ? (
            <>
              <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">
                {addr.firstName} {addr.lastName}
              </p>
              {addr.address && <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">{addr.address}</p>}
              {(addr.city || countryLabel) && <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">{[addr.city, countryLabel].filter(Boolean).join(", ")}</p>}

              {addr.phone && (
                <div className="flex gap-2 mt-3 mb-1 ">
                  <p className="text-base font-semibold text-zinc-500">{__("Phone:")}</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">
                    {addr.phoneCountryCode} {addr.phone}
                  </p>
                </div>
              )}

              {addr.apartment && (
                <div className="flex gap-2 mt-3 mb-1">
                  <p className="text-base font-semibold text-zinc-500">{__("Apartment:")}</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{addr.apartment}</p>
                </div>
              )}

              {addr.building && (
                <div className="flex gap-2 mt-3 mb-1">
                  <p className="text-base font-semibold text-zinc-500">{__("Building:")}</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{addr.building}</p>
                </div>
              )}

              {addr.floor && (
                <div className="flex gap-2 mt-3 mb-1">
                  <p className="text-base font-semibold text-zinc-500">{__("Floor:")}</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{addr.floor}</p>
                </div>
              )}

              {addr.street && (
                <div className="flex gap-2 mt-3 mb-1">
                  <p className="text-base font-semibold text-zinc-500">{__("Street:")}</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{addr.street}</p>
                </div>
              )}

              {addr.state && (
                <div className="flex gap-2 mt-3 mb-1">
                  <p className="text-base font-semibold text-zinc-500">{__("State / Province:")}</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{addr.state}</p>
                </div>
              )}

              {addr.postalCode && (
                <div className="flex gap-2 mt-3 mb-1">
                  <p className="text-base font-semibold text-zinc-500">{__("Postal code:")}</p>
                  <p className="font-medium text-zinc-800 dark:text-zinc-200">{addr.postalCode}</p>
                </div>
              )}
            </>
          ) : (
            <p className="mb-1 text-zinc-500">{__("No shipping address set.")}</p>
          )}
        </div>
      </div>
      {order.orderNote && (
        <div className="pt-6 mt-8 border-t border-zinc-200 dark:border-zinc-800">
          <h3 className="mb-3 text-xl font-semibold">{__("Order Note")}</h3>
          <div>
            <p className="mb-1 font-medium text-zinc-800 dark:text-zinc-200">{order.orderNote}</p>
          </div>
        </div>
      )}
    </div>
  );
};
