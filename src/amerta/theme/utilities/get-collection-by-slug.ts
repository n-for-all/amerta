import { LocaleCode } from "@/amerta/localization/locales";
import configPromise from "@payload-config";
import { getPayload } from "payload";

export const getCollectionBySlug = async (slug, locale, enabled: boolean = true) => {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "collections",
    where: {
      slug: { equals: slug },
        ...(enabled ? { _status: { equals: "published" } } : {}),
    },
    locale: locale as LocaleCode,
    limit: 1,
  });

  return result.docs[0] || null;
};
