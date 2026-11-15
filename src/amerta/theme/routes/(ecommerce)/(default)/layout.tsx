import React from "react";
import { Metadata } from "next";

import "@/amerta/theme/css/global.css";
import "@/amerta/theme/css/app.scss";

import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";
import type { Settings } from "@/payload-types";
import { InitTheme } from "@/amerta/providers/Theme/InitTheme";
import { Providers } from "@/amerta/providers";
import { DEFAULT_LOCALE, LOCALES } from "@/amerta/localization/locales";
import { ThemeShopLayout } from "@/amerta/theme/layout";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import { GTM } from "@/amerta/components/GTM/GTM";
import { GTMFooter } from "@/amerta/components/GTM/GTMFooter";

export default async function RootLayout({ children, locale }: { children: React.ReactNode; locale?: string }) {
  const settings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1, locale)();
  const dir = LOCALES.find((l) => l.code === locale)?.rtl ? "rtl" : "ltr";

  return (
    <html lang={locale || DEFAULT_LOCALE} dir={dir} suppressHydrationWarning>
      <head>
        <InitTheme />
        {settings.favicon && typeof settings.favicon === "object" && settings.favicon.url && <link rel="icon" href={settings.favicon.url} sizes="32x32" />}
        {settings.appleTouchIcon && typeof settings.appleTouchIcon === "object" && settings.appleTouchIcon.url && <link rel="apple-touch-icon" href={settings.appleTouchIcon.url} sizes="180x180" />}
        {settings.androidIcon && typeof settings.androidIcon === "object" && settings.androidIcon.url && <link rel="icon" href={settings.androidIcon.url} type={settings.androidIcon.url.endsWith(".png") ? "image/png" : settings.androidIcon.url.endsWith(".svg") ? "image/svg+xml" : settings.androidIcon.url.endsWith(".webp") ? "image/webp" : "image/png"} sizes="192x192" />}
        {settings.noIndex && <meta name="robots" content="noindex" />}
        <GTM />
      </head>
      <body suppressHydrationWarning className="text-black bg-white dark:bg-black dark:text-white">
        <Providers>
          <ThemeShopLayout locale={locale || DEFAULT_LOCALE}>{children}</ThemeShopLayout>
          <GTMFooter locale={locale || DEFAULT_LOCALE} />
        </Providers>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: {},
};
