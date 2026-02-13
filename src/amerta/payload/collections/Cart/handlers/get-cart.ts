/**
 * @module Collections/Cart/Handlers
 * @title Get Cart Handler
 * @description This handler retrieves the cart. It fetches the cart based on the cart ID cookie and returns the cart data.
 */

import { getCart } from "@/amerta/theme/utilities/get-cart";
import { cookies } from "next/headers";
import { PayloadRequest } from "payload";

export const getCartHandler = async (req: PayloadRequest) => {
  const cookiesInstance = await cookies();
  const cartIdCookie = cookiesInstance.get("cartId")?.value;
  try {
    if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
      return Response.json({ cart: null }, { status: 200 });
    }

    const locale = req.query.locale as string | undefined;
    const populatedCart = await getCart(cartIdCookie, locale);

    return Response.json({ cart: populatedCart });
  } catch (error: any) {
    console.error(error);
    try {
      await req.payload.delete({
        collection: "cart",
        where: { cartId: { equals: cartIdCookie } },
      });

      cookiesInstance.delete("cartId");
    } catch {}
    return Response.json({ error: error.message }, { status: 500 });
  }
};
