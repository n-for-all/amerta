"use client";
import React from "react";
import { usePathname } from "next/navigation";

import type { Currency, Header as HeaderProps, Menu } from "@/payload-types";
import Link from "next/link";
import { useEffect, useState } from "react";

import { CMSLink } from "@/amerta/components/Link";
import { Media } from "@/amerta/components/Media";
import { getLinkUrl, getURL } from "@/amerta/utilities/getURL";

import { ArrowRight, MenuIcon } from "lucide-react";
import Cart from "@/amerta/theme/components/Cart";
import Wishlist from "@/amerta/theme/components/Wishlist";
import { CurrencyPopover } from "@/amerta/theme/components/CurrencyPopover";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";
import { useTheme } from "@/amerta/providers/Theme";
import { LanguageSwitcher } from "@/amerta/theme/components/LanguageSwitcher";
import { SearchModal } from "@/amerta/theme/components/SearchModal";
import { cn } from "@/amerta/utilities/ui";

const ToggleTheme = ({ className }: { className?: string }) => {
  const { theme, setTheme } = useTheme();
  return (
    <button
      onClick={() => {
        console.log("Current theme:", theme);
        setTheme(theme === "dark" ? "light" : "dark");
      }}
      className={className}
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="transition-all rotate-0 text-zinc-600 size-4 dark:hidden dark:-rotate-90 dark:text-zinc-300">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 19a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" />
        <path d="M18.313 16.91l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.218 -1.567l.102 .07z" />
        <path d="M7.007 16.993a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z" />
        <path d="M4 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" />
        <path d="M21 11a1 1 0 0 1 .117 1.993l-.117 .007h-1a1 1 0 0 1 -.117 -1.993l.117 -.007h1z" />
        <path d="M6.213 4.81l.094 .083l.7 .7a1 1 0 0 1 -1.32 1.497l-.094 -.083l-.7 -.7a1 1 0 0 1 1.217 -1.567l.102 .07z" />
        <path d="M19.107 4.893a1 1 0 0 1 .083 1.32l-.083 .094l-.7 .7a1 1 0 0 1 -1.497 -1.32l.083 -.094l.7 -.7a1 1 0 0 1 1.414 0z" />
        <path d="M12 2a1 1 0 0 1 .993 .883l.007 .117v1a1 1 0 0 1 -1.993 .117l-.007 -.117v-1a1 1 0 0 1 1 -1z" />
        <path d="M12 7a5 5 0 1 1 -4.995 5.217l-.005 -.217l.005 -.217a5 5 0 0 1 4.995 -4.783z" />
      </svg>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="hidden transition-all rotate-90 text-zinc-600 size-4 dark:block dark:rotate-0 dark:text-zinc-300">
        <path stroke="none" d="M0 0h24v24H0z" fill="none" />
        <path d="M12 1.992a10 10 0 1 0 9.236 13.838c.341 -.82 -.476 -1.644 -1.298 -1.31a6.5 6.5 0 0 1 -6.864 -10.787l.077 -.08c.551 -.63 .113 -1.653 -.758 -1.653h-.266l-.068 -.006l-.06 -.002z" />
      </svg>
      <span className="sr-only">Toggle theme</span>
    </button>
  );
};

const HeaderLogo = ({ logoLight, logoDark, logoClassName, locale }: { logoLight?: HeaderProps["logoLight"]; logoDark?: HeaderProps["logoDark"]; logoClassName?: string | null; locale: string }) => {
  return (
    <Link href={getURL(`/`, locale)} className={cn("relative block w-full ", logoClassName || "h-8 md:h-10")}>
      {logoLight && (
        <div className="block dark:hidden">
          <Media resource={logoLight} fill={true} htmlElement={null} imgClassName="w-auto!" />
        </div>
      )}
      {logoDark && (
        <div className="hidden dark:block">
          <Media resource={logoDark} fill={true} htmlElement={null} imgClassName="w-auto!" />
        </div>
      )}
      {/* Fallback if only one logo is provided */}
      {!logoDark && logoLight && (
        <div className="hidden dark:block">
          <Media resource={logoLight} fill={true} htmlElement={null} imgClassName="w-auto!" />
        </div>
      )}
      {!logoLight && logoDark && (
        <div className="block dark:hidden">
          <Media resource={logoDark} fill={true} htmlElement={null} imgClassName="w-auto!" />
        </div>
      )}
    </Link>
  );
};

type HeaderComponentProps = HeaderProps & {
  currencies: Currency[];
  currentCurrency: Currency;
  locales: { label: string; code: string }[];
};

