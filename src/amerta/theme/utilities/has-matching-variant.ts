import { Product } from "@/payload-types";

/**
 * Check if the selected variant options match any existing product variant
 */
export const hasMatchingVariant = (product: Product, selectedOptions: Array<{ option: string; value: string }>): boolean => {
  if (!product.variants || product.variants.length === 0) {
    return false;
  }

  // Check if at least one variant matches the selected options
  return product.variants.some((variant) => {
    if (!variant.variant) return false;

    // Get the keys from the variant
    const variantKeys = Object.keys(variant.variant);
    const selectedKeys = selectedOptions.map((opt) => opt.option);

    // Check if the selected options are a subset of or equal to the variant options
    // All selected options must exist in the variant and match
    return selectedOptions.every((selected) => {
      const variantOption = variant.variant?.[selected.option];
      return variantOption && variantOption.value === selected.value;
    });
  });
};
