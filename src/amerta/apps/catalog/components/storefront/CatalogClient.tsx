"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/amerta/theme/ui/button";
import { addToCart } from "@/amerta/core/utilities/cart.client";
import { CATALOG_SOURCES } from "../../settings";
import { CatalogFrame, CatalogFrameProps } from "./CatalogFrame";
import type { CatalogItem, CatalogItemDetails, CatalogVariant } from "../../services/catalogItems";

export interface CatalogLabels {
  catalog: string;
  visitWebsite: string;
  buyNow: string;
  addToCart: string;
  added: string;
  chooseOptions: string;
  choose: string;
  whatsapp: string;
  outOfStock: string;
  failed: string;
  from: string;
  loading: string;
  noProducts: string;
  endQuestion: string;
  endLink: string;
  close: string;
}

interface CatalogClientProps {
  locale: string;
  heading: string;
  intro: string;
  coverImage: string;
  logoUrl: string | null;
  websiteUrl: string;
  checkoutUrl: string;
  orderMode: "buy_now" | "add_to_cart";
  buyOnWebsite: boolean;
  frame: CatalogFrameProps;
  initialItems: CatalogItem[];
  initialHasMore: boolean;
  labels: CatalogLabels;
}

const track = (event: string, data: Record<string, unknown>) => {
  const w = window as any;
  w.dataLayer = w.dataLayer || [];
  w.dataLayer.push({ event, order_source: CATALOG_SOURCES.page, ...data });
};

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor" aria-hidden="true">
    <path d="M12.04 2a9.9 9.9 0 0 0-8.43 15.1L2 22l5.05-1.57A9.9 9.9 0 1 0 12.04 2Zm0 1.8a8.1 8.1 0 0 1 6.9 12.37 8.1 8.1 0 0 1-10.96 2.7l-.33-.2-2.98.93.95-2.9-.22-.34A8.1 8.1 0 0 1 12.04 3.8Zm-3.5 4.03c-.2 0-.5.07-.77.36-.26.3-1 1-1 2.4 0 1.42 1.03 2.8 1.18 2.99.14.2 2 3.17 4.93 4.32 2.43.96 2.93.77 3.46.72.53-.05 1.7-.7 1.94-1.37.24-.67.24-1.25.17-1.37-.07-.12-.26-.2-.55-.34-.29-.14-1.7-.84-1.97-.94-.26-.1-.45-.14-.65.15-.19.29-.74.93-.9 1.12-.17.2-.34.22-.63.08-.29-.15-1.22-.45-2.32-1.44a8.7 8.7 0 0 1-1.6-2c-.17-.29-.02-.44.12-.59.13-.13.29-.33.43-.5.15-.17.2-.29.3-.48.1-.2.05-.36-.03-.5-.07-.15-.63-1.56-.88-2.13-.23-.55-.47-.48-.65-.49l-.56-.01Z" />
  </svg>
);

const WhatsappButton = ({ url, label, item, large }: { url: string; label: string; item: { id: string; title: string }; large?: boolean }) => (
  <a
    href={url}
    target="_blank"
    rel="noopener noreferrer"
    aria-label={`${label}: ${item.title}`}
    title={label}
    onClick={(e) => {
      e.stopPropagation();
      track("catalog_whatsapp_click", { item_id: item.id, item_name: item.title });
    }}
    className={large ? "flex items-center justify-center gap-2 h-9 px-4 text-sm font-medium text-white rounded-full bg-[#25D366] hover:bg-[#1ebe5b]" : "flex items-center justify-center w-7 h-7 text-white rounded-full shrink-0 bg-[#25D366] hover:bg-[#1ebe5b] [&_svg]:w-3.5 [&_svg]:h-3.5"}
  >
    <WhatsappIcon />
    {large && <span>{label}</span>}
  </a>
);

