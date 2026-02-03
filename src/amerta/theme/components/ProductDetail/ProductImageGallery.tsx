"use client";

import { useState } from "react";
import { ImageOrPlaceholder } from "@/amerta/theme/components/Thumbnail";
import { ProductLightbox } from "./ProductLightbox";
import { useEcommerce } from "../../providers/EcommerceProvider";

interface ProductImageGalleryProps {
  productImages: (string | any)[];
  productName: string;
}

export function ProductImageGallery({ productImages, productName }: ProductImageGalleryProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const { __ } = useEcommerce();

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <>
      <div className="hidden-scrollbar lg:grid-flow-row lg:grid-cols-2 lg:overflow-x-hidden undefined">
        {productImages.length > 0 ? (
          <>
            <div className="relative cursor-pointer group aspect-3/4 w-72 shrink-0 snap-center sm:w-96 lg:w-full lg:col-span-2" aria-hidden="true">
              <ImageOrPlaceholder alt={productName} className="object-contain w-full h-full" image={typeof productImages[0] === "string" ? productImages[0] : (productImages[0] as any)?.url} />
              <button className="absolute flex items-center justify-center w-8 h-8 transition-opacity bg-white rounded-full opacity-0 top-3 left-3 rtl:right-3 rtl:left-auto group-hover:opacity-100 dark:text-neutral-100 hover:opacity-100" type="button" onClick={() => openLightbox(0)}>
                <span className="sr-only">{__("View image")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 3.75H6A2.25 2.25 0 0 0 3.75 6v1.5M16.5 3.75H18A2.25 2.25 0 0 1 20.25 6v1.5m0 9V18A2.25 2.25 0 0 1 18 20.25h-1.5m-9 0H6A2.25 2.25 0 0 1 3.75 18v-1.5M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                </svg>
              </button>
            </div>
            {productImages.slice(1).map((image, idx) => (
              <div key={idx} className="relative cursor-pointer group aspect-3/4 w-72 shrink-0 snap-center sm:w-96 lg:w-full lg:col-span-1" aria-hidden="true">
                <ImageOrPlaceholder alt={productName} className="object-contain w-full h-full" image={typeof image === "string" ? image : (image as any)?.url} />
                <button className="absolute flex items-center justify-center w-8 h-8 transition-opacity bg-white rounded-full opacity-0 top-3 left-3 rtl:right-3 rtl:left-auto group-hover:opacity-100 dark:text-neutral-100 hover:opacity-100" type="button" onClick={() => openLightbox(idx + 1)}>
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

      <ProductLightbox images={productImages} productName={productName} isOpen={lightboxOpen} onClose={closeLightbox} initialIndex={lightboxIndex} __={__} />
    </>
  );
}
