/* eslint-disable i18next/no-literal-string */

"use client";

import React, { useEffect, useState } from "react";
import { Gutter, toast } from "@payloadcms/ui";
import { CatalogSettings, DEFAULT_CATALOG_SETTINGS } from "../settings";
import "./index.scss";

const CopyRow = ({ label, help, value }: { label: string; help: string; value: string }) => (
  <div className="catalog-settings__field">
    <label className="catalog-settings__label">{label}</label>
    <div className="catalog-settings__copy">
      <input className="catalog-settings__input" readOnly value={value} onFocus={(e) => e.currentTarget.select()} />
      <button
        type="button"
        className="catalog-settings__button catalog-settings__button--secondary"
        onClick={() => navigator.clipboard.writeText(value).then(() => toast.success("Link copied"), () => toast.error("Could not copy the link"))}
      >
        Copy
      </button>
    </div>
    <p className="catalog-settings__help">{help}</p>
  </div>
);

const ProductPicker = ({ selected, onChange }: { selected: string[]; onChange: (ids: string[]) => void }) => {
  const [products, setProducts] = useState<{ id: string; title: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    fetch("/api/products?limit=1000&depth=0&sort=title&select[title]=true&where[_status][equals]=published", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => setProducts((data.docs || []).map((doc: any) => ({ id: String(doc.id), title: doc.title || doc.id }))))
      .catch(() => toast.error("Could not load the products"))
      .finally(() => setLoading(false));
  }, []);

  const visible = products.filter((product) => product.title.toLowerCase().includes(filter.trim().toLowerCase()));
  const toggle = (id: string) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

  if (loading) return <p className="catalog-settings__help">Loading products…</p>;

  return (
    <div className="catalog-settings__picker">
      <div className="catalog-settings__copy">
        <input className="catalog-settings__input" placeholder="Search products" aria-label="Search products" value={filter} onChange={(e) => setFilter(e.target.value)} />
        <button type="button" className="catalog-settings__button catalog-settings__button--secondary" onClick={() => onChange(Array.from(new Set([...selected, ...visible.map((p) => p.id)])))}>
          Select shown
        </button>
        <button type="button" className="catalog-settings__button catalog-settings__button--secondary" onClick={() => onChange([])}>
          Clear
        </button>
      </div>
      <p className="catalog-settings__help">
        {selected.length} of {products.length} products selected
      </p>
      <ul className="catalog-settings__list">
        {visible.map((product) => (
          <li key={product.id}>
            <label>
              <input type="checkbox" checked={selected.includes(product.id)} onChange={() => toggle(product.id)} />
              <span>{product.title}</span>
            </label>
          </li>
        ))}
        {visible.length === 0 && <li className="catalog-settings__help">No products match.</li>}
      </ul>
    </div>
  );
};

