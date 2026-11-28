"use client";

import { Separator } from "@/amerta/theme/blocks/common/Separator";
import { Button } from "@/amerta/theme/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/amerta/theme/ui/select"; // Assuming this is where your component lives
import { cn } from "@/amerta/utilities/ui";
import { Loader2, LogOut, LayoutDashboard, MapPin, ShoppingBag, User } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { getURL } from "@/amerta/utilities/getURL";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";

type AccountSidebarProps = {
  locale: string;
};

const menuItems = [
  { id: "dashboard", href: "/", label: "Dashboard", icon: LayoutDashboard },
  { id: "account", href: "/profile", label: "Account Details", icon: User },
  { id: "addresses", href: "/addresses", label: "Addresses", icon: MapPin },
  { id: "orders", href: "/orders", label: "Orders", icon: ShoppingBag },
];

export function AccountSidebar({ locale }: AccountSidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { __ } = useEcommerce();
  // While the next account page is being fetched: the chosen item shows a spinner and the page area is dimmed
  const [isPending, startTransition] = useTransition();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const loadingHref = isPending ? pendingHref : null;

  const go = (itemHref: string, url: string) => {
    setPendingHref(itemHref);
    startTransition(() => router.push(url));
  };

  const isActive = (itemHref: string) => {
    const fullHref = `/account${itemHref}`;
    if (itemHref === "/") {
      return pathname === `/${locale}/account` || pathname === `/${locale}/account/` || pathname === `/account`;
    }
    return pathname.endsWith(fullHref);
  };

  const activeItem = menuItems.find((item) => isActive(item.href)) || menuItems[0] || { id: "dashboard", href: "/", label: "Dashboard", icon: LayoutDashboard };

  const handleMobileChange = (val: string) => {
    router.refresh();
    go(val, val === "logout" ? getURL("/logout", locale) : getURL(`/account${val}`, locale));
  };

  return (
    <>
      {/* Read by the page area next to the menu (see the account layout) to dim itself while loading */}
      <span hidden className="peer/account" data-pending={isPending ? "" : undefined} />

      {/* --- Mobile View: Shadcn Select --- */}
      <div className="w-full mb-8 md:hidden">
        <label className="block mt-4 mb-2 text-sm font-medium sr-only text-muted-foreground">{__("My Account")}</label>

        <Select onValueChange={handleMobileChange} value={activeItem.href}>
          <SelectTrigger className="w-full mt-4 bg-white h-11 dark:bg-zinc-950">
            {/* We render the icon + label manually in the value slot for better visuals */}
            <div className="flex items-center gap-2">
              {isPending && <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" />}
              <SelectValue placeholder={__(activeItem.label)} />
            </div>
          </SelectTrigger>

          <SelectContent>
            {menuItems.map((item) => (
              <SelectItem key={item.id} value={item.href}>
                <div className="flex items-center gap-2">
                  <item.icon className="w-4 h-4 opacity-70" />
                  <span>{__(item.label)}</span>
                </div>
              </SelectItem>
            ))}

            {/* Logout Option */}
            <SelectItem value="logout" className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:text-red-400 dark:focus:bg-red-950/20">
              <div className="flex items-center gap-2">
                <LogOut className="w-4 h-4" />
                <span>{__("Log Out")}</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* --- Desktop View: Sidebar (Unchanged) --- */}
      <aside className="hidden my-8 overflow-y-auto md:block md:w-64 md:sticky top-24">
        <div className="md:pr-6 rtl:md:pl-6 rtl:md:pr-0">
          <nav className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const loading = loadingHref === item.href;
              // The chosen item is highlighted straight away, without waiting for its page
              const active = loadingHref ? loading : isActive(item.href);
              const url = getURL(`/account${item.href}`, locale);
              return (
                <Button variant={active ? "default" : "ghost"} asChild key={item.id} className={cn("justify-start w-full gap-2", active && "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100")}>
                  <Link
                    href={url}
                    aria-busy={loading || undefined}
                    className="flex items-center gap-2"
                    onClick={(event) => {
                      // New tab / new window clicks are left to the browser
                      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) return;
                      event.preventDefault();
                      if (!isActive(item.href)) go(item.href, url);
                    }}
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" aria-hidden="true" /> : <Icon className="w-4 h-4" />}
                    {__(item.label)}
                  </Link>
                </Button>
              );
            })}
          </nav>
          <Separator className="my-6" />
          <Button variant={"ghost"} asChild className="justify-start w-full gap-2 text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/10">
            <Link className="flex items-center gap-2" href={getURL(`/logout`, locale)}>
              <LogOut className="w-4 h-4" />
              {__("Log Out")}
            </Link>
          </Button>
        </div>
      </aside>
    </>
  );
}
