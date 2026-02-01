import configPromise from "@payload-config";
import { Config, getPayload } from "payload";
import { unstable_cache } from "next/cache";
import { DEFAULT_LOCALE, LocaleCode } from "@/amerta/localization/locales";

type Global = keyof Config["globals"];

export async function getGlobal(slug: Global, depth = 0, locale?: string) {
  const payload = await getPayload({ config: configPromise });
  const global = await payload.findGlobal({
    slug,
    depth,
    locale: locale as LocaleCode,
  });

  return global;
}

export const getCachedGlobal = (slug: Global, depth = 0, locale: string = DEFAULT_LOCALE) =>
  unstable_cache(async () => getGlobal(slug, depth, locale), [slug, locale], {
    tags: [`globals`, `global_${slug}`, `global_${slug}_${locale}`],
  });
