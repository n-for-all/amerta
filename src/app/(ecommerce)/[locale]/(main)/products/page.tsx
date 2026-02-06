import { Metadata } from "next";

import { Product, type Page } from "@/payload-types";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { ProductCard } from "@/amerta/theme/components/ProductCard";
import { Pagination } from "@/amerta/theme/components/Pagination";
import { getAllProductOptions } from "@/amerta/theme/utilities/get-product-options";
import { CollectionFilters } from "@/amerta/theme/components/CollectionFilters";
import { getProductsBrands } from "@/amerta/theme/utilities/get-products-brands";
import { Button } from "@/amerta/theme/ui/button";
import Link from "next/link";
import { parseSearchFilters } from "@/amerta/theme/utilities/parse-search-filters";
import { createTranslator } from "@/amerta/theme/utilities/translation";
import { getURL } from "@/amerta/utilities/getURL";
import { getCollections } from "@/amerta/theme/utilities/get-collections";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { getProductsBy } from "@/amerta/theme/utilities/get-product-by";
import { SearchParams } from "next/dist/server/request/search-params";

export default async function Page({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }) {
  const { locale } = await params;
  const resolvedSearchParams = await searchParams;
  const { page } = resolvedSearchParams;
  const currentPage = Math.max(1, parseInt(page as string || "0") || 1);
  const itemsPerPage = 12;

  const __ = await createTranslator(locale);

  let products: any[] = [];
  let totalProducts = 0;
  let totalPages = 1;

  const allOptions = await getAllProductOptions(locale);
  const brands = await getProductsBrands();
  const salesChannel = await getSalesChannel();

  const collectionsResult = await getCollections({ page: 1, limit: 100, locale }, salesChannel);
  const allCollections = collectionsResult.docs || [];

  try {
    const { whereQuery, sortQuery } = parseSearchFilters(resolvedSearchParams, allOptions);
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
  } catch {
    // when deploying this template on Payload Cloud, this page needs to build before the APIs are live
    // so swallow the error here and simply render the page with fallback data where necessary
    // in production you may want to redirect to a 404  page or at least log the error somewhere
    // console.error(error)
  }

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
              {__("Products")}
            </span>
          </li>
        </ol>
      </nav>

      <hr role="presentation" className="w-full border-t border-zinc-950/10 dark:border-white/10" />

      <main className="container">
        <div className="flex flex-col items-center text-center py-14 lg:py-20">
          <h1 className="mt-5 text-3xl font-medium leading-none sm:text-4xl xl:text-5xl/none">
            <span className="text-zinc-500">{__("All")}</span>
            <br />
            <span className="underline">{__("Products")}</span>
          </h1>
          <div className="max-w-xl mt-5 uppercase text-sm/6 text-zinc-600 dark:text-zinc-400">{__("Discover our amazing collection of products")}</div>
        </div>

        <CollectionFilters totalProducts={totalProducts} currentProductCount={products.length} brands={brands} collections={allCollections} options={allOptions} />

        <hr role="presentation" className="w-full mt-5 border-t border-zinc-950/10 dark:border-white/10" />
        <div className="pt-10 pb-16 sm:pt-12 sm:pb-24">
          {totalProducts === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1" stroke="currentColor" className="w-16 h-16 mb-4 text-zinc-400">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007ZM8.625 10.5a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Zm7.5 0a.375.375 0 1 1-.75 0 .375.375 0 0 1 .75 0Z" />
              </svg>
              <h3 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-white">{__("No Products Available")}</h3>
              <p className="max-w-md mb-8 text-center text-zinc-600 dark:text-zinc-400">{__("Sorry, there are currently no products found!")}</p>
              <Button size={"lg"} variant="default" asChild>
                <Link href={getURL(`/products`, locale)}>{__("Reset Filters")}</Link>
              </Button>
            </div>
          ) : (
            <section>
              <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-2 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-3 lg:gap-x-7 xl:grid-cols-4">
                {products.map((product: Product) => {
                  return <ProductCard key={product.id} product={product} locale={locale} options={allOptions} />;
                })}
              </div>
              <Pagination currentPage={currentPage} totalPages={totalPages} searchParams={resolvedSearchParams} baseUrl={getURL(`/products`, locale)} locale={locale} />
            </section>
          )}
        </div>
      </main>
    </div>
  );
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { locale } = await params;
  const { page } = await searchParams;

  const metaData = await generateStaticMeta({ pageName: "productsPage", locale, type: "products-page", pageNum: Number(page || 1) });
  return metaData;
}
