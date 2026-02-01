import { getPayload } from "payload";
import config from "@payload-config";
import { ProductOption } from "@/payload-types";
import { LocaleCode } from "@/amerta/localization/locales";

/**
 * Fetches product options by their IDs
 * @param optionIds - Array of product option IDs to fetch
 * @returns Array of ProductOption objects
 */
export async function getProductOptions(optionIds: string[]): Promise<ProductOption[]> {
  if (!optionIds || optionIds.length === 0) {
    return [];
  }

  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "product-options",
    where: {
      id: {
        in: optionIds,
      },
    },
    limit: optionIds.length,
  });

  return docs;
}

/**
 * Fetches a single product option by ID
 * @param optionId - Product option ID
 * @returns ProductOption object or null if not found
 */
export async function getProductOption(optionId: string): Promise<ProductOption | null> {
  if (!optionId) {
    return null;
  }

  try {
    const payload = await getPayload({ config });

    const option = await payload.findByID({
      collection: "product-options",
      id: optionId,
    });

    return option;
  } catch (error) {
    console.error(`Failed to fetch product option ${optionId}:`, error);
    return null;
  }
}

/**
 * Fetches all product options
 * @returns Array of all ProductOption objects
 */
export async function getAllProductOptions(locale?: string): Promise<ProductOption[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "product-options",
    limit: 1000,
    locale: locale as LocaleCode,
  });

  return docs;
}

/**
 * Fetches product options filtered by type
 * @param type - Option type (text, image, dropdown, radio, color)
 * @returns Array of ProductOption objects
 */
export async function getProductOptionsByType(type: "text" | "image" | "dropdown" | "radio" | "color"): Promise<ProductOption[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "product-options",
    where: {
      type: {
        equals: type,
      },
    },
    limit: 1000,
  });

  return docs;
}

/**
 * Fetches product options that are shown in filters
 * @returns Array of ProductOption objects marked for filter display
 */
export async function getFilterProductOptions(): Promise<ProductOption[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "product-options",
    where: {
      showInFilter: {
        equals: true,
      },
    },
    limit: 1000,
  });

  return docs;
}

/**
 * Fetches product options that are shown in search
 * @returns Array of ProductOption objects marked for search display
 */
export async function getSearchProductOptions(): Promise<ProductOption[]> {
  const payload = await getPayload({ config });

  const { docs } = await payload.find({
    collection: "product-options",
    where: {
      showInSearch: {
        equals: true,
      },
    },
    limit: 1000,
  });

  return docs;
}
