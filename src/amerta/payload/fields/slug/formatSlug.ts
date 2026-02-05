import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { slugify } from "@/amerta/utilities/slugify";
import type { FieldHook } from "payload";

export const formatSlug = (val: string): string => {
  let slugifier = new slugify();
  return slugifier.generate(val).toLowerCase();
};

export const formatSlugHook =
  (fallback: string): FieldHook =>
  ({ operation, value, originalDoc, data, req }) => {
    // 1. SKIP if we are not in the default locale (English)
    if (req.locale && req.locale !== DEFAULT_LOCALE) {
      return value || originalDoc?.slug;
    }

    if (!data?.slugLock) {
      if (typeof value === "string" && value.trim() !== "") {
        return formatSlug(value);
      } else {
        const fallbackData = data?.[fallback] || originalDoc?.[fallback];
        if (fallbackData && typeof fallbackData === "string") {
          return formatSlug(fallbackData);
        }
      }
    } else {
      // We always want to generate a slug if one is missing.
      if (operation === "create") {
        const fallbackData = data?.[fallback] || originalDoc?.[fallback];
        if (fallbackData && typeof fallbackData === "string") {
          return formatSlug(fallbackData);
        }
      }

      //only add a slug on update if one doesn't exist
      if (operation === "update" && (!originalDoc?.slug || originalDoc?.slug.trim() === "")) {
        const fallbackData = data?.[fallback] || originalDoc?.[fallback];

        if (fallbackData && typeof fallbackData === "string") {
          return formatSlug(fallbackData);
        }
      }
    }
    return value;
  };
