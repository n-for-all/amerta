import { Payload } from "payload";
import { setCustomerMetafield } from "./set-customer-metafield";

/**
 * Append or update a customer metafield (alias for setCustomerMetafield)
 */
export async function addCustomerMetafield(
  payload: Payload,
  customerId: string,
  namespace: string,
  key: string,
  value: any
): Promise<any> {
  return setCustomerMetafield(payload, customerId, namespace, key, value);
}
