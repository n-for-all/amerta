import { getCart } from "@/amerta/theme/utilities/get-cart";
import { PayloadRequest } from "payload";
import { cookies } from "next/headers";

export const clearCart = async (req: PayloadRequest) => {
  try {
    //@ts-expect-error req.cookies is not typed
    const cookiesInstance = req.cookies || (await cookies());
    const cartIdCookie = cookiesInstance.get("cartId")?.value;
    if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
      return Response.json({ items: [] }, { status: 200 });
    }

    await req.payload.delete({
      collection: "cart",
      where: { cartId: { equals: cartIdCookie } },
    });

    cookiesInstance.delete("cartId");

    return Response.json({ cart: await getCart(cartIdCookie) });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
