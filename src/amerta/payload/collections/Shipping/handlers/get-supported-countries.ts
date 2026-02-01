import { PayloadRequest } from "payload";

export const getSupportedCountries = async (req: PayloadRequest) => {
  try {
    const shippingMethods = await req.payload.find({
      collection: "shipping",
      where: {
        active: {
          equals: true,
        },
      },
      depth: 2,
      limit: 1000,
    });

    // Group by country and aggregate cities
    const countriesMap = new Map<
      string,
      {
        id: string;
        name: string;
        display_name: string;
        iso_2: string;
        iso_3: string;
        citiesType: "all" | "specific";
        cities: Array<{ city: string; code?: string; active: boolean }>;
      }
    >();

    shippingMethods.docs.forEach((method: any) => {
      const country = method.country;
      if (!country || !country.id) return;

      const countryKey = country.id;

      if (!countriesMap.has(countryKey)) {
        countriesMap.set(countryKey, {
          id: country.id,
          name: country.name,
          display_name: country.display_name,
          iso_2: country.iso_2,
          iso_3: country.iso_3,
          citiesType: method.citiesType,
          cities: [],
        });
      }

      const countryData = countriesMap.get(countryKey)!;

      // If this method covers all cities, mark it
      if (method.citiesType === "all") {
        countryData.citiesType = "all";
      }

      // If specific cities, add them (avoiding duplicates)
      if (method.citiesType === "specific" && method.specificCities && Array.isArray(method.specificCities)) {
        method.specificCities.forEach((city: any) => {
          if (city.active) {
            const existingCity = countryData.cities.find((c) => c.city.toLowerCase() === city.city.toLowerCase());
            if (!existingCity) {
              countryData.cities.push({
                city: city.city,
                code: city.code,
                active: city.active,
              });
            }
          }
        });
      }
    });

    // Convert to array and sort
    const supportedCountries = Array.from(countriesMap.values()).sort((a, b) => a.display_name.localeCompare(b.display_name));

    return Response.json(
      {
        success: true,
        data: supportedCountries,
        total: supportedCountries.length,
      },
      {
        status: 200,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Error fetching supported countries:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch supported countries",
      },
      {
        status: 500,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }
};
