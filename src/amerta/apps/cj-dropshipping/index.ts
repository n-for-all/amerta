import { AmertaApp } from "../types";
import { connectAuthEndpoint } from "./endpoints/connectAuth";
import { searchProductsEndpoint } from "./endpoints/searchProducts";
import { productDetailsEndpoint } from "./endpoints/productDetails";
import { importProductEndpoint } from "./endpoints/importProduct";
import { getCategoriesEndpoint } from "./endpoints/getCategories";
import { calculateShippingEndpoint } from "./endpoints/calculateShipping";
import { importedProductsEndpoint } from "./endpoints/importedProducts";
import { cjOrderEndpoints } from "./endpoints/orders";

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
    // Products remember their CJ product id, orders keep the CJ order state and show the
    // "Send to CJ" panel (it renders nothing on orders without CJ products).
    const collections = (config.collections || []).map((collection) => {
      if (collection.slug === "products") {
        return {
          ...collection,
          fields: [
            ...collection.fields,
            {
              name: "cjProductId",
              type: "text",
              index: true,
              label: "CJ Product ID",
              admin: { position: "sidebar", readOnly: true, description: "Dropshipped from CJ Dropshipping", condition: (data: any) => Boolean(data?.cjProductId) },
            },
          ],
        } as typeof collection;
      }
      if (collection.slug === "collections") {
        return {
          ...collection,
          fields: [
            ...collection.fields,
            {
              name: "cjCategories",
              type: "textarea",
              label: "CJ categories",
              admin: {
                position: "sidebar",
                description:
                  "CJ categories that import into this collection, one per line (e.g. Bags & Shoes). Everything under them lands here instead of creating new collections.",
              },
            },
          ],
        } as typeof collection;
      }
      if (collection.slug === "orders") {
        return {
          ...collection,
          fields: [
            ...collection.fields,
            {
              name: "cjDropshippingPanel",
              type: "ui",
              admin: {
                position: "sidebar",
                components: { Field: "@/amerta/apps/cj-dropshipping/components/OrderPanel#CJOrderPanel" },
              },
            },
            {
              name: "cjOrder",
              type: "json",
              // Not part of the admin form, so saving an order that was open during a CJ sync can't overwrite it
              admin: { disabled: true },
            },
          ],
        } as typeof collection;
      }
      return collection;
    });

    return {
      ...config,
      collections,
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
        ...cjOrderEndpoints,
      ],
    };
  },
};
