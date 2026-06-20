import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getLocales = async (): Promise<string[]> => {
  const payload = await getPayload({ config: configPromise });
  const defaultLocale = payload.config.localization ? payload.config.localization.defaultLocale : "en";
  
  const settingsGlobal = await payload.findGlobal({ slug: "settings", depth: 0 });
  
  let locales = Array.isArray(settingsGlobal?.locales) 
    ? settingsGlobal.locales.map((l: any) => typeof l === 'string' ? l : (l.code || l)) 
    : [];
    
  if (locales.length === 0) {
    locales = [defaultLocale];
  } else if (!locales.includes(defaultLocale)) {
    locales.push(defaultLocale);
  }

  return locales;
};
