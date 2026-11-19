"use client";

import React, { useEffect, useRef, useState } from "react";
import { Gutter, toast, Button, TextInput } from "@payloadcms/ui";
import { formatMoney } from "./money";
import { ProductModal } from "./ProductModal";
import "./index.scss";

const SETTINGS_KEY = "shopify-catalog";

export const CatalogClient = () => {
  const [tab, setTab] = useState<"search" | "settings">("search");

  // Settings
  const [clientId, setClientId] = useState("");
  const [clientSecret, setClientSecret] = useState("");
  const [catalogId, setCatalogId] = useState("");
  const [agentProfileUrl, setAgentProfileUrl] = useState("");
  const [defaultCountry, setDefaultCountry] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("");
  const [saving, setSaving] = useState(false);

  // Search
  const [query, setQuery] = useState("");
  const [country, setCountry] = useState("");
  const [currency, setCurrency] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [shipsTo, setShipsTo] = useState("");
  const [shops, setShops] = useState("");
  const [useCatalog, setUseCatalog] = useState(true);
  const [loading, setLoading] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [messages, setMessages] = useState<any[]>([]);
  const [pagination, setPagination] = useState<any>(null);
  const [meta, setMeta] = useState<{ authenticated?: boolean; catalogId?: string | null } | null>(null);
  const [selected, setSelected] = useState<any>(null);
  const [showShops, setShowShops] = useState(false);

  useEffect(() => {
    fetch("/api/globals/apps")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const s = data?.appSettings?.[SETTINGS_KEY] || {};
        setClientId(s.clientId || "");
        setClientSecret(s.clientSecret || "");
        setCatalogId(s.catalogId || "");
        setAgentProfileUrl(s.agentProfileUrl || "");
        setDefaultCountry(s.country || "");
        setDefaultCurrency(s.currency || "");
        setCountry(s.country || "");
        setCurrency(s.currency || "");
      })
      .catch(() => {});
  }, []);

  const saveSettings = async () => {
    setSaving(true);
    try {
      const current = await fetch("/api/globals/apps").then((r) => r.json());
      const res = await fetch("/api/globals/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appSettings: {
            ...(current.appSettings || {}),
            [SETTINGS_KEY]: {
              clientId: clientId.trim(),
              clientSecret: clientSecret.trim(),
              catalogId: catalogId.trim(),
              agentProfileUrl: agentProfileUrl.trim(),
              country: defaultCountry.trim().toUpperCase(),
              currency: defaultCurrency.trim().toUpperCase(),
            },
          },
        }),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      toast.success("Settings saved.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  };

  // Next pages reuse the filters of the search that produced the results, not what's typed in the form now
  const lastParamsRef = useRef<Record<string, any> | null>(null);
  const requestIdRef = useRef(0);

  const search = async (cursor?: string, overrides: Record<string, any> = {}) => {
    let params: Record<string, any>;
    if (cursor) {
      if (loadingRef.current || !lastParamsRef.current) return;
      params = lastParamsRef.current;
    } else {
      params = { query, country, currency, minPrice, maxPrice, shipsTo, shops, useCatalog, ...overrides };
      if (!String(params.query).trim() && !String(params.shops).trim()) {
        toast.error("Enter a search term, or limit the search to some shops.");
        return;
      }
      lastParamsRef.current = params;
    }
    const requestId = ++requestIdRef.current;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch("/api/shopify-catalog/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...params, cursor, limit: 12 }),
      });
      const data = await res.json();
      if (requestId !== requestIdRef.current) return; // a newer search started meanwhile
      if (!res.ok) throw new Error(res.status === 401 ? "You're logged out of this admin. Refresh the page and log in again." : data.error || "Search failed");
      // Later pages can repeat products Shopify already returned; keep the first one
      setProducts((prev) => {
        const seen = new Set<string>();
        return [...(cursor ? prev : []), ...(data.products || [])].filter((p: any) => !seen.has(p.id) && seen.add(p.id));
      });
      setMessages(data.messages || []);
      setPagination(data.pagination || null);
      setMeta({ authenticated: data.authenticated, catalogId: data.catalogId });
      if (!cursor && !data.products?.length) toast.info("No products found.");
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      if (requestId === requestIdRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  };

  // Infinite scroll: load the next page when the bottom of the grid comes into view
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => {});
  loadMoreRef.current = () => {
    if (pagination?.has_next_page && pagination.cursor && !loadingRef.current) search(pagination.cursor);
  };
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver((entries) => entries[0]?.isIntersecting && loadMoreRef.current(), { rootMargin: "600px 0px" });
    observer.observe(el);
    return () => observer.disconnect();
  }, [products.length, pagination?.has_next_page]); // re-observe after each page, so a sentinel still in view loads the next one

  const promotedCount = products.filter((p) => p.variants?.some((v: any) => v.placement)).length;

  // Shops among the results loaded so far (Shopify doesn't report a total)
  const shopList = (() => {
    const map = new Map<string, { name: string; host: string; url?: string; count: number }>();
    for (const p of products) {
      const seller = p.variants?.[0]?.seller || {};
      let host = seller.domain || "";
      try {
        if (seller.url) host = new URL(seller.url).host;
      } catch {}
      const key = seller.id || host || seller.name;
      if (!key) continue;
      const entry = map.get(key) || { name: seller.name || host, host, url: seller.url, count: 0 };
      entry.count++;
      map.set(key, entry);
    }
    return [...map.values()].sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  })();
  const browseShop = (host: string) => {
    setShops(host);
    setShowShops(false);
    search(undefined, { shops: host });
  };

  return (
    <Gutter className="shopify-catalog">
      <div className="sc-header">
        <div>
          <h1>Shopify Catalog</h1>
          <p>Search products from Shopify merchants worldwide. Promoted items earn commission when a buyer purchases through their link.</p>
        </div>
        <span className={`sc-pill ${clientId && clientSecret ? "on" : "off"}`}>{clientId && clientSecret ? "API key set" : "Keyless (testing only)"}</span>
      </div>

      <div className="sc-tabs">
        <button className={tab === "search" ? "active" : ""} onClick={() => setTab("search")}>
          Search
        </button>
        <button className={tab === "settings" ? "active" : ""} onClick={() => setTab("settings")}>
          Settings
        </button>
      </div>

      {tab === "settings" && (
        <div className="sc-card sc-settings">
          <p className="sc-help">
            In the Shopify Dev Dashboard open <strong>Catalogs</strong>, create an API key, and copy its Client ID and secret. Save a catalog with <strong>Earn commission</strong> on and paste its catalog ID. Without a key, search still works for testing but shares a
            low rate limit with everyone.
          </p>
          <TextInput path="clientId" label="Client ID" value={clientId} onChange={(e: any) => setClientId(e.target.value)} />
          <TextInput path="clientSecret" label="Client secret" value={clientSecret} onChange={(e: any) => setClientSecret(e.target.value)} />
          <TextInput path="catalogId" label="Catalog ID" value={catalogId} onChange={(e: any) => setCatalogId(e.target.value)} description="Needed for commission. Searches without it return organic results only." />
          <div className="sc-row">
            <TextInput path="defaultCountry" label="Default buyer country" placeholder="AE" value={defaultCountry} onChange={(e: any) => setDefaultCountry(e.target.value)} />
            <TextInput path="defaultCurrency" label="Default currency" placeholder="AED" value={defaultCurrency} onChange={(e: any) => setDefaultCurrency(e.target.value)} />
          </div>
          <TextInput path="agentProfileUrl" label="Agent profile URL (optional)" placeholder="Shopify's example profile" value={agentProfileUrl} onChange={(e: any) => setAgentProfileUrl(e.target.value)} />
          <Button onClick={saveSettings} disabled={saving}>
            {saving ? "Saving..." : "Save settings"}
          </Button>
        </div>
      )}

      {tab === "search" && (
        <>
          <form
            className="sc-card sc-form"
            onSubmit={(e) => {
              e.preventDefault();
              search();
            }}
          >
            <div className="sc-query">
              <input className="sc-input sc-input-lg" placeholder="What are you looking for? e.g. kopi luwak coffee beans" value={query} onChange={(e) => setQuery(e.target.value)} />
              <Button type="submit" disabled={loading} buttonStyle="primary">
                {loading ? "Searching..." : "Search"}
              </Button>
            </div>
            <div className="sc-filters">
              <label>
                Buyer country
                <input className="sc-input" placeholder="AE" value={country} onChange={(e) => setCountry(e.target.value)} maxLength={2} />
              </label>
              <label>
                Currency
                <input className="sc-input" placeholder="AED" value={currency} onChange={(e) => setCurrency(e.target.value)} maxLength={3} />
              </label>
              <label>
                Min price
                <input className="sc-input" type="number" min="0" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
              </label>
              <label>
                Max price
                <input className="sc-input" type="number" min="0" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
              </label>
              <label>
                Ships to
                <input className="sc-input" placeholder="AE" value={shipsTo} onChange={(e) => setShipsTo(e.target.value)} maxLength={2} />
              </label>
              <label className="sc-wide">
                Only these shops
                <input className="sc-input" placeholder="shop domains, comma separated" value={shops} onChange={(e) => setShops(e.target.value)} />
              </label>
              {catalogId && (
                <label className="sc-check">
                  <input type="checkbox" checked={useCatalog} onChange={(e) => setUseCatalog(e.target.checked)} /> Use my catalog ({catalogId})
                </label>
              )}
            </div>
          </form>

          {meta && (
            <div className="sc-summary">
              <span>
                {pagination?.total_count !== undefined ? `About ${pagination.total_count.toLocaleString()} results` : `${products.length} results`} · showing {products.length}
              </span>
              <span>{meta.authenticated ? "Authenticated" : "Keyless"}</span>
              <span>{meta.catalogId ? `Catalog ${meta.catalogId}` : "No catalog: organic results only, no commission"}</span>
              <span>{promotedCount} promoted</span>
              {shopList.length > 0 && (
                <button type="button" className="sc-link" onClick={() => setShowShops(!showShops)}>
                  from {shopList.length} shop{shopList.length === 1 ? "" : "s"} {showShops ? "▴" : "▾"}
                </button>
              )}
            </div>
          )}

          {showShops && shopList.length > 0 && (
            <div className="sc-card sc-shops">
              <p className="sc-help">
                Shops in the {products.length} results loaded so far. Shopify doesn&apos;t say how many shops match in total; scrolling loads more. Click a shop to search only its products.
              </p>
              <div className="sc-shop-list">
                {shopList.map((shop) => (
                  <div key={shop.host + shop.name} className="sc-shop">
                    <button type="button" onClick={() => browseShop(shop.host)} title={`Search only ${shop.host}`}>
                      <strong>{shop.name}</strong>
                      <span>{shop.host}</span>
                    </button>
                    <em>{shop.count}</em>
                    {shop.url && (
                      <a href={shop.url} target="_blank" rel="noopener" title="Open store">
                        ↗
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {messages.length > 0 && (
            <div className="sc-messages">
              {messages.map((m, i) => (
                <div key={i} className={`sc-msg ${m.type}`}>
                  <strong>{m.code}</strong> {m.content}
                </div>
              ))}
            </div>
          )}

          <div className="sc-grid">
            {products.map((p) => {
              const v = p.variants?.[0] || {};
              const promoted = p.variants?.find((x: any) => x.placement);
              const image = p.media?.find((m: any) => m.type === "image") || v.media?.[0];
              return (
                <div key={p.id} className={`sc-product ${promoted ? "promoted" : ""}`}>
                  <div className="sc-image" onClick={() => setSelected(p)}>
                    {image?.url ? <img src={image.url} alt={image.alt_text || p.title} loading="lazy" /> : <span>No image</span>}
                    {promoted && <span className="sc-badge">Promoted · {promoted.placement?.commission?.percentage?.value ?? "?"}%</span>}
                  </div>
                  <div className="sc-body">
                    <div className="sc-seller">{v.seller?.name || v.seller?.domain || "Unknown seller"}</div>
                    <h3 onClick={() => setSelected(p)}>{p.title}</h3>
                    <div className="sc-price">
                      {p.price_range && p.price_range.min?.amount !== p.price_range.max?.amount
                        ? `${formatMoney(p.price_range.min)} – ${formatMoney(p.price_range.max)}`
                        : formatMoney(v.price || p.price_range?.min)}
                      {v.list_price && <s>{formatMoney(v.list_price)}</s>}
                    </div>
                    {p.rating?.count ? (
                      <div className="sc-rating">
                        ★ {Number(p.rating.value).toFixed(1)} ({p.rating.count})
                      </div>
                    ) : null}
                    <div className="sc-meta">
                      {p.variants?.length || 0} variant{p.variants?.length === 1 ? "" : "s"}
                      {v.availability?.available === false && " · unavailable"}
                    </div>
                    <div className="sc-actions">
                      {v.url && (
                        <a href={v.url} target="_blank" rel="noopener">
                          View product
                        </a>
                      )}
                      {v.checkout_url && (
                        <a href={v.checkout_url} target="_blank" rel="noopener">
                          Checkout
                        </a>
                      )}
                      <button type="button" onClick={() => setSelected(p)}>
                        Details
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {selected && <ProductModal product={selected} country={country} currency={currency} useCatalog={useCatalog} onClose={() => setSelected(null)} />}

          {pagination?.has_next_page && products.length > 0 && (
            <div className="sc-more" ref={sentinelRef}>
              <Button buttonStyle="secondary" disabled={loading} onClick={() => search(pagination.cursor)}>
                {loading ? "Loading..." : "Load more"}
              </Button>
            </div>
          )}
        </>
      )}
    </Gutter>
  );
};
