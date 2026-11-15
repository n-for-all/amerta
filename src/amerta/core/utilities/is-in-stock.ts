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

type VariantOption = { option: string | ProductOption; value: string };

/** Finds the product variant matching the selected options (same matching rules as isInStock). */
export const findMatchingVariant = (product: Product, options?: VariantOption[] | null) => {
  if (!product.variants?.length || !options?.length) return undefined;
  return product.variants.find(({ variant }) => {
    if (!variant) return false;
    return options.every((option) =>
      Object.entries(variant).some(([key, value]) => {
        const variantOptionValue = typeof value === "object" && value !== null && "value" in value ? value.value : value;
        const selectedOptionId = typeof option.option === "string" ? option.option : (option.option as ProductOption)?.id;
        return key === selectedOptionId && variantOptionValue === option.value;
      }),
    );
  });
};

/**
 * Server-side: reduce (direction = -1) or restore (direction = 1) inventory for an order's items.
 * Only products/variants with "Track Inventory" enabled are changed.
 * `payload` and `req` are passed in so this file stays importable from client code.
 */
export async function adjustOrderStock(order: { id: string; items?: any[] | null }, direction: -1 | 1, payload: any, req?: any): Promise<void> {
  // Group lines by product so several lines of the same product are applied in one write
  const byProduct = new Map<string, { quantity: number; options: VariantOption[] | null }[]>();
  for (const item of order.items || []) {
    const productId = typeof item.product === "string" ? item.product : item.product?.id;
    if (!productId) continue;
    const options = Array.isArray(item.metaData) ? (item.metaData as VariantOption[]) : null;
    const lines = byProduct.get(productId) || [];
    lines.push({ quantity: Number(item.quantity) || 1, options });
    byProduct.set(productId, lines);
  }

  for (const [productId, lines] of byProduct) {
    try {
      const product: Product = await payload.findByID({ collection: "products", id: productId, depth: 0, req });
      if (!product) continue;

      if (product.type === "variant") {
        const variants = [...(product.variants || [])].map((v) => ({ ...v }));
        let changed = false;
        for (const line of lines) {
          const match = findMatchingVariant({ ...product, variants }, line.options);
          if (!match?.trackInventory) continue;
          match.quantity = Math.max(0, (Number(match.quantity) || 0) + direction * line.quantity);
          changed = true;
        }
        if (changed) {
          await payload.update({ collection: "products", id: productId, data: { variants }, req, context: { inventoryAdjustment: true } });
        }
      } else if (product.trackInventory) {
        const total = lines.reduce((sum, l) => sum + l.quantity, 0);
        const quantity = Math.max(0, (Number(product.quantity) || 0) + direction * total);
        await payload.update({ collection: "products", id: productId, data: { quantity }, req, context: { inventoryAdjustment: true } });
      }
    } catch (err) {
      payload.logger?.error?.(`[Inventory] Failed to ${direction < 0 ? "reduce" : "restore"} stock for product ${productId} (order ${order.id}): ${err}`);
    }
  }
}
