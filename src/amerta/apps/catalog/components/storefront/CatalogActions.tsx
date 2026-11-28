"use client";

import { useEffect, useState } from "react";
import { Button } from "@/amerta/theme/ui/button";
import { CATALOG_SOURCES, SOURCE_COOKIE, SOURCE_MAX_AGE } from "../../settings";

export interface CatalogActionLabels {
  buyNow: string;
  chooseOptions: string;
  whatsapp: string;
  outOfStock: string;
  failed: string;
}

interface CatalogActionsProps {
  productId: string;
  title: string;
  productUrl: string;
  checkoutUrl: string;
  locale: string;
  inStock: boolean;
  /** Bundles and products with variants are chosen on the product page */
  needsOptions: boolean;
  buyOnWebsite: boolean;
  /** Ready-made wa.me link, or "" when WhatsApp ordering is off */
  whatsappUrl: string;
  labels: CatalogActionLabels;
}

const track = (event: string, data: Record<string, unknown>) => {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, order_source: CATALOG_SOURCES.page, ...data });
};

/** Remembers that this visitor is shopping from the catalog, so their order records it. */
export const CatalogSourceTag = () => {
  useEffect(() => {
    document.cookie = `${SOURCE_COOKIE}=${CATALOG_SOURCES.page}; path=/; max-age=${SOURCE_MAX_AGE}; samesite=lax`;
  }, []);
  return null;
};

export const CatalogActions = ({ productId, title, productUrl, checkoutUrl, locale, inStock, needsOptions, buyOnWebsite, whatsappUrl, labels }: CatalogActionsProps) => {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const buyNow = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/catalog/buy-now", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ product: productId, quantity: 1, locale }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        if (data?.needsOptions) {
          window.location.href = productUrl;
          return;
        }
        throw new Error(data?.error || labels.failed);
      }
      track("catalog_buy_now", { item_id: productId, item_name: title });
      window.location.href = checkoutUrl;
    } catch (err: any) {
      setError(err?.message || labels.failed);
      setBusy(false);
    }
  };

  if (!inStock) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">{labels.outOfStock}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {buyOnWebsite &&
        (needsOptions ? (
          <Button asChild className="w-full">
            <a href={productUrl}>{labels.chooseOptions}</a>
          </Button>
        ) : (
          <Button type="button" className="w-full" onClick={buyNow} disabled={busy}>
            {labels.buyNow}
          </Button>
        ))}
      {whatsappUrl && (
        <Button asChild variant="outline" className="w-full">
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" onClick={() => track("catalog_whatsapp_click", { item_id: productId, item_name: title })}>
            {labels.whatsapp}
          </a>
        </Button>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};
