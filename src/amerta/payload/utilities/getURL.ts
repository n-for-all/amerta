import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { Category, Collection, Page, Post, Product, ProductBrand, ProductTag, Tag } from "@/payload-types";
import { getPathSegment } from "./getPathSegment";
import { CollectionSlug } from "payload";

export const getServerSideURL = () => {
  let url = process.env.NEXT_PUBLIC_SERVER_URL;

  if (!url && process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`.replace(/\/$/, "");
  }

  if (!url) {
    url = process.env.NEXT_PUBLIC_SERVER_URL || "";
  }

  return url.replace(/\/$/, "");
};

const trimSlashes = (str: string) => str.replace(/^\/+|\/+$/g, "");

export type LinkReference = {
  relationTo: CollectionSlug;
  value: Page | Post | Category | Product | Collection | ProductBrand | ProductTag | Tag | string | number;
} | null;

export const getLinkUrl = (link: {
  type?: ("reference" | "custom") | null;
  reference?: LinkReference;
  url?: string | null;
  locale?: string | null;
}): string => {
  if (link.type === "reference" && link.reference) {
    if (typeof link.reference.value === "object" && "slug" in link.reference.value && link.reference.value.slug) {
      const slug = link.reference.relationTo == "pages" && (link.reference.value as Page).isFrontPage ? "" : link.reference.value.slug;
      const pathSlug = slug;
      const pathSegment = getPathSegment(link.reference.relationTo);
      return getURL(`${pathSegment}/${pathSlug}`, link.locale);
    } else if (typeof link.reference.value === "string" || typeof link.reference.value === "number") {
      return getURL(`/${link.reference.value}`, link.locale);
    }
  } else if (link.type === "custom" && link.url) {
    if (link.locale == DEFAULT_LOCALE || !link.locale) {
      return link.url.replace("{locale}", "").replace("//", "/");
    }
    return link.url.replace("{locale}", link.locale || "");
  }

  return "";
};

/**
 * Get the url for a given path and locale, if locale is empty or default, it is omitted from the path.
 * @param path string
 * @param locale string
 * @returns string
 */

export const getURL = (path: string, locale?: string | null): string => {
  const pathParts: string[] = [getServerSideURL()];
  if (locale) {
    if (locale != DEFAULT_LOCALE) {
      pathParts.push(trimSlashes(locale));
    }
    pathParts.push(trimSlashes(path || ""));
  } else {
    pathParts.push(trimSlashes(path || ""));
  }
  return pathParts.filter(Boolean).join("/");
};
