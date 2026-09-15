"use client";

import React, { useEffect, useState } from "react";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";
import { useProductDetail } from "@/amerta/theme/components/ProductDetail/ProductContext";
import { getProductPricing } from "@/amerta/core/utilities/get-product-pricing";
import { printf } from "fast-printf";
import { Sparkles } from "lucide-react";

let cachedSettings: any = null;
let settingsPromise: Promise<any> | null = null;

const getCachedLoyaltySettings = async () => {
  if (cachedSettings) return cachedSettings;
  if (!settingsPromise) {
    settingsPromise = fetch("/api/loyalty/settings")
      .then((res) => res.json())
      .then((data) => {
        cachedSettings = data;
        return data;
      })
      .catch(() => null);
  }
  return settingsPromise;
};

export const ProductPointsBadge: React.FC = () => {
  const { __, currency } = useEcommerce();
  const productDetail = useProductDetail();
  const [settings, setSettings] = useState<any>(cachedSettings);

  useEffect(() => {
    if (!settings) {
      getCachedLoyaltySettings().then((s) => {
        if (s) setSettings(s);
      });
    }
  }, [settings]);

  if (settings && settings.enabled === false) {
    return null;
  }

  // Calculate points for the product
  let points = 0;
  const earningRate = settings?.earningRate || 1;

  if (productDetail?.product) {
    const { product, selectedVariant } = productDetail;
    const pricing = getProductPricing(product, currency);

    let price = 0;
    if (selectedVariant) {
      price =
        selectedVariant.salePrice && selectedVariant.salePrice < selectedVariant.price
          ? selectedVariant.salePrice
          : selectedVariant.price;
    } else if (pricing) {
      if (pricing.type === "simple") {
        price = pricing.salePrice || pricing.price || 0;
      } else if (pricing.type === "variant") {
        price = pricing.minPrice || pricing.price || 0;
      }
    }

    points = Math.max(1, Math.round((price || 0) * earningRate));
  }

  const defaultTemplate =
    "Loyalty Circle: Earn %s reward points on this item and level up your VIP tier.";
  const rawTemplate = settings?.productPointsMessage || defaultTemplate;

  // Wrap template string with translate (__), then replace %s with points
  const pointsFormatted = points > 0 ? points.toLocaleString() : "10";
  const renderedMessage = printf(__(rawTemplate), pointsFormatted);

  // Split on first colon to render prefix like "Loyalty Circle:" in bold if present
  const colonIndex = renderedMessage.indexOf(":");
  let content = <span>{renderedMessage}</span>;
  if (colonIndex !== -1 && colonIndex < 30) {
    const label = renderedMessage.substring(0, colonIndex + 1);
    const rest = renderedMessage.substring(colonIndex + 1);
    content = (
      <span>
        <strong>{label}</strong>
        {rest}
      </span>
    );
  }

  return (
    <div className="mt-3 flex items-center gap-2 border border-amber-200/80 bg-amber-50/50 px-3 py-2 text-xs text-amber-950 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200 rounded-none">
      <Sparkles className="size-4 shrink-0 text-amber-600 dark:text-amber-400" />
      {content}
    </div>
  );
};
