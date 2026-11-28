import { AmertaApp } from "../types";
import { getCatalogSettingsEndpoint, updateCatalogSettingsEndpoint } from "./endpoints/settings";
import { buyNowEndpoint } from "./endpoints/buyNow";
import { catalogFeedEndpoint } from "./endpoints/feed";
import { catalogItemEndpoint, catalogItemsEndpoint } from "./endpoints/items";

export const catalogApp: AmertaApp = {
  name: "Catalog",
  slug: "catalog",
  description: "A quick buy-now catalog page to share on Instagram, Facebook and WhatsApp, with optional WhatsApp ordering and a product feed for Meta. Orders record that they came from the catalog.",
  version: "1.0.0",
  adminNavigation: {
    label: "Catalog",
    path: "/admin/catalog-settings",
  },
  extendConfig: (config) => ({
    ...config,
    admin: {
      ...(config.admin || {}),
      components: {
        ...(config.admin?.components || {}),
        views: {
          ...(config.admin?.components?.views || {}),
          CatalogSettingsPage: {
            Component: "@/amerta/apps/catalog/components/CatalogSettingsView#CatalogSettingsView",
            path: "/catalog-settings",
          },
        },
      },
    },
    endpoints: [...(config.endpoints || []), getCatalogSettingsEndpoint, updateCatalogSettingsEndpoint, buyNowEndpoint, catalogFeedEndpoint, catalogItemsEndpoint, catalogItemEndpoint],
  }),
};
