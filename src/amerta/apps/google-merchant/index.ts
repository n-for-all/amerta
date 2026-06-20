import { AmertaApp } from "../types";
import { fetchSourcesEndpoint } from "./endpoints/fetchSources";
import { syncProductsEndpoint } from "./endpoints/syncProducts";
import { registerDeveloperEndpoint } from "./endpoints/registerDeveloper";
import { grantAccessEndpoint } from "./endpoints/grantAccess";
import { clearProductsEndpoint } from "./endpoints/clearProducts";

export const googleMerchantApp: AmertaApp = {
  name: "Google Merchant",
  slug: "google-merchant",
  description: "Sync your products with Google Merchant Center.",
  version: "1.0.0",
  adminNavigation: {
    label: "Google Merchant",
    path: "/admin/google-merchant-settings",
  },
  extendConfig: (config) => {
    return {
      ...config,
      endpoints: [
        ...(config.endpoints || []),
        fetchSourcesEndpoint,
        syncProductsEndpoint,
        registerDeveloperEndpoint,
        grantAccessEndpoint,
        clearProductsEndpoint,
      ],
    };
  },
};
