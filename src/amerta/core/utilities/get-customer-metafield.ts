import { MetafieldItem } from "./metafield-types";

/**
 * Retrieve a customer metafield by namespace and key from a loaded customer object
 */
export function getCustomerMetafield(
  customer: any,
  namespace: string,
  key: string
): any | null {
  if (!customer || !Array.isArray(customer.metafields)) {
    return null;
  }
  const item = customer.metafields.find(
    (m: MetafieldItem) => m.namespace === namespace && m.key === key
  );
  return item ? item.value : null;
}
