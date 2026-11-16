import { Collection, Product, ProductBrand, ProductOption, ProductReview } from "@/payload-types";
import ProductTabs from "@/amerta/theme/components/ProductTabs";
import { getAllProductOptions } from "@/amerta/core/utilities/get-product-options";
import { hasStock } from "@/amerta/core/utilities/has-stock";
import { ProductCard } from "@/amerta/theme/components/ProductCard";
import { RelatedProducts } from "@/amerta/theme/components/RelatedProducts";
import { getBundlesIncluding, getRelatedProducts } from "@/amerta/core/utilities/get-related-products";
import { getProductOffers } from "@/amerta/core/utilities/cart";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { BundlePart, bundleParts } from "@/amerta/core/utilities/is-in-stock";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";
import { getURL } from "@/amerta/utilities/getURL";

/** Bundle: its items side by side ("+" between them), then a list of what's in the box. */
const BundleArt = ({ parts, locale, __ }: { parts: BundlePart[]; locale: string; __: (k: string) => string }) => (
  <div className="py-6">
    <div className="flex flex-wrap items-center justify-center gap-y-6">
      {parts.map((p, i) => (
        <div key={p.key} className="contents">
          {i > 0 && (
            <span aria-hidden className="mx-2 shrink-0 text-3xl font-light opacity-50 sm:mx-3">
              +
            </span>
          )}
          <figure className="flex flex-col items-center text-center" style={{ width: i === 0 ? (parts.length <= 2 ? "44%" : "34%") : parts.length <= 2 ? "36%" : parts.length === 3 ? "24%" : "17%" }}>
            <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-zinc-100 dark:bg-zinc-800">
              {p.image?.url && <ImageMedia src={p.image.url} alt={p.image.alt || p.title} fill imgClassName="object-contain p-[6%]" />}
              {p.quantity > 1 && <span className="absolute end-2 top-2 rounded-full bg-zinc-900 px-2.5 py-1 text-xs font-semibold text-white">×{p.quantity}</span>}
            </div>
            <figcaption className="mt-3 text-xs/5 uppercase">
              {p.title}
              {p.detail && <span className="block normal-case text-zinc-500">{p.detail}</span>}
            </figcaption>
          </figure>
        </div>
      ))}
    </div>
    <div className="mt-10 border-t border-zinc-200 pt-6 dark:border-zinc-700">
      <p className="uppercase text-sm/6 font-semibold">{__("In the box")}</p>
      <ul className="mt-3 divide-y divide-zinc-200 dark:divide-zinc-700">
        {parts.map((p) => (
          <li key={p.key} className="flex items-center gap-4 py-3">
            <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-md bg-zinc-100 dark:bg-zinc-800">{p.image?.url && <ImageMedia src={p.image.url} alt={p.image.alt || p.title} fill imgClassName="object-contain" />}</div>
            <span className="w-10 shrink-0 tabular-nums font-semibold">×{p.quantity}</span>
            <div className="min-w-0 text-sm/6">
              {p.slug && !p.choice ? (
                <a href={getURL(`/product/${p.slug}`, locale)} className="font-medium hover:underline">
                  {p.title}
                </a>
              ) : (
                <span className="font-medium">{p.title}</span>
              )}
              {p.detail && <span className="block text-zinc-500">{p.detail}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  </div>
);
import { getProductReviews } from "@/amerta/core/utilities/get-product-reviews";
import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel";
import { createTranslator } from "@/amerta/core/utilities/translation";
import { ProductContext } from "@/amerta/theme/components/ProductDetail/ProductContext";
import { ProductImageGallery } from "@/amerta/theme/components/ProductDetail/ProductImageGallery";
import { Blocks } from "@/amerta/theme/blocks/Blocks";

const CartIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth={1}>
    <path d="M12 4V20M20 12H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
  </svg>
);

export default async function ProductDetail({ product, locale, options, choices }: { product: Product; locale: string; options: ProductOption[] | null; choices?: string[] }) {
  const productImages = product.images && product.images.length > 0 ? product.images : [];
  const productName = product.title;
  const brand = product.brand as ProductBrand | undefined;
  const inStock = hasStock(product);
  const collections = ((product.collections as Collection[]) || []).filter((c: Collection) => c.title);
  const reviews: ProductReview[] = await getProductReviews(product.id);
  const salesChannel = await getSalesChannel();
  const allOptions = await getAllProductOptions(locale);
  const relatedProducts = await getRelatedProducts(product, salesChannel!, locale);
  const __ = await createTranslator(locale);
  const bundle = product.type === "bundle" ? bundleParts(product, choices) : null;
  const bundles = product.notSoldSeparately ? await getBundlesIncluding(product.id, locale) : undefined;
  const offers = product.notSoldSeparately ? [] : await getProductOffers(await getPayload({ config: configPromise }), product, locale);

  return (
    <div className="relative space-y-12 product-page sm:space-y-16">
      <div className="absolute inset-x-0 z-10 h-px bg-white -top-px"></div>
      <main className="container">
        <div className="lg:flex">
          <div className="relative w-full lg:w-1/2">
            <div className="sticky top-0">
              {bundle ? <BundleArt parts={bundle.parts} locale={locale} __={__} /> : <ProductImageGallery productImages={productImages} productName={productName} />}
              <div className=""></div>
            </div>
          </div>

          <div className="w-full pt-10 lg:w-1/2 ltr:lg:pt-16 ltr:lg:pl-10 ltr:xl:pl-14 ltr:2xl:pl-16 rtl:lg:pt-16 rtl:lg:pr-10 rtl:xl:pr-14 rtl:2xl:pr-16">
            <div className="sticky top-16">
              <div>
                <ProductContext product={product} locale={locale} collections={collections} brand={brand} inStock={inStock} options={allOptions} choices={choices} bundles={bundles} offers={offers} />

                {product.showPairWith && product.pairWithProducts && Array.isArray(product.pairWithProducts) && product.pairWithProducts.length > 0 ? (
                  <div className="p-5 mt-10 rounded-lg bg-zinc-100">
                    <p data-slot="text" className="mb-3 font-semibold uppercase text-sm/6">
                      {__("PAIR IT WITH")}
                    </p>

                    <div className="space-y-10">
                      {(product.pairWithProducts as any[]).map((relatedProduct: any, idx: number) => (
                        <ProductCard
                          key={idx}
                          vertical
                          cartIcon={
                            <>
                              <CartIcon className="w-5 h-5" /> {__("Add to Cart")}
                            </>
                          }
                          product={relatedProduct}
                          locale={locale}
                          options={options || []}
                        />
                      ))}
                    </div>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-6 mt-10 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-4 lg:mt-16">
                  <div className="flex flex-col items-center justify-start gap-5 text-center">
                    <div className="flex items-center justify-center rounded-full size-16 bg-zinc-100 dark:bg-zinc-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth="1">
                        <path d="M14 2.22179C13.3538 2.09076 12.6849 2.02197 12 2.02197C6.47715 2.02197 2 6.49421 2 12.011C2 17.5277 6.47715 22 12 22C17.5228 22 22 17.5277 22 12.011C22 11.3269 21.9311 10.6587 21.8 10.0132" strokeLinecap="round" strokeWidth="1" />
                        <path
                          d="M12 9.01428C10.8954 9.01428 10 9.68512 10 10.5126C10 11.3401 10.8954 12.011 12 12.011C13.1046 12.011 14 12.6819 14 13.5093C14 14.3368 13.1046 15.0077 12 15.0077M12 9.01428C12.8708 9.01428 13.6116 9.43123 13.8862 10.0132M12 9.01428V8.01538M12 15.0077C11.1292 15.0077 10.3884 14.5908 10.1138 14.0088M12 15.0077V16.0066"
                          strokeLinecap="round"
                          strokeWidth="1"
                        />
                        <path d="M21.9951 2L17.8193 6.17362M16.9951 2.52119L17.1133 5.60928C17.1133 6.33713 17.5484 6.79062 18.3409 6.84782L21.465 6.99451" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                      </svg>
                    </div>
                    <p data-slot="text" className="max-w-xs leading-snug text-center uppercase text-zinc-600 text-sm/6">
                      {__("Best Price")}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-start gap-5 text-center">
                    <div className="flex items-center justify-center rounded-full size-16 bg-zinc-100 dark:bg-zinc-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth="1">
                        <path d="M2 21.1932C2.68524 22.2443 3.57104 22.2443 4.27299 21.1932C6.52985 17.7408 8.67954 23.6764 10.273 21.2321C12.703 17.5694 14.4508 23.9218 16.273 21.1932C18.6492 17.5582 20.1295 23.5776 22 21.5842" strokeLinecap="round" strokeWidth="1" />
                        <path d="M3.57228 17L2.07481 12.6457C1.80373 11.8574 2.30283 11 3.03273 11H20.8582C23.9522 11 19.9943 17 17.9966 17" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                        <path d="M18 11L15.201 7.50122C14.4419 6.55236 13.2926 6 12.0775 6H8C6.89543 6 6 6.89543 6 8V11" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                        <path d="M10 6V3C10 2.44772 9.55228 2 9 2H8" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                      </svg>
                    </div>
                    <p data-slot="text" className="max-w-xs leading-snug text-center uppercase text-zinc-600 text-sm/6">
                      {__("Free Shipping")}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-start gap-5 text-center">
                    <div className="flex items-center justify-center rounded-full size-16 bg-zinc-100 dark:bg-zinc-800">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth="1">
                        <path
                          d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1"
                        />
                      </svg>
                    </div>
                    <p data-slot="text" className="max-w-xs leading-snug text-center uppercase text-zinc-600 text-sm/6">
                      {__("100% Quality Guarantee")}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-start gap-5 text-center">
                    <div className="flex items-center justify-center rounded-full size-16 bg-zinc-100 dark:bg-zinc-800">
                      <svg viewBox="0 0 48 48" width="28" height="28" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M21 11V5C21 4.44772 20.5523 4 20 4C19.4477 4 19 4.44772 19 5V11C19 11.5523 19.4477 12 20 12C20.5523 12 21 11.5523 21 11ZM19 44H5C4.44772 44 4 43.5523 4 43C4 42.4477 4.44772 42 5 42H11.5116C7.02171 39.4081 4 34.5569 4 29V21C4 19.3417 5.34172 18 7 18H33C34.6583 18 36 19.3417 36 21V24H37.928C41.2423 24 43.928 26.6857 43.928 30C43.928 33.3143 41.2423 36 37.928 36H37.578C37.0257 36 36.578 35.5523 36.578 35C36.578 34.4477 37.0257 34 37.578 34H37.928C40.1377 34 41.928 32.2097 41.928 30C41.928 27.7903 40.1377 26 37.928 26H36V29C36 34.5569 32.9783 39.4081 28.4884 42H35C35.5523 42 36 42.4477 36 43C36 43.5523 35.5523 44 35 44H21H19ZM34 26V29C34 36.1797 28.1797 42 21 42H19C11.8203 42 6 36.1797 6 29V21C6 20.4463 6.44628 20 7 20H33C33.5537 20 34 20.4463 34 21V24H33C32.4477 24 32 24.4477 32 25C32 25.5523 32.4477 26 33 26H34ZM15 7V13C15 13.5523 14.5523 14 14 14C13.4477 14 13 13.5523 13 13V7C13 6.44772 13.4477 6 14 6C14.5523 6 15 6.44772 15 7ZM27 13V7C27 6.44772 26.5523 6 26 6C25.4477 6 25 6.44772 25 7V13C25 13.5523 25.4477 14 26 14C26.5523 14 27 13.5523 27 13Z"
                          fill="currentColor"
                        />
                      </svg>
                    </div>
                    <p data-slot="text" className="max-w-xs leading-snug text-center uppercase text-zinc-600 text-sm/6">
                      {__("Rich & Earthy Tones")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <hr role="presentation" className="w-full my-10 border-t sm:my-20 lg:my-24 border-zinc-950/10 dark:border-white/10" />
      <Blocks blocks={product.layout} params={{ slug: product.slug, locale }} />
      <main className="container">
        <div className="">
          <ProductTabs product={product} reviews={reviews} />
        </div>

        <div className="mt-14 lg:mt-16 xl:mt-20">
          <RelatedProducts title="Related Products" description="Discover other products" locale={locale}>
            {relatedProducts.map((product) => (
              <div key={product.id} className="embla__slide basis-[86%] ps-5 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/4">
                <ProductCard className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700" product={product} options={allOptions || []} locale={locale} />
              </div>
            ))}
          </RelatedProducts>
        </div>
      </main>
    </div>
  );
}
