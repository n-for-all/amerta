// components/product/ProductPrice.tsx
"use client";

import { getURL } from "@/amerta/utilities/getURL";
import { Product } from "@/payload-types";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";
import CollectionsDropdown from "@/amerta/theme/components/CollectionsDropdown";
import AddToCartForm from "@/amerta/theme/components/AddToCartForm";
import { ProductListingPrice } from "@/amerta/theme/components/ProductPrice";
import { useState, useEffect, createContext, useContext } from "react";
import { trackEcommerce } from "@/amerta/components/GTM/GTM.client";
import { AppSlot } from "@/amerta/apps/components/AppSlot";
import Link from "next/link";
import { resolveBundleChoices, isInStock } from "@/amerta/core/utilities/is-in-stock";
import type { ProductOffer } from "@/amerta/core/utilities/cart";
import { cn } from "@/amerta/utilities/ui";

/** Bundle: one picker per customer choice (e.g. Choose your game). Picking updates ?choice= so the page shows that product. */
export const BundleChoicePicker = ({ product, choices, className }: { product: Product; choices?: string[]; className?: string }) => {
  const { __ } = useEcommerce();
  const resolved = resolveBundleChoices(product, choices, true);
  if (!resolved.length) return null;
  return (
    <div className={cn("mt-8 space-y-6", className)}>
      {resolved.map((group) => (
        <fieldset key={group.group}>
          <legend className="mb-3 uppercase text-sm/6">{group.label}</legend>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {group.options.map((option) => {
              const selected = group.chosen?.id === option.id;
              const available = isInStock(option, null, group.quantity);
              const ids = resolved.map((g) => (g.group === group.group ? option.id : g.chosen?.id)).filter(Boolean);
              const image = (option.images || []).find((m: any) => m && typeof m === "object") as any;
              const body = (
                <>
                  <span className="relative block aspect-square w-full overflow-hidden rounded-md bg-current/5">{image?.url && <img src={image.url} alt={image.alt || option.title} className="absolute inset-0 h-full w-full object-contain" />}</span>
                  <span className="mt-2 block text-xs/5 font-medium">{option.title}</span>
                  {!available && <span className="block text-[11px] uppercase opacity-60">{__("Sold out")}</span>}
                </>
              );
              const cls = cn("block rounded-lg border p-2 text-center transition", selected ? "border-current ring-1 ring-current" : "border-current/20 hover:border-current/50", !available && "pointer-events-none opacity-40");
              return available ? (
                <Link key={option.id} href={{ query: { choice: ids.join(",") } }} scroll={false} replace aria-current={selected ? "true" : undefined} className={cls}>
                  {body}
                </Link>
              ) : (
                <span key={option.id} aria-disabled className={cls}>
                  {body}
                </span>
              );
            })}
          </div>
        </fieldset>
      ))}
    </div>
  );
};

