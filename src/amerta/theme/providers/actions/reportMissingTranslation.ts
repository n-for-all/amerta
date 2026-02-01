"use server";

import { getPayload } from "payload";
import configPromise from "@payload-config";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";

export async function reportMissingTranslation(key: string, domain: string = "default", locale: string) {
  const payload = await getPayload({ config: configPromise });
  if (!key || typeof key !== "string" || key.trim() == "") return;

  try {
    const existing = await payload.find({
      collection: "translations",
      where: { key: { equals: key }, domain: { equals: domain } },
    });

    if (existing.totalDocs > 0) return;

    await payload.create({
      collection: "translations",
      data: {
        key,
        domain,
        value: key,
      },
      locale: DEFAULT_LOCALE,
      context: {
        disableRevalidation: true,
      },
    });
  } catch (error) {
    console.error("Failed to report missing translation:", error, locale);
  }
}
