import { draftMode } from "next/headers";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { cache } from "react";
import { LocaleCode } from "@/amerta/localization/locales";

export const getProductBySlug = cache(async ({ slug, locale }: { slug: string; locale: string }) => {
  const { isEnabled: draft } = await draftMode();

  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "products",
    draft,
    limit: 1,
    pagination: false,
    overrideAccess: draft,
    where: {
      slug: {
        equals: slug,
      },
    },
    locale: locale as LocaleCode,
    depth: 2,
  });

  return result.docs?.[0] || null;
});
