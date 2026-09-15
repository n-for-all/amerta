import { Payload } from "payload";
import { MetafieldItem } from "./metafield-types";

/**
 * Upsert a customer metafield (creates if not exists, updates if exists)
 */
export async function setCustomerMetafield(
  payload: Payload,
  customerId: string,
  namespace: string,
  key: string,
  value: any
): Promise<any> {
  const customer = await payload.findByID({
    collection: "customers",
    id: customerId,
    depth: 0,
  });

  if (!customer) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }

  const existingMetafields: MetafieldItem[] = Array.isArray(customer.metafields)
    ? [...customer.metafields]
    : [];

  const existingIndex = existingMetafields.findIndex(
    (m) => m.namespace === namespace && m.key === key
  );

  if (existingIndex >= 0) {
    existingMetafields[existingIndex] = {
      ...existingMetafields[existingIndex],
      namespace,
      key,
      value,
    };
  } else {
    existingMetafields.push({
      namespace,
      key,
      value,
    });
  }

  return await payload.update({
    collection: "customers",
    id: customerId,
    data: {
      metafields: existingMetafields,
    },
  });
}
