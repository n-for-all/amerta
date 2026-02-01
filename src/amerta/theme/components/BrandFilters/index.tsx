"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Collection, Currency, ProductBrand, ProductOption } from "@/payload-types";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";
import { Checkbox } from "@/amerta/theme/ui/checkbox";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { printf } from "fast-printf";
import { useMemo, useState } from "react";
import { formatCurrency } from "@/amerta/theme/utilities/format-currency";
import { Button } from "@/amerta/theme/ui/button";
import { Filter, FunnelX } from "lucide-react";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

type CollectionFiltersProps = {
  totalProducts: number;
  currentProductCount: number;
  brands: ProductBrand[];
  collections: Collection[];
  options: ProductOption[];
};

function PriceFilterDropdown({ min, max, currency, onApply }: { min: string; max: string; currency: Currency; onApply: (min: string, max: string) => void }) {
  const [localMin, setLocalMin] = useState(min);
  const [localMax, setLocalMax] = useState(max);

  return (
    <FilterDropdown label="Price" count={(min ? 1 : 0) + (max ? 1 : 0)}>
      <div className="w-64 p-4 space-y-4">
        <div className="flex items-center gap-2">
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-zinc-400 text-xs">{formatCurrency(currency)}</span>
            <input type="number" placeholder="Min" value={localMin} onChange={(e) => setLocalMin(e.target.value)} className="w-full py-2 pl-6 pr-2 text-sm border rounded-md border-zinc-200 focus:outline-none focus:ring-1 focus:ring-black dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
          <span className="text-zinc-400">-</span>
          <div className="relative">
            <span className="absolute left-2.5 top-2.5 text-zinc-400 text-xs">{formatCurrency(currency)}</span>
            <input type="number" placeholder="Max" value={localMax} onChange={(e) => setLocalMax(e.target.value)} className="w-full py-2 pl-6 pr-2 text-sm border rounded-md border-zinc-200 focus:outline-none focus:ring-1 focus:ring-black dark:bg-zinc-800 dark:border-zinc-700" />
          </div>
        </div>
        <Button onClick={() => onApply(localMin, localMax)} className="w-full py-2 text-sm font-medium text-white bg-black rounded-md hover:bg-zinc-800 dark:bg-white dark:text-black">
          Apply
        </Button>
      </div>
    </FilterDropdown>
  );
}

