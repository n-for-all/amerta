"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/amerta/theme/ui/button";
import { Product } from "@/payload-types";
import { cn } from "@/amerta/utilities/ui";

interface WishlistButtonProps {
  product: Product;
  variant?: "default" | "ghost" | "outline";
  className?: string;
  iconClassName?: string;
  showText?: boolean;
}

export const WishlistButton = ({ product, variant = "ghost", className, iconClassName, showText = false }: WishlistButtonProps) => {
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check if product is in wishlist on mount
  useEffect(() => {
    const checkWishlist = () => {
      const storedWishlist = localStorage.getItem("wishlist");
      if (storedWishlist) {
        try {
          const wishlist = JSON.parse(storedWishlist);
          const inWishlist = wishlist.items?.some((item: any) => item.product.id === product.id);
          setIsInWishlist(inWishlist);
        } catch (error) {
          console.error("Failed to parse wishlist:", error);
        }
      }
    };

    checkWishlist();
  }, [product.id]);

  // Listen for wishlist updates
  useEffect(() => {
    const handleWishlistUpdate = ((event: Event) => {
      const customEvent = event as CustomEvent;
      const updatedWishlist = customEvent.detail;
      if (updatedWishlist) {
        const inWishlist = updatedWishlist.items?.some((item: any) => item.product.id === product.id);
        setIsInWishlist(inWishlist);
      }
    }) as EventListener;

    window.addEventListener("wishlistUpdated", handleWishlistUpdate);
    return () => window.removeEventListener("wishlistUpdated", handleWishlistUpdate);
  }, [product.id]);

  const toggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setIsLoading(true);

    try {
      const storedWishlist = localStorage.getItem("wishlist");
      let wishlist: any;

      if (storedWishlist) {
        wishlist = JSON.parse(storedWishlist);
      } else {
        // Create new wishlist
        wishlist = {
          wishlistId: `wishlist_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          items: [],
        };
      }

      if (isInWishlist) {
        // Remove from wishlist
        wishlist.items = wishlist.items.filter((item: any) => item.product.id !== product.id);
      } else {
        // Add to wishlist
        wishlist.items.push({
          product: product,
          addedAt: new Date().toISOString(),
        });
      }

      localStorage.setItem("wishlist", JSON.stringify(wishlist));
      setIsInWishlist(!isInWishlist);
      window.dispatchEvent(new CustomEvent("wishlistUpdated", { detail: wishlist }));

      // TODO: Call API to update wishlist on server
      // if (isInWishlist) {
      //   await removeFromWishlist(product.id);
      // } else {
      //   await addToWishlist(product.id);
      // }
    } catch (error) {
      console.error("Failed to update wishlist:", error);
    }

    setIsLoading(false);
  };

  return (
    <Button
      variant={variant}
      onClick={toggleWishlist}
      disabled={isLoading}
      className={cn("relative", className)}
      title={isInWishlist ? "Remove from wishlist" : "Add to wishlist"}
    >
      <Heart
        strokeWidth={1.5}
        className={cn("w-4 h-4 transition-all", iconClassName, isInWishlist && "fill-current text-red-500")}
      />
      {showText && <span className="ml-2">{isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}</span>}
    </Button>
  );
};
