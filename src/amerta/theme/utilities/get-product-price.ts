import { Product, ProductOption } from "@/payload-types";
import { variantsMatch } from "./variants-match";

export const getProductPrice = (product: Product, variantOptions?: Array<{ option: string | ProductOption; value: string }>) => {
  // For simple products
  if (product.type === "simple") {
    return {
      type: "simple",
      price: product.price || 0,
      salePrice: product.salePrice || null,
    };
  }

  // For variant products
  if (product.type === "variant") {
    if (!product.variants || product.variants.length === 0) {
      return {
        type: "variant",
        price: 0,
        salePrice: 0,
      };
    }

    const matchedVariant = product.variants.find((variant) => {
      if (!variant.variant) {
        return false;
      }

      const variantMainOptions = Object.keys(variant.variant).map((key) => ({
        option: key,
        value: variant.variant ? variant.variant[key] : null,
      }));

      if (variantMainOptions.length !== variantMainOptions.length || variantMainOptions.length == 0) {
        return false;
      }

      return variantsMatch(variantMainOptions, variantOptions || []);
    });

    if (matchedVariant) {
      return {
        type: "variant",
        price: matchedVariant.price || 0,
        salePrice: matchedVariant.salePrice || null,
      };
    } else {
      return {
        type: "variant",
        price: 0,
        salePrice: 0,
      };
    }
  }
  return {
    type: "variant",
    price: 0,
    salePrice: 0,
  };
};
