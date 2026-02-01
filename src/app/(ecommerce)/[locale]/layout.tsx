import { Metadata } from "next";
import DefaultLayout from "../(default)/layout";
import { getServerSideURL } from "@/amerta/utilities/getURL";
import { Settings } from "@/payload-types";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";
import { DEFAULT_LOCALE, LocaleCode } from "@/amerta/localization/locales";
import { redirect } from "next/navigation";

export default async function RootLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const settings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
  const locales: LocaleCode[] = settings.locales && (settings.locales as LocaleCode[]).length > 0 ? (settings.locales as LocaleCode[]) : [DEFAULT_LOCALE];
  if (!locales.includes(locale as LocaleCode)) {
    redirect(`/`);
  }

  return <DefaultLayout locale={locale}>{children}</DefaultLayout>;
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: {},
};
