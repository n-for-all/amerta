import { AmertaApp } from "../types";
import { connectAuthEndpoint } from "./endpoints/connectAuth";
import { searchProductsEndpoint } from "./endpoints/searchProducts";
import { productDetailsEndpoint } from "./endpoints/productDetails";
import { importProductEndpoint } from "./endpoints/importProduct";
import { getCategoriesEndpoint } from "./endpoints/getCategories";
import { calculateShippingEndpoint } from "./endpoints/calculateShipping";
import { importedProductsEndpoint } from "./endpoints/importedProducts";

export const cjDropshippingApp: AmertaApp = {
  name: "CJ Dropshipping",
  slug: "cj-dropshipping",
  description: "Find, source, and import winning products directly from CJ Dropshipping into your store.",
  version: "1.0.0",
  adminNavigation: {
    label: "CJ Dropshipping",
    path: "/admin/cj-dropshipping-settings",
  },
  extendConfig: (config) => {
    return {
      ...config,
      admin: {
        ...(config.admin || {}),
        components: {
          ...(config.admin?.components || {}),
          views: {
            ...(config.admin?.components?.views || {}),
            CJDropshippingSettingsPage: {
              Component: "@/amerta/apps/cj-dropshipping/components/SettingsView#SettingsView",
              path: "/cj-dropshipping-settings",
            },
          },
        },
      },
      endpoints: [
        ...(config.endpoints || []),
        connectAuthEndpoint,
        searchProductsEndpoint,
        productDetailsEndpoint,
        importProductEndpoint,
        getCategoriesEndpoint,
        calculateShippingEndpoint,
        importedProductsEndpoint,
      ],
    };
  },
};
