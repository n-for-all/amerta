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
                  <strong>Buy now on the website</strong>
                  <em>One tap takes the customer straight to checkout with that product. No cart step.</em>
                </span>
              </label>
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
