import { getPayload } from "payload";
import configPromise from "@payload-config";
import { PayloadRequest } from "payload";

export const getShippingMethods = async (countryId: string, cityName?: string, req?: PayloadRequest) => {
  const payload = req?.payload || (await getPayload({ config: configPromise }));

  try {
    const shippingMethods = await payload.find({
      collection: "shipping",
      where: {
        and: [
          {
            country: {
              equals: countryId,
            },
          },
          {
            active: {
              equals: true,
            },
          },
        ],
      },
      sort: "sortOrder",
    });

    let methods = shippingMethods.docs;

    // If city is specified, filter for methods that apply to this city
    if (cityName) {
      methods = methods.filter((method: any) => {
        if (method.citiesType === "all") return true;

        // Check if city is in specific cities list and is active
        if (method.citiesType === "specific" && method.specificCities) {
          return method.specificCities.some((city: any) => city.city.toLowerCase() === cityName.toLowerCase() && city.active);
        }

        return false;
      });
    }

    return methods;
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return [];
  }
};
