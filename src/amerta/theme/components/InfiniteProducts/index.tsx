"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";
import { loadProductsPage, type ProductListScope } from "./actions";

/**
 * Product grid with infinite loading. The first page and the numbered pagination are rendered on the server, so
 * crawlers (and visitors without JavaScript) get normal ?page=N links. In the browser the next pages load as the
 * visitor scrolls, and the numbered pagination is hidden while that works.
 */
export function InfiniteProducts({
  scope,
  initialPage,
  totalPages,
  searchParams,
  locale,
  perPage = 12,
  className,
  baseUrl,
  pagination,
  children,
}: {
  scope: ProductListScope;
  initialPage: number;
  totalPages: number;
  searchParams: Record<string, any>;
  locale: string;
  perPage?: number;
  className?: string;
  /** Listing URL without ?page (filters are kept); used for "Show earlier products" on later pages */
  baseUrl?: string;
  pagination?: React.ReactNode;
  children: React.ReactNode;
}) {
  const { __ } = useEcommerce();
  const [pages, setPages] = useState<React.ReactNode[]>([]);
  const [lastPage, setLastPage] = useState(initialPage);
  const [pageCount, setPageCount] = useState(totalPages);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  const [enhanced, setEnhanced] = useState(false);
  const sentinel = useRef<HTMLDivElement | null>(null);
  const busy = useRef(false);

  const hasMore = lastPage < pageCount;

  const firstPageUrl = (() => {
    if (!baseUrl) return null;
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(searchParams || {})) {
      if (key === "page" || value === undefined) continue;
      for (const v of Array.isArray(value) ? value : [value]) params.append(key, String(v));
    }
    const qs = params.toString();
    return qs ? `${baseUrl}?${qs}` : baseUrl;
  })();

  const loadMore = useCallback(async () => {
    if (busy.current || lastPage >= pageCount) return;
    busy.current = true;
    setLoading(true);
    try {
      const next = await loadProductsPage({ scope, page: lastPage + 1, searchParams, locale, perPage });
      setPages((prev) => [...prev, <React.Fragment key={next.page}>{next.items}</React.Fragment>]);
      setLastPage(next.page);
      setPageCount(next.totalPages);
      setFailed(false);
    } catch (err) {
      console.error("[InfiniteProducts] Failed to load more products:", err);
      setFailed(true);
    } finally {
      busy.current = false;
      setLoading(false);
    }
  }, [lastPage, pageCount, scope, searchParams, locale, perPage]);

  useEffect(() => setEnhanced(true), []);

  // Filters, sort or page changed (the server re-rendered the first page): drop pages loaded for the old query
  const querySignature = JSON.stringify({ scope, searchParams, initialPage, totalPages });
  const lastSignature = useRef(querySignature);
  useEffect(() => {
    if (lastSignature.current === querySignature) return;
    lastSignature.current = querySignature;
    setPages([]);
    setLastPage(initialPage);
    setPageCount(totalPages);
    setFailed(false);
  }, [querySignature, initialPage, totalPages]);

  useEffect(() => {
    if (!enhanced || !hasMore || failed || !sentinel.current) return;
    const observer = new IntersectionObserver((entries) => entries.some((e) => e.isIntersecting) && loadMore(), { rootMargin: "800px 0px" });
    observer.observe(sentinel.current);
    return () => observer.disconnect();
  }, [enhanced, hasMore, failed, loadMore]);

  return (
    <>
      {enhanced && initialPage > 1 && firstPageUrl && (
        <div className="mb-8 text-center">
          <a href={firstPageUrl} className="text-sm uppercase underline text-zinc-600 dark:text-zinc-400">
            {__("Show earlier products")}
          </a>
        </div>
      )}
      <div className={className}>
        {children}
        {pages}
      </div>
      {enhanced && hasMore && !failed && (
        <div ref={sentinel} className="flex justify-center mt-12">
          <button
            type="button"
            onClick={loadMore}
            disabled={loading}
            className="px-6 py-3 text-sm uppercase border rounded-lg border-zinc-950/10 text-zinc-700 hover:bg-zinc-950/5 disabled:opacity-60 dark:border-white/10 dark:text-zinc-300"
          >
            {loading ? __("Loading...") : __("Load more")}
          </button>
        </div>
      )}
      {/* Numbered pagination: always in the HTML for search engines; shown to visitors only without JavaScript or if loading fails */}
      <div className={enhanced && !failed ? "hidden" : undefined}>{pagination}</div>
    </>
  );
}
