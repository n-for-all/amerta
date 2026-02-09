"use client";;
import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const CollectionArchiveCarousel = ({ children }: { children: React.ReactNode }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <>
      <div className="flex gap-2 ms-auto xl:ms-0">
        <button onClick={scrollPrev} className="relative isolate inline-flex shrink-0 items-center justify-center rounded-full border font-medium uppercase p-3 sm:p-3.5 text-sm/none border-zinc-900 text-zinc-950 hover:bg-zinc-950/[2.5%] dark:border-white/40 dark:text-white dark:hover:bg-white/5 transition-colors" type="button">
          <span className="sr-only">Prev</span>
          <ChevronLeft className="w-4 h-4 rtl:rotate-180" />
        </button>
        <button onClick={scrollNext} className="relative isolate inline-flex shrink-0 items-center justify-center rounded-full border font-medium uppercase p-3 sm:p-3.5 text-sm/none border-zinc-900 text-zinc-950 hover:bg-zinc-950/[2.5%] dark:border-white/40 dark:text-white dark:hover:bg-white/5 transition-colors" type="button">
          <span className="sr-only">Next</span>
          <ChevronRight className="w-4 h-4 rtl:rotate-180" />
        </button>
      </div>
      <div className="w-full mt-4 md:mt-16 embla" ref={emblaRef}>
        <div className="flex -ms-5 embla__container">
          {children}
        </div>
      </div>
    </>
  );
};
