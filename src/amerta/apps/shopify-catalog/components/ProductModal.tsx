"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { formatMoney } from "./money";

type Props = {
  product: any; // the search result, shown straight away while the full product loads
  country: string;
  currency: string;
  useCatalog: boolean;
  onClose: () => void;
};

const humanize = (key: string) => key.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());

// Merchant HTML runs in a sandbox without scripts; same-origin only so we can size it to its content
const DescriptionFrame = ({ html }: { html: string }) => {
  const ref = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(120);
  const doc = `<!doctype html><html><head><base target="_blank"><style>body{margin:0;font:14px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#222}img,video,iframe{max-width:100%;height:auto}table{border-collapse:collapse;max-width:100%}td,th{border:1px solid #ddd;padding:4px 8px}</style></head><body>${html}</body></html>`;
  return (
    <iframe
      ref={ref}
      className="sc-desc-frame"
      sandbox="allow-same-origin allow-popups"
      srcDoc={doc}
      style={{ height }}
      onLoad={() => {
        const body = ref.current?.contentDocument?.body;
        if (body) setHeight(Math.min(body.scrollHeight + 16, 4000));
      }}
    />
  );
};

export const ProductModal = ({ product: summary, country, currency, useCatalog, onClose }: Props) => {
  const [product, setProduct] = useState<any>(summary);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [lightbox, setLightbox] = useState(false);
  const [tab, setTab] = useState<"variants" | "description" | "seller" | "raw">("variants");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch("/api/shopify-catalog/product", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: summary.id, country, currency, useCatalog }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.error || "Failed to load product");
        if (!cancelled) setProduct(data.product);
      })
      .catch((e) => !cancelled && setError(e.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [summary.id, country, currency, useCatalog]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") (lightbox ? setLightbox(false) : onClose());
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, onClose]);

  const media: any[] = useMemo(() => {
    const all = [...(product.media || [])];
    // Variant photos the product gallery doesn't already have
    for (const v of product.variants || []) for (const m of v.media || []) if (!all.some((x) => x.url === m.url)) all.push(m);
    return all;
  }, [product]);

  const variants: any[] = product.variants || [];
  const first = variants[0] || {};
  const seller = first.seller || {};
  const promoted = variants.filter((v) => v.placement);
  const description: string = product.description?.html || product.description?.plain || "";
  const metadata: Record<string, any> = product.metadata || {};
  const current = media[mediaIndex] || media[0];
  const step = (d: number) => setMediaIndex((i) => (i + d + media.length) % media.length);

  const renderMedia = (m: any, big = false) => {
    if (!m) return <span className="sc-noimg">No image</span>;
    if (m.type === "video") return <video src={m.url} poster={m.preview?.url} controls playsInline />;
    if (m.type === "external_video" || m.type === "model_3d")
      return (
        <a href={m.url} target="_blank" rel="noopener" className="sc-ext-media">
          {m.preview?.url && <img src={m.preview.url} alt="" />}
          <span>{m.type === "model_3d" ? "3D model ↗" : "Video ↗"}</span>
        </a>
      );
    return <img src={m.url} alt={m.alt_text || product.title} onClick={big ? () => setLightbox(true) : undefined} />;
  };

  return (
    <div className="sc-modal-overlay" onClick={onClose}>
      <div className="sc-modal" onClick={(e) => e.stopPropagation()}>
        <div className="sc-modal-header">
          <div>
            <div className="sc-seller">{seller.name || seller.domain}</div>
            <h2>{product.title}</h2>
          </div>
          <button type="button" className="sc-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        {error && <div className="sc-msg error">{error} (showing the search result instead)</div>}

        <div className="sc-modal-grid">
          {/* Gallery */}
          <div className="sc-gallery">
            <div className="sc-gallery-main">
              {renderMedia(current, true)}
              {media.length > 1 && (
                <>
                  <button type="button" className="sc-nav prev" onClick={() => step(-1)}>
                    ‹
                  </button>
                  <button type="button" className="sc-nav next" onClick={() => step(1)}>
                    ›
                  </button>
                  <div className="sc-counter">
                    {mediaIndex + 1} / {media.length}
                  </div>
                </>
              )}
              {loading && <div className="sc-loading">Loading full details…</div>}
            </div>
            {media.length > 1 && (
              <div className="sc-thumbs">
                {media.map((m, i) => (
                  <button key={m.url + i} type="button" className={i === mediaIndex ? "active" : ""} onClick={() => setMediaIndex(i)}>
                    <img src={m.preview?.url || m.url} alt="" />
                    {m.type !== "image" && <span>▶</span>}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="sc-info">
            <div className="sc-price sc-price-lg">
              {product.price_range && product.price_range.min?.amount !== product.price_range.max?.amount
                ? `${formatMoney(product.price_range.min)} – ${formatMoney(product.price_range.max)}`
                : formatMoney(first.price || product.price_range?.min)}
              {first.list_price && <s>{formatMoney(first.list_price)}</s>}
            </div>

            {product.rating?.count ? (
              <div className="sc-rating">
                ★ {Number(product.rating.value).toFixed(1)} / {product.rating.scale_max || 5} · {product.rating.count.toLocaleString()} reviews
              </div>
            ) : null}

            {promoted.length > 0 ? (
              <div className="sc-promo">
                Promoted: {promoted.length} of {variants.length} variants earn up to {Math.max(...promoted.map((v) => Number(v.placement?.commission?.percentage?.value) || 0))}% commission
              </div>
            ) : (
              <div className="sc-organic">Organic result: no commission on this product</div>
            )}

            {(product.options || []).map((o: any) => (
              <div key={o.name} className="sc-option">
                <div className="sc-label">
                  {o.name} ({o.values?.length || 0})
                </div>
                <div className="sc-chips">
                  {(o.values || []).map((val: any) => (
                    <span key={val.label} className={`sc-chip ${val.available === false ? "off" : ""}`} title={val.available === false ? "Unavailable" : ""}>
                      {val.swatch?.image_url && <img src={val.swatch.image_url} alt="" />}
                      {val.swatch?.color && !val.swatch?.image_url && <i style={{ background: val.swatch.color }} />}
                      {val.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}

            {Object.entries(metadata).map(([key, value]) =>
              Array.isArray(value) && value.length ? (
                <div key={key} className="sc-option">
                  <div className="sc-label">{humanize(key)}</div>
                  <ul className="sc-list">
                    {value.map((item: any, i: number) => (
                      <li key={i}>{typeof item === "string" ? item : JSON.stringify(item)}</li>
                    ))}
                  </ul>
                </div>
              ) : value && typeof value !== "object" ? (
                <div key={key} className="sc-option">
                  <div className="sc-label">{humanize(key)}</div>
                  <div>{String(value)}</div>
                </div>
              ) : null,
            )}

            {product.categories?.length ? (
              <div className="sc-option">
                <div className="sc-label">Categories</div>
                <ul className="sc-list">
                  {product.categories.map((c: any, i: number) => (
                    <li key={i}>
                      {c.value} <small>({c.taxonomy})</small>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="sc-modal-actions">
              {first.url && (
                <a className="sc-btn primary" href={first.url} target="_blank" rel="noopener">
                  View on {seller.name || "store"} ↗
                </a>
              )}
              {first.checkout_url && (
                <a className="sc-btn" href={first.checkout_url} target="_blank" rel="noopener">
                  Checkout ↗
                </a>
              )}
            </div>
            <div className="sc-meta">
              {product.handle && <>Handle: {product.handle} · </>}
              ID: {product.id}
            </div>
          </div>
        </div>

        <div className="sc-modal-tabs">
          <button className={tab === "variants" ? "active" : ""} onClick={() => setTab("variants")}>
            Variants ({variants.length})
          </button>
          <button className={tab === "description" ? "active" : ""} onClick={() => setTab("description")}>
            Description
          </button>
          <button className={tab === "seller" ? "active" : ""} onClick={() => setTab("seller")}>
            Seller & policies
          </button>
          <button className={tab === "raw" ? "active" : ""} onClick={() => setTab("raw")}>
            Raw data
          </button>
        </div>

        <div className="sc-modal-tab-body">
          {tab === "variants" && (
            <div className="sc-table-wrap">
              <table className="sc-table">
                <thead>
                  <tr>
                    <th></th>
                    <th>Variant</th>
                    <th>Price</th>
                    <th>Compare at</th>
                    <th>Available</th>
                    <th>Condition</th>
                    <th>Commission</th>
                    <th>Rating</th>
                    <th>Links</th>
                  </tr>
                </thead>
                <tbody>
                  {variants.map((v) => {
                    const img = v.media?.[0];
                    const label = v.options?.length ? v.options.map((o: any) => `${o.name}: ${o.label}`).join(" · ") : v.title;
                    return (
                      <tr key={v.id}>
                        <td className="sc-td-img">
                          {img ? (
                            <img
                              src={img.preview?.url || img.url}
                              alt=""
                              onClick={() => {
                                const i = media.findIndex((m) => m.url === img.url);
                                if (i >= 0) setMediaIndex(i);
                              }}
                            />
                          ) : null}
                        </td>
                        <td>
                          <div>{label}</div>
                          {v.title && v.title !== product.title && v.options?.length ? <small>{v.title}</small> : null}
                        </td>
                        <td>{formatMoney(v.price)}</td>
                        <td>{v.list_price ? <s>{formatMoney(v.list_price)}</s> : "—"}</td>
                        <td>{v.availability?.available === false ? <span className="sc-no">No</span> : <span className="sc-yes">Yes</span>}</td>
                        <td>{v.condition || "—"}</td>
                        <td>{v.placement ? <strong className="sc-commission">{v.placement.commission?.percentage?.value}%</strong> : "—"}</td>
                        <td>{v.rating?.count ? `★ ${Number(v.rating.value).toFixed(1)} (${v.rating.count})` : "—"}</td>
                        <td className="sc-links">
                          {v.url && (
                            <a href={v.url} target="_blank" rel="noopener">
                              Product
                            </a>
                          )}
                          {v.checkout_url && (
                            <a href={v.checkout_url} target="_blank" rel="noopener">
                              Checkout
                            </a>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {tab === "description" && (description ? <DescriptionFrame html={description} /> : <p className="sc-empty">The merchant didn&apos;t add a description.</p>)}

          {tab === "seller" && (
            <dl className="sc-dl">
              <dt>Name</dt>
              <dd>{seller.name || "—"}</dd>
              <dt>Store</dt>
              <dd>
                {seller.url ? (
                  <a href={seller.url} target="_blank" rel="noopener">
                    {seller.url}
                  </a>
                ) : (
                  "—"
                )}
              </dd>
              <dt>Shopify domain</dt>
              <dd>{seller.domain || "—"}</dd>
              <dt>Shop ID</dt>
              <dd>{seller.id || "—"}</dd>
              <dt>Product ID in their store</dt>
              <dd>{first.seller_product_id || "—"}</dd>
              <dt>Shopify checkout</dt>
              <dd>{first.eligible?.native_checkout === false ? "Not available through Shopify's checkout API" : first.eligible?.native_checkout ? "Available" : "—"}</dd>
              {(seller.links || []).map((l: any) => (
                <React.Fragment key={l.type}>
                  <dt>{humanize(l.type)}</dt>
                  <dd>
                    <a href={l.url} target="_blank" rel="noopener">
                      {l.title || "Open"} ↗
                    </a>
                  </dd>
                </React.Fragment>
              ))}
            </dl>
          )}

          {tab === "raw" && <pre className="sc-raw">{JSON.stringify(product, null, 2)}</pre>}
        </div>
      </div>

      {lightbox && current && (
        <div
          className="sc-lightbox"
          onClick={(e) => {
            e.stopPropagation();
            setLightbox(false);
          }}
        >
          <img src={current.url} alt="" />
          {media.length > 1 && (
            <>
              <button
                type="button"
                className="sc-nav prev"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
              >
                ‹
              </button>
              <button
                type="button"
                className="sc-nav next"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
              >
                ›
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