export const CatalogSettingsClient: React.FC<{ siteUrl: string }> = ({ siteUrl }) => {
  const [settings, setSettings] = useState<CatalogSettings>(DEFAULT_CATALOG_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/catalog/settings", { credentials: "include" })
      .then((res) => res.json())
      .then((data) => {
        if (data && !data.error && !data.message) setSettings({ ...DEFAULT_CATALOG_SETTINGS, ...data });
      })
      .catch(() => toast.error("Could not load the catalog settings"))
      .finally(() => setLoading(false));
  }, []);

  const set = <K extends keyof CatalogSettings>(key: K, value: CatalogSettings[K]) => setSettings((current) => ({ ...current, [key]: value }));

  const save = async () => {
    if (settings.orderOnWhatsapp && !settings.whatsappNumber.replace(/\D/g, "")) {
      toast.error("Add your WhatsApp number, or turn off Order on WhatsApp");
      return;
    }
    if (settings.productMode === "selected" && settings.productIds.length === 0) {
      toast.error("Choose at least one product, or show all products");
      return;
    }
    setSaving(true);
    try {
      const res = await fetch("/api/catalog/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || data.message || "Could not save");
      setSettings({ ...DEFAULT_CATALOG_SETTINGS, ...data.settings });
      toast.success("Catalog settings saved");
    } catch (err: any) {
      toast.error(err.message || "Could not save the catalog settings");
    } finally {
      setSaving(false);
    }
  };

  const base = siteUrl || (typeof window !== "undefined" ? window.location.origin : "");

  return (
    <Gutter>
      <div className="catalog-settings">
        <h1 className="catalog-settings__title">Catalog</h1>
        <p className="catalog-settings__subtitle">A quick buy-now page to share on Instagram, Facebook and WhatsApp. Orders that start there are marked as coming from the catalog.</p>

        {loading ? (
          <p>Loading…</p>
        ) : (
          <>
            <section className="catalog-settings__section">
              <h2 className="catalog-settings__heading">Your links</h2>
              <CopyRow label="Catalog page" value={`${base}/catalog`} help="Put this link in your Instagram bio, Facebook page or WhatsApp profile." />
              {settings.feedEnabled && <CopyRow label="Product feed" value={`${base}/api/catalog/feed.xml`} help="In Meta Commerce Manager, add this as a scheduled data feed. It fills the Facebook, Instagram and WhatsApp catalogs. Add ?locale=ar for another language." />}
            </section>

            <section className="catalog-settings__section">
              <h2 className="catalog-settings__heading">How customers order</h2>
              <label className="catalog-settings__check">
                <input type="checkbox" checked={settings.buyOnWebsite} onChange={(e) => set("buyOnWebsite", e.target.checked)} />
                <span>
                  <strong>Order on the website</strong>
                  <em>Customers order and pay through your shop's checkout.</em>
                </span>
              </label>
              {settings.buyOnWebsite && (
                <div className="catalog-settings__options" role="radiogroup" aria-label="Website button">
                  <label className="catalog-settings__check">
                    <input type="radio" name="catalog-order-mode" checked={settings.orderMode === "buy_now"} onChange={() => set("orderMode", "buy_now")} />
                    <span>
                      <strong>Buy now</strong>
                      <em>One tap takes the customer straight to checkout with that product. No cart step.</em>
                    </span>
                  </label>
                  <label className="catalog-settings__check">
                    <input type="radio" name="catalog-order-mode" checked={settings.orderMode === "add_to_cart"} onChange={() => set("orderMode", "add_to_cart")} />
                    <span>
                      <strong>Add to cart</strong>
                      <em>A + button adds the product to the cart, so the customer can order several products together.</em>
                    </span>
                  </label>
                </div>
              )}
              <label className="catalog-settings__check">
                <input type="checkbox" checked={settings.orderOnWhatsapp} onChange={(e) => set("orderOnWhatsapp", e.target.checked)} />
                <span>
                  <strong>Order on WhatsApp</strong>
                  <em>Opens a WhatsApp chat with you, with the product and price already written.</em>
                </span>
              </label>
              {settings.orderOnWhatsapp && (
                <>
                  <div className="catalog-settings__field">
                    <label className="catalog-settings__label" htmlFor="catalog-whatsapp-number">
                      WhatsApp number
                    </label>
                    <input id="catalog-whatsapp-number" className="catalog-settings__input" inputMode="tel" placeholder="971501234567" value={settings.whatsappNumber} onChange={(e) => set("whatsappNumber", e.target.value)} />
                    <p className="catalog-settings__help">Include the country code, digits only.</p>
                  </div>
                  <div className="catalog-settings__field">
                    <label className="catalog-settings__label" htmlFor="catalog-whatsapp-message">
                      First line of the message
                    </label>
                    <input id="catalog-whatsapp-message" className="catalog-settings__input" value={settings.whatsappMessage} onChange={(e) => set("whatsappMessage", e.target.value)} />
                  </div>
                </>
              )}
            </section>

            <section className="catalog-settings__section">
              <h2 className="catalog-settings__heading">Products</h2>
              <label className="catalog-settings__check">
                <input type="radio" name="catalog-product-mode" checked={settings.productMode === "all"} onChange={() => set("productMode", "all")} />
                <span>
                  <strong>All products</strong>
                  <em>Every published product, including new ones as you add them.</em>
                </span>
              </label>
              <label className="catalog-settings__check">
                <input type="radio" name="catalog-product-mode" checked={settings.productMode === "selected"} onChange={() => set("productMode", "selected")} />
                <span>
                  <strong>Only the products I choose</strong>
                  <em>The catalog page and the product feed show just these.</em>
                </span>
              </label>
              {settings.productMode === "selected" && <ProductPicker selected={settings.productIds} onChange={(ids) => set("productIds", ids)} />}
            </section>

            <section className="catalog-settings__section">
              <h2 className="catalog-settings__heading">Catalog page</h2>
              <div className="catalog-settings__field">
                <label className="catalog-settings__label" htmlFor="catalog-heading">
                  Heading
                </label>
                <input id="catalog-heading" className="catalog-settings__input" placeholder="Your site title" value={settings.heading} onChange={(e) => set("heading", e.target.value)} />
              </div>
              <div className="catalog-settings__field">
                <label className="catalog-settings__label" htmlFor="catalog-intro">
                  Intro line
                </label>
                <input id="catalog-intro" className="catalog-settings__input" value={settings.intro} onChange={(e) => set("intro", e.target.value)} />
              </div>
              <div className="catalog-settings__field">
                <label className="catalog-settings__label" htmlFor="catalog-cover">
                  Cover picture
                </label>
                <input id="catalog-cover" className="catalog-settings__input" placeholder="https://…" value={settings.coverImage} onChange={(e) => set("coverImage", e.target.value)} />
                <p className="catalog-settings__help">Optional. Paste the address of an image from your media library; it shows behind the heading.</p>
              </div>
            </section>

            <section className="catalog-settings__section">
              <h2 className="catalog-settings__heading">Product feed</h2>
              <label className="catalog-settings__check">
                <input type="checkbox" checked={settings.feedEnabled} onChange={(e) => set("feedEnabled", e.target.checked)} />
                <span>
                  <strong>Publish the product feed</strong>
                  <em>All published products, with prices, stock and pictures, in the format Meta reads.</em>
                </span>
              </label>
            </section>

            <button type="button" className="catalog-settings__button" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
          </>
        )}
      </div>
    </Gutter>
  );
};
