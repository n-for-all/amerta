import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getCountries = async (activeOnly: boolean = true) => {
  const payload = await getPayload({ config: configPromise });
  const countries = await payload.find({
    collection: "country",
    where: {
      ...(activeOnly ? { active: { equals: "1" } } : {}),
    },
    limit: 100,
  });

  return countries.docs || [];
};

export const getCountryById = async (id: string | number) => {
  if (!id) return null;
  const payload = await getPayload({ config: configPromise });
  try {
    return await payload.findByID({
      collection: "country",
      id,
    });
  } catch (error) {
    return null;
  }
};
