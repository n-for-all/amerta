import { createCartIfNotExists } from "@/amerta/theme/utilities/create-cart-if-not-exists";
import { getCart } from "@/amerta/theme/utilities/get-cart";
import { hasStock } from "@/amerta/theme/utilities/has-stock";
import { variantsMatch } from "@/amerta/theme/utilities/variants-match";
import { PayloadRequest } from "payload";
import z from "zod";

const variantOptionSchema = z.object({
  option: z.string(),
  value: z.string(),
});

const updateQuantitySchema = z.object({
  product: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(0),
  variantOptions: z.array(variantOptionSchema).optional(),
});

export const updateItemQuantity = async (req: PayloadRequest) => {
  try {
    //@ts-expect-error req.cookies is not typed
    const cartIdCookie = req.cookies.get("cartId")?.value;
    if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
      return Response.json({ items: [] }, { status: 200 });
    }

    const body = await req.json!();
    const validation = updateQuantitySchema.safeParse(body);

    if (!validation.success) {
      console.error("Update quantity validation errors:", validation.error);
      return Response.json({ error: "Error updating item quantity" }, { status: 400 });
    }

    const { product, quantity, variantOptions } = validation.data;
    const cart = await getCart(cartIdCookie);

    let items = cart.items || [];
    if (items.length === 0) {
      return Response.json({ cart: cart });
    }

    const productDoc = await req.payload.findByID({
      collection: "products",
      id: product,
    });

    if (!productDoc) {
      return Response.json({ error: "Product not found", code: "PRODUCT_NOT_FOUND" }, { status: 404 });
    }

    if (!hasStock(productDoc, quantity)) {
      return Response.json({ error: productDoc.title + " is out of stock", code: "OUT_OF_STOCK" }, { status: 400 });
    }

    if (quantity <= 0) {
      // Remove item if quantity is 0 or less
      items = (cart.items || []).filter((item: any) => {
        const itemProductId = typeof item.product === "string" ? item.product : item.product.id;
        if (itemProductId !== product) return true;
        if (variantOptions) {
          return !variantsMatch(item.variantOptions, variantOptions);
        }
        return false;
      });

      await createCartIfNotExists(cart!.id);

      const newCart = await req.payload.update({
        collection: "cart",
        where: { cartId: { equals: cart.id } },
        data: { items },
      });

      if (newCart.errors.length > 0) {
        // Throw the first error found so your catch block handles it
        const message = newCart.errors.map((err) => err.message).join(", ");
        throw new Error(message);
      }
      // Populate full product data
      const populatedCart = await getCart(cart.id);
      return Response.json({ cart: populatedCart });
    }

    items = (cart.items || []).map((item: any) => {
      const itemProductId = typeof item.product === "string" ? item.product : item.product.id;
      if (itemProductId === product && variantsMatch(item.variantOptions, variantOptions)) {
        return { ...item, quantity };
      }
      return item;
    });

    await createCartIfNotExists(cart!.id);

    const newCart = await req.payload.update({
      collection: "cart",
      where: { cartId: { equals: cart.id } },
      data: { items },
    });
    if (newCart.errors.length > 0) {
      // Throw the first error found so your catch block handles it
      const message = newCart.errors.map((err) => err.message).join(", ");
      throw new Error(message);
    }
    // Populate full product data
    const populatedCart = await getCart(cart.id);

    return Response.json({ cart: populatedCart });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
