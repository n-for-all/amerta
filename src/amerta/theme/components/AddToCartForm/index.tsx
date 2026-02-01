"use client";

import { useState } from "react";
import { Product, ProductOption } from "@/payload-types";
import { ProductVariantSelector } from "@/amerta/theme/components/ProductVariantSelector";
import { hasStock } from "@/amerta/theme/utilities/has-stock";
import { hasMatchingVariant } from "@/amerta/theme/utilities/has-matching-variant";
import { Button } from "@/amerta/theme/ui/button";
import { cn } from "@/amerta/utilities/ui";
import { useToast } from "@/amerta/theme/ui/toast";
import { Loader2 } from "lucide-react";
import { useEcommerce } from "../../providers/EcommerceProvider";

interface AddToCartFormProps {
  product: Product;
  options: ProductOption[];
  compact?: boolean;
  children?: React.ReactNode;
  buttonClassName?: string;
  buttonVariant?: "default" | "outline" | "ghost" | "link";
  className?: string;
  icon?: React.ReactNode;
}

const CartQty = ({label, loading, quantity, onChange }: { label: string; loading: boolean; quantity: number; onChange: (value: number) => void }) => {
  return (
    <div>
      <p data-slot="text" className="uppercase text-sm/6">
        {label}
      </p>
      <div className="flex items-center justify-between w-24 mt-2 sm:w-28">
        <button disabled={loading} className="flex items-center justify-center w-8 h-8 bg-white border rounded-full border-zinc-950/15 hover:border-zinc-950/20 focus:outline-none disabled:cursor-default dark:border-neutral-500 dark:bg-neutral-900 dark:hover:border-neutral-400" type="button" onClick={() => onChange(-1)}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M4.25 12a.75.75 0 0 1 .75-.75h14a.75.75 0 0 1 0 1.5H5a.75.75 0 0 1-.75-.75Z" clipRule="evenodd" />
          </svg>
        </button>
        <span className="flex-1 block leading-none text-center select-none">{quantity}</span>
        <button className="flex items-center justify-center w-8 h-8 bg-white border rounded-full border-zinc-950/15 hover:border-zinc-950/20 focus:outline-none disabled:cursor-default dark:border-neutral-500 dark:bg-neutral-900 dark:hover:border-neutral-400" type="button" onClick={() => onChange(1)} disabled={loading}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M12 3.75a.75.75 0 0 1 .75.75v6.75h6.75a.75.75 0 0 1 0 1.5h-6.75v6.75a.75.75 0 0 1-1.5 0v-6.75H4.5a.75.75 0 0 1 0-1.5h6.75V4.5a.75.75 0 0 1 .75-.75Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default function AddToCartForm({ product, options, compact, icon, buttonVariant = "default", buttonClassName, className }: AddToCartFormProps) {
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [variantOptions, setVariantOptions] = useState<Array<{ option: string; value: string }>>([]);
  const { toast } = useToast();
  const { __ } = useEcommerce();

  const handleQuantityChange = (value: number) => {
    const newQuantity = Math.max(1, Math.min(10, quantity + value));
    setQuantity(newQuantity);
  };

  const handleAddToCart = async () => {
    if (!product.id) return;

    setIsLoading(true);

    try {
      const response = await fetch("/api/cart/add", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product: product.id,
          quantity,
          variantOptions,
        }),
      });

      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.error || "Failed to add product to cart");
      }

      const data = await response.json();
      toast(`${product.title} was added to cart (${quantity}x)`, "success", true);

      setQuantity(1);

      // Store cart in localStorage and dispatch update event
      if (data.cart) {
        localStorage.setItem("cart", JSON.stringify(data.cart));
        window.dispatchEvent(new CustomEvent("cartUpdated", { detail: data.cart }));
      }
    } catch (error: any) {
      toast(error.message ? error.message : `Error adding ${product.title} to cart`, "error", true);
    } finally {
      setIsLoading(false);
    }
  };

  const isActive = () => {
    switch (product.type) {
      case "simple":
        return quantity > 0;
      case "variant":
        return hasMatchingVariant(product, variantOptions) && quantity > 0;
      default:
        return false;
    }
  };

  //   if(product.type === "simple" && !hasStock(product, quantity)) {

  if (!hasStock(product)) {
    if (compact) return null;
    return <p className="mt-2 text-xs text-red-600 uppercase dark:text-red-400 text-sm/6">{__("Out of Stock")}</p>;
  }

  return (
    <form className={cn(compact ? "flex items-center justify-between gap-4" : "block mt-10", className)} onSubmit={(e) => e.preventDefault()}>
      {product.type == "variant" ? (
        <ProductVariantSelector
          compact={compact}
          options={options}
          product={product}
          onVariantChange={(productVariant: NonNullable<Product["variants"]>[number] | null) => {
            if (!productVariant) {
              setVariantOptions([]);
              return;
            }
            setVariantOptions(Object.entries(productVariant.variant || {}).map(([optionId, value]) => ({ option: optionId, value: value.value as string })));
          }}
        />
      ) : null}
      {compact ? (
        <Button tooltip="Add to cart" variant={buttonVariant} disabled={!isActive() || isLoading} className={cn("disabled:opacity-50 disabled:cursor-not-allowed", buttonClassName)} type="button" onClick={handleAddToCart}>
          {isLoading ? (
            <Loader2 className="w-4 h-4 cursor-not-allowed animate-spin" />
          ) : icon ? (
            icon
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth="1.5">
              <path d="M3.06164 14.4413L3.42688 12.2985C3.85856 9.76583 4.0744 8.49951 4.92914 7.74975C5.78389 7 7.01171 7 9.46734 7H14.5327C16.9883 7 18.2161 7 19.0709 7.74975C19.9256 8.49951 20.1414 9.76583 20.5731 12.2985L20.9384 14.4413C21.5357 17.946 21.8344 19.6983 20.9147 20.8491C19.995 22 18.2959 22 14.8979 22H9.1021C5.70406 22 4.00504 22 3.08533 20.8491C2.16562 19.6983 2.4643 17.946 3.06164 14.4413Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7.5 9L7.71501 5.98983C7.87559 3.74176 9.7462 2 12 2C14.2538 2 16.1244 3.74176 16.285 5.98983L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          )}
        </Button>
      ) : (
        <div className="flex flex-col mt-6 gap-7">
          <CartQty label={__("Qty")} loading={isLoading} quantity={quantity} onChange={handleQuantityChange} />
          <div className="flex flex-col gap-8 mt-4">
            <button disabled={!isActive() || isLoading} className={cn("w-full max-w-4xl cursor-pointer py-5 font-medium tracking-wide sm:py-6 relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 rounded-full border uppercase px-5 sm:px-6 sm:py-6 text-sm/none focus:not-data-focus:outline-hidden data-focus:outline-2 data-focus:outline-offset-2 data-focus:outline-blue-500 data-disabled:opacity-50 border-zinc-900 text-zinc-950 active:bg-zinc-950 transition-all duration-500 hover:text-zinc-100 hover:bg-zinc-950 dark:border-white/40 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed", buttonClassName)} type="button" onClick={handleAddToCart}>
              {isLoading ? __("Adding...") : __("Add to cart")}
              <div className="absolute right-1.5 flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white sm:h-12 sm:w-12">
                {icon ? (
                  icon
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth="1.5">
                    <path d="M3.06164 14.4413L3.42688 12.2985C3.85856 9.76583 4.0744 8.49951 4.92914 7.74975C5.78389 7 7.01171 7 9.46734 7H14.5327C16.9883 7 18.2161 7 19.0709 7.74975C19.9256 8.49951 20.1414 9.76583 20.5731 12.2985L20.9384 14.4413C21.5357 17.946 21.8344 19.6983 20.9147 20.8491C19.995 22 18.2959 22 14.8979 22H9.1021C5.70406 22 4.00504 22 3.08533 20.8491C2.16562 19.6983 2.4643 17.946 3.06164 14.4413Z" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M7.5 9L7.71501 5.98983C7.87559 3.74176 9.7462 2 12 2C14.2538 2 16.1244 3.74176 16.285 5.98983L16.5 9" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
            </button>
          </div>
        </div>
      )}
    </form>
  );
}
