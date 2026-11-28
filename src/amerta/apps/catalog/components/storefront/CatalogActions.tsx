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
    return <p className="text-xs text-zinc-500 shrink-0 dark:text-zinc-400">{labels.outOfStock}</p>;
  }

  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <div className="flex items-center gap-2">
        {buyOnWebsite &&
          (needsOptions ? (
            <Button asChild size="sm">
              <a href={productUrl}>{labels.chooseOptions}</a>
            </Button>
          ) : (
            <Button type="button" size="sm" onClick={buyNow} disabled={busy}>
              {labels.buyNow}
            </Button>
          ))}
        {whatsappUrl && (
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`${labels.whatsapp}: ${title}`}
            title={labels.whatsapp}
            onClick={() => track("catalog_whatsapp_click", { item_id: productId, item_name: title })}
            className="flex items-center justify-center w-8 h-8 text-white rounded-full bg-[#25D366] hover:bg-[#1ebe5b]"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
              <path d="M12.04 2a9.9 9.9 0 0 0-8.43 15.1L2 22l5.05-1.57A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 6.9 12.37 8.1 8.1 0 0 1-10.96 2.7l-.33-.2-2.98.93.95-2.9-.22-.34A8.1 8.1 0 0 1 12.04 3.8Zm-3.5 4.03c-.2 0-.5.07-.77.36-.26.3-1 1-1 2.4 0 1.42 1.03 2.8 1.18 2.99.14.2 2 3.17 4.93 4.32 2.43.96 2.93.77 3.46.72.53-.05 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.55-.34-.29-.14-1.7-.84-1.97-.94-.26-.1-.45-.14-.65.15-.19.29-.74.93-.9 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.44a8.7 8.7 0 0 1-1.6-2c-.17-.29-.02-.44.12-.59.13-.13.29-.33.43-.5.15-.17.2-.29.3-.48.1-.2.05-.36-.03-.5-.07-.15-.63-1.56-.88-2.13-.23-.55-.47-.48-.65-.49l-.56-.01Z" />
            </svg>
          </a>
        )}
      </div>
      {error && (
        <p role="alert" className="text-xs text-right text-red-600 max-w-40 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  );
};
