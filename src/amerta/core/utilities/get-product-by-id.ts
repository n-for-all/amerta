import { getPayload } from "payload";
import configPromise from "@payload-config";
import { LocaleCode } from "@/amerta/localization/locales";

export const getProductById = async ({ id, locale }: { id: string; locale?: string }) => {
  if (!id) return null;
  const payload = await getPayload({ config: configPromise });

  const result = await payload.findByID({
    collection: "products",
    id,
    locale: locale as LocaleCode | undefined,
  });

  return result || null;
};
