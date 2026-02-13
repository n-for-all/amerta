/**
 * @module Collections/Shipping/Handlers
 * @title Get Shipping Methods Handler
 * @description This handler retrieves the available shipping methods based on the provided country, city, and locale parameters.
 */

import { sendUncachedResponse } from "@/amerta/utilities/sendUncachedResponse";
import { Shipping } from "@/payload-types";

export const getShippingMethods = async (req) => {
  try {
    const countryId = req.query?.country as string;
    const city = req.query?.city as string;
    const locale = req.query?.locale as string;

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
      locale: locale as string,
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

    if (city) {
      methods = shippingMethodsArray
        .filter((method: Shipping) => {
          if (method.citiesType === "all") return true;
          if (method.citiesType === "specific" && method.specificCities) {
            return method.specificCities.some((c) => c.code?.trim().toLowerCase() === city.trim().toLowerCase() && c.active);
          }

          return false;
        })
        .map((method: Shipping) => {
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

    return sendUncachedResponse(200, {
      success: true,
      data: methods,
      total: methods.length,
    });
  } catch (error) {
    console.error("Error fetching shipping methods:", error);
    return sendUncachedResponse(500, {
      success: false,
      error: "Failed to fetch shipping methods",
    });
  }
};
