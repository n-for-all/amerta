import { mongooseAdapter } from "@payloadcms/db-mongodb";

import { FixedToolbarFeature, HeadingFeature, lexicalEditor } from "@payloadcms/richtext-lexical";
import { BlocksField, Config, PayloadHandler, PayloadRequest } from "payload";
import { defaultLexical } from "@/amerta/fields/defaultLexical";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import { nodemailerAdapter } from "@payloadcms/email-nodemailer";
import { Media } from "@/amerta/collections/Media";
import { Orders } from "@/amerta/collections/Orders";
import { Pages } from "@/amerta/collections/Pages";
import ProductsConfig from "@/amerta/collections/Products";
import Users from "@/amerta/collections/Users";
import { Menu } from "@/amerta/collections/Menu";
import { Settings } from "@/amerta/globals/Settings";
import { formBuilderPlugin } from "@payloadcms/plugin-form-builder";
import { nestedDocsPlugin } from "@payloadcms/plugin-nested-docs";
import { redirectsPlugin } from "@payloadcms/plugin-redirects";
import { seoPlugin } from "@payloadcms/plugin-seo";
import { revalidateRedirects } from "@/amerta/hooks/revalidate-redirects";
import BlogConfig from "@/amerta/collections/Blog";
import { GenerateDescription, GenerateImage, GenerateTitle, GenerateURL } from "@payloadcms/plugin-seo/dist/types";
import { type Field } from "payload";
import { Customers, CustomerGroups, CustomerTags } from "@/amerta/collections/Customers";
import { Currencies } from "@/amerta/collections/Currencies";
import { Countries } from "@/amerta/collections/Countries";
import { TaxRates } from "@/amerta/collections/TaxRates";
import { SalesChannel, Store } from "@/amerta/collections/Store";
import { Footer } from "@/amerta/theme/blocks/common/Footer/config";
import { Header } from "@/amerta/theme/blocks/common/Header/config";

import { generateIconsJson } from "@/amerta/fields/icon/generateIcons";
import { Cart } from "@/amerta/collections/Cart";
import { Wishlist } from "@/amerta/collections/Wishlist";
import { CartRules } from "@/amerta/collections/CartRules";
import { Coupons } from "@/amerta/collections/Coupons";
import { Shipping } from "@/amerta/collections/Shipping";

import { getCheckoutData } from "@/amerta/theme/utilities/get-checkout-data";
import PaymentsConfig from "@/amerta/collections/Payment";
import { createStoreData, importBaseData } from "@/amerta/theme/utilities/seed-data";
import { importWooProductsHandler } from "@/amerta/theme/data/imports/import-woo-products";
import { importWpXmlHandler } from "@/amerta/theme/data/imports/import-wp-xml";
import { DEFAULT_LOCALE, LOCALES } from "@/amerta/localization/locales";
import { Translations } from "@/amerta/collections/Translations";
import { searchHandler } from "@/amerta/theme/utilities/search-handler";
import { EmailTemplates } from "@/amerta/collections/EmailTemplates";
import { dynamicTransport } from "@/amerta/utilities/dynamicEmailTransport";
import { sendTestEmail } from "@/amerta/utilities/sendTestEmail";
import { importMediaStock } from "@/amerta/utilities/media-stock/import";
import { searchMediaStock } from "@/amerta/utilities/media-stock/search";
import { afterError } from "@/amerta/hooks/after-error";
import { filterAvailableLocales } from "@/amerta/hooks/filter-available-locales";
import { getCart } from "@/amerta/theme/utilities/get-cart";
import { authenticateOauth } from "@/amerta/auth/handlers/authenticate-oauth";
import { oauthCallback } from "@/amerta/auth/handlers/oauth-callback";
import { getEnabledAuthProviders } from "@/amerta/auth/handlers/get-enabled-providers";
import { getDashboardStats } from "@/amerta/stats/handlers/getDashboardStats";
import deepmerge from "deepmerge";
import { Page, Post } from "@/payload-types";
import { getAdminPath } from "./payload/utilities/getAdminURL";
import { checkRole } from "./payload/access/checkRole";
import { EcommerceSettings } from "./payload/globals/EcommerceSettings";
import { importSampleDataHandler } from "./theme/data/imports/import-sample-data";
import { importShopifyDataHandler } from "./theme/data/imports/import-shopify-data";
import { importPagesHandler } from "./theme/data/imports/import-sample-pages";
import { importBlogsHandler } from "./theme/data/imports/import-sample-blogs";