export function BrandFilters({ totalProducts, currentProductCount, brands, collections, options }: CollectionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { __, currency } = useEcommerce();

  const activeFilterCount = useMemo(() => {
    let count = 0;
    count += searchParams.getAll("collection").length;
    count += searchParams.getAll("brand").length;
    if (searchParams.get("minPrice")) count += 1;
    if (searchParams.get("maxPrice")) count += 1;
    options.forEach((opt) => {
      count += searchParams.getAll(`opt_${opt.id}`).length;
    });

    return count;
  }, [searchParams, options]);

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("collection");
    params.delete("brand");
    params.delete("minPrice");
    params.delete("maxPrice");
    options.forEach((opt) => params.delete(`opt_${opt.id}`));
    params.set("page", "1");

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const updateFilter = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    const currentValues = params.getAll(key);

    if (currentValues.includes(value)) {
      params.delete(key, value);
    } else {
      if (key === "sort") {
        params.set(key, value);
      } else {
        params.append(key, value);
      }
    }

    if (key !== "page") {
      params.set("page", "1");
    }

    router.push(`${pathname}?${params.toString()}`, { scroll: false });
  };

  const isSelected = (key: string, value: string) => {
    return searchParams.getAll(key).includes(value);
  };

  return (
    <div className="flex flex-wrap justify-between gap-4">
      <div className="flex gap-2.5 items-center">
        <p className="uppercase text-zinc-500 text-sm/6">{printf(__("%s products"), currentProductCount)}</p>
        <p className="uppercase text-zinc-300 text-sm/6">/</p>
        <p className="uppercase text-zinc-500 text-sm/6">{printf(__("%s total"), totalProducts)}</p>
        <p className="uppercase text-zinc-300 text-sm/6">/</p>
        <FilterDropdown label={__("Sort by")}>
          <div className="py-1">
            {[
              { label: __("Newest"), value: "newest" },
              { label: __("Oldest"), value: "oldest" },
              { label: __("Price: Low to High"), value: "price-asc" },
              { label: __("Price: High to Low"), value: "price-desc" },
              { label: __("Name: A to Z"), value: "name-asc" },
              { label: __("Name: Z to A"), value: "name-desc" },
            ].map((option) => (
              <button key={option.value} onClick={() => updateFilter("sort", option.value)} className={`block w-full px-4 py-2 text-left text-sm whitespace-nowrap ${searchParams.get("sort") === option.value ? "font-bold text-zinc-900 bg-zinc-50" : "text-zinc-700 hover:bg-zinc-50"}`}>
                {option.label}
              </button>
            ))}
          </div>
        </FilterDropdown>
      </div>

      <div className="ml-auto">
        <Button className="inline-flex items-center sm:hidden">
          <span className="text-sm font-medium uppercase text-zinc-700 dark:text-zinc-300">Filters</span>
          <Filter className="flex-shrink-0 w-4 h-4" />
        </Button>

        {/* Desktop Filters */}
        <div className="hidden sm:flex sm:items-baseline sm:space-x-2">
          <PriceFilterDropdown
            min={searchParams.get("minPrice") || ""}
            max={searchParams.get("maxPrice") || ""}
            currency={currency}
            onApply={(min, max) => {
              const params = new URLSearchParams(searchParams.toString());
              if (min) params.set("minPrice", min);
              else params.delete("minPrice");
              if (max) params.set("maxPrice", max);
              else params.delete("maxPrice");
              params.set("page", "1"); // Reset page
              router.push(`${pathname}?${params.toString()}`, { scroll: false });
            }}
          />
          {collections && collections.length > 0 && (
            <FilterDropdown label="Collection" count={searchParams.getAll("collection").length}>
              <div className="p-4 space-y-2 min-w-[200px]">
                {collections.map((cat) => (
                  <FilterCheckbox key={cat.id} label={cat.title || "Unknown"} checked={isSelected("collection", cat.id)} onChange={() => updateFilter("collection", cat.id)} />
                ))}
              </div>
            </FilterDropdown>
          )}

          {brands && brands.length > 0 ? (
            <FilterDropdown label={__("Brand")} count={searchParams.getAll("brand").length}>
              <div className="p-4 space-y-2 min-w-[200px]">
                {brands.map((brand) => (
                  <FilterCheckbox key={brand.id} label={brand.title} checked={isSelected("brand", brand.id)} onChange={() => updateFilter("brand", brand.id)} />
                ))}
              </div>
            </FilterDropdown>
          ) : null}

          {options.map((option) => {
            if (!option.showInFilter) return null;
            switch (option.type) {
              case "dropdown":
              case "radio":
                return (
                  <FilterDropdown key={option.id} label={option.name} count={searchParams.getAll(`opt_${option.id}`).length}>
                    <div className="p-4 space-y-2 min-w-[150px]">{option.options?.map((opt) => <FilterCheckbox key={opt.id} label={opt.label || ""} checked={isSelected(`opt_${option.id}`, opt.option)} onChange={() => updateFilter(`opt_${option.id}`, opt.option)} />)}</div>
                  </FilterDropdown>
                );
              case "color":
                return (
                  <FilterDropdown key={option.id} label={option.name} count={searchParams.getAll(`opt_${option.id}`).length}>
                    <div className="p-4 grid grid-cols-1 gap-2 min-w-[200px]">{option.colors?.map((opt) => <ColorSwatch key={opt.id} color={opt.color || "#000000"} label={opt.label || ""} checked={isSelected(`opt_${option.id}`, opt.color)} onChange={() => updateFilter(`opt_${option.id}`, opt.color)} />)}</div>
                  </FilterDropdown>
                );
              case "image":
                return (
                  <FilterDropdown key={option.id} label={option.name} count={searchParams.getAll(`opt_${option.id}`).length}>
                    <div className="p-4 grid grid-cols-4 gap-2 min-w-[200px]">{option.images?.map((opt) => <ImageSwatch key={opt.id} image={(opt.image as any)?.url || ""} label={opt.label || ""} checked={isSelected(`opt_${option.id}`, opt.id || "")} onChange={() => updateFilter(`opt_${option.id}`, opt.id || "")} />)}</div>
                  </FilterDropdown>
                );
            }
          })}
          {activeFilterCount > 0 && (
            <Button onClick={clearAllFilters} className="relative text-red-400" variant={"ghost"}>
              <span className="absolute top-0 right-0 w-4 h-4 text-xs text-white bg-red-500 rounded-full rtl:left-0 rtl:right-auto">{activeFilterCount}</span> <FunnelX className="flex-shrink-0 w-4 h-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterDropdown({ label, children, count = 0 }: { label: string; children: React.ReactNode; count?: number }) {
  return (
    <Popover className="relative inline-block text-left">
      <PopoverButton className="inline-flex items-center justify-center px-3 py-2 font-normal rounded-full group focus-visible:outline-none hover:bg-zinc-100 dark:hover:bg-zinc-800">
        <p className="uppercase text-sm/6">{label}</p>
        {count > 0 && <span className="ml-1 text-xs font-semibold underline text-zinc-950 tabular-nums dark:text-white">({count})</span>}
        <ChevronIcon className="ml-1 -mr-1 text-zinc-400 group-hover:text-zinc-500" />
      </PopoverButton>

      <PopoverPanel className="absolute right-0 z-30 mt-2 overflow-auto origin-top-right bg-white shadow-lg max-h-48 min-w-32 focus:outline-none dark:bg-zinc-900 dark:ring-white/10">{children}</PopoverPanel>
    </Popover>
  );
}

function FilterCheckbox({ label, checked, onChange }: { label: string; checked: boolean; onChange: (checked: boolean) => void }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer group">
      <Checkbox checked={checked} onCheckedChange={onChange} />
      <span className={`text-sm ${checked ? "font-medium text-zinc-900 dark:text-white" : "text-zinc-600 dark:text-zinc-400 group-hover:text-zinc-900"}`}>{label}</span>
    </label>
  );
}

function ColorSwatch({ color, label, checked, onChange }: { color: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="relative flex items-center gap-2 group" title={label}>
      <div className={`w-6 h-6 rounded-full border-1 transition-all ${checked ? "border-zinc-900 dark:border-white ring-2 ring-offset-2 ring-zinc-900 dark:ring-white" : "border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400"}`} style={{ backgroundColor: color }} />
      <span className="text-sm text-zinc-600 dark:text-zinc-400 truncate max-w-[40px]">{label}</span>
    </button>
  );
}
function ImageSwatch({ image, label, checked, onChange }: { image: string; label: string; checked: boolean; onChange: () => void }) {
  return (
    <button type="button" onClick={onChange} className="relative flex flex-col items-center gap-1 group" title={label}>
      <div className={`w-12 h-12 rounded-md border-2 transition-all overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${checked ? "border-zinc-900 dark:border-white ring-2 ring-offset-2 ring-zinc-900 dark:ring-white" : "border-zinc-300 dark:border-zinc-700 group-hover:border-zinc-400"}`}>{image ? <ImageMedia src={image} alt={label} width={48} height={48} imgClassName="object-cover w-full h-full" /> : <div className="flex items-center justify-center w-full h-full text-xs text-zinc-400">No img</div>}</div>
      <span className="text-xs text-zinc-600 dark:text-zinc-400 truncate max-w-[48px]">{label}</span>
    </button>
  );
}

function ChevronIcon({ className = "size-5" }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" color="currentColor" className={`shrink-0 ${className}`} strokeWidth="1.5" stroke="currentColor">
      <path d="M18 9.00005C18 9.00005 13.5811 15 12 15C10.4188 15 6 9 6 9" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5"></path>
    </svg>
  );
}
