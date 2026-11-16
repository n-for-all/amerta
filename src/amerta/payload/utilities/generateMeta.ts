import type { Metadata } from "next";
import type { Media, Page, Post, Config, Settings, Category, Product, Collection } from "@/payload-types";
import { getServerSideURL } from "./getURL";
import { getCachedGlobal } from "./getGlobals";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { printf } from "fast-printf";
import { OpenGraphType } from "next/dist/lib/metadata/types/opengraph-types";
import { convertLexicalToHTML } from "@payloadcms/richtext-lexical/html";
import striptags from "striptags";
import { DocType, getPathSegment } from "./getPathSegment";

export const dynamic = "force-dynamic";

const cleanDescription = (text: any): string => {
  if (!text) return "";

  let cleaned = String(text);
  if (text && text.root && Array.isArray(text.root.children)) {
    try {
      cleaned = striptags(convertLexicalToHTML({ data: text }));
    } catch {
      return "";
    }
  }

  cleaned = cleaned.replace(/\\n/g, " ").replace(/\\r/g, " ").replace(/\s+/g, " ");

  return cleaned.trim().substring(0, 160);
};

export type PageName = "blogPage" | "brandsPage" | "createAccountPage" | "loginPage" | "recoverPasswordPage" | "resendVerificationEmailPage" | "resetPasswordPage" | "verifyEmailPage" | "accountPage" | "addressesPage" | "ordersPage" | "profilePage" | "collectionsPage" | "productsPage" | "productTagsPage" | "categoriesPage" | "tagsPage" | "cartPage" | "checkoutPage" | "logoutPage";

const generateURL = async ({ slug, isFrontPage, type, localeCode }: { slug: string; isFrontPage?: boolean | null; type: DocType; localeCode?: string }) => {
  const url = getServerSideURL();

  const prefix = !localeCode || localeCode === DEFAULT_LOCALE ? "" : `/${localeCode}`;
  const pathSegment = getPathSegment(type);
  if (isFrontPage) return `${url}${prefix}`;
  return slug ? `${url}${prefix}${pathSegment}/${slug}` : `${url}${prefix}${pathSegment}`;
};

const getImageURL = async (image?: Media | Config["db"]["defaultIDType"] | null, settings: Settings | null = null, locale?: string) => {
  const serverUrl = getServerSideURL();

  let url = "";

  if (image && typeof image === "object" && "url" in image) {
    const ogUrl = image.sizes?.og?.url || image.url || "";
    url = /^https?:\/\//.test(ogUrl) ? ogUrl : serverUrl + ogUrl;
  } else {
    settings = settings ? settings : await getCachedGlobal("settings" as never, 1, locale)();
    return settings?.defaultSeoImage && typeof settings?.defaultSeoImage === "object" ? settings?.defaultSeoImage.url : "";
  }

  return url;
};

export const generateCanonicalURL = async ({ slug, isFrontPage, settings, type, locale }: { slug: string; isFrontPage: boolean | null; settings: Settings; type: DocType; locale?: string }) => {
  const languages: Record<string, string> = {};

  const enabledLocales: string[] = (settings?.locales || []) as string[];
  // A page has its own address when it has a slug, is the front page, or is a fixed page like /products or /blog
  const hasOwnURL = !!slug || !!isFrontPage || getPathSegment(type) !== "";

  if (Array.isArray(enabledLocales) && hasOwnURL) {
    await Promise.all(
      enabledLocales.map(async (lang: string) => {
        const code = lang;
        if (code) {
          languages[code] = await generateURL({ slug, isFrontPage, type: type, localeCode: code });
        }
      }),
    );
  }

  if (languages[DEFAULT_LOCALE]) {
    languages["x-default"] = languages[DEFAULT_LOCALE] || "";
  }

  // Each language version is its own canonical (an Arabic page must not point to the English one)
  const canonicalURL = hasOwnURL ? await generateURL({ slug: slug || "", isFrontPage, type: type, localeCode: locale }) : getServerSideURL();
  return { canonicalURL, languages };
};

