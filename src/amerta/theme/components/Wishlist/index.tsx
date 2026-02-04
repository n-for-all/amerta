"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, AlertCircle, Loader2 } from "lucide-react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Product, Wishlist as WishlistType } from "@/payload-types";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { cn } from "@/amerta/utilities/ui";
import { useAuth } from "@/amerta/providers/Auth";
import { getCustomerWishlist, removeWishlistItem, syncLocalWishlist } from "@/amerta/theme/utilities/wishlist";
import { getURL } from "@/amerta/utilities/getURL";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

const getProductId = (item: any): string => {
  return typeof item.product === "string" ? item.product : item.product.id;
};

export default function Wishlist({ className }: { className?: string }) {
  const [wishlist, setWishlist] = useState<Partial<WishlistType> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removingItemId, setRemovingItemId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const { currency, locale, exchangeRate, __ } = useEcommerce();
  const { user } = useAuth();

  useEffect(() => {
    const initializeWishlist = async () => {
      setLoading(true);

      const storedStr = localStorage.getItem("wishlist");
      const localWishlist = storedStr ? JSON.parse(storedStr) : null;
      const localItems = localWishlist?.items || [];

      if (user) {
        try {
          let serverWishlist: any = null;

          if (localItems.length > 0) {
            serverWishlist = await syncLocalWishlist(localItems);

            localStorage.removeItem("wishlist");

            window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: null }));
          } else {
            serverWishlist = await getCustomerWishlist();
          }

          setWishlist(serverWishlist);
        } catch (err) {
          console.error("Wishlist sync error:", err);
        }
      } else {
        setWishlist(localWishlist);
      }
      setLoading(false);
    };

    initializeWishlist();
  }, [user]);

  useEffect(() => {
    if (user) return;

    const handleLocalUpdate = ((event: Event) => {
      const customEvent = event as CustomEvent;
      setWishlist(customEvent.detail);
    }) as EventListener;

    window.addEventListener("wishlistUpdated", handleLocalUpdate);
    return () => window.removeEventListener("wishlistUpdated", handleLocalUpdate);
  }, [user]);

  const handleRemoveItem = async (productId: string) => {
    setRemovingItemId(productId);
    setError(null);

    try {
      if (user) {
        const updated = await removeWishlistItem(productId);
        if (updated) setWishlist(updated);
      } else {
        if (!wishlist) return;

        const updatedItems = (wishlist.items || []).filter((item) => {
          return getProductId(item) !== productId;
        });

        const updatedWishlist = { ...wishlist, items: updatedItems };

        setWishlist(updatedWishlist);
        localStorage.setItem("wishlist", JSON.stringify(updatedWishlist));
        window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: updatedWishlist }));
      }
    } catch (error: any) {
      setError(error?.message || "Failed to remove item");
    } finally {
      setRemovingItemId(null);
    }
  };

  const itemCount = (wishlist?.items || []).length || 0;

  return (
    <Popover className="relative inline-flex items-center">
      <PopoverButton className={cn("inline-flex cursor-pointer text-left items-center justify-center p-1 md:p-2.5 relative focus:outline-none focus:ring-0", className)}>
        <Heart className="w-6 h-6" strokeWidth={1} />
        {!loading && itemCount > 0 && <span className="text-xs font-semibold leading-none">({itemCount})</span>}
      </PopoverButton>
      <PopoverPanel className="absolute right-0 z-50 mt-2 bg-white border rounded shadow-xl max-w-56 md:max-w-none rtl:left-0 rtl:right-auto top-full w-96 border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700">
        <div className="flex flex-col max-h-[600px]">
          {}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 mx-4 mt-2 text-xs border border-red-200 rounded bg-red-50 dark:bg-red-900/20 dark:border-red-800">
              <AlertCircle className="flex-shrink-0 w-3 h-3 text-red-600 dark:text-red-400" />
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          {}
          <div className="flex-1 overflow-y-auto min-h-[150px]">
            {loading ? (
              <div className="flex items-center justify-center h-full py-12">
                <Loader2 className="w-6 h-6 animate-spin text-zinc-400" />
              </div>
            ) : !wishlist || (wishlist.items || []).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="w-10 h-10 text-zinc-400" strokeWidth={1} />
                <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">{__("Your wishlist is empty")}</p>
                <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">{__("Add items you love to your wishlist")}</p>
              </div>
            ) : (
              <div className="p-4 space-y-4">
                {wishlist.items?.map((item) => {
                  const product = item.product as Product;
                  if (typeof product === "string") return null;

                  return (
                    <div key={product.id} className="flex items-center gap-3 group">
                      {}
                      <Link href={getURL(`/product/${product.slug || product.id}`, locale)} className="relative flex-shrink-0 w-16 h-20 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">
                        {product.images?.[0] && typeof product.images[0] !== "string" && product.images[0].url ? (
                          <ImageMedia alt={product.images[0].alt || product.title} src={product.images[0].url} fill imgClassName="object-cover w-full h-full transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-zinc-300">
                            <Heart className="w-6 h-6" />
                          </div>
                        )}
                      </Link>

                      <div className="flex flex-col flex-1 min-w-0">
                        {}
                        <Link href={getURL(`/product/${product.slug || product.id}`, locale)} className="text-sm font-medium truncate text-zinc-900 dark:text-white hover:underline">
                          {product.title}
                        </Link>

                        {}
                        {product.brand && <p className="text-xs text-zinc-500 truncate mt-0.5">{typeof product.brand === "string" ? "Brand" : product.brand.title}</p>}

                        <div className="flex items-center justify-between mt-2">
                          {}
                          <p className="text-sm font-semibold text-zinc-900 dark:text-white">{formatPrice(product.price, currency, exchangeRate)}</p>

                          {}
                          <button onClick={() => handleRemoveItem(product.id)} disabled={removingItemId === product.id} className="text-xs text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 disabled:opacity-50 disabled:cursor-not-allowed">
                            {removingItemId === product.id ? <Loader2 className="w-3 h-3 animate-spin" /> : __("Remove")}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {}
          {wishlist && (wishlist.items || []).length > 0 && (
            <div className="flex-shrink-0 px-4 py-3 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
              <Link href={getURL(`/collections/all`, locale)} className="block w-full py-2 text-xs font-medium text-center text-white bg-black rounded-md hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200">
                {__("Continue Shopping")}
              </Link>
            </div>
          )}
        </div>
      </PopoverPanel>
    </Popover>
  );
}
