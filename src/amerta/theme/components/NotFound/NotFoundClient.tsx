"use client";
import { Button } from "@/amerta/theme/ui/button";
import Link from "next/link";

import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { getURL } from "@/amerta/utilities/getURL";
import { ArrowRight } from "lucide-react";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export default function NotFoundClient() {
  const { __ } = useEcommerce();
  return (
    <div className="grid py-16">
      <div className="flex flex-col items-center justify-center px-4 py-8 text-center">
        <h1 className="text-[100px] leading-none font-bold">{__("404")}</h1>

        <h2 className="mb-6 text-4xl font-semibold">{__("Whoops!")}</h2>
        <h3 className="mb-1.5 text-2xl font-semibold">{__("Something went wrong")}</h3>
        <p className="max-w-sm mb-6 text-muted-foreground">{__("The page you're looking for isn't found.")}</p>
        <Button asChild>
          <Link href={getURL("/", DEFAULT_LOCALE)} className="rtl:flex-row-reverse">
            {__("Go to home page")} <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
