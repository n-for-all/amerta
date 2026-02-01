import { getPayload } from "payload";
import configPromise from "@payload-config";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { reportMissingTranslation } from "../providers/actions/reportMissingTranslation";
import { LocaleCode } from "@/amerta/localization/locales";

type Dictionary = Record<string, Record<string, string>>;

const getGlobalDictionary = unstable_cache(
  async (locale: string): Promise<Dictionary> => {
    const payload = await getPayload({ config: configPromise });

    const { docs } = await payload.find({
      collection: "translations",
      locale: locale as LocaleCode,
      pagination: false,
      depth: 0,
      fallbackLocale: false,
    });

    const dictionary: Dictionary = {};

    docs.forEach((doc) => {
      const domain = (doc.domain as string) || "default";
      if (doc.key && doc.value) {
        if (!dictionary[domain]) dictionary[domain] = {};
        dictionary[domain][doc.key] = doc.value;
      }
    });

    return dictionary;
  },
  ["translations-dictionary"],
  {
    tags: ["translations"],
    revalidate: 3600 * 24 * 7,
  },
);

export const getDictionary = cache((locale: string) => getGlobalDictionary(locale));

// 3. Your Helper (Now fast!)
export const createTranslator = async (locale: string) => {
  const dictionary = await getDictionary(locale);
  return (key: string, domain: string = "default") => {
    const val = dictionary[domain]?.[key] || (domain !== "default" ? dictionary["default"]?.[key] : null);
    if (!val || val === "") {
      reportMissingTranslation(key, domain, locale);
    }
    return val || key;
  };
};