/** Offers (cart rules) this product is part of, e.g. "Buy 2 coffees, get Keto Cream free". */
export const ProductOffers = ({ offers, locale, className }: { offers?: ProductOffer[]; locale: string; className?: string }) => {
  const { __ } = useEcommerce();
  if (!offers?.length) return null;
  return (
    <ul className={cn("mt-6 space-y-3", className)}>
      {offers.map((offer) => (
        <li key={offer.id} className="flex items-center gap-4 rounded-lg border border-current/20 p-3">
          {offer.gift?.image?.url ? (
            <span className="relative block h-14 w-14 shrink-0 overflow-hidden rounded-md bg-current/5">
              <img src={offer.gift.image.url} alt={offer.gift.image.alt || offer.gift.title} className="absolute inset-0 h-full w-full object-contain" />
            </span>
          ) : (
            <span aria-hidden className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-current/10 text-lg">%</span>
          )}
          <div className="min-w-0 text-sm/6">
            <p className="text-[11px] font-semibold uppercase tracking-wider opacity-60">{offer.gift ? __("Free gift offer") : __("Offer")}</p>
            <p className="font-medium">{offer.title}</p>
            {offer.gift?.slug && (
              <Link href={getURL(`/product/${offer.gift.slug}`, locale)} className="text-xs underline underline-offset-4 opacity-70 hover:opacity-100">
                {offer.gift.title}
              </Link>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
};

/** Products only sold inside a bundle: say so and link to the bundle(s), with this product already chosen. */
export const NotSoldSeparately = ({ product, bundles, locale, className }: { product: Product; bundles?: Product[]; locale: string; className?: string }) => {
  const { __ } = useEcommerce();
  return (
    <div role="note" className={cn("mt-8 rounded-lg border border-current/20 p-5", className)}>
      <p className="font-semibold uppercase text-sm/6">{__("Not sold separately")}</p>
      {bundles && bundles.length > 0 ? (
        <>
          <p className="mt-1 text-sm/6 opacity-70">{__("Available as part of:")}</p>
          <ul className="mt-3 space-y-2">
            {bundles.map((b) => (
              <li key={b.id}>
                <Link href={getURL(`/product/${b.slug}?choice=${product.id}`, locale)} className="inline-flex items-center gap-2 font-medium underline underline-offset-4">
                  {b.title} <span aria-hidden className="rtl:-scale-x-100">→</span>
                </Link>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <p className="mt-1 text-sm/6 opacity-70">{__("It is only available as part of a bundle.")}</p>
      )}
    </div>
  );
};

export interface ProductDetailContextType {
  product: Product;
  selectedVariant: NonNullable<Product["variants"]>[number] | null;
  options?: any;
  inStock?: boolean;
}

const ProductDetailContext = createContext<ProductDetailContextType | null>(null);

export const useProductDetail = () => useContext(ProductDetailContext);

export const ProductContext = ({ product, locale, collections, brand, inStock, options, choices, bundles, offers }: { product: Product; locale: string; collections: any[]; brand?: any; inStock: boolean; options: any; choices?: string[]; bundles?: Product[]; offers?: ProductOffer[] }) => {
  const bundleChoices = product.type === "bundle" ? resolveBundleChoices(product, choices, true).filter((c) => c.chosen).map((c) => ({ group: c.group, product: c.chosen!.id })) : undefined;
  const { __, currency, exchangeRate } = useEcommerce();
  const [selectedVariant, setSelectedVariant] = useState<NonNullable<Product["variants"]>[number] | null>(null);

  useEffect(() => {
    // Products with sizes/options keep their prices on the variants (the product's own price is empty):
    // report the lowest variant price, i.e. the "from" price the customer sees first.
    const variantPrices = product.type === "variant" ? (product.variants || []).map((v) => v.salePrice || v.price || 0).filter((p) => p > 0) : [];
    const basePrice = variantPrices.length ? Math.min(...variantPrices) : product.salePrice || product.price || 0;
    const price = basePrice * (Number(exchangeRate) || 1);
    trackEcommerce("view_item", {
      currency: currency?.code || "",
      value: price,
      items: [{ item_id: product.sku || product.id, item_name: product.title, price, quantity: 1 }],
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);
  const onVariantChange = (variant: NonNullable<Product["variants"]>[number] | null) => {
    setSelectedVariant(variant);
  };
  return (
    <ProductDetailContext.Provider value={{ product, selectedVariant, options, inStock }}>
      <div>
      <nav aria-label="Breadcrumb" className="font-medium text-xs/6">
        <ol role="list" className="flex flex-wrap items-center gap-2">
          <li>
            <div className="flex items-center gap-x-2">
              <a className="uppercase text-zinc-900 dark:text-zinc-200" href={getURL("/", locale)}>
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

      {(product as any).callout && (
        <div className="mt-4">
          <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-md animate-[pulse_3s_ease-in-out_infinite]">
            <span className="text-sm font-bold tracking-wide uppercase">
              {(product as any).callout}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-4 mt-8">
        {brand && (
          <div className="px-5 py-2 rounded-full bg-zinc-900">
            <p data-slot="text" className="text-xs text-white uppercase text-sm/6">
              {brand.title}
            </p>
          </div>
        )}
        {!product.notSoldSeparately && (
          <>
            <ProductListingPrice product={product} selectedVariant={selectedVariant} />
            <p data-slot="text" className="font-light uppercase text-zinc-400 text-sm/6">
              /
            </p>
          </>
        )}

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
            {product.reviewCount ? `${product.reviewCount} ${product.reviewCount !== 1 ? __("reviews") : __("review")}` : __("No reviews")}
          </a>
        </div>
      </div>
      {!product.notSoldSeparately && <AppSlot target="product.price.after" />}
      {!inStock && !product.notSoldSeparately ? <p className="mt-2 text-xs text-red-600 uppercase dark:text-red-400 text-sm/6">{__("Out of Stock")}</p> : null}

      <div className="mt-6 mb-4">{product.excerpt}</div>
      {product.notSoldSeparately ? (
        <NotSoldSeparately product={product} bundles={bundles} locale={locale} />
      ) : (
        <>
          <ProductOffers offers={offers} locale={locale} />
          {product.type === "bundle" && <BundleChoicePicker product={product} choices={choices} />}
          <AddToCartForm product={product} options={options} onVariantChange={onVariantChange} bundleChoices={bundleChoices} />
        </>
      )}
    </div>
    </ProductDetailContext.Provider>
  );
};
