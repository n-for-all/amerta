import { Collection, Product, ProductBrand, ProductOption, ProductReview } from "@/payload-types";
import ProductTabs from "@/amerta/theme/components/ProductTabs";
import CollectionsDropdown from "@/amerta/theme/components/CollectionsDropdown";
import AddToCartForm from "@/amerta/theme/components/AddToCartForm";
import { ImageOrPlaceholder } from "@/amerta/theme/components/Thumbnail";
import { ProductPrice } from "@/amerta/theme/components/ProductPrice";
import { getAllProductOptions } from "@/amerta/theme/utilities/get-product-options";
import { hasStock } from "@/amerta/theme/utilities/has-stock";
import { getURL } from "@/amerta/utilities/getURL";
import { ProductCard } from "@/amerta/theme/components/ProductCard";
import { RelatedProducts } from "../RelatedProducts";
import { getRelatedProducts } from "@/amerta/theme/utilities/get-related-products";
import { getProductReviews } from "@/amerta/theme/utilities/get-product-reviews";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { createTranslator } from "../../utilities/translation";

const CartIcon = ({ className }: { className?: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth={1}>
    <path d="M12 4V20M20 12H4" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
  </svg>
);

export default async function ProductDetail({ product, locale, options }: { product: Product; locale: string; options: ProductOption[] | null }) {
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

  return (
    <div className="relative space-y-12 product-page sm:space-y-16">
      <div className="absolute inset-x-0 z-10 h-px bg-white -top-px"></div>
      <main className="container">
        <div className="lg:flex">
          <div className="relative w-full lg:w-1/2">
            <div className="sticky top-0">
              <div className="swimlane hidden-scrollbar lg:grid-flow-row lg:grid-cols-2 lg:overflow-x-hidden undefined">
                {productImages.length > 0 ? (
                  <>
                    <div className="relative cursor-pointer bg-zinc-100 group aspect-3/4 w-72 shrink-0 snap-center sm:w-96 lg:w-full lg:col-span-2" aria-hidden="true">
                      <ImageOrPlaceholder alt={productName} className="object-contain w-full h-full" image={typeof productImages[0] === "string" ? productImages[0] : (productImages[0] as any)?.url} />
                      <button className="absolute flex items-center justify-center w-8 h-8 transition-opacity bg-white rounded-full opacity-0 top-3 left-3 rtl:right-3 rtl:left-auto group-hover:opacity-100 dark:text-neutral-100" type="button">
                        <span className="sr-only">{__("View image")}</span>
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                        </svg>
                      </button>
                    </div>
                    {productImages.slice(1).map((image, idx) => (
                      <div key={idx} className="relative cursor-pointer bg-zinc-100 group aspect-3/4 w-72 shrink-0 snap-center sm:w-96 lg:w-full lg:col-span-1" aria-hidden="true">
                        <ImageOrPlaceholder alt={productName} className="object-contain w-full h-full" image={typeof image === "string" ? image : (image as any)?.url} />
                        <button className="absolute flex items-center justify-center w-8 h-8 transition-opacity bg-white rounded-full opacity-0 top-3 left-3 rtl:right-3 rtl:left-auto group-hover:opacity-100 dark:text-neutral-100" type="button">
                          <span className="sr-only">{__("View image")}</span>
                          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </>
                ) : (
                  <div className="relative cursor-pointer bg-zinc-100 group aspect-3/4 w-72 shrink-0 snap-center sm:w-96 lg:w-full lg:col-span-2">
                    <div className="flex items-center justify-center w-full h-full text-zinc-400 bg-zinc-200">{__("No image available")}</div>
                  </div>
                )}
              </div>
              <div className=""></div>
            </div>
          </div>

          <div className="w-full pt-10 lg:w-1/2 ltr:lg:pt-16 ltr:lg:pl-10 ltr:xl:pl-14 ltr:2xl:pl-16 rtl:lg:pt-16 rtl:lg:pr-10 rtl:xl:pr-14 rtl:2xl:pr-16">
            <div className="sticky top-16">
              <div>
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
                          {productName}
                        </span>
                      </li>
                    </ol>
                  </nav>

                  <h1 title={productName} className="mt-4 text-3xl leading-none sm:text-4xl xl:text-5xl/none text font-medium *:data-[slot=dim]:text-zinc-300 *:data-[slot=italic]:font-serif *:data-[slot=italic]:font-normal *:data-[slot=italic]:italic *:data-[slot=dim]:dark:text-zinc-500">
                    {productName}
                  </h1>

                  <div className="flex flex-wrap items-center gap-4 mt-8">
                    {brand && (
                      <div className="px-5 py-2 rounded-full bg-zinc-900">
                        <p data-slot="text" className="text-xs text-white uppercase text-sm/6">
                          {brand.title}
                        </p>
                      </div>
                    )}
                    <ProductPrice product={product} />
                    <p data-slot="text" className="font-light uppercase text-zinc-400 text-sm/6">
                      /
                    </p>

                    <div className="flex items-center gap-1">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                        <path fillRule="evenodd" d="M10.788 3.21c.448-1.077 1.976-1.077 2.424 0l2.082 5.006 5.404.434c1.164.093 1.636 1.545.749 2.305l-4.117 3.527 1.257 5.273c.271 1.136-.964 2.033-1.96 1.425L12 18.354 7.373 21.18c-.996.608-2.231-.29-1.96-1.425l1.257-5.273-4.117-3.527c-.887-.76-.415-2.212.749-2.305l5.404-.434 2.082-5.005Z" clipRule="evenodd" />
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
                </div>
                <div className="mt-6 mb-4">{product.excerpt}</div>
                <AddToCartForm product={product} options={allOptions} />

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

                <div className="grid grid-cols-2 gap-6 mt-10 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 lg:mt-16">
                  <div className="flex flex-col items-center justify-start gap-5 text-center">
                    <div className="flex items-center justify-center rounded-full size-16 bg-zinc-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth="1">
                        <path d="M14 2.22179C13.3538 2.09076 12.6849 2.02197 12 2.02197C6.47715 2.02197 2 6.49421 2 12.011C2 17.5277 6.47715 22 12 22C17.5228 22 22 17.5277 22 12.011C22 11.3269 21.9311 10.6587 21.8 10.0132" strokeLinecap="round" strokeWidth="1" />
                        <path d="M12 9.01428C10.8954 9.01428 10 9.68512 10 10.5126C10 11.3401 10.8954 12.011 12 12.011C13.1046 12.011 14 12.6819 14 13.5093C14 14.3368 13.1046 15.0077 12 15.0077M12 9.01428C12.8708 9.01428 13.6116 9.43123 13.8862 10.0132M12 9.01428V8.01538M12 15.0077C11.1292 15.0077 10.3884 14.5908 10.1138 14.0088M12 15.0077V16.0066" strokeLinecap="round" strokeWidth="1" />
                        <path d="M21.9951 2L17.8193 6.17362M16.9951 2.52119L17.1133 5.60928C17.1133 6.33713 17.5484 6.79062 18.3409 6.84782L21.465 6.99451" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                      </svg>
                    </div>
                    <p data-slot="text" className="max-w-xs leading-snug text-center uppercase text-zinc-600 text-sm/6">
                      {__("30 Days Return")}
                    </p>
                  </div>
                  <div className="flex flex-col items-center justify-start gap-5 text-center">
                    <div className="flex items-center justify-center rounded-full size-16 bg-zinc-100">
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
                    <div className="flex items-center justify-center rounded-full size-16 bg-zinc-100">
                      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" color="currentColor" stroke="currentColor" strokeWidth="1">
                        <path d="M10.4107 19.9677C7.58942 17.858 2 13.0348 2 8.69444C2 5.82563 4.10526 3.5 7 3.5C8.5 3.5 10 4 12 6C14 4 15.5 3.5 17 3.5C19.8947 3.5 22 5.82563 22 8.69444C22 13.0348 16.4106 17.858 13.5893 19.9677C12.6399 20.6776 11.3601 20.6776 10.4107 19.9677Z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
                      </svg>
                    </div>
                    <p data-slot="text" className="max-w-xs leading-snug text-center uppercase text-zinc-600 text-sm/6">
                      {__("100% Quality Guarantee")}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <hr role="presentation" className="w-full my-16 border-t sm:my-24 lg:my-28 border-zinc-950/10 dark:border-white/10" />

      <main className="container">
        <h2 className="text-3xl font-medium leading-none text-center sm:text-4xl xl:text-5xl/none text">
          <span className="font-serif italic">{__("all about the")}</span> <br />
          <span>{__("PRODUCT")}</span>
        </h2>

        <div className="mt-14 lg:mt-16 xl:mt-20">
          <ProductTabs product={product} reviews={reviews} />
        </div>

        <div className="mt-14 lg:mt-16 xl:mt-20">
          <RelatedProducts title="Related Products" description="Discover other products" products={relatedProducts} options={options || []} locale={locale} />
        </div>
      </main>
    </div>
  );
}
