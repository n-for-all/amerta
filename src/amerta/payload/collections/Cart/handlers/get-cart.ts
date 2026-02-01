import { getCart } from "@/amerta/theme/utilities/get-cart";
import { PayloadRequest } from "payload";

export const getCartHandler = async (req: PayloadRequest) => {
  try {
    //@ts-expect-error req.cookies is not typed
    const cartIdCookie = req.cookies.get("cartId")?.value;
    if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
      return Response.json({ cart: null }, { status: 200 });
    }

    // Populate full product data
    const populatedCart = await getCart(cartIdCookie);

    return Response.json({ cart: populatedCart });
  } catch (error: any) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
};
