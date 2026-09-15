"use server";
import { Product, Wishlist } from "@/payload-types";
import { getMeCustomer } from "@/amerta/utilities/getMeCustomer";
import { getPayload } from "payload";
import config from "@payload-config";

export async function getCustomerWishlist() {
  const { user } = await getMeCustomer();
  if (!user) return null;

  const payload = await getPayload({ config });

  const result = await payload.find({
    collection: "wishlist",
    where: {
      customer: {
        equals: user.id,
      },
    },
    depth: 2, // Ensure we get full product data
    limit: 1,
  });

  return result.docs[0] || null;
}

export async function removeWishlistItem(productId: string) {
  const { user } = await getMeCustomer();
  if (!user) throw new Error("Unauthorized");

  const payload = await getPayload({ config });
  const wishlist = await payload.find({
    collection: "wishlist",
    where: {
      customer: {
        equals: user.id,
      },
    },
    limit: 1,
  });

  if (!wishlist.docs[0]) return null;

  const currentWishlist = wishlist.docs[0];

  // 2. Filter out the item
  const updatedItems = (currentWishlist.items || []).filter((item) => {
    const itemProductId = typeof item.product === "string" ? item.product : item.product.id;
    return itemProductId !== productId;
  });

  // 3. Update
  const updated = await payload.update({
    collection: "wishlist",
    id: currentWishlist.id,
    data: {
      items: updatedItems.map((item) => ({
        product: typeof item.product === "string" ? item.product : item.product.id,
        addedAt: item.addedAt,
      })),
    },
  });

  return updated;
}

export async function syncLocalWishlist(localItems: { product: Product; addedAt: string }[]) {
  const { user } = await getMeCustomer();
  if (!user) return null;

  let wishlist: Wishlist | null = null;
  const payload = await getPayload({ config });

  const existing = await payload.find({
    collection: "wishlist",
    where: { customer: { equals: user.id } },
    limit: 1,
  });

  if (existing.docs[0]) {
    wishlist = existing.docs[0];
  } else {
    // Create new if doesn't exist
    wishlist = await payload.create({
      collection: "wishlist",
      data: {
        wishlistId: `user_${user.id}`,
        customer: user.id,
        items: [],
      },
    });
  }

  const existingIds = new Set((wishlist.items || []).map((item) => (typeof item.product === "string" ? item.product : item.product.id)));
  const newItemsToPush = localItems.filter((localItem) => !existingIds.has(localItem.product.id));

  if (newItemsToPush.length === 0) return wishlist;

  const updated = await payload.update({
    collection: "wishlist",
    id: wishlist.id,
    data: {
      items: [
        ...(wishlist.items || []).map((item) => ({
          product: typeof item.product === "string" ? item.product : item.product.id,
          addedAt: item.addedAt,
        })),
        ...newItemsToPush.map((item) => ({
          product: item.product.id,
          addedAt: item.addedAt,
        })),
      ],
    },
  });

  return updated;
}
