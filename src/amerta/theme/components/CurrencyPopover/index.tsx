"use client";

import React, { useEffect } from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

import { ChevronDown } from "lucide-react";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { Currency } from "@/payload-types";

interface CurrencyPopoverProps {
  currentCurrency?: Currency;
  currencies?: Currency[];
}

export function CurrencyPopover({ currentCurrency, currencies = [] }: CurrencyPopoverProps) {
  const { currency } = useEcommerce();

  const handleCurrencyChange = (currencyCode: string) => {
    // Set cookies for the new currency
    document.cookie = `currency=${currencyCode}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year

    // Optionally reload to refresh the page with new currency
    window.location.reload();
  };

  useEffect(() => {
    if (currencies.length === 1) {
      document.cookie = `currency=${currencies[0]!.code}; path=/; max-age=${60 * 60 * 24 * 365}`; // 1 year
    }
  }, [currencies]);

  if (currencies.length === 1) return null;

  const displayText = currentCurrency ? (currentCurrency.symbol?.toLowerCase() == currentCurrency.code?.toLowerCase() ? ` ${currentCurrency.code}` : `${currentCurrency.symbol} ${currentCurrency.code}`) : "--";

  return (
    <Popover className="relative">
      <PopoverButton className="flex items-center gap-1 px-3 py-2 text-sm font-medium uppercase transition duration-200 border rounded opacity-60 hover:opacity-100 text-zinc-900 hover:text-zinc-600 dark:text-white dark:hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white">
        <span>{displayText}</span>
        <ChevronDown className="w-4 h-4 transition-transform ui-open:rotate-180" />
      </PopoverButton>

      <PopoverPanel className="absolute right-0 z-50 w-56 mt-2 bg-white border rounded shadow-lg border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700">
        <div className="p-1">
          <h3 className="px-2 mt-2 mb-2 text-xs tracking-wide uppercase opacity-50 text-zinc-900 dark:text-white">Select Currency</h3>
          <div className="space-y-2 overflow-y-auto max-h-64">
            {currencies.length > 0 ? (
              currencies.map((curr) => (
                <button key={curr.id} onClick={() => handleCurrencyChange(curr.code || "")} className={`w-full py-1 px-2 text-left text-sm rounded transition-colors ${currency.code === curr.code ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}>
                  <div className="flex items-center justify-between">
                    <span className="font-medium uppercase">{curr.code}</span>
                    <span className="text-xs text-zinc-500 dark:text-zinc-400">{curr.symbol || curr.symbolNative}</span>
                  </div>
                  <div className="text-xs opacity-75">{curr.name}</div>
                </button>
              ))
            ) : (
              <div className="px-2 py-1 text-sm text-zinc-500 dark:text-zinc-400">No currencies available</div>
            )}
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