export const generateMeta = async (args: { doc: Partial<Page> | Partial<Post> | Partial<Category> | Partial<Product> | Partial<Collection> | null; type: DocType; locale: string; pageNum?: number; ogType?: OpenGraphType | "product"; price?: { amount?: number; currencyCode?: string | null } | null }): Promise<Metadata> => {
  const { doc, type, locale, pageNum, ogType, price } = args;

  const settings: Settings | null = (await getCachedGlobal("settings" as never, 1, locale)()) as Settings;

  let title = doc?.meta?.title ? doc?.meta?.title : "";
  if (!title || title === "") {
    const siteTitle = settings?.siteTitle || "";
    let titleTemplate = settings?.seoTitleTemplate || "%s | {siteName}";
    const pageTitle = doc?.title || siteTitle;

    if (pageNum && pageNum > 1) {
      titleTemplate = printf(titleTemplate, printf(settings?.defaultSeoPaginationTitle || "%s - Page %d", pageNum));
    }

    title = titleTemplate.replace("%s", pageTitle as string).replace("{siteName}", siteTitle);
  }

  // No share image set (e.g. only filled in for one language): use the post's main image before the site default
  const fallbackImage = doc && "heroImage" in doc && doc.heroImage && typeof doc.heroImage === "object" ? doc.heroImage : null;
  const ogImage = await getImageURL(doc?.meta?.image || fallbackImage, settings, locale);

  let originalText: any = null;
  if (doc) {
    if ("description" in doc) {
      originalText = doc?.description || null;
    } else if ("content" in doc) {
      originalText = doc?.content || null;
    }

    originalText = cleanDescription(originalText);
  }

  let description = doc?.meta?.description || (doc as Post | Product)?.excerpt || originalText;

  if ((!description || description.trim() == "") && doc) {
    if ("isFrontPage" in doc && doc?.isFrontPage) {
      description = settings?.siteDescription || "";
    } else {
      description = settings?.defaultSeoDescription || "";
    }
  }

  const { canonicalURL, languages } = await generateCanonicalURL({ slug: doc?.slug || "", isFrontPage: doc && "isFrontPage" in doc ? !!doc.isFrontPage : false, settings: settings as Settings, type, locale });
  const ogTypeFinal = (ogType == "product" ? undefined : ogType) || settings.ogType || "website";
  const other = {};
  if (ogType == "product") {
    other["og:type"] = "product";
    other["product:availability"] = "in stock";
    other["product:price:amount"] = price && price.amount ? price.amount.toString() : undefined;
    other["product:price:currency"] = price && price.currencyCode ? price.currencyCode : undefined;
  }
  return {
    description: description,
    openGraph: {
      description: description || "",
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      url: canonicalURL,
      type: ogTypeFinal,
    },
    title,
    alternates: {
      canonical: canonicalURL,
      languages: languages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ogImage ? [ogImage] : [],
      creator: settings.twitterHandle && typeof settings.twitterHandle === "string" ? `@${settings.twitterHandle}` : undefined,
    },
    other,
  };
};

export interface MetaTagsOptions {
  title?: string;
  description?: string;
  image?: string;
}

