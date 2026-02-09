"use client";
import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { cn } from "@/amerta/utilities/ui";
import { ChevronLeft, ChevronRight } from "lucide-react";

export const RelatedProducts = ({ children, locale, title, description, className }: { children: React.ReactNode; locale?: string; title?: string; description?: string; className?: string }) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({ align: "start", loop: false });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if(!children || React.Children.count(children) === 0) return null;

  return (
    <div className={cn("mt-44", className)}>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="relative flex flex-col gap-1">
          {title ? <h2 className="text-xl font-medium leading-none sm:text-4xl xl:text-4xl text">{title}</h2> : null}
          {description ? <p className="max-w-xs lg:max-w-sm text-sm/6 text-zinc-600 dark:text-zinc-400">{description}</p> : null}
        </div>

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

        {/* Carousel */}
        <div className="w-full mt-4 md:mt-16 embla" ref={emblaRef}>
          <div className="flex -ms-5 embla__container">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
