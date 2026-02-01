import { draftMode } from "next/headers";
import { getPayload } from "payload";
import { cache } from "react";
import configPromise from "@payload-config";
import { LocaleCode } from "@/amerta/localization/locales";

export const getPageBySlug = cache(async ({ slug, locale }: { slug: string; locale?: string }) => {
  const { isEnabled: draft } = await draftMode();

  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "pages",
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      _status: { equals: "published" },
      slug: {
        equals: slug,
      },
    },
    locale: locale as LocaleCode,
    depth: 4,
  });

  return result.docs?.[0] || null;
});
