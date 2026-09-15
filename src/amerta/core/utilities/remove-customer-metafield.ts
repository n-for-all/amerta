import { Payload } from "payload";
import { MetafieldItem } from "./metafield-types";

/**
 * Remove a customer metafield by namespace and key
 */
export async function removeCustomerMetafield(
  payload: Payload,
  customerId: string,
  namespace: string,
  key: string
): Promise<any> {
  const customer = await payload.findByID({
    collection: "customers",
    id: customerId,
    depth: 0,
  });

  if (!customer || !Array.isArray(customer.metafields)) {
    return customer;
  }

  const filteredMetafields = customer.metafields.filter(
    (m: MetafieldItem) => !(m.namespace === namespace && m.key === key)
  );

  return await payload.update({
    collection: "customers",
    id: customerId,
    data: {
      metafields: filteredMetafields,
    },
  });
}
