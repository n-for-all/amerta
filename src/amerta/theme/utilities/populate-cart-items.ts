import { Cart } from "@/payload-types";
import { Payload } from "payload";
import { hasStock } from "./has-stock";
import { variantsMatch } from "./variants-match";

export async function populateCartItems(items: Cart["items"], payload: Payload): Promise<Cart["items"]> {
  return (await Promise.all(
    (items || [])
      .map(async (item: any) => {
        const productId = typeof item.product === "string" ? item.product : item.product.id;
        try {
          const productDoc = await payload.findByID({
            collection: "products",
            id: productId,
            depth: 2,
            select: {
              id: true,
              title: true,
              slug: true,
              price: true,
              salePrice: true,
              type: true,
              trackInventory: true,
              quantity: true,
              variants: true,
              images: true,
              stockStatus: true,
              _status: true,
            },
          });

          let price = 0;
          let salePrice: number | null = 0;
          // get the matched variant options for the item
          if (productDoc.type === "variant") {
            if (!item.variantOptions || item.variantOptions.length === 0) {
              return null;
            }
            const variant = productDoc.variants?.find((v) => {
              return variantsMatch(
                v.variant
                  ? Object.entries(v.variant).map(([key, value]) => {
                      const variantOptionValue = typeof value === "object" && value !== null && "value" in value ? value.value : value;
                      return { option: key, value: variantOptionValue };
                    })
                  : [],
                item.variantOptions,
              );
            });
            if (variant) {
              price = variant.price || 0;
              salePrice = variant.salePrice || 0;
            } else {
              return null;
            }
          } else {
            price = productDoc.price || 0;
            salePrice = productDoc.salePrice || 0;
          }

          if (price == 0 && salePrice == 0) {
            return null;
          }

          return {
            ...item,
            price: price,
            salePrice: salePrice,
            product: productDoc,
            inStock: hasStock(productDoc, item.quantity),
          };
        } catch {
          return item;
        }
      })
      .filter((item) => item !== null),
  )) as Cart["items"];
}