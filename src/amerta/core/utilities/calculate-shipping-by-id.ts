import { Country, Shipping } from "@/payload-types";
import { getShippingMethodById } from "./get-shipping-method-by-id";

/**
 * Calculates total shipping cost including tax by shipping method ID.
 * @param shippingMethodId - The ID of the shipping method.
 * @param country - The country ID or object.
 * @param city - The city name or code.
 * @param orderSubtotal - The order subtotal to check for free shipping eligibility.
 * @returns Object containing shipping cost breakdown.
 * @example
 * const cost = await calculateShippingById("ship123", "us", "NYC", 150);
 */
export const calculateShippingById = async (shippingMethodId: string, country: string | Country, city: string, orderSubtotal: number): Promise<{ baseCost: number; tax: number; total: number; isFree: boolean }> => {
  try {
    const shippingMethod: Shipping = await getShippingMethodById(shippingMethodId);

    if (!shippingMethod) {
      throw new Error("Shipping method not found");
    }

    // Verify country matches
    const countryId = typeof country === "string" ? country : country.id;
    const methodCountry = typeof shippingMethod.country === "string" ? shippingMethod.country : shippingMethod.country?.id;
    if (methodCountry !== countryId) {
      throw new Error("Shipping method is not available for the selected country");
    }

    let shippingCost = shippingMethod.cost || 0;
    let freeShippingThreshold: number | null | undefined = null;

    // Handle city-specific pricing
    if (shippingMethod.citiesType === "specific") {
      if (!city) {
        throw new Error("City is required for this shipping method");
      }

      if (!shippingMethod.specificCities || shippingMethod.specificCities.length === 0) {
        throw new Error("No cities configured for this shipping method");
      }

      // Find the city in the specific cities list
      const cityConfig = shippingMethod.specificCities.find((c: any) => {
        const cityName = c.city?.trim().toLowerCase();
        const cityCode = c.code?.trim().toLowerCase();
        const searchCity = city.trim().toLowerCase();
        return (cityName === searchCity || cityCode === searchCity) && c.active;
      });

      if (!cityConfig) {
        throw new Error(`Shipping is not available for ${city}. Please select a different city or shipping method.`);
      }

      // Use city-specific cost if provided, otherwise use default method cost
      shippingCost = cityConfig.cost !== undefined ? cityConfig.cost : shippingMethod.cost || 0;

      // Use city-specific free threshold if provided
      freeShippingThreshold = cityConfig.freeThreshold !== undefined ? cityConfig.freeThreshold : shippingMethod.freeThreshold;
    } else {
      // For "all" cities, use the method's default cost and threshold
      shippingCost = shippingMethod.cost || 0;
      freeShippingThreshold = shippingMethod.freeThreshold && shippingMethod.freeThreshold > 0 ? shippingMethod.freeThreshold : null;
    }

    // Check if eligible for free shipping based on the threshold
    const qualifiesForFree = freeShippingThreshold && freeShippingThreshold > 0 && orderSubtotal >= freeShippingThreshold;

    if (qualifiesForFree) {
      return { baseCost: 0, tax: 0, total: 0, isFree: true };
    }

    // Calculate tax on shipping
    const isTaxable = shippingMethod.taxable || false;
    const taxRate = isTaxable ? (shippingMethod.taxRate || 0) / 100 : 0;
    const tax = shippingCost * taxRate;
    const total = shippingCost + tax;

    return {
      baseCost: shippingCost,
      tax,
      total,
      isFree: false,
    };
  } catch (error) {
    console.error("Error calculating shipping total:", error);
    throw error;
  }
};
