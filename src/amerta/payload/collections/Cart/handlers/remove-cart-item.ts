import { createCartIfNotExists } from "@/amerta/theme/utilities/create-cart-if-not-exists";
import { getCart } from "@/amerta/theme/utilities/get-cart";
import { variantsMatch } from "@/amerta/theme/utilities/variants-match";
import { PayloadRequest } from "payload";
import z from "zod";

const variantOptionSchema = z.object({
  option: z.string(),
  value: z.string(),
});

const removeFromCartSchema = z.object({
  product: z.string().min(1, "Product ID is required"),
  variantOptions: z.array(variantOptionSchema).optional(),
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

    if (!validation.success) {
      console.error("Remove from cart validation errors:", validation.error);
      return Response.json({ error: "Error removing item from cart" }, { status: 400 });
    }

    const { product, variantOptions } = validation.data;
    const cart = await getCart(cartIdCookie);

    if (!cart.items || cart.items.length === 0) {
      return Response.json({ error: "Item is already not in the cart" }, { status: 404 });
    }

    const items = (cart.items || []).filter((item: any) => {
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
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
