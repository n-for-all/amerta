"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Currency } from "@/payload-types";
import { Button } from "@/amerta/theme/ui/button";
import Cart from "@/amerta/theme/components/Cart";
import Wishlist from "@/amerta/theme/components/Wishlist";
import { CurrencyPopover } from "@/amerta/theme/components/CurrencyPopover";
import { LanguageSwitcher } from "@/amerta/theme/components/LanguageSwitcher";
import { SearchModal } from "@/amerta/theme/components/SearchModal";
import { useTheme } from "@/amerta/providers/Theme";
import { addToCart } from "@/amerta/core/utilities/cart.client";
import { CATALOG_SOURCES, SOURCE_COOKIE, SOURCE_MAX_AGE } from "../../settings";
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
  search: string;
  account: string;
  toggleTheme: string;
}

interface CatalogClientProps {
  locale: string;
  heading: string;
  intro: string;
  coverImage: string;
  logoUrl: string | null;
  websiteUrl: string;
  accountUrl: string;
  checkoutUrl: string;
  orderMode: "buy_now" | "add_to_cart";
  buyOnWebsite: boolean;
  enableThemeSwitch: boolean;
  currencies: Currency[];
  currentCurrency: Currency;
  locales: { label: string; code: string }[];
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
    className={large ? "flex items-center justify-center gap-2 h-10 px-5 text-sm font-medium text-white rounded-full bg-[#25D366] hover:bg-[#1ebe5b]" : "flex items-center justify-center w-9 h-9 text-white rounded-full shrink-0 bg-[#25D366] hover:bg-[#1ebe5b]"}
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

const ProductPopup = ({ itemId, locale, labels, buyOnWebsite, orderMode, ordering, onClose }: { itemId: string; locale: string; labels: CatalogLabels; buyOnWebsite: boolean; orderMode: "buy_now" | "add_to_cart"; ordering: ReturnType<typeof useOrder>; onClose: () => void }) => {
  const [item, setItem] = useState<CatalogItemDetails | null>(null);
  const [failed, setFailed] = useState(false);
  const [variant, setVariant] = useState<CatalogVariant | null>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let cancelled = false;
    setItem(null);
    setFailed(false);
    setVariant(null);
    fetch(`/api/catalog/item/${encodeURIComponent(itemId)}?locale=${encodeURIComponent(locale)}`, { credentials: "include" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: CatalogItemDetails) => {
        if (cancelled) return;
        setItem(data);
        setVariant(data.variants.find((v) => v.inStock) || null);
      })
      .catch(() => !cancelled && setFailed(true));
    return () => {
      cancelled = true;
    };
  }, [itemId, locale]);

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      previous?.focus?.();
    };
  }, [onClose]);

  const images = item ? [...(variant?.image ? [variant.image] : []), ...item.images.filter((url) => url !== variant?.image)] : [];
  const inStock = item ? (item.kind === "variant" ? !!variant?.inStock : item.inStock) : false;
  const whatsappUrl = item ? (item.kind === "variant" && variant ? variant.whatsappUrl : item.whatsappUrl) : "";
  const busy = !!item && ordering.busyId === item.id;
  const added = !!item && ordering.addedId === item.id;

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center sm:items-center sm:p-6" role="dialog" aria-modal="true" aria-label={item?.title || labels.loading}>
      <button type="button" aria-label={labels.close} className="absolute inset-0 w-full h-full cursor-default bg-black/60" onClick={onClose} tabIndex={-1} />
      <div className="relative flex flex-col w-full max-h-[92dvh] overflow-hidden bg-white shadow-xl rounded-t-2xl sm:max-w-lg sm:rounded-2xl dark:bg-zinc-900">
        <button ref={closeRef} type="button" onClick={onClose} aria-label={labels.close} className="absolute z-10 flex items-center justify-center w-9 h-9 text-xl rounded-full top-3 right-3 rtl:right-auto rtl:left-3 bg-white/90 text-zinc-900 shadow">
          ×
        </button>

        {!item ? (
          <p className="p-10 text-center text-zinc-500">{failed ? labels.failed : labels.loading}</p>
        ) : (
          <>
            <div className="overflow-y-auto">
              {images.length > 0 && (
                <div className="flex overflow-x-auto snap-x snap-mandatory bg-zinc-100 dark:bg-zinc-800">
                  {images.map((url) => (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img key={url} src={url} alt={item.title} className="object-contain w-full shrink-0 snap-center aspect-square" loading="lazy" />
                  ))}
                </div>
              )}
              <div className="p-5">
                <h2 className="text-xl font-semibold">{item.title}</h2>
                <p className="mt-1 text-lg">
                  {item.kind === "variant" && variant ? (
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

                {item.variants.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4" role="group" aria-label={labels.choose}>
                    {item.variants.map((v) => (
                      <button
                        key={v.label}
                        type="button"
                        disabled={!v.inStock}
                        aria-pressed={variant?.label === v.label}
                        onClick={() => setVariant(v)}
                        className={"px-4 py-2 text-sm border rounded-full disabled:opacity-40 disabled:line-through " + (variant?.label === v.label ? "border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900" : "border-zinc-300 dark:border-zinc-600")}
                      >
                        {v.label}
                      </button>
                    ))}
                  </div>
                )}

                {item.excerpt && <p className="mt-4 text-zinc-600 dark:text-zinc-300">{item.excerpt}</p>}
                {item.descriptionHtml && <div className="mt-4 text-sm leading-relaxed text-zinc-600 dark:text-zinc-300 [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_h2]:font-semibold [&_h3]:font-semibold [&_a]:underline" dangerouslySetInnerHTML={{ __html: item.descriptionHtml }} />}
              </div>
            </div>

            <div className="p-4 border-t border-zinc-200 dark:border-zinc-700">
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
                      <Button asChild size="lg" className="flex-1">
                        <a href={item.productUrl}>{labels.chooseOptions}</a>
                      </Button>
                    ) : (
                      <Button type="button" size="lg" className="flex-1" disabled={busy} onClick={() => ordering.order(item, variant?.variantOptions || [])}>
                        {added ? labels.added : orderMode === "add_to_cart" ? labels.addToCart : labels.buyNow}
                      </Button>
                    ))}
                  {whatsappUrl && <WhatsappButton url={whatsappUrl} label={labels.whatsapp} item={item} large />}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export const CatalogClient = (props: CatalogClientProps) => {
  const { locale, heading, intro, coverImage, logoUrl, websiteUrl, accountUrl, orderMode, buyOnWebsite, enableThemeSwitch, currencies, currentCurrency, locales, initialItems, initialHasMore, labels } = props;
  const [items, setItems] = useState<CatalogItem[]>(initialItems);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const [openId, setOpenId] = useState<string | null>(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const pageRef = useRef(1);
  const loadingRef = useRef(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();
  const ordering = useOrder(props);

  // The catalog is a screen of its own: the shop's header and footer are put away while it is open.
  // Visits are also tagged, so an order placed afterwards records that it came from the catalog.
  useEffect(() => {
    document.cookie = `${SOURCE_COOKIE}=${CATALOG_SOURCES.page}; path=/; max-age=${SOURCE_MAX_AGE}; samesite=lax`;

    const hidden: HTMLElement[] = [];
    let node: HTMLElement | null = rootRef.current;
    while (node && node.parentElement && node.parentElement !== document.body) {
      for (const sibling of Array.from(node.parentElement.children) as HTMLElement[]) {
        if (sibling !== node && !sibling.hidden && !["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)) {
          sibling.hidden = true;
          hidden.push(sibling);
        }
      }
      node = node.parentElement;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      hidden.forEach((element) => (element.hidden = false));
      document.body.style.overflow = previousOverflow;
    };
  }, []);

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

  const iconButton = "flex items-center justify-center p-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div ref={rootRef} className="fixed inset-0 z-40 overflow-y-auto bg-white text-zinc-900 dark:bg-black dark:text-white">
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 dark:bg-black dark:border-zinc-800">
        <div className="flex flex-wrap items-center justify-end max-w-2xl px-4 py-2 mx-auto gap-x-3 gap-y-1">
          <div className="flex items-center gap-1">
            <CurrencyPopover currentCurrency={currentCurrency} currencies={currencies} />
            <LanguageSwitcher locale={locale} locales={locales} />
            {enableThemeSwitch && (
              <button type="button" className={iconButton} aria-label={labels.toggleTheme} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                  <path d="M12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10zm0-5a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zM4 11a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2h1zm17 0a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2h1zM6.3 4.9l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4zm12.8 0a1 1 0 0 1 0 1.4l-.7.7A1 1 0 0 1 17 5.6l.7-.7a1 1 0 0 1 1.4 0zM7 17a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7A1 1 0 0 1 7 17zm11.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4z" />
                </svg>
              </button>
            )}
            <button type="button" className={iconButton} aria-label={labels.search} onClick={() => setSearchOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden="true">
                <path d="M17 17L21 21" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <Link href={accountUrl} className={iconButton} aria-label={labels.account}>
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden="true">
                <path d="M15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 10.6569 15 9Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 17C17 14.2386 14.7614 12 12 12C9.23858 12 7 14.2386 7 17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Wishlist className="hover:bg-zinc-100 dark:hover:bg-zinc-800" />
            <Cart />
          </div>
        </div>
      </header>

      <main className="max-w-2xl pb-16 mx-auto sm:px-6 sm:pt-6">
        <div className="relative flex flex-col items-center justify-center px-6 py-12 overflow-hidden text-center text-white bg-zinc-900 sm:rounded-2xl">
          {coverImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={coverImage} alt="" className="absolute inset-0 object-cover w-full h-full opacity-40" />
          )}
          <div className="relative">
            {/* The logo already says the shop's name, so the name is only written out when there is no logo */}
            {logoUrl ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={logoUrl} alt="" className="w-auto h-12 mx-auto" />
                <h1 className="sr-only">{heading}</h1>
              </>
            ) : (
              <h1 className="text-2xl font-bold">{heading}</h1>
            )}
            {intro && <p className="max-w-md mx-auto mt-3 text-sm text-white/85">{intro}</p>}
            <a href={websiteUrl} className="inline-block mt-4 text-sm font-medium underline underline-offset-4 text-white/90 hover:text-white">
              {labels.visitWebsite}
            </a>
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
                  {newSection && <h2 className="pt-8 pb-1 text-lg font-semibold uppercase">{item.section}</h2>}
                  <div className="flex items-center gap-4 py-4 border-b border-zinc-200 dark:border-zinc-800">
                    <button type="button" onClick={() => setOpenId(item.id)} className="flex items-center flex-1 min-w-0 gap-4 text-left cursor-pointer rtl:text-right">
                      <span className="block w-20 h-20 overflow-hidden rounded-lg shrink-0 bg-zinc-100 dark:bg-zinc-800 sm:w-24 sm:h-24">
                        {item.image && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={item.image} alt="" className="object-cover w-full h-full" loading="lazy" />
                        )}
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className="block font-semibold leading-snug">{item.title}</span>
                        {item.excerpt && <span className="mt-1 text-sm text-zinc-500 line-clamp-2 dark:text-zinc-400">{item.excerpt}</span>}
                        <span className="block mt-1 text-sm text-zinc-600 dark:text-zinc-300">
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
                        <div className="flex items-center gap-2">
                          {buyOnWebsite &&
                            (item.kind !== "simple" ? (
                              <Button type="button" size="sm" variant="outline" onClick={() => setOpenId(item.id)}>
                                {labels.choose}
                              </Button>
                            ) : orderMode === "add_to_cart" ? (
                              <button type="button" disabled={busy} onClick={() => ordering.order(item)} aria-label={`${labels.addToCart}: ${item.title}`} title={labels.addToCart} className="flex items-center justify-center text-xl rounded-lg cursor-pointer w-9 h-9 bg-zinc-100 hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:hover:bg-zinc-700">
                                {added ? "✓" : "+"}
                              </button>
                            ) : (
                              <Button type="button" size="sm" disabled={busy} onClick={() => ordering.order(item)}>
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
          {loading && <p className="py-6 text-center text-zinc-500">{labels.loading}</p>}
          {!hasMore && items.length > 0 && (
            <p className="py-10 text-center text-zinc-600 dark:text-zinc-300">
              {labels.endQuestion}{" "}
              <a href={websiteUrl} className="font-semibold underline underline-offset-4">
                {labels.endLink}
              </a>
            </p>
          )}
        </div>
      </main>

      {openId && <ProductPopup itemId={openId} locale={locale} labels={labels} buyOnWebsite={buyOnWebsite} orderMode={orderMode} ordering={ordering} onClose={() => setOpenId(null)} />}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} locale={locale} />
    </div>
  );
};
