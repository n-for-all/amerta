"use client";
import React from "react";
import type { Currency, Order } from "@/payload-types";
import { useDocumentInfo, useFormFields } from "@payloadcms/ui"; // Import useFormFields
import styles from "./index.module.scss";
import { formatPrice } from "@/amerta/theme/utilities/format-price";

export const OrderItems: React.FC<{ currency?: Currency }> = ({ currency }) => {
  // 1. Get the base saved data (good for ID, status, readonly fields)
  const { data: savedData } = useDocumentInfo();

  // 2. Get the live form fields (flat object structure)
  // We subscribe to 'items' specifically to trigger re-renders when rows are added/removed/changed
  const fields = useFormFields(([fields]) => fields);

  if (!savedData) return null;

  // 3. Helper to get a field's value, falling back to saved data if not dirty
  const getValue = (path: string) => {
    return fields[path]?.value !== undefined ? fields[path].value : (savedData as any)[path];
  };

  // 4. Reconstruct the 'items' array from the live fields
  // In Payload, array fields store the number of rows in the parent key (e.g., fields.items.value = 3)
  const itemsCount = typeof fields.items?.value === "number" ? fields.items.value : (savedData as Order).items?.length || 0;

  const liveItems = Array.from({ length: itemsCount }).map((_, idx) => {
    const prefix = `items.${idx}`;
    return {
      id: getValue(`${prefix}.id`),
      product: getValue(`${prefix}.product`),
      price: getValue(`${prefix}.price`),
      quantity: getValue(`${prefix}.quantity`),
      metaData: getValue(`${prefix}.metaData`),
      productName: getValue(`${prefix}.productName`),
      productSKU: getValue(`${prefix}.productSKU`),
      variantText: getValue(`${prefix}.variantText`),
    };
  });

  const subtotal = liveItems.reduce((acc, item: any) => acc + (item.price || 0) * (item.quantity || 0), 0);
  const shippingTotal = getValue("shippingTotal") || 0;
  const discountTotal = getValue("discountTotal") || 0;
  const couponCode = getValue("couponCode") || "";
  const isFreeShipping = getValue("isFreeShipping") || false;
  const total = getValue("total") || subtotal - discountTotal + shippingTotal;
  const taxTotal = getValue("tax") || 0;

  return (
    <div className={styles.wrapper}>
      <div className={styles.header}>
        <div className={styles.headerItem}>Item</div>
        <div className={styles.headerPrice}>Price</div>
        <div className={styles.headerQty}>Qty</div>
        <div className={styles.headerTotal}>Total</div>
      </div>

      {liveItems.map((item: any, idx) => {
        const product = item.product && typeof item.product === "object" ? item.product : null;
        const lineTotal = (item.price || 0) * (item.quantity || 0);

        // Ensure metaData is handled safely
        const metaData = item.metaData && typeof item.metaData === "object" ? item.metaData : {};

        return (
          <div key={idx} className={styles.line}>
            <div className={styles.lineMain}>
              <div className={styles.productInfo}>
                <div>
                  <div className={styles.productTitle}>{item.productName || metaData?.title || product?.title || "Product"}</div>
                  {item.variantText && <div className={styles.productSubTitle}>{item.variantText}</div>}
                  {metaData?.subtitle && <div className={styles.productSubTitle}>{metaData?.subtitle}</div>}
                  <div className={styles.metaRow}>
                    <span className={styles.metaLabel}>SKU: </span>
                    <span>{item.productSKU || metaData?.sku || product?.sku || "—"}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className={styles.linePrice}>{formatPrice(item.price || 0, currency!, 1)}</div>
            <div className={styles.lineQty}>× {item.quantity || 0}</div>
            <div className={styles.lineTotal}>{formatPrice(lineTotal, currency!, 1)}</div>
          </div>
        );
      })}

      {/* Shipping line */}
      <div className={styles.shippingRow}>
        <div className={styles.shippingIcon}>🚚</div>
        <div className={styles.shippingInfo}>
          <div className={styles.shippingTitle}>
            {getValue("shippingMethodName") ?? "Shipping"}
            {isFreeShipping && <span className={styles.freeTag}>FREE</span>}
          </div>
        </div>
        <div className={styles.shippingAmount}>{isFreeShipping ? <span className={styles.strikethrough}>{formatPrice(Number(shippingTotal), currency!, 1)}</span> : <span>{formatPrice(Number(shippingTotal), currency!, 1)}</span>}</div>
      </div>

      {/* Totals */}
      <div className={styles.totals}>
        <div className={styles.totalsRow}>
          <span>Items Subtotal:</span>
          <span>{formatPrice(subtotal, currency!, 1)}</span>
        </div>
        {discountTotal > 0 && (
          <div className={styles.totalsRow}>
            <span>
              Discount
              {couponCode && <span className={styles.couponCode}> ({couponCode})</span>}:
            </span>
            <span className={styles.discount}>-{formatPrice(discountTotal, currency!, 1)}</span>
          </div>
        )}
        <div className={styles.totalsRow}>
          <span>Shipping:</span>
          <span>
            {isFreeShipping ? (
              <>
                <span className={styles.strikethrough}>{formatPrice(Number(shippingTotal), currency!, 1)}</span>
                <span className={styles.freeText}> FREE</span>
              </>
            ) : (
              <span>{formatPrice(Number(shippingTotal), currency!, 1)}</span>
            )}
          </span>
        </div>
        <div className={styles.totalsRow}>
          <span>Taxes:</span>
          <span>
            <span>{formatPrice(Number(taxTotal), currency!, 1)}</span>
          </span>
        </div>
        <div className={styles.totalsRow}>
          <span>Order Total:</span>
          <span className={styles.bold}>{formatPrice(total, currency!, 1)}</span>
        </div>
      </div>
    </div>
  );
};
