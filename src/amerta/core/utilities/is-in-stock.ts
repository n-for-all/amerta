import { Product, ProductOption } from "@/payload-types";

export const isInStock = (
  product: Product,
  options?:
    | {
        option: string | ProductOption;
        value: string;
      }[]
    | null,
  requiredQuantity = 1, // 1. Renamed to avoid naming conflict
): boolean => {
  if (product.type === "simple") {
    if (product.trackInventory) {
      return product.quantity ? product.quantity >= requiredQuantity : false;
    }
    return product.stockStatus === "in_stock";
  }

  if (product.type === "variant") {
    if (!product.variants || product.variants.length === 0) return false;

    // 2. Fix: If this is a variant product but no options are selected,
    // we can't determine if a specific variant is in stock.
    // Returns false (or true if you want to know if *any* variant is in stock).
    if (!options || options.length === 0) {
      return false;
    }

    const foundVariant = product.variants.find(({ variant }) => {
      if (!variant) return false;

      // Check if EVERY selected option matches this variant's options
      // This logic is safer than your previous loop
      return options.every((option) => {
        return Object.entries(variant).some(([key, value]) => {
          const variantOptionValue = typeof value === "object" && value !== null && "value" in value ? value.value : value;
          const selectedOptionId = typeof option.option === "string" ? option.option : (option.option as ProductOption)?.id;

          return key === selectedOptionId && variantOptionValue === option.value;
        });
      });
    });

    if (!foundVariant) return false;

    // 3. Fix: Use the renamed variable 'requiredQuantity'
    // destructure the variant's specific quantity as 'variantQuantity'
    const { trackInventory, quantity: variantQuantity, stockStatus } = foundVariant;

    if (trackInventory) {
      return variantQuantity ? variantQuantity >= requiredQuantity : false;
    }

    return stockStatus === "in_stock";
  }

  return false;
};
