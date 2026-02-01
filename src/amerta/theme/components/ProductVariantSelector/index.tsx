"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Product, ProductOption, ProductMedia } from "@/payload-types";
import { cn } from "@/amerta/utilities/ui";
import { Tooltip } from "@/amerta/theme/ui/tooltip";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/amerta/theme/ui/select";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

interface Props {
  compact?: boolean;
  product: Product;
  options: ProductOption[];
  onVariantChange?: (variant: NonNullable<Product["variants"]>[number] | null) => void;
}

type VariantData = Record<
  string,
  {
    name: string;
    type: string;
    value: string;
  }
>;

export const ProductVariantSelector = ({ compact, product, options, onVariantChange }: Props) => {
  const variants = product.variants;

  // Ref to track if we have initialized defaults for this specific product
  const hasInitialized = useRef(false);
  // Track the previous product ID to reset initialization if user navigates
  const lastProductId = useRef(product.id);

  // Reset initialization if product changes
  if (product.id !== lastProductId.current) {
    hasInitialized.current = false;
    lastProductId.current = product.id;
  }

  // 1. FILTER RELEVANT OPTIONS AND THEIR VALUES
  const relevantOptions = useMemo(() => {
    if (!variants || !variants.length) return [];
    
    // Collect all values used in variants for each option
    const usedValues = new Map<string, Set<string>>();
    
    variants.forEach((v) => {
      const vData = v.variant as VariantData;
      if (!vData) return;
      
      Object.entries(vData).forEach(([optionId, data]) => {
        if (!usedValues.has(optionId)) {
          usedValues.set(optionId, new Set());
        }
        usedValues.get(optionId)!.add(data.value);
      });
    });
    
    // Filter options and their sub-values
    return options
      .filter((opt) => usedValues.has(opt.id))
      .map((opt) => {
        const allowedValues = usedValues.get(opt.id)!;
        
        return {
          ...opt,
          colors: opt.colors?.filter((c) => allowedValues.has(c.color)),
          images: opt.images?.filter((img) => allowedValues.has(img.label)),
          options: opt.options?.filter((o) => {
            const val = o.option || o.label || "";
            return allowedValues.has(val);
          }),
        };
      });
  }, [variants, options]);

  const [selections, setSelections] = useState<Record<string, string>>({});

  // 2. FIND MATCHING VARIANT
  const selectedVariant = useMemo(() => {
    return (
      variants?.find((v) => {
        const vData = v.variant as VariantData;
        if (!vData) return false;
        return Object.entries(selections).every(([optionId, selectedValue]) => {
          return vData[optionId]?.value === selectedValue;
        });
      }) || null
    );
  }, [selections, variants]);

  // 3. CHECK AVAILABILITY
  const checkAvailability = useCallback(
    (optionId: string, candidateValue: string) => {
      return variants?.some((v) => {
        const vData = v.variant as VariantData;
        if (!vData) return false;
        if (vData[optionId]?.value !== candidateValue) return false;
        return Object.entries(selections).every(([selectedId, selectedValue]) => {
          if (selectedId === optionId) return true;
          return vData[selectedId]?.value === selectedValue;
        });
      });
    },
    [variants, selections],
  );

  // 4. SELECT DEFAULT (Run once per product)
  useEffect(() => {
    if (hasInitialized.current) return; // STOP LOOP: Already initialized
    if (!variants?.length || !relevantOptions.length) return;

    // Logic: Find first available stock, or fallback to first item
    const defaultVariant = variants.find((v) => v.stockStatus === "in_stock") || variants[0];

    if (defaultVariant && defaultVariant.variant) {
      const vData = defaultVariant.variant as VariantData;
      const initialSelections: Record<string, string> = {};

      Object.entries(vData).forEach(([key, data]) => {
        if (relevantOptions.some((opt) => opt.id === key)) {
          initialSelections[key] = data.value;
        }
      });

      setSelections(initialSelections);
      hasInitialized.current = true; // Mark as done
    }
  }, [variants, relevantOptions]); // Dependencies are fine now because of the ref check

  // 5. NOTIFY PARENT (Fixed Loop)
  // We use a ref for the callback so changing the function identity doesn't re-run the effect
  const onVariantChangeRef = useRef(onVariantChange);

  // Keep the ref updated with the latest function from parent
  useEffect(() => {
    onVariantChangeRef.current = onVariantChange;
  });

  useEffect(() => {
    // Only verify completeness
    const allSelected = relevantOptions.every((opt) => selections[opt.id]);
    const variantToEmit = allSelected ? selectedVariant : null;

    // Call the latest callback
    if (onVariantChangeRef.current) {
      onVariantChangeRef.current(variantToEmit);
    }
  }, [selectedVariant, selections, relevantOptions]); // <--- Removed onVariantChange from deps

  const handleSelect = (optionId: string, value: string) => {
    setSelections((prev) => ({ ...prev, [optionId]: value }));
  };

  const getImageUrl = (media: string | ProductMedia | null | undefined) => {
    if (!media) return null;
    return typeof media === "string" ? media : media.url;
  };

  if (!relevantOptions.length) return null;
  return (
    <div className={(compact ? "flex items-center gap-2" : "flex flex-col gap-6")}>
      {relevantOptions.map((opt) => {
        const sortFn = (valA: string, valB: string) => {
          const isAvailA = checkAvailability(opt.id, valA);
          const isAvailB = checkAvailability(opt.id, valB);
          return isAvailA === isAvailB ? 0 : isAvailA ? -1 : 1;
        };
        

        const sortedColors = opt.colors ? [...opt.colors].sort((a, b) => sortFn(a.color, b.color)) : [];
        const sortedImages = opt.images ? [...opt.images].sort((a, b) => sortFn(a.label, b.label)) : [];
        const sortedOptions = opt.options ? [...opt.options].sort((a, b) => sortFn(a.option || a.label || "", b.option || b.label || "")) : [];

        return (
          <div key={opt.id} className="space-y-3">
            <h3 className={"uppercase text-sm/6" + (compact ? " sr-only" : "")}>
              <span className="capitalize">{opt.name}:</span> <span className="font-normal text-zinc-500">{opt.type === "color" ? opt.colors?.find((c) => c.color === selections[opt.id])?.label : selections[opt.id]}</span>
            </h3>

            {/* --- TYPE: COLOR --- */}
            {opt.type === "color" && sortedColors.length > 0 && (
              <div className="flex flex-wrap gap-3">
                {sortedColors.map((c) => {
                  const isSelected = selections[opt.id] === c.color;
                  const isAvailable = checkAvailability(opt.id, c.color);
                  if (!isAvailable && compact) {
                    return null;
                  }

                  return (
                    <Tooltip key={c.id || c.label} content={isAvailable ? c.label : `${c.label} (Unavailable)`}>
                      <button type="button" disabled={!isAvailable} onClick={() => handleSelect(opt.id, c.color)} className={cn("h-8 w-8 rounded-full focus:outline-none ring-offset-2 transition-all relative", isSelected ? "ring-zinc-600 ring-2 scale-105" : "ring-zinc-200 ring-1 hover:scale-105", !isAvailable && "opacity-20 cursor-not-allowed hover:scale-100 ring-zinc-100", compact ? "h-5 w-5 ring-1" : "")} style={{ backgroundColor: c.color }}>
                        {!isAvailable && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-zinc-400 rotate-45" />
                          </div>
                        )}
                      </button>
                    </Tooltip>
                  );
                })}
              </div>
            )}

            {/* --- TYPE: IMAGE --- */}
            {opt.type === "image" && sortedImages.length > 0 && (
              <div className="flex flex-wrap gap-4">
                {sortedImages.map((img) => {
                  const isSelected = selections[opt.id] === img.label;
                  const isAvailable = checkAvailability(opt.id, img.label);
                  const url = getImageUrl(img.image);
                  if (!isAvailable && compact) {
                    return null;
                  }
                  return (
                    <button key={img.id || img.label} type="button" disabled={!isAvailable} onClick={() => handleSelect(opt.id, img.label)} className={cn("relative h-16 w-16 overflow-hidden rounded-xs border-2 transition-all", isSelected ? "border-blue-600 opacity-100 ring-1 ring-blue-600" : "border-zinc-200 opacity-80 hover:opacity-100", !isAvailable && "opacity-30 grayscale cursor-not-allowed hover:opacity-30", compact ? "h-10 w-10" : "")} title={img.label}>
                      {url ? <ImageMedia src={url} alt={img.label} fill imgClassName="object-cover" /> : <span className="p-1 text-xs">{img.label}</span>}
                    </button>
                  );
                })}
              </div>
            )}

            {/* --- TYPE: DROPDOWN --- */}
            {opt.type === "dropdown" && sortedOptions.length > 0 && (
              <div className="relative w-full max-w-xs">
                <Select value={selections[opt.id] || ""} onValueChange={(value) => handleSelect(opt.id, value)}>
                  <SelectTrigger>
                    <SelectValue placeholder={`${opt.label}`} />
                  </SelectTrigger>
                  <SelectContent>
                    {sortedOptions.map((o) => {
                      const val = o.option || o.label || "";
                      const isAvailable = checkAvailability(opt.id, val);
                      if (!isAvailable && compact) {
                        return null;
                      }
                      return (
                        <SelectItem key={o.id || val} value={val} disabled={!isAvailable} className={!isAvailable ? "text-gray-300 bg-gray-50 opacity-50" : ""}>
                          {o.label || val} {!isAvailable ? "(Unavailable)" : ""}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* --- TYPE: RADIO / TEXT --- */}
            {(opt.type === "radio" || opt.type === "text") && sortedOptions.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {sortedOptions.map((o) => {
                  const val = o.option || o.label || "";
                  const isSelected = selections[opt.id] === val;
                  const isAvailable = checkAvailability(opt.id, val);
                  if (!isAvailable && compact) {
                    return null;
                  }
                  return (
                    <button key={o.id || val} type="button" disabled={!isAvailable} onClick={() => handleSelect(opt.id, val)} className={cn("px-4 py-2 text-sm font-medium border transition-colors", isSelected ? "bg-black text-white border-black" : "bg-white text-zinc-900 border-zinc-200 hover:border-zinc-400", !isAvailable && "bg-zinc-100 text-zinc-300 border-zinc-100 cursor-not-allowed line-through", compact ? "text-xs px-3 py-1.5" : "")}>
                      {o.label || val}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
