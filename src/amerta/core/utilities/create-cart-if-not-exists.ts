import { getPayload } from "payload";
import configPromise from "@payload-config";

/**
 * Creates a new cart if one does not already exist for the given cartId.
 * @param cartId - The unique identifier for the cart.
 * @returns The existing or newly created cart object.
 * @example
 * const cart = await createCartIfNotExists("abc123");
 */
export const createCartIfNotExists = async (cartId) => {
  const payload = await getPayload({ config: configPromise });
  // Try to find existing cart
  const carts = await payload.find({
    collection: "cart",
    where: {
      cartId: { equals: cartId || "0" },
    },
    limit: 1,
  });
  if (carts.docs.length === 0) {
    return await payload.create({
      collection: "cart",
      data: {
        items: [],
        status: "active",
        cartId,
        expiryDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split("T")[0]!,
      },
      draft: false,
    });
  }
  return carts.docs[0];
};