export const generateStaticMeta = async ({ pageName, locale, type, pageNum, ogType }: { pageName: PageName; locale: string; type: DocType; pageNum?: number; ogType?: OpenGraphType | "product" }): Promise<Metadata> => {
  const settings: Settings | null = (await getCachedGlobal("settings" as never, 1, locale)()) as Settings;
  const options = getPageSeoMeta(settings, pageName);
  if (!settings) {
    return options;
  }
  const siteTitle = settings?.siteTitle || "";
  let titleTemplate = settings?.seoTitleTemplate || "%s | {siteName}";
  const pageTitle = options.title || siteTitle;

  if (pageNum && pageNum > 1) {
    titleTemplate = printf(titleTemplate, printf(settings?.defaultSeoPaginationTitle || "%s - Page %d", pageTitle, pageNum));
  }

  const title = printf(titleTemplate, pageTitle as string).replace("{siteName}", siteTitle);
  const description = (options.description || (settings.defaultSeoDescription as string) || (settings.siteDescription as string) || "").replace("{siteName}", siteTitle);
  const image = typeof settings.defaultSeoImage === "object" && settings.defaultSeoImage?.url ? settings.defaultSeoImage.url : "";
  const siteName = (settings.siteTitle as string) || "";

  const url = await generateURL({ slug: "", isFrontPage: type === "page" ? true : false, type, localeCode: locale });
  const { canonicalURL, languages } = await generateCanonicalURL({ slug: "", isFrontPage: false, settings: settings as Settings, type, locale });

  const ogTypeFinal: OpenGraphType = (ogType == "product" ? undefined : ogType) || settings.ogType || "website";
  const privatePage = ["account", "addresses", "orders", "profile", "cart", "checkout", "login", "logout", "create-account", "recover-password", "reset-password", "verify-email", "resend-verification-email"].includes(type);

  return {
    title,
    description,
    ...(privatePage ? { robots: { index: false, follow: true } } : {}),
    openGraph: {
      title,
      description,
      type: ogTypeFinal,
      url: url,
      siteName,
      images: image
        ? [
            {
              url: image,
              width: 1200,
              height: 630,
              alt: title,
            },
          ]
        : [],
    },
    alternates: {
      canonical: canonicalURL,
      languages: languages,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
      creator: settings.twitterHandle && typeof settings.twitterHandle === "string" ? `@${settings.twitterHandle}` : undefined,
    },
    ...(ogType == "product" ? { other: { "og:type": "product" } } : {}),
  };
};

/**
 * Get page-specific SEO meta from settings
 * @param settings - Settings object from Payload
 * @param pageName - The page name (e.g., 'blogPage', 'loginPage', 'accountPage')
 * @param locale - Optional locale for localized content
 * @returns Object with title and description
 */
const getPageSeoMeta = (settings: Settings | null, pageName: PageName): { title?: string; description?: string } => {
  if (!settings) return {};

  // Map page names to their settings keys
  const pageMetaKeyMap: Record<PageName, { title: keyof Settings; description: keyof Settings }> = {
    blogPage: {
      title: "blogPageTitle",
      description: "blogPageDescription",
    },
    brandsPage: {
      title: "brandsPageTitle",
      description: "brandsPageDescription",
    },
    createAccountPage: {
      title: "createAccountPageTitle",
      description: "createAccountPageDescription",
    },
    loginPage: {
      title: "loginPageTitle",
      description: "loginPageDescription",
    },
    recoverPasswordPage: {
      title: "recoverPasswordPageTitle",
      description: "recoverPasswordPageDescription",
    },
    resendVerificationEmailPage: {
      title: "resendVerificationEmailPageTitle",
      description: "resendVerificationEmailPageDescription",
    },
    resetPasswordPage: {
      title: "resetPasswordPageTitle",
      description: "resetPasswordPageDescription",
    },
    verifyEmailPage: {
      title: "verifyEmailPageTitle",
      description: "verifyEmailPageDescription",
    },
    accountPage: {
      title: "accountPageTitle",
      description: "accountPageDescription",
    },
    addressesPage: {
      title: "addressesPageTitle",
      description: "addressesPageDescription",
    },
    ordersPage: {
      title: "ordersPageTitle",
      description: "ordersPageDescription",
    },
    profilePage: {
      title: "profilePageTitle",
      description: "profilePageDescription",
    },
    collectionsPage: {
      title: "collectionsPageTitle",
      description: "collectionsPageDescription",
    },
    productTagsPage: {
      title: "productTagsPageTitle",
      description: "productTagsPageDescription",
    },
    productsPage: {
      title: "productsPageTitle",
      description: "productsPageDescription",
    },
    categoriesPage: {
      title: "categoriesPageTitle",
      description: "categoriesPageDescription",
    },
    tagsPage: {
      title: "tagsPageTitle",
      description: "tagsPageDescription",
    },
    cartPage: {
      title: "cartPageTitle",
      description: "cartPageDescription",
    },
    checkoutPage: {
      title: "checkoutPageTitle",
      description: "checkoutPageDescription",
    },
    logoutPage: {
      title: "logoutPageTitle",
      description: "logoutPageDescription",
    },
  };

  const keys = pageMetaKeyMap[pageName];
  if (!keys) return {};

  const settingsData = settings;
  const title = settingsData[keys.title] || "";
  const description = settingsData[keys.description] || "";

  return {
    title: (title || undefined) as string | undefined,
    description: (description || undefined) as string | undefined,
  };
};