/** Orders one product on the website: straight to checkout, or into the cart. */
const useOrder = ({ locale, orderMode, checkoutUrl, labels }: Pick<CatalogClientProps, "locale" | "orderMode" | "checkoutUrl" | "labels">) => {
  const [busyId, setBusyId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [error, setError] = useState<{ id: string; message: string } | null>(null);

  const order = useCallback(
    async (item: { id: string; title: string }, variantOptions: { option: string; value: string }[] = []) => {
      setBusyId(item.id);
      setError(null);
      try {
        if (orderMode === "add_to_cart") {
          const result = await addToCart({ id: item.id, title: item.title, price: 0 }, 1, variantOptions, locale);
          if (result.error) throw new Error(result.error.message);
          window.dispatchEvent(new CustomEvent("cartUpdated", { detail: result.cart }));
          track("catalog_add_to_cart", { item_id: item.id, item_name: item.title });
          setAddedId(item.id);
          window.setTimeout(() => setAddedId((current) => (current === item.id ? null : current)), 2000);
          setBusyId(null);
          return true;
        }

        const res = await fetch("/api/catalog/buy-now", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ product: item.id, quantity: 1, variantOptions, locale }),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data?.error || labels.failed);
        track("catalog_buy_now", { item_id: item.id, item_name: item.title });
        window.location.href = checkoutUrl;
        return true;
      } catch (err: any) {
        setError({ id: item.id, message: err?.message || labels.failed });
        setBusyId(null);
        return false;
      }
    },
    [locale, orderMode, checkoutUrl, labels.failed],
  );

  return { order, busyId, addedId, error };
};

/**
 * The product, over the catalog. It opens at once with what the row already shows (picture, name,
 * price) and fills in the rest when it arrives, so nothing jumps. It slides up on phones and
 * fades in on larger screens, and leaves the same way.
 */
