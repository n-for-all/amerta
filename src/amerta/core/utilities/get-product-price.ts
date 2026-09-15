import { Product, ProductOption } from "@/payload-types";
import { variantsMatch } from "./variants-match";

export const getProductPrice = (product: Product, variantOptions?: { option: string | ProductOption; value: string }[], options?: ProductOption[]) => {
  if (product.type === "simple") {
    return {
      type: "simple",
      price: product.price || 0,
      salePrice: product.salePrice || null,
    };
  }

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

      const variantMainOptions = Object.keys(variant.variant)
        .filter((key) => {
          //! remove invalid options, especially when you delete an option, sometime it is not removed from the db
          return options ? options.some((opt) => opt.id === key) : true;
        })
        .map((key) => ({
          option: key,
          value: variant.variant ? variant.variant[key]!.value : "---",
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
