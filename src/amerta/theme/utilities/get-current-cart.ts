import { cookies } from "next/headers";
import { CartWithCalculations } from "../types";
import { getCart } from "./get-cart";

export async function getCurrentCart(): Promise<CartWithCalculations> {
  const cookieStore = await cookies();
  const cartIdCookie = cookieStore.get("cartId")?.value;
  return getCart(cartIdCookie);
}