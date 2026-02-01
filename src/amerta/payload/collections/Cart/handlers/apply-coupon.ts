
import { createCartIfNotExists } from "@/amerta/theme/utilities/create-cart-if-not-exists";
import { getCart } from "@/amerta/theme/utilities/get-cart";
import { PayloadRequest } from "payload";

export const applyCoupon = async (req: PayloadRequest) => {
  try {
    const { code } = await req.json!();

    const coupons = await req.payload.find({
      collection: "coupons",
      where: { code: { equals: code } },
    });

    if (coupons.docs.length === 0) {
      return Response.json({ error: "This coupon does not exist or invalid" }, { status: 400 });
    }

    const coupon = coupons.docs[0]!;

    // Validate coupon
    if (coupon.status !== "active") {
      return Response.json({ error: "This coupon does not exist or invalid" }, { status: 400 });
    }

    const startDate = new Date(coupon.startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);

    if (startDate > today) {
      return Response.json({ error: "This coupon does not exist or invalid" }, { status: 400 });
    }

    if (coupon.expiryDate) {
      const expiryDate = new Date(coupon.expiryDate);
      expiryDate.setHours(0, 0, 0, 0);
      if (expiryDate < today) {
        return Response.json({ error: "This coupon have expired" }, { status: 400 });
      }
    }

    if (coupon.usageLimit && coupon.timesUsed >= coupon.usageLimit) {
      return Response.json({ error: "This coupon does not exist or invalid" }, { status: 400 });
    }

    //@ts-expect-error req.cookies is not typed
    const cartIdCookie = req.cookies.get("cartId")?.value;
    if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
      return Response.json({ error: "You don't have any products in your cart to apply the coupon" }, { status: 400 });
    }

    const cart = await getCart(cartIdCookie);
    if (cart.items?.length === 0) {
      return Response.json({ error: "You don't have any products in your cart to apply the coupon" }, { status: 400 });
    }

    await createCartIfNotExists(cart!.id);

    await req.payload.update({
      collection: "cart",
      where: { cartId: { equals: cart.id } },
      data: {
        appliedCoupon: coupon.id,
      },
    });

    const cartWithCoupon = await getCart(cart.id);
    const subtotal = cartWithCoupon.subtotal || 0;

    if (coupon.minimumPurchase && subtotal < coupon.minimumPurchase) {
      return Response.json({ error: `Minimum purchase of $${coupon.minimumPurchase} required` }, { status: 400 });
    }

    return Response.json({
      cart: cartWithCoupon,
      message: `Coupon applied! You saved $${cartWithCoupon.discount.toFixed(2)}`,
    });
  } catch (error: any) {
    return Response.json({ error: error.message }, { status: 500 });
  }
};
