import { Metadata } from "next";

import { Collection, Product } from "@/payload-types";
import { generateMeta } from "@/amerta/utilities/generateMeta";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/amerta/theme/ui/button";
import { ProductCard } from "@/amerta/theme/components/ProductCard";
import { Pagination } from "@/amerta/theme/components/Pagination";
import { getAllProductOptions } from "@/amerta/theme/utilities/get-product-options";
import { getProductsBrands } from "@/amerta/theme/utilities/get-products-brands";
import { CollectionFilters } from "@/amerta/theme/components/CollectionFilters";
import { parseSearchFilters } from "@/amerta/theme/utilities/parse-search-filters";
import { createTranslator } from "@/amerta/theme/utilities/translation";
import { printf } from "fast-printf";
import { getURL } from "@/amerta/utilities/getURL";
import RichText from "@/amerta/theme/components/RichText";
import { getCollectionBySlug } from "@/amerta/theme/utilities/get-collection-by-slug";
import { getProductsBy } from "@/amerta/theme/utilities/get-product-by";
import { SearchParams } from "next/dist/server/request/search-params";

export const dynamic = "force-dynamic";

export default async function CollectionPage({ params, searchParams }: { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<SearchParams> }) {
  const { slug, locale } = await params;
  const resolvedSearchParams = await searchParams;
  const { page } = resolvedSearchParams;
  const currentPage = Math.max(1, parseInt(page as string) || 1);
  const itemsPerPage = 12;

  let products: any[] = [];
  let totalProducts = 0;
  let totalPages = 1;
  let collectionName = slug.replace(/-/g, " ");
  let collectionDescription: any = {};

  const allOptions = await getAllProductOptions(locale);
  const brands = await getProductsBrands();
  const __ = await createTranslator(locale);

  const collection = await getCollectionBySlug(slug, locale);
  if (collection) {
    collectionName = collection.title;
    collectionDescription = collection.description;
  } else {
    redirect(getURL(`/collections`, locale));
  }

  const { whereQuery, sortQuery } = parseSearchFilters(resolvedSearchParams, allOptions, false);
  whereQuery.collections = { equals: collection!.id };

  const productsResult = await getProductsBy({
    limit: itemsPerPage,
    page: currentPage,
    whereQuery: whereQuery,
    sortQuery: sortQuery,
    locale: locale,
  });

  totalProducts = productsResult.totalDocs;
  totalPages = Math.ceil(totalProducts / itemsPerPage);
  products = productsResult.docs || [];

  return (
    <div>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="text-xs/6 font-medium py-3.5 container">
        <ol role="list" className="flex flex-wrap items-center gap-2">
          <li>
            <div className="flex items-center gap-x-2">
              <a className="uppercase text-zinc-900 dark:text-white" href={getURL("/", locale)}>
                {__("Home")}
              </a>
              <svg viewBox="0 0 6 20" aria-hidden="true" className="w-auto h-5 text-zinc-300 dark:text-zinc-700">
                <path d="M4.878 4.34H3.551L.27 16.532h1.327l3.281-12.19z" fill="currentColor"></path>
              </svg>
            </div>
          </li>
          <li>
            <span aria-current="page" className="uppercase text-zinc-500 hover:text-zinc-600 dark:text-zinc-400">
              {collectionName}
            </span>
          </li>
        </ol>
      </nav>

      <hr role="presentation" className="w-full border-t border-zinc-950/10 dark:border-white/10" />

      <main className="container">
        {/* Header Section */}
        <div className="flex flex-col items-center text-center py-14 lg:py-20">
          <div>
            <svg width="33" height="33" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_3045_1353)">
                <path d="M16.5 0C16.5 0 17.9497 8.10256 21.4236 11.5764C24.8974 15.0503 33 16.5 33 16.5C33 16.5 24.8974 17.9497 21.4236 21.4236C17.9497 24.8974 16.5 33 16.5 33C16.5 33 15.0503 24.8974 11.5764 21.4236C8.10256 17.9497 0 16.5 0 16.5C0 16.5 8.10256 15.0503 11.5764 11.5764C15.0503 8.10256 16.5 0 16.5 0Z" fill="black"></path>
              </g>
              <defs>
                <clipPath id="clip0_3045_1353">
                  <rect width="33" height="33" fill="white"></rect>
                </clipPath>
              </defs>
            </svg>
          </div>
          <h1 className="mt-5 text-3xl font-medium leading-none sm:text-4xl xl:text-5xl/none">
            <span className="text-zinc-500">{__("Collection")}</span>
            <br />
            <span className="underline">{collectionName}</span>
          </h1>
          <div className="max-w-xl mt-5 uppercase text-sm/6 text-zinc-600 dark:text-zinc-400">
            <RichText data={collectionDescription} enableProse={false} enableGutter={false} locale={locale} />
          </div>
        </div>

        <CollectionFilters totalProducts={totalProducts} currentProductCount={products.length} brands={brands} collections={[]} options={allOptions} />

        <hr role="presentation" className="w-full mt-4 border-t border-zinc-950/10 dark:border-white/10" />
        <div className="pt-10 pb-16 sm:pt-12 sm:pb-24">
          {totalProducts === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" className="w-16 h-16 mb-4 text-zinc-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <h3 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-white">{__("No Products Available")}</h3>
              <p className="max-w-md mb-8 text-center text-zinc-600 dark:text-zinc-400">{printf(__("Sorry, there are currently no products in the %s collection. Check back soon or browse our other collections!"), collectionName)}</p>
              <Button size={"lg"} variant="default" asChild>
                <Link href={getURL(`/collections`, locale)}>{__("Browse All Collections")}</Link>
              </Button>
            </div>
          ) : (
            <section>
              <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-7 xl:grid-cols-4">
                {products.map((product: Product) => {
                  return <ProductCard key={product.id} product={product} locale={locale} options={allOptions} />;
                })}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} searchParams={resolvedSearchParams} baseUrl={getURL(`/collections/${slug}`, locale)} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;

  let page: Collection | null = null;
  try {
    page = await getCollectionBySlug(slug, locale);
  } catch {
    // don't throw an error if the fetch fails
    // this is so that we can render a static home page for the demo
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // in production you may want to redirect to a 404  page or at least log the error somewhere
  }

  return generateMeta({ doc: page, type: "collection", locale });
}
