/**
 * @module Products/Hooks/OptionDelete
 * @title Product Option Delete Hook
 * @description Cleanup hook that removes references to deleted product options from all product variants
 */

import { AfterDeleteHook } from "node_modules/payload/dist/collections/config/types";

/**
 * Hook executed after a product option is deleted
 *
 * @remarks
 * This hook ensures data integrity by automatically cleaning up all references to a deleted product option
 * from every product's variants. When a product option is removed, this hook:
 *
 * 1. Finds all products that have variants with option references
 * 2. Iterates through each product's variants
 * 3. Removes the deleted option ID from each variant's option data
 * 4. Updates the product in the database if any variants were modified
 *
 * ## Example Scenario
 * If you have a "Size" option with ID `option-123` and it's used in variants:
 * - Before: `variants[0].variant = { option-123: "Large", option-456: "Red" }`
 * - After deletion: `variants[0].variant = { option-456: "Red" }`
 *
 * ## Performance Considerations
 * - This hook uses `depth: 0` to minimize query overhead
 * - Only updates products that actually have the option reference
 * - Bulk updates happen per product, not per variant
 *
 * @param params - Hook parameters
 * @param params.req - Payload request object with access to the payload API
 * @param params.id - The ID of the deleted product option
 *
 * @example
 * ```typescript
 * // Registered as afterDelete hook on the product-option collection
 * // Automatically triggered when a product option is deleted
 * ```
 */
export const productOptionDelete: AfterDeleteHook = async ({ req, id }) => {
  const products = await req.payload.find({
    collection: "products",
    where: {
      "variants.variant": {
        exists: true,
      },
    },
    depth: 0,
  });

  for (const product of products.docs) {
    let hasChanged = false;
    const updatedVariants = product.variants?.map((v: any) => {
      if (v.variant && v.variant[id]) {
        hasChanged = true;
        const newVariantData = { ...v.variant };
        delete newVariantData[id]; // Remove the specific option reference
        return { ...v, variant: newVariantData };
      }
      return v;
    });
    if (hasChanged) {
      await req.payload.update({
        collection: "products",
        id: product.id,
        data: {
          variants: updatedVariants,
        },
      });
    }
  }
};
