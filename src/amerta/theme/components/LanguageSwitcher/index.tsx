"use client";

import React from "react";
import { Popover, PopoverButton, PopoverPanel } from "@headlessui/react";

import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";

interface LanguageSwitcherProps {
  locale: string;
  locales: {
    label: string;
    code: string;
  }[];
}

export function LanguageSwitcher({ locale, locales = [] }: LanguageSwitcherProps) {
  const { __ } = useEcommerce();
  const handleLocaleChange = (code: string) => {
    const url = window.location.href;
    // Replace the current locale in the URL with the selected one
    const urlObj = new URL(url);
    const pathSegments = urlObj.pathname.split("/").filter(Boolean);

    const localePath = code == DEFAULT_LOCALE ? "" : code;

    if (locales.some((l) => l.code === pathSegments[0])) {
      pathSegments[0] = localePath; // Replace existing locale
    } else {
      pathSegments.unshift(localePath); // Add locale at the start
    }

    urlObj.pathname = "/" + pathSegments.filter(Boolean).join("/");
    window.location.href = urlObj.toString();
  };

  if (locales.length === 1) return null;

  const displayText = locales.find((l) => l.code === locale)?.label || locale;
  const displayMobileText = displayText.substring(0, 2).toUpperCase();

  return (
    <Popover className="relative">
      <PopoverButton className="flex items-center gap-1 px-3 py-2 text-sm font-medium uppercase transition duration-200 border rounded opacity-60 hover:opacity-100 text-zinc-900 hover:text-zinc-600 dark:text-white dark:hover:text-zinc-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-zinc-900 dark:focus-visible:outline-white">
        <span className="hidden md:block">{displayText}</span>
        <span className="block md:hidden">{displayMobileText}</span>
        <ChevronDown className="w-4 h-4 transition-transform ui-open:rotate-180" />
      </PopoverButton>

      <PopoverPanel className="absolute right-0 z-50 w-56 mt-2 bg-white border rounded shadow-lg border-zinc-200 dark:bg-zinc-900 dark:border-zinc-700">
        <div className="p-1">
          <h3 className="px-2 mt-2 mb-2 text-xs tracking-wide uppercase opacity-50 text-zinc-900 dark:text-white">{__("Select Language")}</h3>
          <div className="space-y-2 overflow-y-auto max-h-64">
            {locales.length > 0 ? (
              locales.map((curr) => (
                <Link href="#" key={curr.code} onClick={() => handleLocaleChange(curr.code)} className={`w-full py-1 px-2 flex text-left text-sm w-full rounded transition-colors ${locale === curr.code ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900" : "text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"}`}>
                  {curr.label}
                </Link>
              ))
            ) : (
              <div className="px-2 py-1 text-sm text-zinc-500 dark:text-zinc-400">No locales available</div>
            )}
          </div>
        </div>
      </PopoverPanel>
    </Popover>
  );
}
