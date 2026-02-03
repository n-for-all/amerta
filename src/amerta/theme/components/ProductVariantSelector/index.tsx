"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Product, ProductOption } from "@/payload-types";
import { VariantChoice, VariantColorSelector, VariantDropdownSelector, VariantImageSelector, VariantTextSelector } from "./VariantType";
import { getAvailableProductOptions } from "../../utilities/get-available-product-options";

interface Props {
  compact?: boolean;
  product: Product;
  options: ProductOption[];
  noDefaults?: boolean;
  onVariantChange?: (variant: NonNullable<Product["variants"]>[number] | null) => void;
}

export const ProductVariantSelector = ({ compact, product, noDefaults, options, onVariantChange }: Props) => {
  const [selections, setSelections] = useState<Record<string, string>>({});

  const availableCombinations = useMemo(() => {
    return getAvailableProductOptions(product) || [];
  }, [product]);

  const processedOptions = useMemo(() => {
    return options.map((opt) => {
      let rawItems: any[] = [];
      if (opt.type === "color") rawItems = opt.colors || [];
      else if (opt.type === "image") rawItems = opt.images || [];
      else rawItems = opt.options || [];

      const choices: VariantChoice[] = rawItems
        .map((item) => {
          const value = typeof item === "string" ? item : item.value || item.option || item.color || item.label || "";
          const label = typeof item === "string" ? item : item.label || value;
          const meta = opt.type === "color" ? item.color : opt.type === "image" ? item.image : null;

          const isAvailable = availableCombinations.some((combination) => {
            return combination[opt.id]?.value === value;
          });

          let isSelectionAvailable = true;
          if (isAvailable && Object.keys(selections).length > 0) {
            isSelectionAvailable = availableCombinations.some((combination) => {
              if (combination[opt.id]?.value !== value) return false;

              return Object.entries(selections).every(([selOptId, selValue]) => {
                if (selOptId === opt.id) return true;
                return combination[selOptId]?.value === selValue;
              });
            });
          }

          return {
            value,
            label,
            meta,
            hidden: !isAvailable,
            isAvailable: isSelectionAvailable,
            isSelected: false,
          };
        })
        .filter((c) => c.value !== "" && !c.hidden);

      return { ...opt, choices };
    });
  }, [product, options, selections]);

  const handleSelect = (id: string, val: string) => {
    if (!val || val === "") {
      return;
    }
    setSelections({ ...selections, [id]: val });
  };

  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current || !availableCombinations.length || noDefaults) return;

    let bestCombo: any = null;
    let bestPrice = Infinity;
    let bestIsStock = false;

    availableCombinations.forEach((combo) => {
      const matchingVariant = product.variants?.find((v) => {
        const vData = v.variant as any;

        return options.every((opt) => {
          const variantVal = vData[opt.id]?.value || vData[opt.id];
          const comboVal = combo[opt.id]?.value;
          return variantVal === comboVal;
        });
      });

      if (!matchingVariant) return;

      const price = matchingVariant.salePrice && matchingVariant.salePrice < matchingVariant.price ? matchingVariant.salePrice : matchingVariant.price;
      const isStock = matchingVariant.stockStatus === "in_stock";

      const isBetter = (isStock && !bestIsStock) || (isStock === bestIsStock && price < bestPrice);

      if (isBetter) {
        bestCombo = combo;
        bestPrice = price;
        bestIsStock = isStock;
      }
    });

    const winner = bestCombo || availableCombinations[0];

    if (winner) {
      const defaults: Record<string, string> = {};
      options.forEach((opt) => {
        if (winner[opt.id]?.value) {
          defaults[opt.id] = winner[opt.id].value;
        }
      });

      setSelections(defaults);
      initialized.current = true;
    }
  }, [availableCombinations, product.variants, options]);

  const onVariantChangeRef = useRef(onVariantChange);
  useEffect(() => {
    onVariantChangeRef.current = onVariantChange;
  });

  useEffect(() => {
    if(Object.entries(selections).length === 0) {
      if(onVariantChangeRef.current) {
        onVariantChangeRef.current(null);
      }
      return;
    }
    const selectedVariant =
      product.variants?.find((v: any) => {
        const vData = v.variant as Record<string, { value: string }>;
        return Object.entries(selections).every(([id, val]) => vData?.[id]?.value === val);
      }) || null;

    if (onVariantChangeRef.current) {
      onVariantChangeRef.current(selectedVariant);
    }
  }, [selections, product.variants]);

  return (
    <div className={compact ? "flex items-center gap-2 flex-wrap" : "flex flex-col gap-6"}>
      {processedOptions.map((opt) => {
        const hasAnyAvailable = opt.choices.some((c) => c.isAvailable);
        if (opt.choices.length === 0) return null;
        const choicesWithState = opt.choices.map((c) => ({
          ...c,
          isSelected: selections[opt.id] === c.value,
        }));

        const selectedLabel = choicesWithState.find((c) => c.isSelected)?.label || opt.name;

        return (
          <div key={opt.id} className="space-y-3">
            <h3 className={"uppercase text-sm/6" + (compact ? " sr-only" : "")}>
              <span className="capitalize">{opt.name}:</span> <span className="font-normal text-zinc-500">{selectedLabel}</span>
            </h3>

            {opt.type === "color" && <VariantColorSelector label={opt.label || opt.name} choices={choicesWithState} onSelect={(val) => handleSelect(opt.id, val)} compact={compact} />}
            {opt.type === "image" && <VariantImageSelector label={opt.label || opt.name} choices={choicesWithState} onSelect={(val) => handleSelect(opt.id, val)} compact={compact} />}
            {opt.type === "dropdown" && <VariantDropdownSelector label={opt.label || opt.name} choices={choicesWithState} onSelect={(val) => handleSelect(opt.id, val)} compact={compact} />}
            {(opt.type === "text" || opt.type === "radio") && <VariantTextSelector label={opt.label || opt.name} choices={choicesWithState} onSelect={(val) => handleSelect(opt.id, val)} compact={compact} />}
          </div>
        );
      })}
    </div>
  );
};
