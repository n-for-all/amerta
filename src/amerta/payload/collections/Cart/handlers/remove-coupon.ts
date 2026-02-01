import { getCart } from "@/amerta/theme/utilities/get-cart";
import { PayloadRequest } from "payload";

export const removeCoupon = async (req: PayloadRequest) => {
  try {
    //@ts-expect-error req.cookies is not typed
    const cartIdCookie = req.cookies.get("cartId")?.value;
    if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
      return Response.json({ error: "You don't have any products in your cart" }, { status: 400 });
    }

    const newCart = await req.payload.update({
      collection: "cart",
      where: { cartId: { equals: cartIdCookie } },
      data: { appliedCoupon: null },
    });

    if (newCart.errors.length > 0) {
      // Throw the first error found so your catch block handles it
      const message = newCart.errors.map((err) => err.message).join(", ");
      throw new Error(message);
    }

    const cartWithCoupon = await getCart(cartIdCookie);

    return Response.json({
      cart: cartWithCoupon,
      message: "Coupon removed",
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