const ProductPopup = ({ preview, locale, labels, buyOnWebsite, orderMode, ordering, onClose }: { preview: CatalogItem; locale: string; labels: CatalogLabels; buyOnWebsite: boolean; orderMode: "buy_now" | "add_to_cart"; ordering: ReturnType<typeof useOrder>; onClose: () => void }) => {
  const [details, setDetails] = useState<CatalogItemDetails | null>(null);
  const [failed, setFailed] = useState(false);
  const [variant, setVariant] = useState<CatalogVariant | null>(null);
  const [shown, setShown] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  const item = details || preview;

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/catalog/item/${encodeURIComponent(preview.id)}?locale=${encodeURIComponent(locale)}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: CatalogItemDetails) => {
        if (cancelled) return;
        setDetails(data);
        setVariant(data.variants.find((v) => v.inStock) || null);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [preview.id, locale]);

  const close = useCallback(() => {
    setShown(false);
    window.setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    // Two frames, so the starting position is painted before the transition begins
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setShown(true)));
    closeRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKey);
      previous?.focus?.({ preventScroll: true });
    };
  }, [close]);

  const gallery = details ? details.images : preview.image ? [preview.image] : [];
  const images = [...(variant?.image ? [variant.image] : []), ...gallery.filter((url) => url !== variant?.image)];
  const needsVariant = item.kind === "variant";
  const inStock = needsVariant ? (details ? !!variant?.inStock : item.inStock) : item.inStock;
  const whatsappUrl = needsVariant && variant ? variant.whatsappUrl : item.whatsappUrl;
  const busy = ordering.busyId === item.id;
  const added = ordering.addedId === item.id;
  // A variant product can only be ordered once its variants have loaded
  const waiting = needsVariant && !details;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={item.title}>
      <button type="button" aria-label={labels.close} tabIndex={-1} onClick={close} className={"absolute inset-0 w-full h-full cursor-default bg-black/60 transition-opacity duration-200 ease-out motion-reduce:transition-none " + (shown ? "opacity-100" : "opacity-0")} />
      <div
        className={
          "relative flex flex-col w-full max-h-[92dvh] overflow-hidden bg-white shadow-xl rounded-t-2xl sm:max-w-lg sm:rounded-2xl dark:bg-zinc-900 transition-all duration-300 ease-out motion-reduce:transition-none " +
          (shown ? "translate-y-0 opacity-100 sm:scale-100" : "translate-y-full opacity-100 sm:translate-y-0 sm:opacity-0 sm:scale-95")
        }
      >
        <button ref={closeRef} type="button" onClick={close} aria-label={labels.close} className="absolute z-10 flex items-center justify-center text-xl rounded-full shadow w-9 h-9 top-3 right-3 rtl:right-auto rtl:left-3 bg-white/90 text-zinc-900">
          ×
        </button>

        <div className="overflow-y-auto">
          {/* The picture area keeps its square shape from the first frame, so the text below never jumps */}
          <div className="flex overflow-x-auto aspect-square snap-x snap-mandatory bg-zinc-100 dark:bg-zinc-800">
            {images.map((url, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={url} src={url} alt={item.title} className="object-contain w-full h-full shrink-0 snap-center" loading={index === 0 ? "eager" : "lazy"} />
            ))}
          </div>
          <div className="p-4">
            <h2 className="text-lg font-semibold leading-snug">{item.title}</h2>
            <p className="mt-1">
              {needsVariant && variant ? (
                <>
                  {variant.priceLabel}
                  {variant.compareLabel && <span className="ml-2 text-sm text-red-500 line-through">{variant.compareLabel}</span>}
                </>
              ) : (
                <>
                  {item.fromPrice && <span className="text-sm text-zinc-500">{labels.from} </span>}
                  {item.priceLabel}
                  {item.compareLabel && <span className="ml-2 text-sm text-red-500 line-through">{item.compareLabel}</span>}
                </>
              )}
            </p>

            {details && details.variants.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label={labels.choose}>
                {details.variants.map((v) => (
                  <button
                    key={v.label}
                    type="button"
                    disabled={!v.inStock}
                    aria-pressed={variant?.label === v.label}
                    onClick={() => setVariant(v)}
                    className={"px-3 py-1.5 text-xs border rounded-full disabled:opacity-40 disabled:line-through " + (variant?.label === v.label ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" : "border-zinc-300 dark:border-zinc-600")}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}

            {item.excerpt && <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-300">{item.excerpt}</p>}
            {details?.descriptionHtml && <div className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:font-semibold [&_h3]:font-semibold [&_a]:underline" dangerouslySetInnerHTML={{ __html: details.descriptionHtml }} />}
            {failed && (
              <p role="alert" className="mt-4 text-sm text-red-600 dark:text-red-400">
                {labels.failed}
              </p>
            )}
          </div>
        </div>

        <div className="p-3 border-t border-zinc-200 dark:border-zinc-700">
          {ordering.error?.id === item.id && (
            <p role="alert" className="mb-2 text-sm text-red-600 dark:text-red-400">
              {ordering.error.message}
            </p>
          )}
          {!inStock ? (
            <p className="text-center text-zinc-500">{labels.outOfStock}</p>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              {buyOnWebsite &&
                (item.kind === "choices" ? (
                  <Button asChild className="flex-1">
                    <a href={item.productUrl}>{labels.chooseOptions}</a>
                  </Button>
                ) : (
                  <Button type="button" className="flex-1" disabled={busy || waiting} onClick={() => ordering.order(item, variant?.variantOptions || [])}>
                    {added ? labels.added : orderMode === "add_to_cart" ? labels.addToCart : labels.buyNow}
                  </Button>
                ))}
              {whatsappUrl && <WhatsappButton url={whatsappUrl} label={labels.whatsapp} item={item} large />}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export const CatalogClient = (props: CatalogClientProps) => {
  const { locale, heading, intro, coverImage, logoUrl, websiteUrl, orderMode, buyOnWebsite, frame, initialItems, initialHasMore, labels } = props;
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const ordering = useOrder(props);
  const openItem = openId ? items.find((item) => item.id === openId) || null : null;
  const closePopup = useCallback(() => setOpenId(null), []);

  const loadMore = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/api/catalog/items?page=${pageRef.current + 1}&locale=${encodeURIComponent(locale)}`, { credentials: "include" });
      if (!res.ok) throw new Error();
      const data: { items: CatalogItem[]; hasMore: boolean } = await res.json();
      pageRef.current += 1;
      setItems((current) => [...current, ...data.items.filter((item) => !current.some((existing) => existing.id === item.id))]);
      setHasMore(data.hasMore);
    } catch {
      setHasMore(false);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasMore) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMore(), { root: rootRef.current, rootMargin: "400px" });
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loadMore, items.length]);

  return (
    <CatalogFrame {...frame} tagSource rootRef={rootRef}>
      <main className="max-w-2xl pb-16 mx-auto sm:px-6 sm:pt-6">
        {/* Cover: the shop's picture under a dark overlay, with its name (a link to the website) and a few words */}
        <div className={"relative flex flex-col items-center justify-center px-6 overflow-hidden text-center text-white bg-zinc-900 sm:rounded-2xl " + (coverImage ? "min-h-56 py-10" : "py-8")}>
          {coverImage && (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={coverImage} alt="" className="absolute inset-0 object-cover w-full h-full" />
              <div className="absolute inset-0 bg-black/60" />
            </>
          )}
          <div className="relative">
            {/* The logo already says the shop's name, so the name is only written out when there is no logo */}
            {logoUrl && (
              <a href={websiteUrl} aria-label={labels.visitWebsite} className="block">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="" className="w-auto mx-auto h-9" />
              </a>
            )}
            <h1 className={logoUrl ? "mt-3 text-xs font-medium" : "text-xl font-bold"}>
              <a href={websiteUrl} className="inline-flex items-center gap-1 hover:underline underline-offset-4">
                <span>{logoUrl ? labels.visitWebsite : heading}</span>
                <svg viewBox="0 0 24 24" className="w-[0.9em] h-[0.9em] rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M9 6l6 6-6 6" />
                </svg>
              </a>
            </h1>
            {intro && <p className="max-w-md mx-auto mt-1.5 text-sm text-white/90 line-clamp-3">{intro}</p>}
          </div>
        </div>

        <div className="px-4 sm:px-0">
          {items.length === 0 && <p className="py-10 text-center text-zinc-500">{labels.noProducts}</p>}
          <ul>
            {items.map((item, index) => {
              const newSection = item.section && item.section !== items[index - 1]?.section;
              const busy = ordering.busyId === item.id;
              const added = ordering.addedId === item.id;
              return (
                <li key={item.id}>
                  {newSection && <h2 className="pt-6 pb-1 text-sm font-semibold tracking-wide uppercase">{item.section}</h2>}
                  <div className="flex items-center gap-3 py-3 border-b border-zinc-200 dark:border-zinc-800">
                    <button type="button" onClick={() => setOpenId(item.id)} className="flex items-center flex-1 min-w-0 gap-3 text-left cursor-pointer rtl:text-right">
                      <span className="block w-16 h-16 overflow-hidden rounded-lg shrink-0 bg-zinc-100 dark:bg-zinc-800 sm:w-20 sm:h-20">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt="" className="object-cover w-full h-full" loading="lazy" />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block text-sm font-semibold leading-snug">{item.title}</span>
                        {item.excerpt && <span className="mt-0.5 text-[13px] leading-snug text-zinc-500 line-clamp-1 sm:line-clamp-2 dark:text-zinc-400">{item.excerpt}</span>}
                        <span className="block mt-0.5 text-[13px] text-zinc-600 dark:text-zinc-300">
                          {item.fromPrice && <span>{labels.from} </span>}
                          {item.priceLabel}
                          {item.compareLabel && <span className="ml-2 text-red-500 line-through">{item.compareLabel}</span>}
                        </span>
                      </span>
                    </button>

                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {!item.inStock ? (
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">{labels.outOfStock}</p>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {buyOnWebsite &&
                            (item.kind !== "simple" ? (
                              <Button type="button" size="xs" variant="outline" className="px-3 text-xs" onClick={() => setOpenId(item.id)}>
                                {labels.choose}
                              </Button>
                            ) : orderMode === "add_to_cart" ? (
                              <button type="button" disabled={busy} onClick={() => ordering.order(item)} aria-label={`${labels.addToCart}: ${item.title}`} title={labels.addToCart} className="flex items-center justify-center text-lg rounded-lg cursor-pointer w-8 h-8 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                                {added ? "✓" : "+"}
                              </button>
                            ) : (
                              <Button type="button" size="xs" className="px-3 text-xs" disabled={busy} onClick={() => ordering.order(item)}>
                                {labels.buyNow}
                              </Button>
                            ))}
                          {item.whatsappUrl && <WhatsappButton url={item.whatsappUrl} label={labels.whatsapp} item={item} />}
                        </div>
                      )}
                      {ordering.error?.id === item.id && openId !== item.id && (
                        <p role="alert" className="text-xs text-right text-red-600 max-w-40 dark:text-red-400">
                          {ordering.error.message}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>

          <div ref={sentinelRef} aria-hidden="true" />
          {loading && <p className="py-6 text-sm text-center text-zinc-500">{labels.loading}</p>}
          {!hasMore && items.length > 0 && (
            <p className="py-8 text-sm text-center text-zinc-600 dark:text-zinc-300">
              {labels.endQuestion}{" "}
              <a href={websiteUrl} className="font-semibold underline underline-offset-4">
                {labels.endLink}
              </a>
            </p>
          )}
        </div>
      </main>

      {openItem && <ProductPopup key={openItem.id} preview={openItem} locale={locale} labels={labels} buyOnWebsite={buyOnWebsite} orderMode={orderMode} ordering={ordering} onClose={closePopup} />}
    </CatalogFrame>
  );
};
