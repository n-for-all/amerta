import { Shipping } from "@/payload-types";

export const getShippingMethods = async (req) => {
  try {
    const countryId = req.query?.country as string;
    const city = req.query?.city as string;

    if (!countryId) {
      return Response.json(
        {
          success: false,
          error: "Country parameter is required",
        },
        { status: 400 },
      );
    }

    const where: any = {
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
    };

    const shippingMethods = await req.payload.find({
      collection: "shipping",
      where,
      depth: 1,
      limit: 1000,
      sort: "sortOrder",
    });

    const shippingMethodsArray: Shipping[] = shippingMethods.docs;
    let methods: {
      id: string;
      name: string;
      description?: string | null;
      cost: number;
      estimatedDaysMin: number;
      estimatedDaysMax: number;
      freeThreshold?: number | null;
      taxable?: boolean | null;
      taxRate?: number | null;
    }[] = [];

    // If city is provided, filter for methods that apply to this city
    // and use city-specific pricing if available
    console.log("Filtering shipping methods for country:", countryId, "and city:", city, methods);
    if (city) {
      methods = shippingMethodsArray
        .filter((method: Shipping) => {
          if (method.citiesType === "all") return true;

          console.log("Checking method for city-specific applicability:", method.id);

          if (method.citiesType === "specific" && method.specificCities) {
            return method.specificCities.some((c) => c.code?.trim().toLowerCase() === city.trim().toLowerCase() && c.active);
          }

          console.warn("Unknown citiesType or missing specificCities for method:", method.id);

          return false;
        })
        .map((method: Shipping) => {
          console.log("Processing method for city-specific pricing:", method.id);
          // If specific cities, get city-specific pricing
          if (method.citiesType === "specific" && method.specificCities) {
            const cityData = method.specificCities.find((c) => c.code?.trim().toLowerCase() === city.trim().toLowerCase());

            if (cityData) {
              return {
                id: method.id,
                label: method.label,
                name: method.name,
                description: method.description,
                cost: cityData.cost,
                estimatedDaysMin: cityData.estimatedDaysMin,
                estimatedDaysMax: cityData.estimatedDaysMax,
                freeThreshold: cityData.freeThreshold,
                taxable: method.taxable,
                taxRate: method.taxRate,
              };
            }
          }

          // For "all cities" type, use country-level pricing
          return {
            id: method.id,
            label: method.label,
            name: method.name,
            description: method.description,
            cost: method.cost,
            estimatedDaysMin: method.estimatedDaysMin,
            estimatedDaysMax: method.estimatedDaysMax,
            freeThreshold: method.freeThreshold,
            taxable: method.taxable,
            taxRate: method.taxRate,
          };
        });
    } else {
      // No city specified, return country-level pricing
      methods = methods.map((method: any) => ({
        id: method.id,
        label: method.label,
        name: method.name,
        description: method.description,
        cost: method.cost,
        estimatedDaysMin: method.estimatedDaysMin,
        estimatedDaysMax: method.estimatedDaysMax,
        freeThreshold: method.freeThreshold,
        taxable: method.taxable,
        taxRate: method.taxRate,
      }));
    }

    return Response.json(
      {
        success: true,
        data: methods,
        total: methods.length,
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
    console.error("Error fetching shipping methods:", error);
    return Response.json(
      {
        success: false,
        error: "Failed to fetch shipping methods",
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
