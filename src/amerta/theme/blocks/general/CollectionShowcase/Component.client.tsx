"use client";
import React from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, ArrowUpRight } from "lucide-react";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { Button } from "@/amerta/theme/ui/button";
import { getURL } from "@/amerta/utilities/getURL";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

export const ThemeShopCollectionShowcaseBlockClient: React.FC<any> = ({ title, locale, subtitle, collections, className }: any) => {
  const [activeTab, setActiveTab] = React.useState(0);
  const [prevBtnDisabled, setPrevBtnDisabled] = React.useState(true);
  const [nextBtnDisabled, setNextBtnDisabled] = React.useState(false);
  const emblaRef = React.useRef<HTMLDivElement>(null);
  const { __ } = useEcommerce();

  const scrollPrev = React.useCallback(() => {
    if (emblaRef.current) {
      emblaRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  }, []);

  const scrollNext = React.useCallback(() => {
    if (emblaRef.current) {
      emblaRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  }, []);

  const onSelect = React.useCallback(() => {
    if (!emblaRef.current) return;
    const element = emblaRef.current;
    setPrevBtnDisabled(element.scrollLeft <= 0);
    setNextBtnDisabled(element.scrollLeft + element.clientWidth >= element.scrollWidth);
  }, []);

  React.useEffect(() => {
    onSelect();
    window.addEventListener("resize", onSelect);
    return () => window.removeEventListener("resize", onSelect);
  }, [onSelect]);

  if (!collections || collections.length === 0) {
    return null;
  }

  const activeCollection = collections[activeTab];
  const collectionsToDisplay = activeCollection.children && activeCollection.children.length > 0 ? activeCollection.children : [activeCollection];

  return (
    <section className={`container mt-20 sm:mt-28 lg:mt-28 ${className || ""}`}>
      <div className="flex flex-col justify-between gap-8 lg:flex-row">
        {title && (
          <div className="flex-2/3">
            <h2 dangerouslySetInnerHTML={{ __html: title }} className="max-w-2xl text-3xl font-medium leading-tight sm:text-4xl xl:text-5xl" />
          </div>
        )}

        {subtitle && (
          <div className="flex-1/3">
            <p className="uppercase text-sm/6">{subtitle}</p>
            <Button asChild variant={"outline"} size={"xl"} className="mt-4">
              <Link href={getURL(`/collections`, locale)}>{__("Shop Now")}</Link>
            </Button>
          </div>
        )}
      </div>

      <hr className="block w-full mt-8 border-t lg:hidden border-zinc-950/10" />

      {/* Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-5 mt-20">
        {/* Collection Tabs */}
        <div className="flex flex-wrap gap-2">
          {collections.map((collection, index) => (
            <button key={collection.id} onClick={() => setActiveTab(index)} className={`relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 rounded-full border uppercase px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none transition-colors ${activeTab === index ? "border-zinc-900 bg-zinc-900 text-white" : "border-zinc-900 text-zinc-950 hover:bg-zinc-950/[2.5%]"}`}>
              {collection.title}
            </button>
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex gap-2 ms-auto xl:ms-0">
          <button onClick={scrollPrev} disabled={prevBtnDisabled} className="relative isolate inline-flex shrink-0 items-center justify-center rounded-full border font-medium uppercase p-3 sm:p-3.5 text-sm/none border-zinc-900 text-zinc-950 hover:bg-zinc-950/[2.5%] disabled:opacity-50 transition-colors" aria-label="Previous">
            <span className="sr-only">Prev</span>
            <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
          </button>
          <button onClick={scrollNext} disabled={nextBtnDisabled} className="relative isolate inline-flex shrink-0 items-center justify-center rounded-full border font-medium uppercase p-3 sm:p-3.5 text-sm/none border-zinc-900 text-zinc-950 hover:bg-zinc-950/[2.5%] disabled:opacity-50 transition-colors" aria-label="Next">
            <span className="sr-only">Next</span>
            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
          </button>
        </div>
      </div>

      {/* Carousel */}
      <div className="mt-10 embla">
        <div className="-ms-5 embla__container" ref={emblaRef}>
          {collectionsToDisplay.map((collection) => {
            const image = typeof collection.image === "object" ? collection.image : null;
            const imageSrc = image?.url;

            return (
              <div key={collection.id} className="embla__slide basis-[86%] ps-5 md:basis-1/2 lg:basis-1/3 xl:basis-1/4 2xl:basis-1/4">
                <div className="relative w-full group/collection">
                  <div className="relative z-0 w-full overflow-hidden rounded-lg aspect-3/4">
                    {imageSrc ? (
                      <ImageMedia alt={collection.title || collection.name || "collection"} src={imageSrc} fill imgClassName="z-0 object-cover rounded-lg" />
                    ) : (
                      <div className="flex items-center justify-center w-full h-full bg-zinc-200">
                        <span className="text-zinc-400">{__("No Image")}</span>
                      </div>
                    )}
                    <span className="absolute inset-0 transition-opacity opacity-0 bg-black/20 group-hover/collection:opacity-100" />
                  </div>

                  {/* Bottom Label */}
                  <div className="absolute inset-x-4 bottom-4 flex items-center justify-center gap-0.5">
                    <div className="flex items-center justify-center px-5 bg-white rounded-full h-11 grow text-zinc-900">
                      <p className="leading-none uppercase text-sm/6">{collection.title || collection.name}</p>
                    </div>
                    <div className="flex items-center justify-center bg-white rounded-full h-11 w-11 text-zinc-900">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Link */}
                  <Link href={getURL(`/collections/${collection.slug}`, locale)} className="uppercase text-sm/6">
                    <span className="absolute inset-0" />
                    <span className="sr-only">{collection.title || collection.name}</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
