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
      {!logoLight && !logoDark && (
        <div className="block h-full py-1 dark:hidden">
          <svg className="w-auto h-full" viewBox="0 0 322 69" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink">
            <g stroke="none" strokeWidth={1} fill="none" fillRule="evenodd">
              <g transform="translate(30.894938, 0.521484)" fill="#000000" fillRule="nonzero">
                <path d="M0,46.9874054 L16.4928947,0 L33.9055381,0 L56.8861899,65.4785156 L41.8994651,65.4785156 L31.6087089,33.6092377 C30.3370414,29.4353485 29.0383658,25.1253891 27.7126823,20.6793594 C26.3869987,16.2333298 24.9468741,11.1909485 23.3923087,5.55221558 L27.1008811,5.55221558 C25.51473,11.1909485 24.0509162,16.2333298 22.7094398,20.6793594 C21.3679633,25.1253891 20.0387321,29.4353485 18.721746,33.6092377 L8.10689307,65.4785156 L0,46.9874054 Z M8.10208655,51.2148285 L8.10208655,40.3864288 L42.3176322,40.3864288 L42.3176322,51.2148285 L8.10208655,51.2148285 Z" />
                <path d="M59.6286526,65.4785156 L59.6286526,19.0722656 L72.0960751,19.0722656 L72.0960751,29.5133972 L71.3160458,29.5133972 C72.1290341,26.9412231 73.2792798,24.8110199 74.7667828,23.1227875 C76.2542859,21.4345551 77.9817715,20.1751328 79.9492398,19.3445206 C81.9167081,18.5139084 83.9869443,18.0986023 86.1599484,18.0986023 C89.6975461,18.0986023 92.7730313,19.1194153 95.3864041,21.1610413 C97.9997769,23.2026672 99.5824948,25.9867859 100.134558,29.5133972 L98.7626401,29.5133972 C99.3412533,27.1504211 100.380034,25.1180649 101.878981,23.4163284 C103.377928,21.714592 105.20635,20.4028702 107.364248,19.481163 C109.522146,18.5594559 111.862234,18.0986023 114.384512,18.0986023 C117.362265,18.0986023 120.02828,18.7454224 122.382559,20.0390625 C124.736837,21.3327026 126.592382,23.2167435 127.949194,25.691185 C129.306006,28.1656265 129.984411,31.1805725 129.984411,34.7360229 L129.984411,65.4785156 L117.05625,65.4785156 L117.05625,37.1090698 C117.05625,34.3235779 116.300024,32.242012 114.787573,30.8643723 C113.275122,29.4867325 111.412481,28.7979126 109.199652,28.7979126 C107.533392,28.7979126 106.09178,29.1641235 104.874815,29.8965454 C103.65785,30.6289673 102.713369,31.6479492 102.041372,32.9534912 C101.369375,34.2590332 101.033377,35.7790375 101.033377,37.513504 L101.033377,65.4785156 L88.5796872,65.4785156 L88.5796872,36.7451477 C88.5796872,34.3258667 87.8630582,32.3965073 86.4298001,30.9570694 C84.996542,29.5176315 83.137106,28.7979126 80.851492,28.7979126 C79.3308011,28.7979126 77.9412594,29.1571426 76.6828671,29.8756027 C75.4244748,30.5940628 74.4222012,31.6436005 73.6760464,33.0242157 C72.9298916,34.4048309 72.5568143,36.089859 72.5568143,38.0792999 L72.5568143,65.4785156 L59.6286526,65.4785156 Z" />
                <path d="M158.087549,66.5332031 C153.404169,66.5332031 149.320116,65.4971695 145.83539,63.4251022 C142.350664,61.353035 139.651804,58.4892654 137.73881,54.8337936 C135.825815,51.1783218 134.869318,47.0056915 134.869318,42.3159027 C134.869318,37.5830841 135.842066,33.3896255 137.787561,29.735527 C139.733057,26.0814285 142.418299,23.2149124 145.843286,21.1359787 C149.268274,19.057045 153.2055,18.0175781 157.654962,18.0175781 C161.067591,18.0175781 164.169168,18.5995102 166.959696,19.7633743 C169.750223,20.9272385 172.155313,22.5813675 174.174967,24.7257614 C176.19462,26.8701553 177.750559,29.4093704 178.842783,32.3434067 C179.935007,35.2774429 180.481119,38.5146332 180.481119,42.0549774 L180.481119,45.5438232 L139.489069,45.5438232 L139.489069,37.277298 L174.242258,37.277298 L168.400278,39.233551 C168.400278,36.8920898 167.974672,34.8732376 167.123461,33.1769943 C166.272249,31.480751 165.0665,30.173378 163.506212,29.2548752 C161.945925,28.3363724 160.082712,27.877121 157.916574,27.877121 C155.779276,27.877121 153.929911,28.3363724 152.368479,29.2548752 C150.807047,30.173378 149.600725,31.480751 148.749514,33.1769943 C147.898302,34.8732376 147.472696,36.8920898 147.472696,39.233551 L147.472696,44.8894501 C147.472696,47.2757721 147.903452,49.3671799 148.764963,51.1636734 C149.626474,52.9601669 150.878572,54.3525696 152.521257,55.3408813 C154.163942,56.3291931 156.145945,56.823349 158.467264,56.823349 C160.158243,56.823349 161.660738,56.5779877 162.974749,56.087265 C164.288759,55.5965424 165.388308,54.9060059 166.273394,54.0156555 C167.15848,53.1253052 167.795801,52.0880127 168.185358,50.9037781 L180.02244,50.9037781 C179.452524,53.9735413 178.141832,56.6804123 176.090364,59.0243912 C174.038897,61.3683701 171.462831,63.2058334 168.362169,64.5367813 C165.261507,65.8677292 161.836634,66.5332031 158.087549,66.5332031 Z" />
                <path d="M185.1907,65.4785156 L185.1907,19.0722656 L197.672543,19.0722656 L197.672543,26.9844818 L197.800945,26.9844818 C198.650555,24.1866302 199.982418,22.114563 201.796535,20.76828 C203.610653,19.4219971 206.046871,18.7488556 209.10519,18.7488556 C209.873775,18.7488556 210.575413,18.7623596 211.210102,18.7893677 C211.844791,18.8163757 212.419399,18.8433838 212.933926,18.8703918 L212.933926,29.8999786 C212.467007,29.8596954 211.697391,29.809227 210.62508,29.7485733 C209.552769,29.6879196 208.46661,29.6575928 207.366604,29.6575928 C205.604214,29.6575928 204.022297,30.060997 202.620853,30.8678055 C201.21941,31.674614 200.118717,32.8694916 199.318775,34.4524384 C198.518833,36.0353851 198.118862,37.9948425 198.118862,40.3308105 L198.118862,65.4785156 L185.1907,65.4785156 Z" />
                <path d="M244.928439,19.0722656 L244.928439,29.2373657 L214.476397,29.2373657 L214.476397,19.0722656 L235.605062,19.0722656 L244.928439,19.0722656 Z M222.500537,6.41601562 L235.429385,19.4160156 L235.429385,51.1434174 C235.429385,52.7094269 235.747531,53.795929 236.383822,54.4029236 C237.020114,55.0099182 238.211215,55.3134155 239.957126,55.3134155 C240.694583,55.3134155 241.570056,55.3134155 242.583545,55.3134155 C243.597033,55.3134155 244.378665,55.3134155 244.928439,55.3134155 L244.928439,65.4785156 C244.150699,65.4785156 243.058589,65.4785156 241.65211,65.4785156 C240.245631,65.4785156 238.829425,65.4785156 237.403491,65.4785156 C232.279742,65.4785156 228.514979,64.4803619 226.109202,62.4840546 C223.703425,60.4877472 222.500537,57.3825073 222.500537,53.168335 L222.500537,6.41601562 Z" />
                <path d="M264.268057,66.2530518 C261.175864,66.2530518 258.429739,65.7415009 256.029684,64.718399 C253.629629,63.6952972 251.738951,62.1561813 250.357649,60.1010513 C248.976347,58.0459213 248.285696,55.4802704 248.285696,52.4040985 C248.285696,49.7696686 248.770125,47.5819016 249.738981,45.8407974 C250.707838,44.0996933 252.032263,42.6976776 253.712256,41.6347504 C255.392248,40.5718231 257.3263,39.7636414 259.51441,39.2102051 C261.702521,38.6567688 264.001181,38.265152 266.410391,38.0353546 C269.243033,37.7519989 271.497061,37.4800873 273.172476,37.2196198 C274.847891,36.9591522 276.048491,36.5787506 276.774275,36.0784149 C277.500059,35.5780792 277.862952,34.828949 277.862952,33.8310242 L277.862952,33.5337067 C277.862952,32.388382 277.558996,31.3813019 276.951086,30.5124664 C276.343176,29.643631 275.475828,28.9622498 274.349043,28.4683228 C273.222258,27.9743958 271.867621,27.7274323 270.285132,27.7274323 C268.684332,27.7274323 267.277739,27.9795456 266.065352,28.4837723 C264.852965,28.987999 263.894408,29.6931839 263.18968,30.5993271 C262.484953,31.5054703 262.073996,32.5609589 261.956808,33.7657928 L249.77503,33.7657928 C249.984686,30.5600739 250.93466,27.7879715 252.624953,25.4494858 C254.315245,23.1110001 256.68257,21.3012314 259.726927,20.0201797 C262.771284,18.7391281 266.417029,18.0986023 270.66416,18.0986023 C273.834173,18.0986023 276.66075,18.4608078 279.143889,19.1852188 C281.627028,19.9096298 283.72473,20.9614563 285.436995,22.3406982 C287.14926,23.7199402 288.447134,25.3906631 289.330618,27.3528671 C290.214102,29.3150711 290.655844,31.5335083 290.655844,34.0081787 L290.655844,65.4785156 L278.005087,65.4785156 L278.005087,58.9340973 L277.829306,58.9340973 C277.019522,60.4428864 276.009352,61.7454529 274.798796,62.8417969 C273.58824,63.9381409 272.122824,64.7807693 270.402548,65.3696823 C268.682272,65.9585953 266.637442,66.2530518 264.268057,66.2530518 Z M267.837927,57.2710419 C269.919836,57.2710419 271.719191,56.8878937 273.235991,56.1215973 C274.752791,55.3553009 275.918944,54.3146896 276.73445,52.9997635 C277.549956,51.6848373 277.957709,50.1908112 277.957709,48.5176849 L277.957709,43.8553619 C277.585547,44.0558624 277.090361,44.2496109 276.472151,44.4366074 C275.853941,44.6236038 275.135138,44.8031616 274.315741,44.9752808 C273.496344,45.1473999 272.604849,45.3163147 271.641257,45.4820251 C270.677664,45.6477356 269.671271,45.8104706 268.622076,45.9702301 C267.151282,46.1885834 265.815298,46.539917 264.614126,47.024231 C263.412955,47.5085449 262.456686,48.1560516 261.745322,48.9667511 C261.033957,49.7774506 260.678274,50.8007812 260.678274,52.0367432 C260.678274,53.1239319 260.975477,54.0610886 261.569884,54.8482132 C262.16429,55.6353378 262.997305,56.2359238 264.06893,56.649971 C265.140555,57.0640182 266.396887,57.2710419 267.837927,57.2710419 Z" />
              </g>
              <polygon fill="#0891B2" points="39 0.5 24.5 0.5 6.44817189 48.0274358 13.5 66 28.5 66 21 48" />
              <circle fill="#000000" cx={10} cy={47} r={10} />
            </g>
          </svg>
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
      <header className={"relative z-30 w-full group border-b border-zinc-950/10 dark:border-white/10 " + (className ? ` ${className}` : "")}>
        <nav aria-label="Global" className="container">
          <div className="flex items-center justify-between py-6">
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
