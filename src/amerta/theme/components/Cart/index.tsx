"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X, AlertCircle, Loader2 } from "lucide-react";
import { Dialog, DialogPanel, TransitionChild } from "@headlessui/react";
import { removeFromCart, updateQuantity, fetchCart } from "@/amerta/theme/utilities/cart.client";
import { CartWithCalculations } from "@/amerta/theme/types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { CouponForm } from "../CouponForm";
import { getURL } from "@/amerta/utilities/getURL";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";
import { Product, ProductMedia } from "@/payload-types";
import { isInStock } from "../../utilities/is-in-stock";

interface CartProps {
  onClose?: () => void;
}

export default function Cart({ onClose }: CartProps) {
  const [cart, setCart] = useState<CartWithCalculations | null>(null);
  const [isOpen, setIsCartOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const { currency, locale, exchangeRate, __ } = useEcommerce();

  useEffect(() => {
    const loadCartOnMount = async () => {
      const { cart: fetchedCart } = await fetchCart(locale);
      if (fetchedCart) {
        setCart(fetchedCart);
        localStorage.setItem("cart", JSON.stringify(fetchedCart));
      }
    };

    loadCartOnMount();
  }, []);

  // Load cart when cart modal opens
  useEffect(() => {
    const loadCart = async () => {
      const { cart: fetchedCart, error } = await fetchCart(locale);
      if (error) {
        console.error("Failed to fetch cart:", error.message);
        setCart(null);
        return;
      }

      if (fetchedCart) {
        setCart(fetchedCart);
        localStorage.setItem("cart", JSON.stringify(fetchedCart));
      } else {
        setCart(null);
      }
    };

    if (isOpen) {
      loadCart();
    }
  }, [isOpen]);

  // Listen for cart updates from AddToCartForm and other operations
  useEffect(() => {
    const handleCartUpdate = ((event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedCart = customEvent.detail;
      if (updatedCart) {
        setCart(updatedCart);
        localStorage.setItem("cart", JSON.stringify(updatedCart));
      }
    }) as EventListener;

    window.addEventListener("cartUpdated", handleCartUpdate);
    return () => window.removeEventListener("cartUpdated", handleCartUpdate);
  }, []);

  const onCloseDialog = () => {
    setIsCartOpen(false);
    if (onClose) onClose();
  };

  const handleQuantityChange = async (itemId?: string | null, newQuantity?: number) => {
    if (!itemId || newQuantity === undefined) return;
    if (newQuantity < 1) return;

    setUpdatingItemId(itemId);
    setError(null);

    const { cart: updatedCart, error: apiError } = await updateQuantity(itemId, newQuantity,locale);

    if (apiError) {
      setError(apiError.message);
      setUpdatingItemId(null);
      return;
    }

    if (updatedCart) {
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: updatedCart }));
    }

    setUpdatingItemId(null);
  };

  const handleRemoveItem = async (itemId?: string | null) => {
    if (!itemId) return;
    setUpdatingItemId(itemId);
    setError(null);

    const { cart: updatedCart, error: apiError } = await removeFromCart(itemId, locale);

    if (apiError) {
      setError(apiError.message);
      setUpdatingItemId(null);
      return;
    }

    if (updatedCart) {
      setCart(updatedCart);
      localStorage.setItem("cart", JSON.stringify(updatedCart));
      window.dispatchEvent(new CustomEvent("cartUpdated", { detail: updatedCart }));
    }

    setUpdatingItemId(null);
  };

  // Calculate totals
  const subtotal = cart?.subtotal || 0;
  const discountAmount = cart?.discount || 0;
  const total = cart?.total || 0;
  const itemCount = (cart?.items || []).length || 0;

  return (
    <>
      <button onClick={() => setIsCartOpen(true)} type="button" className="-m-2.5 inline-flex cursor-pointer items-center justify-center rounded-md p-2.5">
        <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" color="currentColor" strokeWidth={1} stroke="currentColor">
          <path
            d="M3.06164 14.4413L3.42688 12.2985C3.85856 9.76583 4.0744 8.49951 4.92914 7.74975C5.78389 7 7.01171 7 9.46734 7H14.5327C16.9883 7 18.2161 7 19.0709 7.74975C19.9256 8.49951 20.1414 9.76583 20.5731 12.2985L20.9384 14.4413C21.5357 17.946 21.8344 19.6983 20.9147 20.8491C19.995 22 18.2959 22 14.8979 22H9.1021C5.70406 22 4.00504 22 3.08533 20.8491C2.16562 19.6983 2.4643 17.946 3.06164 14.4413Z"
            stroke="currentColor"
            strokeWidth={1}
          />
          <path d="M7.5 9L7.71501 5.98983C7.87559 3.74176 9.7462 2 12 2C14.2538 2 16.1244 3.74176 16.285 5.98983L16.5 9" stroke="currentColor" strokeLinecap="round" strokeWidth={1} />
        </svg>
        <span className="text-xs leading-none">({itemCount})</span>
      </button>
      <Dialog open={isOpen} onClose={onCloseDialog} className="relative z-50">
        <TransitionChild enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-slate-900/50" aria-hidden="true" onClick={onCloseDialog} />
        </TransitionChild>
        <div className="fixed inset-0">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full rtl:left-0 rtl:right-auto">
              <TransitionChild
                enter="transform transition ease-out duration-300 sm:duration-500"
                enterFrom="translate-x-full rtl:-translate-x-full"
                enterTo="translate-x-0"
                leave="transform transition ease-in duration-200 sm:duration-300"
                leaveFrom="translate-x-0"
                leaveTo="translate-x-full rtl:-translate-x-full"
              >
                <DialogPanel className="w-screen max-w-lg overflow-hidden bg-white shadow-xl dark:bg-zinc-900">
                  <div className="flex flex-col h-full px-4 md:px-8">
                    {/* Header */}
                    <header className="flex items-center justify-between flex-shrink-0 py-4 border-b border-zinc-900/10 dark:border-white/10">
                      <h2 className="font-serif text-xl font-medium text-zinc-900 dark:text-white">{__("Shopping Cart")}</h2>
                      <button type="button" onClick={onCloseDialog} className="p-4 -m-4 cursor-pointer group">
                        <X className="w-5 h-5 transition-transform duration-200 group-hover:rotate-90" />
                      </button>
                    </header>

                    {/* Cart Items */}
                    <div className="flex-1 overflow-hidden">
                      <div className="flex flex-col h-full">
                        <div className="flex-1 pt-4 overflow-x-hidden overflow-y-auto">
                          <div className="flow-root">
                            {/* Error Messages */}
                            {error && (
                              <div className="flex items-center gap-3 px-2 py-1 mb-2 border border-red-200 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-800">
                                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                              </div>
                            )}

                            {!cart || (cart.items || []).length === 0 ? (
                              <div className="flex flex-col items-center justify-center py-12 text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-12 h-12 text-zinc-400">
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z"
                                  />
                                </svg>
                                <p className="mt-4 text-sm text-zinc-600 dark:text-zinc-400">{__("Your cart is empty")}</p>
                              </div>
                            ) : (
                              <ul role="list" className="my-1 divide-y divide-zinc-900/10 dark:divide-white/10">
                                {cart.items?.map((item, index) => {
                                  const product = item.product as Product;
                                  const price = item.price;
                                  const salePrice = item.salePrice && item.salePrice > 0 && item.salePrice < item.price ? item.salePrice : item.price;
                                  return (
                                    <li key={`${item.id}`} className="flex py-4">
                                      <div className="relative w-24 h-32 overflow-hidden rounded-md shrink-0">
                                        {(product.images?.[0] as ProductMedia)?.url ? (
                                          <ImageMedia alt={(product.images?.[0] as ProductMedia)?.alt || product.title} src={(product.images?.[0] as ProductMedia)?.url} fill imgClassName="object-contain w-full h-full" />
                                        ) : (
                                          <div className="w-full h-full bg-zinc-200 dark:bg-zinc-700" />
                                        )}
                                      </div>

                                      <div className="flex flex-col flex-1 ms-4">
                                        {/* Product Name and Price */}
                                        <div className="flex justify-between font-medium">
                                          <h3 className="leading-tight">
                                            <Link href={`/en/products/${product.id}`} className="uppercase text-sm/6 text-zinc-900 dark:text-white">
                                              {product.title}
                                            </Link>
                                          </h3>
                                          <p className="uppercase whitespace-nowrap ms-4 text-sm/6 text-zinc-900 dark:text-white">{formatPrice(price, currency, exchangeRate)}</p>
                                        </div>

                                        {/* Variant Options */}
                                        {item.variantOptions && item.variantOptions.length > 0 && (
                                          <div className="mt-1 flex gap-1.5 text-xs text-zinc-500">
                                            {item.variantOptions.map((variant, idx) => (
                                              <div className="flex gap-1" key={`${variant.option}-${variant.value}`}>
                                                <p className="uppercase text-sm/6">
                                                  {typeof variant.option === "string" ? variant.option : variant.option.name}: {variant.value}
                                                </p>
                                                {idx < item.variantOptions!.length - 1 && <p className="uppercase opacity-30 text-sm/6">/</p>}
                                              </div>
                                            ))}
                                          </div>
                                        )}

                                        <p className="mt-1 text-xs uppercase text-zinc-500 text-sm/6">
                                          {salePrice < price ? <span className="mr-1 text-red-400 line-through rtl:ml-1 rtl:mr-0">{formatPrice(price * item.quantity, currency, exchangeRate)}</span> : null}
                                          {formatPrice(salePrice * item.quantity, currency, exchangeRate)}
                                        </p>
                                        {!isInStock(product, item.variantOptions) && <p className="mt-1 text-xs text-red-600">{__("This item is out of stock.")}</p>}
                                        <div className="flex items-center justify-between pt-2 mt-1 text-sm">
                                          <div className="inline-grid w-full grid-cols-1 max-w-16">
                                            <select
                                              value={item.quantity}
                                              onChange={(e) => handleQuantityChange(item.id, parseInt(e.target.value))}
                                              disabled={updatingItemId === item.id}
                                              className="col-start-1 row-start-1 appearance-none rounded-md bg-white py-0.5 ps-3 pe-8 text-xs/6 outline-1 -outline-offset-1 outline-zinc-900/10 focus:outline-1 dark:bg-zinc-800 dark:text-white dark:outline-white/10 disabled:opacity-50"
                                            >
                                              {[1, 2, 3, 4, 5, 6, 7, 8].map((qty) => (
                                                <option key={qty} value={qty}>
                                                  {qty}
                                                </option>
                                              ))}
                                            </select>
                                            {updatingItemId === product.id ? (
                                              <Loader2 className="self-center col-start-1 row-start-1 pointer-events-none me-2 size-4 justify-self-end text-zinc-500 animate-spin" />
                                            ) : (
                                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className="self-center col-start-1 row-start-1 pointer-events-none me-2 size-4 justify-self-end text-zinc-500">
                                                <path fillRule="evenodd" d="M5.22 8.22a.75.75 0 0 1 1.06 0L10 11.94l3.72-3.72a.75.75 0 1 1 1.06 1.06l-4.25 4.25a.75.75 0 0 1-1.06 0L5.22 9.28a.75.75 0 0 1 0-1.06Z" clipRule="evenodd" />
                                              </svg>
                                            )}
                                          </div>

                                          <button
                                            type="button"
                                            onClick={() => handleRemoveItem(item.id)}
                                            disabled={updatingItemId === item.id}
                                            className="p-2 -m-2 font-medium cursor-pointer text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white disabled:opacity-50"
                                            title={__("Remove item from cart")}
                                          >
                                            <span className="sr-only">{__("Remove")}</span>
                                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                              <path
                                                d="M19.5 5.5L18.8803 15.5251C18.7219 18.0864 18.6428 19.3671 18.0008 20.2879C17.6833 20.7431 17.2747 21.1273 16.8007 21.416C15.8421 22 14.559 22 11.9927 22C9.42312 22 8.1383 22 7.17905 21.4149C6.7048 21.1257 6.296 20.7408 5.97868 20.2848C5.33688 19.3626 5.25945 18.0801 5.10461 15.5152L4.5 5.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path
                                                d="M3 5.5H21M16.0557 5.5L15.3731 4.09173C14.9196 3.15626 14.6928 2.68852 14.3017 2.39681C14.215 2.3321 14.1231 2.27454 14.027 2.2247C13.5939 2 13.0741 2 12.0345 2C10.9688 2 10.436 2 9.99568 2.23412C9.8981 2.28601 9.80498 2.3459 9.71729 2.41317C9.32164 2.7167 9.10063 3.20155 8.65861 4.17126L8.05292 5.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                              <path d="M9.5 16.5L9.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
                                              <path d="M14.5 16.5L14.5 10.5" strokeLinecap="round" strokeLinejoin="round" />
                                            </svg>
                                          </button>
                                        </div>
                                      </div>
                                    </li>
                                  );
                                })}
                              </ul>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        {cart && (cart.items || []).length > 0 && (
                          <section aria-labelledby="summary-heading" className="grid gap-4 py-4 mt-auto border-t shrink-0 border-zinc-900/10 dark:border-white/10">
                            <h2 id="summary-heading" className="sr-only">
                              {__("Order summary")}
                            </h2>

                            <div>
                              {/* Coupon Section */}
                              <CouponForm
                                cart={cart}
                                onCartUpdate={(updatedCart) => {
                                  setCart(updatedCart);
                                  localStorage.setItem("cart", JSON.stringify(updatedCart));
                                }}
                                compact={true}
                                currency={currency}
                                className={"border-b border-dashed border-zinc-900/10 dark:border-white/10"}
                              />

                              {/* Pricing Details */}
                              <div className="mb-4 space-y-2">
                                <div className="flex justify-between text-base font-medium">
                                  <p className="font-medium uppercase text-sm/6 text-zinc-900 dark:text-white">{__("Subtotal")}</p>
                                  <p className="font-medium uppercase text-sm/6 text-zinc-900 dark:text-white">{formatPrice(subtotal, currency, exchangeRate)}</p>
                                </div>

                                {discountAmount > 0 && (
                                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                                    <p className="uppercase text-sm/6">{__("Discount")}</p>
                                    <p className="uppercase text-sm/6">-{formatPrice(discountAmount, currency, exchangeRate)}</p>
                                  </div>
                                )}

                                <div className="flex justify-between pt-2 text-base font-semibold border-t border-zinc-900/10 dark:border-white/10">
                                  <p className="uppercase text-sm/6 text-zinc-900 dark:text-white">{__("Total")}</p>
                                  <p className="uppercase text-sm/6 text-zinc-900 dark:text-white">{formatPrice(total, currency, exchangeRate)}</p>
                                </div>
                              </div>

                              <p className="mt-0.5 text-xs text-zinc-500 text-sm/6 uppercase">{__("Shipping and taxes calculated at checkout.")}</p>

                              <div className="grid grid-cols-2 gap-2 mt-5">
                                <Link
                                  href={getURL(`/cart`, locale)}
                                  onClick={onCloseDialog}
                                  className="relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 rounded-full border border-zinc-900 px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none uppercase text-zinc-950 transition-colors hover:bg-zinc-950/5 dark:border-white/40 dark:text-white dark:hover:bg-white/5"
                                >
                                  {__("View cart")}
                                </Link>

                                <Link
                                  href={getURL(`/checkout`, locale)}
                                  onClick={onCloseDialog}
                                  className="relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 rounded-full border border-transparent bg-zinc-900 px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none uppercase text-white transition-colors hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100"
                                >
                                  {__("Check out")}
                                </Link>
                              </div>

                              <div className="flex justify-center mt-4 text-sm text-center text-zinc-500">
                                <p className="text-xs uppercase text-sm/6">
                                  {__("or")}{" "}
                                  <Link href={getURL(`/`, locale)} onClick={onCloseDialog} className="text-xs font-medium uppercase text-zinc-900 text-sm/6 dark:text-white hover:underline">
                                    {__("Continue Shopping →")}
                                  </Link>
                                </p>
                              </div>
                            </div>
                          </section>
                        )}
                      </div>
                    </div>
                  </div>
                </DialogPanel>
              </TransitionChild>
            </div>
          </div>
        </div>
      </Dialog>
    </>
  );
}
