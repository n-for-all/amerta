import configPromise from "@payload-config";
import { getPayload } from "payload";

export const getProductTagBySlug = async (slug, locale, enabled: boolean = true) => {
  const payload = await getPayload({ config: configPromise });

  const result = await payload.find({
    collection: "product-tags",
    where: {
      slug: { equals: slug },
        ...(enabled ? { _status: { equals: "published" } } : {}),
    },
    locale: locale as any,
    limit: 1,
  });

  return result.docs[0] || null;
};
