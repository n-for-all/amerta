"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import type { Currency } from "@/payload-types";
import Cart from "@/amerta/theme/components/Cart";
import Wishlist from "@/amerta/theme/components/Wishlist";
import { CurrencyPopover } from "@/amerta/theme/components/CurrencyPopover";
import { LanguageSwitcher } from "@/amerta/theme/components/LanguageSwitcher";
import { SearchModal } from "@/amerta/theme/components/SearchModal";
import { useTheme } from "@/amerta/providers/Theme";
import { CATALOG_SOURCES, SOURCE_COOKIE, SOURCE_MAX_AGE } from "../../settings";

export interface CatalogFrameProps {
  locale: string;
  accountUrl: string;
  enableThemeSwitch: boolean;
  currencies: Currency[];
  currentCurrency: Currency;
  locales: { label: string; code: string }[];
  labels: { search: string; account: string; toggleTheme: string; backToCatalog: string };
}

/**
 * The catalog's own screen: the shop's header and footer are put away, and a slim bar with the
 * shop's tools takes their place. The catalog page and the checkout reached from it both use it.
 */
export const CatalogFrame = ({
  locale,
  accountUrl,
  enableThemeSwitch,
  currencies,
  currentCurrency,
  locales,
  labels,
  backUrl,
  wide,
  tagSource,
  rootRef,
  children,
}: CatalogFrameProps & { backUrl?: string; wide?: boolean; tagSource?: boolean; rootRef?: React.RefObject<HTMLDivElement | null>; children: React.ReactNode }) => {
  const ownRef = useRef<HTMLDivElement>(null);
  const ref = rootRef || ownRef;
  const [searchOpen, setSearchOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    // A visit to the catalog is remembered, so the order placed afterwards records where it came from
    if (tagSource) document.cookie = `${SOURCE_COOKIE}=${CATALOG_SOURCES.page}; path=/; max-age=${SOURCE_MAX_AGE}; samesite=lax`;

    const hidden: HTMLElement[] = [];
    let node: HTMLElement | null = ref.current;
    while (node && node.parentElement && node.parentElement !== document.body) {
      for (const sibling of Array.from(node.parentElement.children) as HTMLElement[]) {
        if (sibling !== node && !sibling.hidden && !["SCRIPT", "STYLE", "LINK"].includes(sibling.tagName)) {
          sibling.hidden = true;
          hidden.push(sibling);
        }
      }
      node = node.parentElement;
    }
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      hidden.forEach((element) => (element.hidden = false));
      document.body.style.overflow = previousOverflow;
    };
  }, [ref, tagSource]);

  const iconButton = "flex items-center justify-center p-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div ref={ref} className="fixed inset-0 z-40 overflow-y-auto bg-white text-zinc-900 dark:bg-black dark:text-white">
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 dark:bg-black dark:border-zinc-800">
        <div className={"flex flex-wrap items-center px-4 py-1.5 mx-auto gap-x-3 gap-y-1 text-sm [&_svg]:max-w-5 [&_svg]:max-h-5 " + (backUrl ? "justify-between " : "justify-end ") + (wide ? "max-w-7xl sm:px-6 lg:px-8" : "max-w-2xl")}>
          {backUrl && (
            <a href={backUrl} className="text-sm font-medium underline underline-offset-4">
              ← {labels.backToCatalog}
            </a>
          )}
          <div className="flex items-center gap-1">
            <CurrencyPopover currentCurrency={currentCurrency} currencies={currencies} />
            <LanguageSwitcher locale={locale} locales={locales} />
            {enableThemeSwitch && (
              <button type="button" className={iconButton} aria-label={labels.toggleTheme} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                  <path d="M12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10zm0-5a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zM4 11a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2h1zm17 0a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2h1zM6.3 4.9l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4zm12.8 0a1 1 0 0 1 0 1.4l-.7.7A1 1 0 0 1 17 5.6l.7-.7a1 1 0 0 1 1.4 0zM7 17a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7A1 1 0 0 1 7 17zm11.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4z" />
                </svg>
              </button>
            )}
            <button type="button" className={iconButton} aria-label={labels.search} onClick={() => setSearchOpen(true)}>
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden="true">
                <path d="M17 17L21 21" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <Link href={accountUrl} className={iconButton} aria-label={labels.account}>
              <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden="true">
                <path d="M15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 10.6569 15 9Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M17 17C17 14.2386 14.7614 12 12 12C9.23858 12 7 14.2386 7 17" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </Link>
            <Wishlist className="hover:bg-zinc-100 dark:hover:bg-zinc-800" />
            <Cart />
          </div>
        </div>
      </header>

      {children}
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} locale={locale} />
    </div>
  );
};
