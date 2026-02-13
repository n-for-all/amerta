/**
 * @module Collections/Cart/Handlers
 * @title Get Cart Handler
 * @description This handler retrieves the cart. It fetches the cart based on the cart ID cookie and returns the cart data.
 */

import { getCart } from "@/amerta/theme/utilities/get-cart";
import { PayloadRequest } from "payload";

export const getCartHandler = async (req: PayloadRequest) => {
  try {
    //@ts-expect-error req.cookies is not typed
    const cartIdCookie = req.cookies.get("cartId")?.value;
    if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
      return Response.json({ cart: null }, { status: 200 });
    }

    const locale = req.query.locale as string | undefined;
    // Populate full product data
    const populatedCart = await getCart(cartIdCookie, locale);

    return Response.json({ cart: populatedCart });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
