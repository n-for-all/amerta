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
import { CATALOG_SOURCES, SOURCE_COOKIE, SOURCE_MAX_AGE } from "@/amerta/apps/catalog/settings";

export interface CatalogFrameProps {
  locale: string;
  accountUrl: string;
  enableThemeSwitch: boolean;
  /** Always dark, whatever the shop's theme is */
  darkMode: boolean;
  /** Which tools the bar shows; the cart is always there */
  show: { account: boolean; currency: boolean; language: boolean; search: boolean; wishlist: boolean };
  currencies: Currency[];
  currentCurrency: Currency;
  locales: { label: string; code: string }[];
  labels: { search: string; account: string; toggleTheme: string; backToCatalog: string };
  /** Where the catalog and its checkout live, so cart links can be kept inside the catalog */
  catalogUrl: string;
  catalogCheckoutUrl: string;
}

/**
 * The catalog's own screen: the shop's header and footer are put away, and a slim bar with the
 * shop's tools takes their place. The catalog page and the checkout reached from it both use it.
 */
export const CatalogFrame = ({
  locale,
  accountUrl,
  enableThemeSwitch,
  darkMode,
  show,
  currencies,
  currentCurrency,
  locales,
  labels,
  catalogUrl,
  catalogCheckoutUrl,
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

  // Dark mode covers the whole screen, including the cart and search that open over it, so it is
  // set on the page while the catalog is open (the visitor's own theme choice is not overwritten).
  useEffect(() => {
    if (!darkMode) return;
    const root = document.documentElement;
    const previous = root.getAttribute("data-theme");
    const apply = () => root.getAttribute("data-theme") !== "dark" && root.setAttribute("data-theme", "dark");
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(root, { attributes: true, attributeFilter: ["data-theme"] });
    return () => {
      observer.disconnect();
      if (previous) root.setAttribute("data-theme", previous);
      else root.removeAttribute("data-theme");
    };
  }, [darkMode]);

  // Nothing in the cart or the checkout leads out of the catalog. The cart and the checkout form are
  // the shop's own components and are left as they are; while the catalog is open their links are
  // adjusted from here: "Check out" goes to the catalog's checkout, a product opens in the catalog,
  // and "View cart" / "Continue shopping" (which lead to the shop) are put away.
  useEffect(() => {
    const pathOf = (anchor: HTMLAnchorElement): string | null => {
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return null;
        // Drop a leading language segment such as /ar or /en-GB
        return url.pathname.replace(/^\/[a-z]{2}(-[A-Za-z]{2})?(?=\/|$)/, "").replace(/\/+$/, "") || "/";
      } catch {
        return null;
      }
    };
    const scopes = () => [ref.current, ...Array.from(document.querySelectorAll<HTMLElement>('[role="dialog"]'))].filter(Boolean) as HTMLElement[];

    const tidy = () => {
      for (const scope of scopes()) {
        for (const anchor of Array.from(scope.querySelectorAll<HTMLAnchorElement>("a[href]:not([data-catalog-keep])"))) {
          const path = pathOf(anchor);
          if (path !== "/" && path !== "/cart") continue;
          // A logo (a picture that links home) stays where it is; a click on it leads back to the catalog (see onClick)
          if (path === "/" && anchor.querySelector("img, svg, picture")) continue;
          // "or Continue shopping →" sits in a small text wrapper: put the whole line away
          const parent = anchor.parentElement;
          const line = parent && ["SPAN", "P"].includes(parent.tagName) ? parent : anchor;
          if (!line.hidden) line.hidden = true;
          // "View cart" shared a two-column row with "Check out", which now takes the full width
          if (path === "/cart" && parent && getComputedStyle(parent).display === "grid") parent.style.gridTemplateColumns = "1fr";
        }
      }
    };

    let queued = 0;
    const observer = new MutationObserver(() => {
      cancelAnimationFrame(queued);
      queued = requestAnimationFrame(tidy);
    });
    observer.observe(document.body, { childList: true, subtree: true });
    tidy();

    const onClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest?.("a[href]") as HTMLAnchorElement | null;
      if (!anchor || anchor.hasAttribute("data-catalog-keep") || !scopes().some((scope) => scope.contains(anchor))) return;
      const path = pathOf(anchor);
      if (!path) return;
      const product = path.match(/^\/products?\/([^/]+)$/);
      const target = path === "/checkout" ? catalogCheckoutUrl : path === "/" ? catalogUrl : product ? `${catalogUrl}?product=${encodeURIComponent(product[1]!)}` : null;
      if (!target) return;
      event.preventDefault();
      event.stopPropagation();
      window.location.assign(target);
    };
    document.addEventListener("click", onClick, true);

    return () => {
      observer.disconnect();
      cancelAnimationFrame(queued);
      document.removeEventListener("click", onClick, true);
    };
  }, [ref, catalogUrl, catalogCheckoutUrl]);

  const iconButton = "flex items-center justify-center p-1.5 rounded-md cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800";

  return (
    <div ref={ref} data-theme={darkMode ? "dark" : undefined} className="fixed inset-0 z-40 overflow-y-auto bg-white text-zinc-900 dark:bg-black dark:text-white">
      <header className="sticky top-0 z-30 bg-white border-b border-zinc-200 dark:bg-black dark:border-zinc-800">
        <div className={"flex flex-wrap items-center px-4 py-1.5 mx-auto gap-x-1 gap-y-1 text-sm [&_svg]:max-w-5 [&_svg]:max-h-5 " + (wide ? "max-w-7xl sm:px-6 lg:px-8" : "max-w-2xl")}>
          {/* A small arrow back to the catalog, then the shop's tools on the left and only the cart on the right */}
          {backUrl && (
            <a href={backUrl} aria-label={labels.backToCatalog} title={labels.backToCatalog} className={iconButton}>
              <svg viewBox="0 0 24 24" className="w-5 h-5 rtl:rotate-180" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 6l-6 6 6 6" />
              </svg>
            </a>
          )}
          <div className="flex items-center gap-1">
            {show.currency && <CurrencyPopover currentCurrency={currentCurrency} currencies={currencies} />}
            {show.language && <LanguageSwitcher locale={locale} locales={locales} />}
            {enableThemeSwitch && (
              <button type="button" className={iconButton} aria-label={labels.toggleTheme} onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4" aria-hidden="true">
                  <path d="M12 7a5 5 0 1 1 0 10a5 5 0 0 1 0-10zm0-5a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0V3a1 1 0 0 1 1-1zm0 17a1 1 0 0 1 1 1v1a1 1 0 0 1-2 0v-1a1 1 0 0 1 1-1zM4 11a1 1 0 0 1 0 2H3a1 1 0 0 1 0-2h1zm17 0a1 1 0 0 1 0 2h-1a1 1 0 0 1 0-2h1zM6.3 4.9l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4zm12.8 0a1 1 0 0 1 0 1.4l-.7.7A1 1 0 0 1 17 5.6l.7-.7a1 1 0 0 1 1.4 0zM7 17a1 1 0 0 1 0 1.4l-.7.7a1 1 0 0 1-1.4-1.4l.7-.7A1 1 0 0 1 7 17zm11.4 0l.7.7a1 1 0 0 1-1.4 1.4l-.7-.7a1 1 0 0 1 1.4-1.4z" />
                </svg>
              </button>
            )}
            {show.search && (
              <button type="button" className={iconButton} aria-label={labels.search} onClick={() => setSearchOpen(true)}>
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden="true">
                  <path d="M17 17L21 21" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </button>
            )}
            {show.account && (
              <Link href={accountUrl} className={iconButton} aria-label={labels.account}>
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1} aria-hidden="true">
                  <path d="M15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 10.6569 15 9Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M17 17C17 14.2386 14.7614 12 12 12C9.23858 12 7 14.2386 7 17" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            )}
            {show.wishlist && <Wishlist className="hover:bg-zinc-100 dark:hover:bg-zinc-800" />}
          </div>
          <div className="ml-auto">
            <Cart />
          </div>
        </div>
      </header>

      {children}
      {show.search && <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} locale={locale} />}
    </div>
  );
};
