/* eslint-disable i18next/no-literal-string */

"use client";
import React, { useEffect, useState } from "react";
import type { Order, Customer } from "@/payload-types";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui";
import styles from "./index.module.scss";
import { getAdminURL } from "@/amerta/utilities/getAdminURL";

export const OrderDetails: React.FC = () => {
  const { data: savedData } = useDocumentInfo();

  const fields = useFormFields(([fields]) => fields);

  const order = savedData as Order | null;

  const getValue = (path: string, fallback: any) => {
    const liveField = fields[path];
    return liveField?.value !== undefined ? liveField.value : fallback;
  };

  const [liveCustomer, setLiveCustomer] = useState<Customer | null>(null);

  const orderedByValue = fields.orderedBy?.value;

  const isObject = typeof orderedByValue === "object" && orderedByValue !== null;
  const currentId = isObject ? (orderedByValue as any).id : orderedByValue;
  useEffect(() => {
    if (!currentId) {
      setLiveCustomer(null);
      return;
    }

    const savedCustomer = order?.orderedBy as Customer | undefined;
    if (savedCustomer && savedCustomer.id === currentId) {
      setLiveCustomer(savedCustomer);
      return;
    }

    const fetchCustomer = async () => {
      try {
        const resp = await fetch(`/api/customers/${currentId}`);
        if (resp.ok) {
          const data = await resp.json();
          setLiveCustomer(data);
        }
      } catch (err) {
        console.error("Failed to fetch live customer", err);
      }
    };

    fetchCustomer();
  }, [currentId, order?.orderedBy]);
  if (!order) return null;

  const liveStatus = getValue("status", order.status);

  const liveCreatedAt = getValue("createdAt", order.createdAt);

  const liveOrderedByRaw = getValue("orderedBy", order.orderedBy);
  const getCustomerData = () => {
    const customer = liveCustomer || (typeof order.orderedBy === "object" ? order.orderedBy : null);

    if (!customer) return { name: "", email: "", badge: "Guest", id: null };

    const firstName = customer.firstName || "";
    const lastName = customer.lastName || "";
    const name = `${firstName} ${lastName}`.trim();
    const email = customer.email ? `<${customer.email}>` : "";
    const badge = customer.hasAccount === "1" ? "Account" : "Guest";
    const id = customer.id || null;

    return { name, email, badge, id };
  };

  const { name: customerFullName, email: customerEmail, badge: customerBadge, id: customerId } = getCustomerData();
  const customerName = `${customerFullName} ${customerEmail}`.trim();

  const savedAddr = order.address || {};
  const addr = {
    firstName: getValue("address.firstName", savedAddr.firstName),
    lastName: getValue("address.lastName", savedAddr.lastName),
    country: getValue("address.country", savedAddr.country),
    address: getValue("address.address", savedAddr.address),
    city: getValue("address.city", savedAddr.city),
    phoneCountryCode: getValue("address.phoneCountryCode", savedAddr.phoneCountryCode),
    phone: getValue("address.phone", savedAddr.phone),
    apartment: getValue("address.apartment", savedAddr.apartment),
    building: getValue("address.building", savedAddr.building),
    floor: getValue("address.floor", savedAddr.floor),
    street: getValue("address.street", savedAddr.street),
    state: getValue("address.state", savedAddr.state),
    postalCode: getValue("address.postalCode", savedAddr.postalCode),
    countryName: getValue("address.countryName", savedAddr.countryName),
  };

  const savedBillingAddr = order.billingAddress || {};
  const billingAddr = {
    firstName: getValue("billingAddress.firstName", savedBillingAddr.firstName),
    lastName: getValue("billingAddress.lastName", savedBillingAddr.lastName),
    country: getValue("billingAddress.country", savedBillingAddr.country),
    address: getValue("billingAddress.address", savedBillingAddr.address),
    city: getValue("billingAddress.city", savedBillingAddr.city),
    phoneCountryCode: getValue("billingAddress.phoneCountryCode", savedBillingAddr.phoneCountryCode),
    phone: getValue("billingAddress.phone", savedBillingAddr.phone),
    apartment: getValue("billingAddress.apartment", savedBillingAddr.apartment),
    building: getValue("billingAddress.building", savedBillingAddr.building),
    floor: getValue("billingAddress.floor", savedBillingAddr.floor),
    street: getValue("billingAddress.street", savedBillingAddr.street),
    state: getValue("billingAddress.state", savedBillingAddr.state),
    postalCode: getValue("billingAddress.postalCode", savedBillingAddr.postalCode),
    countryName: getValue("billingAddress.countryName", savedBillingAddr.countryName),
  };

  const countryVal = addr.countryName;
  const countryLabel = countryVal && typeof countryVal === "object" && "name" in countryVal ? countryVal.name : ((countryVal as string) ?? "");

  const billingCountryVal = billingAddr.countryName;
  const billingCountryLabel = billingCountryVal && typeof billingCountryVal === "object" && "name" in billingCountryVal ? billingCountryVal.name : ((billingCountryVal as string) ?? "");

  return (
    <div className={styles.wrapper}>
      <h2 className={styles.heading}>Order #{order.orderId} details</h2>

      <p className={styles.subHeading}>
        Payment via {order.paymentMethodName || "---"} • Shipping via {order.shippingMethodName || "---"}
        {order.isFreeShipping && <span className={styles.freeShippingTag}>FREE SHIPPING</span>}
      </p>

      <div className={styles.columns}>
        {}
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>General</h3>

          <div className={styles.row}>
            <div className={styles.label}>Date created:</div>
            <div className={styles.value}>{liveCreatedAt ? new Date(liveCreatedAt).toLocaleDateString() : "—"}</div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>Status:</div>
            <div className={styles.value}>{liveStatus ?? "—"}</div>
          </div>

          <div className={styles.row}>
            <div className={styles.label}>Customer:</div>
            <div className={styles.value}>
              {customerId ? (
                <a href={getAdminURL(`/collections/customer/${customerId}`)} className={styles.customerLink}>
                  <span className={`${styles.badge} ${customerBadge === "Account" ? styles.badgeAccount : styles.badgeGuest}`}>{customerBadge}</span>
                  {customerName && ` ${customerName}`}
                </a>
              ) : (
                <>
                  <span className={`${styles.badge} ${customerBadge === "Account" ? styles.badgeAccount : styles.badgeGuest}`}>{customerBadge}</span>
                  {customerName && ` ${customerName}`}
                </>
              )}
            </div>
          </div>
        </div>

        {}
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Billing</h3>

          {}
          {billingAddr && (billingAddr.firstName || billingAddr.lastName || billingAddr.address || billingAddr.city) ? (
            <>
              <p className={styles.value}>
                {billingAddr.firstName} {billingAddr.lastName}
              </p>
              {billingAddr.address && <p className={styles.value}>{billingAddr.address}</p>}
              {(billingAddr.city || billingCountryLabel) && <p className={styles.value}>{[billingAddr.city, billingCountryLabel].filter(Boolean).join(", ")}</p>}

              {billingAddr.phone && (
                <>
                  <p className={styles.inlineLabel}>Phone:</p>
                  <p className={styles.value}>
                    {billingAddr.phoneCountryCode} {billingAddr.phone}
                  </p>
                </>
              )}

              {billingAddr.apartment && (
                <>
                  <p className={styles.inlineLabel}>Apartment:</p>
                  <p className={styles.value}>{billingAddr.apartment}</p>
                </>
              )}

              {billingAddr.building && (
                <>
                  <p className={styles.inlineLabel}>Building:</p>
                  <p className={styles.value}>{billingAddr.building}</p>
                </>
              )}

              {billingAddr.floor && (
                <>
                  <p className={styles.inlineLabel}>Floor:</p>
                  <p className={styles.value}>{billingAddr.floor}</p>
                </>
              )}

              {billingAddr.street && (
                <>
                  <p className={styles.inlineLabel}>Street:</p>
                  <p className={styles.value}>{billingAddr.street}</p>
                </>
              )}

              {billingAddr.state && (
                <>
                  <p className={styles.inlineLabel}>State / Province:</p>
                  <p className={styles.value}>{billingAddr.state}</p>
                </>
              )}

              {billingAddr.postalCode && (
                <>
                  <p className={styles.inlineLabel}>Postal code:</p>
                  <p className={styles.value}>{billingAddr.postalCode}</p>
                </>
              )}
            </>
          ) : (
            <p className={styles.valueMuted}>No billing address set.</p>
          )}
        </div>

        {}
        <div className={styles.column}>
          <h3 className={styles.columnTitle}>Shipping</h3>

          {}
          {addr ? (
            <>
              <p className={styles.value}>
                {addr.firstName} {addr.lastName}
              </p>
              {addr.address && <p className={styles.value}>{addr.address}</p>}
              {(addr.city || countryLabel) && <p className={styles.value}>{[addr.city, countryLabel].filter(Boolean).join(", ")}</p>}

              {addr.phone && (
                <>
                  <p className={styles.inlineLabel}>Phone:</p>
                  <p className={styles.value}>
                    {addr.phoneCountryCode} {addr.phone}
                  </p>
                </>
              )}

              {addr.apartment && (
                <>
                  <p className={styles.inlineLabel}>Apartment:</p>
                  <p className={styles.value}>{addr.apartment}</p>
                </>
              )}

              {addr.building && (
                <>
                  <p className={styles.inlineLabel}>Building:</p>
                  <p className={styles.value}>{addr.building}</p>
                </>
              )}

              {addr.floor && (
                <>
                  <p className={styles.inlineLabel}>Floor:</p>
                  <p className={styles.value}>{addr.floor}</p>
                </>
              )}

              {addr.street && (
                <>
                  <p className={styles.inlineLabel}>Street:</p>
                  <p className={styles.value}>{addr.street}</p>
                </>
              )}

              {addr.state && (
                <>
                  <p className={styles.inlineLabel}>State / Province:</p>
                  <p className={styles.value}>{addr.state}</p>
                </>
              )}

              {addr.postalCode && (
                <>
                  <p className={styles.inlineLabel}>Postal code:</p>
                  <p className={styles.value}>{addr.postalCode}</p>
                </>
              )}
            </>
          ) : (
            <p className={styles.valueMuted}>No shipping address set.</p>
          )}
        </div>
      </div>

      {}
      {order.orderNote && (
        <div className={styles.orderNoteSection}>
          <h3 className={styles.columnTitle}>Order Note</h3>
          <div className={styles.orderNote}>
            <p className={styles.value}>{order.orderNote}</p>
          </div>
        </div>
      )}
    </div>
  );
};