export const Header: React.FC<HeaderComponentProps> = ({ menu, currencies, locales, currentCurrency, logoLight, logoDark, logoClassName, buttonLink, enableThemeSwitch, defaultTheme, className }: HeaderComponentProps) => {
  const { setTheme } = useTheme();
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const pathname = usePathname();
  const { locale } = useEcommerce();
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Add keyboard shortcut listener
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsSearchOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);
  // Hide mobile menu on route change
  useEffect(() => {
    setShowMobileMenu(false);
  }, [pathname]);

  // Set default theme on mount
  useEffect(() => {
    if (defaultTheme && defaultTheme !== "system") {
      setTheme(defaultTheme);
    } else if (defaultTheme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      setTheme(mediaQuery.matches ? "dark" : "light");
    }
  }, [defaultTheme, setTheme]);

  let buttonUrl: string | null = null;
  if (buttonLink) {
    buttonUrl = getLinkUrl({ ...buttonLink, locale });
  }

  return (
    <>
      <header className={"relative z-30 w-full group" + (className ? ` ${className}` : "")}>
        <nav aria-label="Global" className="container">
          <div className="flex items-center justify-between py-6 border-b border-zinc-950/10 dark:border-white/10">
            {/* Logo */}
            <div className="flex lg:flex-1">
              <HeaderLogo logoLight={logoLight} logoDark={logoDark} logoClassName={logoClassName} locale={locale} />
            </div>

            {/* Desktop Menu Links */}
            <div className="hidden lg:flex lg:gap-x-8">
              {(menu as Menu)?.navItems?.map((menuItem, i) => (
                <div key={i} className="relative">
                  <CMSLink className="uppercase transition duration-200 text-sm/6 text-zinc-900 hover:text-zinc-600 dark:text-white dark:hover:text-zinc-300" {...menuItem.link} appearance={undefined} locale={locale} />
                </div>
              ))}
            </div>

            {/* Right Section - Currency, Search, User, Cart */}
            <div className="flex flex-1 justify-end gap-x-2.5 md:gap-x-4 xl:gap-x-5">
              {/* Mobile Menu Button */}
              <button type="button" onClick={() => setShowMobileMenu(!showMobileMenu)} className="-m-2.5 inline-flex cursor-pointer items-center justify-center rounded-md p-2.5 lg:hidden">
                <span className="sr-only">Open main menu</span>
                <MenuIcon className="size-6" />
              </button>

              {/* Currency Popover */}
              <CurrencyPopover currentCurrency={currentCurrency} currencies={currencies} />
              <LanguageSwitcher locale={locale} locales={locales} />

              {enableThemeSwitch ? <ToggleTheme className="flex items-center justify-center px-2 -mr-2 hover:bg-zinc-50 dark:hover:bg-zinc-800" /> : null}
              {/* Search Button */}
              <button onClick={() => setIsSearchOpen(true)} className="-m-2.5 flex cursor-pointer items-center justify-center rounded-md p-2.5 focus-visible:outline-0" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" color="currentColor" strokeWidth={1} stroke="currentColor">
                  <path d="M17 17L21 21" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
                  <path d="M19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C15.4183 19 19 15.4183 19 11Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
                </svg>
              </button>
              {/* User/Account Button */}
              <Link href={getURL("/account", locale)} className="-m-2.5 flex cursor-pointer items-center justify-center p-2.5 focus-visible:outline-0" type="button">
                <svg xmlns="http://www.w3.org/2000/svg" width={24} height={24} viewBox="0 0 24 24" fill="none" color="currentColor" strokeWidth={1} stroke="currentColor">
                  <path d="M15 9C15 7.34315 13.6569 6 12 6C10.3431 6 9 7.34315 9 9C9 10.6569 10.3431 12 12 12C13.6569 12 15 10.6569 15 9Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
                  <path d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
                  <path d="M17 17C17 14.2386 14.7614 12 12 12C9.23858 12 7 14.2386 7 17" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} />
                </svg>
              </Link>
              <Wishlist className="-m-2.5 hover:bg-zinc-50 dark:hover:bg-zinc-800" />
              <Cart />
              {buttonUrl ? (
                <CMSLink className="hidden px-4 py-2 text-sm font-medium text-white rounded-full md:inline-block bg-zinc-900 hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100" {...buttonLink} appearance={undefined} locale={locale}>
                  {buttonLink?.label}
                </CMSLink>
              ) : null}
            </div>
          </div>
        </nav>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <div className="absolute right-0 z-50 flex flex-col w-full transition-all divide-y shadow-lg bg-zinc-50 top-full dark:bg-zinc-900">
            {typeof menu == "object" &&
              menu?.navItems?.map((menuItem, i) => {
                return (
                  <CMSLink locale={locale} className="flex items-center justify-between px-4 py-2 font-medium transition duration-200 text-zinc-600 hover:text-zinc-900 dark:text-zinc-300 dark:hover:text-zinc-300" key={i} {...menuItem.link} appearance={undefined}>
                    <ArrowRight className="inline ml-2 size-4" />
                  </CMSLink>
                );
              })}
          </div>
        )}
      </header>
      <SearchModal isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} locale={locale} />
    </>
  );
};
