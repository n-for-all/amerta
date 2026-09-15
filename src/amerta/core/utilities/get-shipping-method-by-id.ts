import { Shipping } from "@/payload-types";

import configPromise from "@payload-config";
import { getPayload } from "payload";

export const getShippingMethodById = async (shippingMethodId: string): Promise<any | null> => {
  if (!shippingMethodId || shippingMethodId === "") {
    return null;
  }
  const payload = await getPayload({ config: configPromise });

  const shippingMethod: Shipping = await payload.findByID({
    collection: "shipping",
    id: shippingMethodId,
    depth: 2,
  });

  return shippingMethod;
};