export const withGuard = (handler: PayloadHandler): PayloadHandler => {
  return async (req) => {
    if (!req.user || !checkRole(["admin"], req.user)) {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    return handler(req);
  };
};

const generateDescription: GenerateDescription<Post | Page> = async ({ doc, req }) => {
  const settings = await req.payload.findGlobal({
    slug: "settings",
  });

  try {
    if (doc?.meta?.description) {
      return doc.meta.description;
    }
    if ("isFrontPage" in doc && doc.isFrontPage) {
      return settings?.siteDescription || "";
    }

    return settings?.defaultSeoDescription || settings?.siteDescription || "";
  } catch (error) {
    console.error("Error generating description:", error);
    return settings?.siteDescription || "";
  }
};

const generateImage: GenerateImage<Post | Page> = async ({ doc, req }) => {
  const settings = await req.payload.findGlobal({
    slug: "settings",
  });

  try {
    if (doc?.meta?.image) {
      return doc.meta.image;
    }

    return settings?.defaultSeoImage || "";
  } catch (error) {
    console.error("Error generating SEO image:", error);
    return settings?.defaultSeoImage || "";
  }
};
const generateTitle: GenerateTitle<Post | Page> = async ({ doc, req }) => {
  const settings = await req.payload.findGlobal({
    slug: "settings",
  });

  const siteTitle = settings?.siteTitle || "";
  const titleTemplate = settings?.seoTitleTemplate || "%s | {siteName}";
  try {
    if (doc?.meta?.title) {
      return titleTemplate.replace("%s", doc.meta.title).replace("{siteName}", siteTitle);
    }

    if (doc?.title) {
      return titleTemplate.replace("%s", doc.title).replace("{siteName}", siteTitle);
    }

    return settings?.defaultSeoTitle || siteTitle;
  } catch (error) {
    console.error("Error generating title:", error);
    return siteTitle;
  }
};

const generateURL: GenerateURL<Post | Page> = ({ doc }) => {
  const url = getServerSideURL();
  return doc?.slug ? `${url}/${doc.slug}` : url;
};

const arrayMerge = (destinationArray: any[], sourceArray: any[]) => {
  return [...destinationArray, ...sourceArray];
};

const isPlainObject = (item: any) => {
  if (Array.isArray(item)) return true;
  return (
    item && typeof item === "object" && item.constructor === Object && !item.$$typeof // Protect React Components
  );
};

export function withAmerta(config: Config): Config {
  const UserCollectionOverrides = config.collections?.find((col) => col.slug === Users.slug);
  let FinalUsersCollection = Users;
  if (UserCollectionOverrides) {
    FinalUsersCollection = deepmerge(Users, UserCollectionOverrides, {
      arrayMerge,
      isMergeableObject: isPlainObject,
    });
  }

  const adminPath = getAdminPath();
  const { onInit: configOnInit, ...configWithoutOnInit } = config;

  const amertaConfig: Omit<Config, "secret"> = {
    admin: {
      components: {
        beforeNavLinks: ["@/amerta/components/DashboardLink"],
        beforeLogin: ["@/amerta/components/BeforeLogin"],
        graphics: {
          Logo: "@/amerta/theme/admin/Logo#Logo",
          Icon: "@/amerta/theme/admin/Icon#Icon",
        },
        afterNavLinks: ["@/amerta/components/Imports/index"],
        views: {
          dashboard: {
            path: "/",
            Component: "@/amerta/components/Dashboard",
          },
          list: {
            path: "/versions",
            Component: "@/amerta/components/Versions/Pages/PageVersions#PageVersions",
          },
          CustomImportPage: {
            Component: "@/amerta/components/Imports/ImportView#ImportView",
            path: "/import-wp",
          },
          CustomSampleDataPage: {
            Component: "@/amerta/components/Imports/ImportSampleData#ImportSampleData",
            path: "/import-sample-data",
          },
          CustomShopifyDataPage: {
            Component: "@/amerta/components/Imports/ImportShopifyData#ImportShopifyData",
            path: "/import-shopify-data",
          },
        },
        // providers: ["@/amerta/theme/components/Onboarding/providers/Guard#SetupGuardProvider"],
      },
    },
    hooks: {
      afterError: [afterError],
    },
    editor: defaultLexical,
    db: mongooseAdapter({
      url: process.env.DATABASE_URI || "",
    }),
    serverURL: getServerSideURL(),
    globals: [EcommerceSettings, Header, Footer, Settings],
    collections: [...ProductsConfig, Pages, ...BlogConfig, Translations, Store, SalesChannel, Orders, Customers, CustomerGroups, CustomerTags, FinalUsersCollection, Menu, Media, Currencies, Countries, TaxRates, Shipping, ...PaymentsConfig, Cart, CartRules, Wishlist, Coupons, EmailTemplates],
    email: nodemailerAdapter({
      defaultFromAddress: process.env.EMAIL_FROM || "",
      defaultFromName: process.env.EMAIL_APP_NAME || "",
      transport: dynamicTransport,
    }),
    localization: {
      defaultLocale: DEFAULT_LOCALE,
      locales: LOCALES as any,
      filterAvailableLocales: filterAvailableLocales,
    },
    plugins: [
      redirectsPlugin({
        collections: ["pages", "posts", "categories", "products", "collections"],
        redirectTypes: ["301", "302"],
        redirectTypeFieldOverride: {
          label: "Redirect Type (Overridden)",
        },
        overrides: {
          admin: {
            group: "Settings",
          },
          fields: ({ defaultFields }: { defaultFields: Field[] }) => {
            return defaultFields.map((field) => {
              if ("name" in field && field.name === "from") {
                return {
                  ...field,
                };
              }
              return field;
            });
          },
          hooks: {
            afterChange: [revalidateRedirects],
          },
        },
      }),
      nestedDocsPlugin({
        collections: ["categories", "collections"],
        generateURL: (docs: Array<Record<string, unknown>>) => docs.reduce((url, doc) => `${url}/${doc.slug || ""}`, "") as any,
      }),
      seoPlugin({
        generateImage,
        generateDescription,
        generateTitle,
        generateURL,
        tabbedUI: true,
      }),
      formBuilderPlugin({
        fields: {
          payment: false,
        },
        formSubmissionOverrides: {
          admin: {
            group: "Content",
          },
        },
        formOverrides: {
          admin: {
            group: "Settings",
          },
          fields: ({ defaultFields }: { defaultFields: Field[] }) => {
            return defaultFields.map((field) => {
              if ("name" in field && field.name === "fields") {
                const blocks = (field as BlocksField).blocks.map((block) => {
                  if (block.slug == "country") {
                    return {
                      ...block,
                      slug: "country_field",
                    };
                  }

                  if (["text", "email", "tel", "url"].includes(block.slug)) {
                    block.fields.push({ name: "placeholder", type: "text", localized: true, label: "Placeholder" });
                  }
                  return block;
                });

                return {
                  ...field,
                  blocks: blocks,
                };
              }
              if ("name" in field && field.name === "confirmationMessage") {
                return {
                  ...field,
                  localized: true,
                  editor: lexicalEditor({
                    features: ({ rootFeatures }) => {
                      return [...rootFeatures, FixedToolbarFeature(), HeadingFeature({ enabledHeadingSizes: ["h1", "h2", "h3", "h4"] })];
                    },
                  }),
                };
              }

              return field;
            });
          },
        },
      }),
    ],
    onInit: async (payload) => {
      try {
        const stores = await payload.find({
          collection: "store",
          limit: 1,
        });
        if (stores.totalDocs > 0) {
          return;
        }

        console.log("✓ Amerta initialization started.");
        const { logs, error } = await importBaseData(payload);
        if (error) {
          console.error("Error importing base data on init:", error);
        } else {
          (logs || []).forEach((log) => console.log(log));
        }

        const { logs: storeLogs, error: storeError } = await createStoreData(payload, "USD");
        if (storeError) {
          console.error("Error creating store data on init:", storeError);
        } else {
          (storeLogs || []).forEach((log) => console.log(log));
        }
      } catch (error) {
        console.error("Error during onInit data seeding:", error);
      }

      console.log("✓ Amerta initialization complete.");
      if (configOnInit) {
        await configOnInit(payload);
      }
    },
    endpoints: [
      {
        path: "/checkout/data",
        method: "get",
        handler: async (req: PayloadRequest) => {
          try {
            const data = await getCheckoutData();

            //@ts-expect-error req.cookies is not typed
            const cartIdCookie = req.cookies.get("cartId")?.value;
            return Response.json({
              success: true,
              data: {
                ...data,
                cart: await getCart(cartIdCookie),
              },
            });
          } catch (error) {
            console.error("Error fetching checkout data:", error);
            return Response.json(
              {
                success: false,
                error: "Failed to fetch checkout data",
              },
              { status: 500 },
            );
          }
        },
      },
      {
        path: "/fields/icons",
        method: "get",
        handler: async (req: PayloadRequest) => {
          if (!req.user) {
            return Response.json({ error: "Unauthorized" }, { status: 401 });
          }

          try {
            const icons = await generateIconsJson();
            return Response.json(icons || []);
          } catch (error) {
            console.error("Error generating icons:", error);
            return Response.json({ error: "Internal server error" }, { status: 500 });
          }
        },
      },
      {
        path: `/${adminPath}/media-stock/search`,
        method: "get",
        handler: withGuard(searchMediaStock),
      },
      {
        path: `/${adminPath}/media-stock/import`,
        method: "post",
        handler: withGuard(importMediaStock),
      },
      {
        path: `/${adminPath}/setup/import`,
        method: "post",
        handler: withGuard(async (req) => {
          if (!req.user || !checkRole(["admin"], req.user)) return Response.json({ error: "Unauthorized" }, { status: 401 });
          const result = await importBaseData(req.payload);
          return Response.json(result);
        }),
      },
      {
        path: `/${adminPath}/setup/currencies`,
        method: "get",
        handler: withGuard(async (req) => {
          const currencies = await req.payload.find({
            collection: "currency",
            limit: 300,
            sort: "code",
          });
          return Response.json({ docs: currencies.docs });
        }),
      },
      {
        path: `/${adminPath}/setup/store`,
        method: "post",
        handler: withGuard(async (req) => {
          const { currency } = await req.json!();
          const result = await createStoreData(req.payload, currency);
          return Response.json(result);
        }),
      },
      {
        path: `/${adminPath}/setup-status`,
        method: "get",
        handler: withGuard(async (req) => {
          const store = await req.payload.find({ collection: "store", limit: 1 });
          return Response.json({ isSetup: store.totalDocs > 0 });
        }),
      },
      {
        path: `/${adminPath}/import-woo-products`,
        method: "post",
        handler: withGuard(importWooProductsHandler),
      },
      {
        path: `/${adminPath}/import-wp-xml`,
        method: "post",
        handler: withGuard(importWpXmlHandler),
      },
      {
        path: `/${adminPath}/import-sample-data`,
        method: "post",
        handler: withGuard(importSampleDataHandler),
      },
      {
        path: `/${adminPath}/import-shopify-data`,
        method: "post",
        handler: withGuard(importShopifyDataHandler),
      },
      {
        path: `/${adminPath}/import-pages`,
        method: "post",
        handler: withGuard(importPagesHandler),
      },
      {
        path: `/${adminPath}/import-blogs`,
        method: "post",
        handler: withGuard(importBlogsHandler),
      },
      {
        path: "/live-search",
        method: "get",
        handler: searchHandler,
      },
      {
        path: `/${adminPath}/send-test-email`,
        method: "post",
        handler: withGuard(sendTestEmail),
      },
      {
        path: "/auth/:provider/:locale/authenticate",
        method: "post",
        handler: authenticateOauth,
      },
      {
        path: "/auth/:provider/:locale/callback",
        method: "get",
        handler: oauthCallback,
      },
      {
        path: "/auth/providers",
        method: "get",
        handler: getEnabledAuthProviders,
      },
      {
        path: "/stats/dashboard",
        method: "get",
        handler: withGuard(getDashboardStats),
      },
      {
        path: "/404",
        method: "get",
        handler: () => {
          return new Response(null, { status: 404 });
        },
      },
    ],
    experimental: {
      localizeStatus: true,
    },
  };

  // Warn about duplicate collection slugs and return unique ones only
  const amertaCollectionSlugs = new Set(amertaConfig.collections?.map((col: any) => col.slug) || []);

  const filteredConfigCollections = (config.collections || []).filter((col: any) => {
    if (col.slug && amertaCollectionSlugs.has(col.slug) && col.slug !== FinalUsersCollection.slug) {
      console.warn(`\x1b[33mDuplicate collection slug detected: "${col.slug}" - removing from config to avoid conflicts\x1b[0m`);
      return false;
    }
    return col.slug !== FinalUsersCollection.slug;
  });

  const mergedConfig = {
    ...configWithoutOnInit,
    collections: filteredConfigCollections,
  };

  if (!config.admin?.user) {
    mergedConfig.admin = {
      ...(mergedConfig.admin || {}),
      user: FinalUsersCollection.slug,
    };
  }

  return deepmerge(amertaConfig, mergedConfig, { arrayMerge, isMergeableObject: isPlainObject }) as Config;
}
