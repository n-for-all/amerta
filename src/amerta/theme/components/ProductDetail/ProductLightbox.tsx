"use client";

import { Dialog, DialogPanel, Transition, TransitionChild } from "@headlessui/react";
import React, { useState, useEffect } from "react";
import { ImageOrPlaceholder } from "@/amerta/theme/components/Thumbnail";

interface ProductLightboxProps {
  images: (string | any)[];
  productName: string;
  isOpen: boolean;
  onClose: () => void;
  initialIndex?: number;
  __: (key: string) => string;
}

export function ProductLightbox({ images, productName, isOpen, onClose, initialIndex = 0, __ }: ProductLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isImageLoading, setIsImageLoading] = useState(false);

  // Update current index when initialIndex changes
  useEffect(() => {
    setCurrentIndex(initialIndex);
    setIsImageLoading(false);
  }, [initialIndex]);

  // Reset loading state when lightbox opens
  useEffect(() => {
    if (isOpen) {
      setIsImageLoading(false);
    }
  }, [isOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;

      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          goToPrevious();
          break;
        case "ArrowRight":
          e.preventDefault();
          goToNext();
          break;
        case "Escape":
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, currentIndex]);

  const goToPrevious = () => {
    setIsImageLoading(true);
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  };

  const goToNext = () => {
    setIsImageLoading(true);
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  };

  const jumpToImage = (index: number) => {
    if (index !== currentIndex) {
      setIsImageLoading(true);
      setCurrentIndex(index);
    }
  };

  const currentImage = images[currentIndex];
  const imageUrl = typeof currentImage === "string" ? currentImage : (currentImage as any)?.url;
  console.log("imageUrl", imageUrl);

  return (
    <Transition show={isOpen} as={React.Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <TransitionChild as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
          <div className="fixed inset-0 bg-black/75 backdrop-blur-sm" />
        </TransitionChild>

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <TransitionChild as={React.Fragment} enter="ease-out duration-300" enterFrom="opacity-0 scale-95" enterTo="opacity-100 scale-100" leave="ease-in duration-200" leaveFrom="opacity-100 scale-100" leaveTo="opacity-0 scale-95">
            <DialogPanel className="relative w-full max-h-full max-w-7xl">
              {/* Close button */}
              <button onClick={onClose} className="absolute z-10 flex items-center justify-center w-10 h-10 transition-all duration-200 ease-in-out rounded-full top-4 right-4 bg-white/90 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                <span className="sr-only">{__("Close")}</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Navigation buttons - only show if more than one image */}
              {images.length > 1 && (
                <>
                  <button
                    onClick={goToPrevious}
                    className="absolute z-10 flex items-center justify-center w-12 h-12 transition-all duration-200 ease-in-out -translate-y-1/2 rounded-full left-4 top-1/2 bg-white/90 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">{__("Previous image")}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 transition-transform duration-200 hover:-translate-x-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
                    </svg>
                  </button>

                  <button
                    onClick={goToNext}
                    className="absolute z-10 flex items-center justify-center w-12 h-12 transition-all duration-200 ease-in-out -translate-y-1/2 rounded-full right-4 top-1/2 bg-white/90 hover:bg-white hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    <span className="sr-only">{__("Next image")}</span>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2" stroke="currentColor" className="w-6 h-6 transition-transform duration-200 hover:translate-x-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                    </svg>
                  </button>
                </>
              )}

              {/* Main image */}
              <div className="relative aspect-square w-full h-full max-h-[96vh] bg-white overflow-hidden shadow-2xl">
                <div className={`absolute inset-0 transition-opacity duration-300 ease-in-out ${isImageLoading ? "opacity-100" : "opacity-0"}`}>
                  <div className="flex items-center justify-center w-full h-full">
                    <div className="w-8 h-8 border-4 border-gray-300 rounded-full border-t-blue-600 animate-spin"></div>
                  </div>
                </div>
                <Transition
                  key={currentIndex}
                  show={!isImageLoading}
                  as={React.Fragment}
                  enter="transition-opacity duration-300 ease-in-out"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="transition-opacity duration-200 ease-in-out"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="h-full">
                    <ImageOrPlaceholder loading="eager" alt={`${productName} - Image ${currentIndex + 1}`} className="object-contain w-full h-full transition-transform duration-300 ease-in-out" image={imageUrl} onLoad={() => setIsImageLoading(false)} />
                  </div>
                </Transition>
              </div>

              {/* Image counter */}
              {images.length > 1 && (
                <div className="absolute px-3 py-1 transition-all duration-200 ease-in-out rounded-full bottom-4 right-4 rtl:left-4 rtl:right-auto bg-white/90 backdrop-blur-sm hover:bg-white">
                  <span className="text-sm font-medium text-gray-900">
                    {currentIndex + 1} / {images.length}
                  </span>
                </div>
              )}

              {/* Thumbnail navigation */}
              {images.length > 1 && images.length <= 8 && (
                <div className="absolute bottom-0 left-0 flex gap-2 p-2 transition-all duration-300 ease-in-out rounded-tr-lg rtl:right-0 rtl:left-auto bg-white/90 backdrop-blur-sm">
                  {images.map((image, idx) => {
                    const thumbUrl = typeof image === "string" ? image : (image as any)?.url;
                    return (
                      <button
                        key={idx}
                        onClick={() => jumpToImage(idx)}
                        className={`flex-shrink-0 w-12 h-12 rounded relative overflow-hidden border-2 transition-all duration-200 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                          idx === currentIndex ? "border-blue-500 scale-110 shadow-lg" : "border-transparent hover:border-gray-300"
                        }`}
                      >
                        <ImageOrPlaceholder alt={`${productName} thumbnail ${idx + 1}`} className="object-cover w-full h-full transition-transform duration-200 ease-in-out" image={thumbUrl} />
                      </button>
                    );
                  })}
                </div>
              )}
            </DialogPanel>
          </TransitionChild>
        </div>
      </Dialog>
    </Transition>
  );
}
