import type { Payload } from "payload";

/** Cookie that remembers where the visitor came from, so the order can record it. */
export const SOURCE_COOKIE = "amerta_source";
/** How long a visit counts towards the source: one day. */
export const SOURCE_MAX_AGE = 60 * 60 * 24;

/** Order sources written by the Catalog app. */
export const CATALOG_SOURCES = {
  page: "catalog",
  feed: "catalog_feed",
  whatsapp: "catalog_whatsapp",
} as const;

export interface CatalogSettings {
  /** Heading shown on the catalog page. Empty = the site title. */
  heading: string;
  /** Short line under the heading. */
  intro: string;
  /** Optional picture behind the heading (image URL). */
  coverImage: string;
  /** Customers can order through the website. */
  buyOnWebsite: boolean;
  /** What the website button does: straight to checkout, or add to the cart. */
  orderMode: "buy_now" | "add_to_cart";
  /** Which products the catalog shows. */
  productMode: "all" | "selected";
  /** The chosen products when productMode is "selected". */
  productIds: string[];
  /** Show an "Order on WhatsApp" button. */
  orderOnWhatsapp: boolean;
  /** WhatsApp number with country code, e.g. 971501234567. */
  whatsappNumber: string;
  /** First line of the WhatsApp message. */
  whatsappMessage: string;
  /** Serve the product feed for Facebook, Instagram and WhatsApp catalogs. */
  feedEnabled: boolean;
}

export const DEFAULT_CATALOG_SETTINGS: CatalogSettings = {
  heading: "",
  intro: "",
  coverImage: "",
  buyOnWebsite: true,
  orderMode: "buy_now",
  productMode: "all",
  productIds: [],
  orderOnWhatsapp: false,
  whatsappNumber: "",
  whatsappMessage: "Hi, I would like to order this from your catalog:",
  feedEnabled: true,
};

/** Only letters, digits, "_" and "-" are kept, so the value is safe to store and show. */
export const cleanSource = (value?: string | null): string => {
  const source = (value || "").trim().toLowerCase();
  return /^[a-z0-9_-]{1,40}$/.test(source) ? source : "";
};

/** The catalog only tags its own visits; other utm_source values are left alone. */
export const isCatalogSource = (value?: string | null): boolean => cleanSource(value).startsWith("catalog");

export const whatsappDigits = (value?: string | null): string => (value || "").replace(/\D/g, "");

export async function getCatalogSettings(payload: Payload): Promise<{ active: boolean; settings: CatalogSettings }> {
  try {
    const appsGlobal = await payload.findGlobal({ slug: "apps", depth: 0 });
    const active = ((appsGlobal?.activeApps as string[]) || []).includes("catalog");
    const saved = ((appsGlobal?.appSettings as Record<string, any>) || {}).catalog || {};
    const settings: CatalogSettings = { ...DEFAULT_CATALOG_SETTINGS, ...saved };
    settings.orderMode = settings.orderMode === "add_to_cart" ? "add_to_cart" : "buy_now";
    settings.productMode = settings.productMode === "selected" ? "selected" : "all";
    settings.productIds = Array.isArray(settings.productIds) ? settings.productIds.map(String) : [];
    return { active, settings };
  } catch {
    return { active: false, settings: DEFAULT_CATALOG_SETTINGS };
  }
}
