import { draftMode } from "next/headers";
import { getPayload } from "payload";
import { cache } from "react";
import configPromise from "@payload-config";
import { LocaleCode } from "@/amerta/localization/locales";

export const getHomePage = cache(async (locale?: string) => {
  const { isEnabled: draft } = await draftMode();

  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "pages",
    draft,
    limit: 1,
    where: {
      _status: { equals: "published" },
      isFrontPage: {
        equals: true,
      },
    },
    locale: locale as LocaleCode,
    depth: 4,
  });

  return result.docs?.[0] || null;
});
