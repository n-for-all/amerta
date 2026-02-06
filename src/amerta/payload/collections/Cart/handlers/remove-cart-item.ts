import { createCartIfNotExists } from "@/amerta/theme/utilities/create-cart-if-not-exists";
import { getCart } from "@/amerta/theme/utilities/get-cart";
import { createTranslator } from "@/amerta/theme/utilities/translation";
import { variantsMatch } from "@/amerta/theme/utilities/variants-match";
import { PayloadRequest } from "payload";
import z from "zod";

const removeFromCartSchema = z.object({
  itemId: z.string().min(1, "Item ID is required"),
  locale: z.string().optional(),
});

export const removeCartItem = async (req: PayloadRequest) => {
  try {
    //@ts-expect-error req.cookies is not typed
    const cartIdCookie = req.cookies.get("cartId")?.value;
    if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
      return Response.json({ items: [] }, { status: 200 });
    }

    const body = await req.json!();
    const validation = removeFromCartSchema.safeParse(body);
    const __ = await createTranslator(validation.data?.locale);

    if (!validation.success) {
      console.error("Remove from cart validation errors:", validation.error);
      return Response.json({ error: __("Error removing item from cart") }, { status: 400 });
    }

    const { itemId, locale } = validation.data;
    const cart = await getCart(cartIdCookie, locale);

    if (!cart.items || cart.items.length === 0) {
      return Response.json({ error: __("Item is already not in the cart") }, { status: 404 });
    }

    const items = (cart.items || []).filter((item: any) => {
      return item.id !== itemId;
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
    const populatedCart = await getCart(cart.id, locale);

    return Response.json({ cart: populatedCart });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
