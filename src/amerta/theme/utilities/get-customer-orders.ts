import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getCustomerOrders = async (customerId: string, options?: { page?: number; limit?: number; sort?: string }) => {
  const payload = await getPayload({ config: configPromise });

  const orders = await payload.find({
    collection: "orders",
    where: {
      orderedBy: {
        equals: customerId,
      },
    },
    page: options?.page || 1,
    limit: options?.limit || 10,
    sort: options?.sort || "-createdAt",
  });

  return orders;
};