/* ------------------------------------------------------------------------------------------------
 * Structured data (JSON-LD): extra facts Google reads from the page (brand, articles, breadcrumbs).
 * Render as an inline script:
 *   <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdString(data) }} />
 * ---------------------------------------------------------------------------------------------- */

/** Safe JSON for a <script> tag (no "</script>" breakouts). */
export const jsonLdString = (data: unknown) => JSON.stringify(data).replace(/</g, "\\u003c");

const absoluteURL = (url?: string | null) => (!url ? undefined : /^https?:\/\//.test(url) ? url : getServerSideURL() + url);
const mediaURL = (media: unknown) => (media && typeof media === "object" && "url" in media ? absoluteURL((media as Media).url) : undefined);
const homeURL = (locale?: string) => (!locale || locale === DEFAULT_LOCALE ? getServerSideURL() : `${getServerSideURL()}/${locale}`);

/** "Home › Blog › Article" trail. Items are { name, url }; the last one is the current page. */
export const breadcrumbJSONLD = (items: { name: string; url: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.filter((i) => i.name).map((item, i) => ({ "@type": "ListItem", position: i + 1, name: striptags(item.name), item: item.url })),
});

/** The shop itself (name, logo, social profiles) and the website, for the home page. */
export const organizationJSONLD = async (locale: string) => {
  const settings = (await getCachedGlobal("settings" as never, 1, locale)()) as Settings;
  const header = (await getCachedGlobal("header" as never, 1, locale)()) as any;
  const footer = (await getCachedGlobal("footer" as never, 1, locale)()) as any;
  const name = settings?.siteTitle || "";
  const logo = mediaURL(header?.logoLight) || mediaURL(settings?.androidIcon) || mediaURL(settings?.appleTouchIcon) || mediaURL(settings?.defaultSeoImage);
  const sameAs = (footer?.socialMedia || []).map((s: any) => s?.url).filter(Boolean);
  const organization: Record<string, any> = { "@context": "https://schema.org", "@type": "Organization", "@id": `${getServerSideURL()}/#organization`, name, url: getServerSideURL() };
  if (logo) organization.logo = logo;
  if (sameAs.length) organization.sameAs = sameAs;
  if (settings?.emailFooterEmail) organization.email = settings.emailFooterEmail;
  if (settings?.emailFooterPhone) organization.telephone = settings.emailFooterPhone;
  const website = { "@context": "https://schema.org", "@type": "WebSite", "@id": `${homeURL(locale)}/#website`, name, url: homeURL(locale), inLanguage: locale, publisher: { "@id": `${getServerSideURL()}/#organization` } };
  return [organization, website];
};

/** A blog article: headline, image, dates, author and publisher. */
export const articleJSONLD = async (post: Post, url: string, locale: string) => {
  const settings = (await getCachedGlobal("settings" as never, 1, locale)()) as Settings;
  const header = (await getCachedGlobal("header" as never, 1, locale)()) as any;
  const image = mediaURL(post.meta?.image) || mediaURL(post.heroImage);
  const authors = (post.populatedAuthors || []).map((a) => a?.name).filter(Boolean);
  const publisher: Record<string, any> = { "@type": "Organization", "@id": `${getServerSideURL()}/#organization`, name: settings?.siteTitle || "" };
  const logo = mediaURL(header?.logoLight) || mediaURL(settings?.androidIcon);
  if (logo) publisher.logo = { "@type": "ImageObject", url: logo };
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: striptags(post.meta?.title || post.title || "").substring(0, 110),
    description: post.meta?.description || post.excerpt || undefined,
    image: image ? [image] : undefined,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt,
    inLanguage: locale,
    mainEntityOfPage: { "@type": "WebPage", "@id": url },
    url,
    author: authors.length ? authors.map((name) => ({ "@type": "Person", name })) : publisher,
    publisher,
  };
};
