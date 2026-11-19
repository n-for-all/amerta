import { AmertaApp } from "../types";
import { searchCatalogEndpoint } from "./endpoints/search";

export const shopifyCatalogApp: AmertaApp = {
  name: "Shopify Catalog",
  slug: "shopify-catalog",
  description: "Search products from Shopify merchants worldwide and earn commission through Promoted Placements.",
  version: "0.1.0",
  adminNavigation: {
    label: "Shopify Catalog",
    path: "/admin/shopify-catalog",
  },
  extendConfig: (config) => ({
    ...config,
    admin: {
      ...(config.admin || {}),
      components: {
        ...(config.admin?.components || {}),
        views: {
          ...(config.admin?.components?.views || {}),
          ShopifyCatalogPage: {
            Component: "@/amerta/apps/shopify-catalog/components/CatalogView#CatalogView",
            path: "/shopify-catalog",
          },
        },
      },
    },
    endpoints: [...(config.endpoints || []), searchCatalogEndpoint],
  }),
};
