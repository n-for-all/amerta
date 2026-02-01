"use client";

import { Separator } from "@/amerta/theme/blocks/common/Separator";
import { Button } from "@/amerta/theme/ui/button";
import { cn } from "@/amerta/utilities/ui";
import { LogOut } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, MapPin, ShoppingBag, User } from "lucide-react";
import { getURL } from "@/amerta/utilities/getURL";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

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
  const { __ } = useEcommerce();

  const isActive = (itemHref: string) => {
    const fullHref = `/${locale}/account${itemHref}`;
    // Exact match for dashboard, startsWith for others
    if (itemHref === "/") {
      // Match both /en/account and /en/account/
      return pathname === `/${locale}/account` || pathname === `/${locale}/account/`;
    }
    return pathname.startsWith(fullHref);
  };

  return (
    <aside className="sticky w-64 my-8 overflow-y-auto top-24">
      <div className="pr-6 rtl:pl-6 rtl:pr-0">
        <nav className="space-y-2">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            return (
              <Button variant={active ? "default" : "ghost"} asChild key={item.id} className={cn("justify-start w-full gap-2", active && "bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100")}>
                <Link href={getURL(`/account${item.href}`, locale)} className="flex items-center gap-2">
                  <Icon className="w-4 h-4" />
                  {__(item.label)}
                </Link>
              </Button>
            );
          })}
        </nav>
        <Separator className="my-6" />
        <Button variant={"ghost"} asChild className="justify-start w-full gap-2">
          <Link className="flex items-center gap-2" href={getURL(`/logout`, locale)}>
            <LogOut className="w-4 h-4" />
            {__("Log Out")}
          </Link>
        </Button>
      </div>
    </aside>
  );
}
