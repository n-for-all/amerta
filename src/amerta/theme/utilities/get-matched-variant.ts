import { variantsMatch } from "@/amerta/theme/utilities/variants-match";
import { Product, ProductOption } from "@/payload-types";

export const getMatchedVariant = (product: Product, variantOptions: { option: string | ProductOption; value: string }[], allOptions: ProductOption[]) => {
  const variant = product.variants?.find((v) => {
    //!filter out invalid variant options, especially when you delete an option, sometime it is not removed from the db
    const validVariantOptions = Object.entries(v.variant || {}).filter(([key]) => allOptions.some((opt) => opt.id === key));
    return variantsMatch(
      validVariantOptions
        ? validVariantOptions.map(([key, value]) => {
            const variantOptionValue = typeof value === "object" && value !== null && "value" in value ? value.value : value;
            return { option: key, value: variantOptionValue };
          })
        : [],
      variantOptions,
    );
  });

  return variant;
};
