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
  choices?: BundleChoice[] | null, // bundles: the products the customer chose
): boolean => {
  if (product.type === "bundle") {
    // The bundle itself, every included product and every chosen product must be in stock (populated, i.e. read with depth >= 1)
    const items = product.bundleItems || [];
    const own = product.trackInventory ? (product.quantity ?? 0) >= requiredQuantity : product.stockStatus !== "out_of_stock";
    const included = items.every((b) => typeof b.product === "object" && !!b.product && isInStock(b.product, bundleItemOptions(b.product, b.variant), (b.quantity || 1) * requiredQuantity));
    const chosen = resolveBundleChoices(product, choices).every((c) => !!c.chosen && isInStock(c.chosen, null, c.quantity * requiredQuantity));
    return own && included && chosen;
  }

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

/** A product chosen by the customer for one of a bundle's choices ({ group: choice row id, product }). */
export type BundleChoice = { group?: string | null; product: string | Product };

const idOf = (p: any): string | undefined => (typeof p === "string" ? p : p?.id);

/**
 * Resolves the customer's choices for a bundle: one populated product per choice group.
 * `wanted` may be choice objects or plain product ids (e.g. from ?choice=a,b). A choice that is missing
 * or not allowed falls back to the first option in stock when `fallback` is true, otherwise it stays empty.
 */
export const resolveBundleChoices = (product: Product, wanted?: (BundleChoice | string)[] | null, fallback = false) =>
  (product.bundleChoices || []).map((group) => {
    const options = (group.products || []).filter((p): p is Product => typeof p === "object" && !!p);
    const ids = (wanted || []).filter((w) => typeof w === "string" || !w.group || w.group === group.id).map((w) => (typeof w === "string" ? w : idOf(w.product)));
    let chosen = options.find((o) => ids.includes(o.id)) || null;
    if (!chosen && fallback) chosen = options.find((o) => isInStock(o, null, group.quantity || 1)) || options[0] || null;
    return { group: group.id || "", label: group.label, quantity: group.quantity || 1, options, chosen };
  });

/** The selected options of a bundle line's variant (null for a simple product, [] if no valid variant is chosen). */
export const bundleItemOptions = (product: Product, variantId?: string | null): VariantOption[] | null => {
  if (product.type !== "variant") return null;
  const variant = product.variants?.find((v) => v.id === variantId)?.variant;
  if (!variant) return [];
  return Object.entries(variant).map(([option, value]) => ({ option, value: typeof value === "object" && value !== null && "value" in value ? String((value as any).value) : String(value) }));
};

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
  // Group lines by product so several lines of the same product are applied in one write.
  // A bundle line reduces the bundle's own stock and that of every included product.
  const byProduct = new Map<string, { quantity: number; options: VariantOption[] | null; variantId?: string | null }[]>();
  const addLine = (productId: string, quantity: number, options: VariantOption[] | null, variantId?: string | null) => {
    const lines = byProduct.get(productId) || [];
    lines.push({ quantity, options, variantId });
    byProduct.set(productId, lines);
  };
  for (const item of order.items || []) {
    const productId = typeof item.product === "string" ? item.product : item.product?.id;
    if (!productId) continue;
    const quantity = Number(item.quantity) || 1;
    const options = Array.isArray(item.metaData) ? (item.metaData as VariantOption[]) : null;
    const product: Product | null = await payload.findByID({ collection: "products", id: productId, depth: 0, req }).catch(() => null);
    addLine(productId, quantity, options);
    if (product?.type === "bundle") {
      for (const b of product.bundleItems || []) {
        const id = typeof b.product === "string" ? b.product : b.product?.id;
        if (id) addLine(id, (b.quantity || 1) * quantity, null, b.variant);
      }
      for (const c of (item.bundleChoices || []) as BundleChoice[]) {
        const group = (product.bundleChoices || []).find((g) => g.id === c.group);
        const id = idOf(c.product);
        if (id) addLine(id, (group?.quantity || 1) * quantity, null);
      }
    }
  }

  for (const [productId, lines] of byProduct) {
    try {
      const product: Product = await payload.findByID({ collection: "products", id: productId, depth: 0, req });
      if (!product) continue;

      if (product.type === "variant") {
        const variants = [...(product.variants || [])].map((v) => ({ ...v }));
        let changed = false;
        for (const line of lines) {
          const match = line.variantId ? variants.find((v) => v.id === line.variantId) : findMatchingVariant({ ...product, variants }, line.options);
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

/**
 * How many units can be bought right now (Infinity when stock isn't tracked).
 * Variant products need the selected options; without them the answer is Infinity (not known yet).
 * A bundle is limited by its own stock and by every included product.
 */
export const availableQuantity = (product: Product, options?: VariantOption[] | null, choices?: BundleChoice[] | null): number => {
  const own = (trackInventory?: boolean | null, quantity?: number | null, stockStatus?: string | null) =>
    trackInventory ? Math.max(0, Number(quantity) || 0) : stockStatus === "out_of_stock" ? 0 : Infinity;

  if (product.type === "bundle") {
    let available = own(product.trackInventory, product.quantity, product.stockStatus);
    for (const b of product.bundleItems || []) {
      if (typeof b.product !== "object" || !b.product) return 0;
      available = Math.min(available, Math.floor(availableQuantity(b.product, bundleItemOptions(b.product, b.variant)) / (b.quantity || 1)));
    }
    // A chosen product limits the bundle; without a choice yet, the best option in the group does
    for (const c of resolveBundleChoices(product, choices)) {
      const best = c.chosen ? availableQuantity(c.chosen) : Math.max(0, ...c.options.map((o) => availableQuantity(o)));
      available = Math.min(available, Math.floor(best / c.quantity));
    }
    return (product.bundleItems || []).length || (product.bundleChoices || []).length ? available : 0;
  }
  if (product.type === "variant") {
    if (!options?.length) return Infinity;
    const variant = findMatchingVariant(product, options);
    return variant ? own(variant.trackInventory, variant.quantity, variant.stockStatus) : 0;
  }
  return own(product.trackInventory, product.quantity, product.stockStatus);
};

export type BundlePart = { key: string; image: any; title: string; detail: string | null; quantity: number; slug?: string | null; choice?: boolean };

const firstImage = (p: any) => (Array.isArray(p?.images) ? p.images.find((m: any) => m && typeof m === "object") : null) || null;

/**
 * Everything a bundle page shows, in display order: the included product marked "Main" first, then the bundle's
 * own item (when it has an item name, or has no customer choices), the other included products, then the chosen products.
 * `choices` are the customer's picks (missing ones fall back to the first option in stock); `pickImage` lets a theme choose the picture.
 */
export const bundleParts = (product: Product, choices?: (BundleChoice | string)[] | null, pickImage: (p: any) => any = firstImage) => {
  const included: (BundlePart & { main: boolean })[] = [];
  for (const b of product.bundleItems || []) {
    const p = b.product;
    if (!p || typeof p !== "object") continue;
    const variant = p.variants?.find((v) => v.id === b.variant);
    const detail = variant?.variant ? Object.values(variant.variant as Record<string, any>).map((o) => o?.value).filter(Boolean).join(" · ") : null;
    const image = variant?.image && typeof variant.image === "object" && (variant.image as any).url ? variant.image : pickImage(p);
    included.push({ key: b.id || p.id, image, title: p.title, detail, quantity: b.quantity || 1, slug: p.slug, main: !!b.isMain });
  }
  const resolved = resolveBundleChoices(product, choices, true);
  const chosen: BundlePart[] = resolved
    .filter((c) => c.chosen)
    .map((c) => ({ key: `choice-${c.group}`, image: pickImage(c.chosen), title: c.chosen!.title, detail: c.label || null, quantity: c.quantity, slug: c.chosen!.slug, choice: true }));
  const showOwn = !!product.bundleItemName || !(product.bundleChoices || []).length;
  const own: BundlePart[] = showOwn ? [{ key: product.id, image: pickImage(product), title: product.bundleItemName || product.title, detail: product.bundleItemDetail || null, quantity: 1 }] : [];
  const main = included.find((i) => i.main);
  const rest = included.filter((i) => i !== main);
  return { parts: [...(main ? [main] : []), ...own, ...rest, ...chosen] as BundlePart[], choices: resolved };
};
