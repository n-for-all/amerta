"use server";

import React from "react";
import { ProductCard } from "@/amerta/theme/components/ProductCard";
import { getAllProductOptions } from "@/amerta/core/utilities/get-product-options";
import { parseSearchFilters } from "@/amerta/core/utilities/parse-search-filters";
import { getProductsBy } from "@/amerta/core/utilities/get-product-by";
import type { Product } from "@/payload-types";

/** Which listing the grid belongs to; mirrors the filter each listing page applies */
export type ProductListScope = { type: "all" } | { type: "collection" | "brand" | "tag"; id: string };

const SCOPE_FIELD = { collection: "collections", brand: "brands", tag: "productTags" } as const;

/**
 * Renders one page of product cards for infinite loading. Uses the same filters, sort and page size as the
 * server-rendered listing page, so page N here is exactly what ?page=N shows.
 */
export async function loadProductsPage({
  scope,
  page,
  searchParams,
  locale,
  perPage = 12,
}: {
  scope: ProductListScope;
  page: number;
  searchParams: Record<string, string | string[]>;
  locale: string;
  perPage?: number;
}): Promise<{ items: React.ReactNode; page: number; totalPages: number }> {
  const allOptions = await getAllProductOptions(locale);
  const { page: _ignored, ...filters } = searchParams || {};
  const { whereQuery, sortQuery } = parseSearchFilters(filters, allOptions, scope.type === "all");
  if (scope.type !== "all") {
    if (!SCOPE_FIELD[scope.type] || typeof scope.id !== "string") throw new Error("Invalid listing");
    whereQuery[SCOPE_FIELD[scope.type]] = { equals: scope.id };
  }

  const safePage = Math.max(1, Math.floor(Number(page) || 1));
  const result = await getProductsBy({ limit: Math.min(48, Math.max(1, perPage)), page: safePage, whereQuery, sortQuery, locale });

  return {
    items: (result.docs || []).map((product: Product) => <ProductCard key={product.id} product={product} locale={locale} options={allOptions} />),
    page: safePage,
    totalPages: result.totalPages || 1,
  };
}
