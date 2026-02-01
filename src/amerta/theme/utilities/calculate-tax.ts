import { getPayload } from "payload";
import configPromise from "@payload-config";
import { Country } from "@/payload-types";

interface TaxRate {
  id: string;
  name: string;
  rate: number;
  code: string;
  taxType: "default" | "specific";
}

interface TaxCalculationResult {
  taxRates: TaxRate[];
  taxType: "default" | "specific" | "none";
  totalTaxRate: number;
  totalTaxPercentage: number;
  taxAmount: number;
}

/**
 * Calculate tax for a given country and amount
 * @param country - The country to fetch taxes for
 * @param amount - The taxable amount (subtotal - discount + shipping)
 * @returns Tax calculation result with rates and amounts
 */
export const calculateTax = async (country: string | Country, amount: number): Promise<TaxCalculationResult> => {
  const payload = await getPayload({ config: configPromise });
  const countryId = typeof country === "string" ? country : country.id;

  if (!countryId) {
    return {
      taxRates: [],
      taxType: "none",
      totalTaxRate: 0,
      totalTaxPercentage: 0,
      taxAmount: 0,
    };
  }

  try {
    // First, try to find specific country tax rates
    const specificTaxes = await payload.find({
      collection: "tax-rate",
      where: {
        and: [
          {
            taxType: {
              equals: "specific",
            },
          },
          {
            countries: {
              in: [countryId],
            },
          },
        ],
      },
    });

    let taxRates: TaxRate[] = [];
    let taxType: "default" | "specific" | "none" = "none";

    // If specific taxes found, use them
    if (specificTaxes.docs.length > 0) {
      taxRates = specificTaxes.docs.map((doc: any) => ({
        id: doc.id,
        name: doc.name,
        rate: doc.rate || 0,
        code: doc.code || "",
        taxType: "specific" as const,
      }));
      taxType = "specific";
    } else {
      // If no specific taxes, get the default tax rate
      const defaultTax = await payload.find({
        collection: "tax-rate",
        where: {
          taxType: {
            equals: "default",
          },
        },
        limit: 1,
      });

      if (defaultTax.docs.length > 0) {
        taxRates = defaultTax.docs.map((doc: any) => ({
          id: doc.id,
          name: doc.name,
          rate: doc.rate || 0,
          code: doc.code || "",
          taxType: "default" as const,
        }));
        taxType = "default";
      }
    }

    // Calculate total tax rate (sum of all applicable tax rates)
    const totalTaxPercentage = taxRates.reduce((sum, taxRate) => sum + taxRate.rate, 0);
    const totalTaxRate = totalTaxPercentage / 100;
    const taxAmount = amount * totalTaxRate;

    return {
      taxRates,
      taxType,
      totalTaxRate,
      totalTaxPercentage,
      taxAmount,
    };
  } catch (error) {
    console.error("Error calculating tax:", error);
    return {
      taxRates: [],
      taxType: "none",
      totalTaxRate: 0,
      totalTaxPercentage: 0,
      taxAmount: 0,
    };
  }
};

/**
 * Fetch tax rates for a specific country (without calculating amount)
 * @param countryId - The country ID to fetch taxes for
 * @returns Tax rates information
 */
export const getTaxRatesByCountry = async (countryId: string): Promise<Omit<TaxCalculationResult, "taxAmount">> => {
  const result = await calculateTax(countryId, 0);
  /* eslint-disable @typescript-eslint/no-unused-vars */
  const { taxAmount, ...ratesInfo } = result;
  return ratesInfo;
};
