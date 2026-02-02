import { getPayload } from "payload";
import configPromise from "@payload-config";
import { PaymentMethod } from "../types";
import { getSalesChannel } from "./get-sales-channel";

export interface CheckoutData {
  countries: Array<{
    id: string;
    name: string;
    display_name: string;
    iso_2: string;
    iso_3: string;
    citiesType: "all" | "specific";
    cities: Array<{ city: string; code?: string; active: boolean }>;
  }>;
  paymentMethods: PaymentMethod[];
}

/**
 * Fetch all checkout data (countries and payment methods) at once
 * Use this for server-side rendering to pass initial data to the Checkout component
 */
export async function getCheckoutData(): Promise<CheckoutData> {
  try {
    const payload = await getPayload({ config: configPromise });

    const salesChannel = await getSalesChannel();
    if (!salesChannel) {
      throw new Error("Sales channel not found");
    }
    // Fetch all required data in parallel
    const [shippingData, paymentMethodsData] = await Promise.all([
      payload.find({
        collection: "shipping",
        where: {
          active: {
            equals: true,
          },
        },
        limit: 1000, // Get all shipping records to extract unique countries
      }),
      payload.find({
        collection: "payment-method",
        where: {
          active: {
            equals: true,
          },
          salesChannels: {
            equals: salesChannel.id,
          },
        },
      }),
    ]);

    // Extract unique countries from shipping data
    const countriesMap = new Map();
    shippingData.docs.forEach((shipping: any) => {
      if (shipping.country) {
        const countryId = typeof shipping.country === "string" ? shipping.country : shipping.country.id;
        const countryData = typeof shipping.country === "string" ? null : shipping.country;

        if (!countriesMap.has(countryId)) {
          countriesMap.set(countryId, {
            id: countryId,
            name: countryData?.name || "Unknown",
            display_name: countryData?.display_name || countryData?.name || "Unknown",
            iso_2: countryData?.iso_2 || "",
            iso_3: countryData?.iso_3 || "",
            citiesType: shipping.citiesType || "all",
            cities: shipping.specificCities || [],
          });
        }
      }
    });

    return {
      countries: Array.from(countriesMap.values()),
      paymentMethods: (paymentMethodsData.docs || []).map((pm) => ({
        id: pm.id || "",
        name: pm.name,
        label: pm.label,
        type: pm.type,
        publicDescription: pm.publicDescription || "",
        icons: pm.icons || [],
        createdAt: pm.createdAt,
        updatedAt: pm.updatedAt,
      })),
    };
  } catch (error) {
    console.error("Error fetching checkout data:", error);
    throw error;
  }
}
