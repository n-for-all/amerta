"use client";;
import Link from "next/link";
import { useEffect, useState } from "react";
import { CartWithCalculations } from "@/amerta/theme/types";
import { ImageOrPlaceholder } from "../Thumbnail";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { TrashIcon } from "lucide-react";
import { CouponForm } from "../CouponForm";
import { Button } from "@/amerta/theme/ui/button";
import { getURL } from "@/amerta/utilities/getURL";

export default function CartPage() {
  const [cart, setCart] = useState<CartWithCalculations | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currency, __, locale, exchangeRate } = useEcommerce();

  useEffect(() => {
    const loadCart = async () => {
      try {
        setLoading(true);

        const response = await fetch("/api/cart/get", {
          method: "GET",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
        });

        const data = await response.json();
        if (data.cart) {
          setCart(data.cart);
        }
      } catch (err) {
        console.error("Error loading cart:", err);
        setError(err instanceof Error ? err.message : __("Failed to load cart"));
      } finally {
        setLoading(false);
      }
    };

    loadCart();
  }, []);

  const clearError = () => setError(null);

  const handleRemoveItem = async (productId: string) => {
    try {
      clearError();
      const response = await fetch("/api/cart/remove", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product: productId }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else if (data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : __("Failed to remove item"));
    }
  };

  const handleUpdateQuantity = async (productId: string, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(productId);
      return;
    }

    try {
      clearError();
      const response = await fetch("/api/cart/update-quantity", {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ product: productId, quantity }),
      });

      const data = await response.json();
      if (data.error) {
        setError(data.error);
      } else if (data.cart) {
        setCart(data.cart);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : __("Failed to update quantity"));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-16 mx-auto max-w-7xl">
        <div className="text-center">
          <p className="text-lg">{__("Loading cart...")}</p>
        </div>
      </div>
    );
  }

  if (!cart || !cart.items || cart.items.length === 0) {
    return (
      <div className="py-20 mt-12 text-center">
        <p className="mb-6 text-lg text-zinc-600">{__("Your cart is empty")}</p>
        <Link href={getURL("/", locale)} className="inline-block font-medium text-blue-600 hover:text-blue-700">
          {__("Continue Shopping →")}
        </Link>
      </div>
    );
  }

  return (
    <div className="pb-16 mx-auto max-w-7xl">
      {error && (
        <div className="flex items-center justify-between p-4 mt-6 text-red-800 border border-red-200 rounded-lg bg-red-50">
          <p className="text-sm font-medium">{error}</p>
          <button onClick={clearError} className="ml-4 text-sm font-medium text-red-600 hover:text-red-700">
            {__("Dismiss")}
          </button>
        </div>
      )}

      <form className="mt-12 lg:grid lg:grid-cols-12 lg:items-start lg:gap-x-12 xl:gap-x-14">
        {/* Cart Items Section */}
        <section aria-labelledby="cart-heading" className="lg:col-span-7">
          <h2 id="cart-heading" className="sr-only">
            {__("Items in your shopping cart")}
          </h2>

          <ul role="list" className="border-t border-b divide-y divide-zinc-900/10 border-zinc-900/10">
            {cart.items.map((item, index) => {
              const product = typeof item.product === "object" ? item.product : null;
              if (!product) return null;
              return (
                <li key={`${product.id}-${index}`} className="flex items-center py-6 sm:py-10">
                  <div className="shrink-0">
                    <div className="relative w-24 aspect-3/4 sm:w-40">
                      <ImageOrPlaceholder image={product.images?.[0]} alt={product.title} className="object-contain rounded-lg" />
                    </div>
                  </div>
                  <div className="flex flex-col flex-1 ml-4 sm:ml-6 rtl:mr-4 rtl:sm:ml-0">
                    <div className="relative pr-9 sm:grid sm:grid-cols-2 sm:gap-x-6 sm:pr-0">
                      <div>
                        <div className="flex justify-between">
                          <h3 className="text-sm">
                            <Link href={`/en/products/${product.slug || product.id}`} className="font-medium uppercase hover:text-zinc-600">
                              {product.title}
                            </Link>
                          </h3>
                        </div>
                        {item.variantOptions && item.variantOptions.length > 0 && (
                          <div className="mt-1.5 flex gap-2 text-sm">
                            {item.variantOptions.map((variant, idx) => (
                              <div key={idx} className="flex gap-1">
                                <p className="uppercase text-zinc-500 text-sm/6">{typeof variant.option === "string" ? variant.option : variant.option?.label || ""}</p>
                                {idx < (item.variantOptions || []).length - 1 && <p className="uppercase text-zinc-300 text-sm/6">/</p>}
                                <p className="uppercase text-zinc-500 text-sm/6">{variant.value}</p>
                              </div>
                            ))}
                          </div>
                        )}
                        <p className="mt-1.5 text-sm/6 uppercase font-medium">{formatPrice(product.salePrice || product.price || 0, currency, exchangeRate)}</p>
                      </div>
                      <div className="mt-4 sm:mt-0 sm:pr-9">
                        <div className="grid w-full grid-cols-1">
                          <div className="flex items-center text-sm">
                            <div className="flex items-center justify-between w-24 px-2 py-1 border rounded-full sm:w-28 border-zinc-950/15">
                              <button type="button" onClick={() => handleUpdateQuantity(product.id, item.quantity - 1)} disabled={item.quantity <= 1} className="flex items-center justify-center w-6 h-6 disabled:opacity-50 disabled:cursor-not-allowed">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
                                </svg>
                              </button>
                              <span className="flex-1 block font-medium leading-none text-center select-none">{item.quantity}</span>
                              <button type="button" onClick={() => handleUpdateQuantity(product.id, item.quantity + 1)} className="flex items-center justify-center w-6 h-6">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
                                  <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Remove Button */}
                        <div className="absolute top-0 right-0 rtl:left-0 rtl:right-auto">
                          <Button variant={"ghost"} tooltip={__("Remove item")} type="button" onClick={() => handleRemoveItem(product.id)} className="inline-flex p-2 text-zinc-400 hover:text-zinc-500">
                            <span className="sr-only">{__("Remove item")}</span>
                            <TrashIcon className="size-5" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* Order Summary Section */}
        <section aria-labelledby="summary-heading" className="px-4 py-6 mt-16 border rounded border-zinc-900/10 sm:p-6 lg:col-span-5 lg:mt-0 lg:p-8 bg-zinc-50 dark:bg-zinc-900/50">
          <h3 className="text-2xl font-medium">{__("Order summary")}</h3>
          <CouponForm showLabel={false} cart={cart} onCartUpdate={setCart} currency={currency} className={"border-t border-b mt-6 border-zinc-200 py-4 bg-zinc-50 mb-0"} />

          <dl className="mt-8 space-y-5">
            <div className="flex items-center justify-between">
              <dt className="text-sm font-medium uppercase text-zinc-600">{__("Subtotal")}</dt>
              <dd className="text-sm font-medium text-zinc-900">{formatPrice(cart.subtotal || 0, currency, exchangeRate)}</dd>
            </div>
            <hr className="w-full border-t border-zinc-950/10" />
            <>
              <div className="flex items-center justify-between text-green-600">
                <dt className="text-sm font-medium uppercase">{__("Discount")}</dt>
                <dd className="text-sm font-medium">-{formatPrice(cart.discount || 0, currency, exchangeRate)}</dd>
              </div>
              <hr className="w-full border-t border-zinc-950/10" />
            </>
            <div className="flex items-center justify-between pt-4">
              <dt className="text-base font-bold uppercase text-zinc-900">{__("Order total")}</dt>
              <dd className="text-base font-bold uppercase text-zinc-900">{formatPrice(cart.total || 0, currency, exchangeRate)}</dd>
            </div>
          </dl>
          <div className="mt-10">
            <Link href={getURL(`/checkout`, locale)} className="block w-full text-center font-medium rounded-full border border-zinc-900 bg-zinc-900 px-5 py-3.5 sm:px-6 sm:py-4 text-sm text-white hover:bg-zinc-800 transition-colors">
              {__("Checkout")}
            </Link>

            <div className="flex justify-center mt-4 text-sm text-center text-zinc-500">
              <span className="text-xs">
                {__("or")} <Link href={getURL(`/collections`, locale)} className="text-xs font-medium uppercase text-zinc-900 hover:underline">
                  {__("Continue Shopping →")}
                </Link>
              </span>
            </div>
          </div>
        </section>
      </form>
    </div>
  );
}
