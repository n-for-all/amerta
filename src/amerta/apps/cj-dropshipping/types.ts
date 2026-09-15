export interface CJSettings {
  email?: string;
  apiKey?: string;
  accessToken?: string;
  tokenExpiryDate?: string;
  markupType?: "multiplier" | "fixed" | "percentage";
  markupValue?: number;
  roundTo99?: boolean;
  defaultSalesChannelId?: string;
  autoPublish?: boolean;
  defaultStock?: number;
  defaultShippingCountry?: string;
  categoryMappingMode?: "auto_create" | "single_collection";
  defaultCollectionId?: string;

  // Smart Dropshipping & Shipping Protection Rules (All monetary values in CJ USD $)
  enablePriceFloor?: boolean;
  minPriceFloorUSD?: number; // In CJ USD ($) (e.g. 15.00)
  minPriceFloor?: number; // In store default currency (legacy fallback)

  enableShippingBuffer?: boolean;
  shippingBufferUSD?: number; // In CJ USD ($) (e.g. 4.00)

  enableTieredMarkup?: boolean;
  tieredThresholdUSD?: number; // In USD (e.g. 5.00)
  tieredMultiplier?: number; // Multiplier for low-cost items (e.g. 3.5)

  // Multi-rule Shipping & Import Protection Rules (controls allow/block and buffer cushion)
  shippingImportRules?: CJShippingImportRule[];
}

export type CJRuleField = "all" | "weight" | "weight_not_set" | "cost" | "variants_count";
export type CJRuleOperator = "always" | "greater_than" | "less_than" | "equals" | "is_not_set";
export type CJRuleAction = "allow" | "block" | "warning";

export interface CJShippingImportRule {
  id: string;
  name: string;
  field: CJRuleField;
  operator: CJRuleOperator;
  value?: number;
  action: CJRuleAction;
  bufferUSD?: number;
  enabled: boolean;
}

export interface CJCategory {
  categoryId: string;
  categoryName: string;
  categoryFirstId?: string;
  categoryFirstName?: string;
  categorySecondId?: string;
  categorySecondName?: string;
  children?: CJCategory[];
}

export interface CJProductListItem {
  pid: string;
  productNameEn: string;
  productSku: string;
  productImage: string;
  productWeight: number;
  sellPrice: string;
  categoryName?: string;
  categoryId?: string;
  sourceFrom?: number;
  addMarkStatus?: number;
  calculatedRetailPrice?: number;
  isOverweight?: boolean;
  importBlocked?: boolean;
  importBlockedReason?: string;
  shippingBufferUSD?: number;
  matchedRuleName?: string;
  variants?: any[];
}

export interface CJVariant {
  vid: string;
  pid: string;
  variantName: string;
  variantNameEn: string;
  variantImage: string;
  variantSku: string;
  variantUnit: string;
  variantProperty: string;
  variantKey: string;
  variantLength: number;
  variantWidth: number;
  variantHeight: number;
  variantVolume: number;
  variantWeight: number;
  variantSellPrice: number;
  variantStandardPrice?: number;
  inventory?: number;
  calculatedRetailPrice?: number;
}

export interface CJProductDetail {
  pid: string;
  productName: string;
  productNameEn: string;
  productSku: string;
  productImage: string;
  productWeight: number;
  productType: string;
  categoryId: string;
  categoryName: string;
  entryNameEn: string;
  productImageSet: string[];
  description: string;
  sellPrice?: string;
  variants: CJVariant[];
}

export interface CJSearchQuery {
  keyword?: string;
  categoryId?: string;
  pageNum?: number;
  pageSize?: number;
  startPrice?: number;
  endPrice?: number;
  countryCode?: string;
  productFlag?: number;
  addMarkStatus?: number;
  startWarehouseInventory?: number;
  productType?: number;
}

export interface ImportProductOptions {
  pid: string;
  customTitle?: string;
  customPrice?: number;
  salesChannelId?: string;
  categoryId?: string;
  collectionId?: string;
  publishStatus?: "published" | "draft";
  selectedVariantVids?: string[];
}

export interface BulkImportItem {
  pid: string;
  title: string;
  image?: string;
  cost?: string;
  retailPrice?: number;
  categoryName?: string;
  status: "pending" | "importing" | "success" | "failed";
  message?: string;
}

export interface BulkImportProgress {
  current: number;
  total: number;
  successCount: number;
  failCount: number;
}

/**
 * Safely parse any weight string or number from CJ into grams (integer).
 * Handles "250g", "0.25kg", "250", etc.
 */
export function parseCJWeight(val: any): number {
  if (val === null || val === undefined) return 0;
  if (typeof val === "number") {
    if (isNaN(val) || val <= 0) return 0;
    return Math.round(val);
  }
  const str = String(val).trim().toLowerCase();
  if (!str) return 0;

  // Extract first floating-point number from string
  const match = str.match(/([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return 0;

  const num = parseFloat(match[1]);
  if (isNaN(num) || num <= 0) return 0;

  // If unit is explicitly in kilograms, convert to grams
  if (str.includes("kg")) {
    return Math.round(num * 1000);
  }

  return Math.round(num);
}

/**
 * Resolve effective weight for a product in grams.
 * Checks productWeight, weight, packWeight, packingWeight, grossWeight on parent,
 * and falls back to variants if parent weight is not set or 0.
 */
export function resolveEffectiveProductWeight(product: {
  productWeight?: any;
  weight?: any;
  packWeight?: any;
  packingWeight?: any;
  grossWeight?: any;
  variants?: any[];
} | null | undefined): number {
  if (!product) return 0;

  const parentWeight = parseCJWeight(
    product.productWeight ||
    product.weight ||
    product.packWeight ||
    product.packingWeight ||
    product.grossWeight
  );

  if (parentWeight > 0) {
    return parentWeight;
  }

  // Variant fallback (e.g. apparel with variants having individual variantWeight)
  if (Array.isArray(product.variants) && product.variants.length > 0) {
    const variantWeights = product.variants
      .map((v: any) =>
        parseCJWeight(
          v?.variantWeight ||
          v?.weight ||
          v?.packWeight ||
          v?.packingWeight ||
          v?.grossWeight
        )
      )
      .filter((w: number) => w > 0);

    if (variantWeights.length > 0) {
      return Math.max(...variantWeights);
    }
  }

  return 0;
}

