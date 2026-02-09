import React from "react";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { ThemeShopCollectionArchiveBlock } from "@/payload-types";
import { CollectionArchiveCarousel } from "./Carousel";
import { cn } from "@/amerta/utilities/ui";
import Link from "next/link";
import { getAllProductOptions } from "@/amerta/theme/utilities/get-product-options";
import { getLinkUrl } from "@/amerta/utilities/getURL";
import RichText from "@/amerta/theme/components/RichText";
import { ProductCard } from "@/amerta/theme/components/ProductCard";

type Props = ThemeShopCollectionArchiveBlock & {
  className?: string;
  locale?: string;
};

export const ThemeShopCollectionArchive: React.FC<Props> = async ({ buttonPrimary, collectionObj, title, description, limit = 8, className, locale }) => {
  const collectionId = typeof collectionObj === "object" ? collectionObj?.id : collectionObj;

  if (!collectionId) return null;
  const options = await getAllProductOptions(locale);

  const payload = await getPayload({ config: configPromise });
  const { docs: products } = await payload.find({
    collection: "products",
    where: {
      collections: {
        equals: collectionId,
      },
    },
    limit: limit || 8,
    depth: 1,
  });

  let buttonPrimaryUrl: string | null = null;
  if (buttonPrimary) {
    buttonPrimaryUrl = getLinkUrl({ ...buttonPrimary, locale: locale as string | undefined });
  }

  return (
    <div className={cn("container mt-16 md:mt-44", className)}>
      <div className="flex flex-wrap items-center justify-between gap-6">
        {buttonPrimary && buttonPrimaryUrl ? (
          <Link
            href={buttonPrimaryUrl}
            className="relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 rounded-full border uppercase px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none border-zinc-900 text-zinc-950 hover:bg-zinc-950/[2.5%] dark:border-white/40 dark:text-white dark:hover:bg-white/5 transition-colors"
          >
            {buttonPrimary.label}
          </Link>
        ) : null}
        <div className="relative">
          <h2 className="text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none text font-medium *:data-[slot=dim]:text-zinc-300 *:data-[slot=italic]:font-serif *:data-[slot=italic]:font-normal *:data-[slot=italic]:italic *:data-[slot=dim]:dark:text-zinc-500">
            <RichText data={title} enableProse={false} enableGutter={false} />
          </h2>
        </div>
        <p className="max-w-xs lg:max-w-sm text-sm/6 text-zinc-600 dark:text-zinc-400">{description}</p>
        <CollectionArchiveCarousel>
          {products.map((product) => (
            <div key={product.id} className="embla__slide basis-[86%] ps-5 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/4">
              <ProductCard className="bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700" product={product} options={options} locale={locale} />
            </div>
          ))}
        </CollectionArchiveCarousel>
      </div>
    </div>
  );
};
