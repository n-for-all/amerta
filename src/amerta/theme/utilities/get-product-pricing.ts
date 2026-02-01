import { Currency, Product } from "@/payload-types";

export const getProductPricing = (product: Product, currency: Currency) => {
  // For simple products
  if (product.type === "simple") {
    return {
      type: "simple",
      price: product.price || 0,
      salePrice: product.salePrice || null,
      currency: currency,
      quantity: product.quantity || 0,
      trackInventory: product.trackInventory || false,
    };
  }

  // For variant products
  if (product.type === "variant") {
    if (!product.variants || product.variants.length === 0) {
      return {
        type: "variant",
        price: 0,
        salePrice: 0,
        quantity: 0,
        variants: [],
        currency: currency,
      };
    }

    const variants = product.variants.map((variant) => ({
      price: variant.price || 0,
      salePrice: variant.salePrice || null,
      sku: variant.sku,
      barcode: variant.barcode,
      quantity: variant.quantity || 0,
      trackInventory: variant.trackInventory || false,
      stockStatus: variant.stockStatus || "in_stock",
      variantOptions: variant.variant || {},
      image: variant.image,
    }));

    let price = Math.min(...variants.map((v) => v.salePrice || v.price));

    return {
      type: "variant",
      variants,
      price,
      currency: currency,
      minPrice: Math.min(...variants.map((v) => v.salePrice || v.price)),
      maxPrice: Math.max(...variants.map((v) => v.salePrice || v.price)),
    };
  }

  return null;
};
