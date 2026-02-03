"use client";
import { Product } from "@/payload-types";
import AddToCartForm from "../AddToCartForm";
import { ProductListingPrice } from "../ProductPrice";
import React from "react";

export const CartForm = ({ product, icon, noDefaults, compact, options, buttonClassName }: { product: Product; icon?: React.ReactNode; noDefaults?: boolean; compact?: boolean; options: any[]; buttonClassName?: string }) => {
  const [selectedVariant, setSelectedVariant] = React.useState<NonNullable<Product["variants"]>[number] | null>(null);
  const onVariantChange = (variant: NonNullable<Product["variants"]>[number] | null) => {
    setSelectedVariant(variant);
  };
  return (
    <>
      <AddToCartForm noDefaults={noDefaults} onVariantChange={onVariantChange} icon={icon} compact={compact} product={product} className="mb-0" options={options} buttonVariant="ghost" buttonClassName={buttonClassName} />
      <ProductListingPrice product={product} selectedVariant={selectedVariant} />
    </>
  );
};
