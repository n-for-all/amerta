// components/product/ProductPrice.tsx
"use client";

import { getURL } from "@/amerta/utilities/getURL";
import { Product } from "@/payload-types";
import { useEcommerce } from "../../providers/EcommerceProvider";
import CollectionsDropdown from "../CollectionsDropdown";
import AddToCartForm from "../AddToCartForm";
import { ProductListingPrice, ProductPrice } from "../ProductPrice";
import { useState } from "react";

export const ProductContext = ({ product, locale, collections, brand, inStock, options }: { product: Product; locale: string; collections: any[]; brand?: any; inStock: boolean; options: any }) => {
  const { __ } = useEcommerce();
  const [selectedVariant, setSelectedVariant] = useState<NonNullable<Product["variants"]>[number] | null>(null);
  const onVariantChange = (variant: NonNullable<Product["variants"]>[number] | null) => {
    setSelectedVariant(variant);
  };
  return (
    <div>
      <nav aria-label="Breadcrumb" className="font-medium text-xs/6">
        <ol role="list" className="flex flex-wrap items-center gap-2">
          <li>
            <div className="flex items-center gap-x-2">
              <a className="uppercase text-zinc-900" href={getURL("/", locale)}>
                {__("Home")}
              </a>
              <svg viewBox="0 0 6 20" aria-hidden="true" className="w-auto h-5 text-zinc-300">
                <path d="M4.878 4.34H3.551L.27 16.532h1.327l3.281-12.19z" fill="currentColor"></path>
              </svg>
            </div>
          </li>
          <CollectionsDropdown collections={collections} />
          <li>
            <span aria-current="page" className="uppercase text-zinc-500 hover:text-zinc-600">
              {product.title}
            </span>
          </li>
        </ol>
      </nav>

      <h1 title={product.title} className="mt-4 text-3xl leading-none sm:text-4xl xl:text-5xl/none text font-medium *:data-[slot=dim]:text-zinc-300 *:data-[slot=italic]:font-serif *:data-[slot=italic]:font-normal *:data-[slot=italic]:italic *:data-[slot=dim]:dark:text-zinc-500">
        {product.title}
      </h1>

      <div className="flex flex-wrap items-center gap-4 mt-8">
        {brand && (
          <div className="px-5 py-2 rounded-full bg-zinc-900">
            <p data-slot="text" className="text-xs text-white uppercase text-sm/6">
              {brand.title}
            </p>
          </div>
        )}
        <ProductListingPrice product={product} selectedVariant={selectedVariant} />
        <p data-slot="text" className="font-light uppercase text-zinc-400 text-sm/6">
          /
        </p>

        <div className="flex items-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
            <path
              fillRule="evenodd"
              d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z"
              clipRule="evenodd"
            />
          </svg>
          <p data-slot="text" className="uppercase text-sm/6">
            {product.rating ? product.rating.toFixed(1) : "0.0"}
          </p>
          <p data-slot="text" className="uppercase text-sm/6">
            ·
          </p>
          <a className="!capitalize underline text-sm/6 uppercase" href="#reviews">
            {product.reviewCount ? `${product.reviewCount} review${product.reviewCount !== 1 ? "s" : ""}` : __("No reviews")}
          </a>
        </div>
      </div>
      {!inStock ? <p className="mt-2 text-xs text-red-600 uppercase dark:text-red-400 text-sm/6">{__("Out of Stock")}</p> : null}

      <div className="mt-6 mb-4">{product.excerpt}</div>
      <AddToCartForm product={product} options={options} onVariantChange={onVariantChange} />
    </div>
  );
};
