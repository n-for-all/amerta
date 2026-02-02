import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, ArrowUpRight, LibraryBig } from "lucide-react";
import { ImageOrPlaceholder } from "@/amerta/theme/components/Thumbnail";
import { getURL } from "@/amerta/utilities/getURL";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { Pagination } from "@/amerta/theme/components/Pagination";
import { Button } from "@/amerta/theme/ui/button";
import { SearchParams } from "next/dist/server/request/search-params";
import { getProductsTags } from "@/amerta/theme/utilities/get-products-tags";
import { createTranslator } from "@/amerta/theme/utilities/translation";
import { ProductTag } from "@/payload-types";

export const revalidate = 60;

type Props = {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<SearchParams>;
};

export default async function ProductsTagsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  const page = (await searchParams)?.page || "1";
  const __ = await createTranslator(locale);

  try {
    const salesChannel = await getSalesChannel();
    const { docs: productTags, totalPages } = await getProductsTags({ page, locale }, salesChannel);

    return (
      <div className="w-full min-h-screen bg-white dark:bg-zinc-950">
        <main className="container px-4 py-16 mx-auto sm:py-20 lg:py-24">
          {/* Header */}

          {productTags.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20">
              <LibraryBig className="w-16 h-16 mb-4 text-zinc-400" strokeWidth={1} />
              <h3 className="mb-2 text-2xl font-semibold text-zinc-900 dark:text-white">{__("No Tags Yet")}</h3>
              <p className="text-center text-zinc-600 dark:text-zinc-400">{__("Check back soon for our exciting tags!")}</p>
              <Button asChild>
                <Link href={getURL("/", locale)} className="mt-6">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  {__("Go to Homepage")}
                </Link>
              </Button>
            </div>
          ) : (
            <>
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
                  <span className="text-zinc-500">{__("Tags")}</span>
                  <br />
                </h1>
                <div className="max-w-xl mt-5 uppercase text-sm/6 text-zinc-600 dark:text-zinc-400">{__("Explore our curated tags of premium products.")}</div>
              </div>
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-4">
                {productTags.map((productTag: ProductTag) => {
                  return (
                    <div key={productTag.id} className="embla__slide basis-[86%] ps-5 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/4">
                      <div className="relative w-full group/collection">
                        <div className="relative z-0 w-full overflow-hidden rounded-lg aspect-3/4">
                          <ImageOrPlaceholder image={productTag.image} className="z-0 object-cover rounded-lg" />
                          <span className="absolute inset-0 transition-opacity opacity-0 bg-black/20 group-hover/collection:opacity-100" />
                        </div>

                        {/* Bottom Label */}
                        <div className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-0.5">
                          <div className="flex items-center justify-center px-5 bg-white rounded-full dark:bg-zinc-900 dark:text-white h-11 grow text-zinc-900">
                            <p className="leading-none uppercase text-sm/6">{productTag.name}</p>
                          </div>
                          <div className="flex items-center justify-center bg-white rounded-full dark:bg-zinc-900 dark:text-white h-11 w-11 text-zinc-900">
                            <ArrowUpRight className="w-4 h-4" />
                          </div>
                        </div>

                        {/* Link */}
                        <Link href={getURL(`/tags/${productTag.slug}`, locale)} className="uppercase text-sm/6">
                          <span className="absolute inset-0" />
                          <span className="sr-only">{productTag.name}</span>
                        </Link>
                      </div>
                    </div>
                  );
                })}
                <Pagination locale={locale} currentPage={parseInt(page as string, 10)} totalPages={totalPages} baseUrl={getURL(`/tags`, locale)} />
              </div>
            </>
          )}
        </main>
      </div>
    );
  } catch (error) {
    console.error("Error fetching tags:", error);
    return (
      <div className="w-full min-h-screen bg-white dark:bg-zinc-950">
        <main className="container px-4 py-16 mx-auto sm:py-20 lg:py-24">
          <div className="text-center">
            <h1 className="text-2xl font-semibold text-zinc-900 dark:text-white">{__("Error loading tags")}</h1>
            <p className="mt-2 text-zinc-600 dark:text-zinc-400">{__("Please try again later.")}</p>
          </div>
        </main>
      </div>
    );
  }
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "productTagsPage", locale, type: "product-tags" });
  return metaData;
}
