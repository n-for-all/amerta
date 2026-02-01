import { headers } from "next/headers";
import DefaultLayout from "@/app/(ecommerce)/(default)/layout";
import { DEFAULT_LOCALE, LOCALES } from "@/amerta/localization/locales";
import NotFoundClient from "./NotFoundClient";

export const metadata = {
  title: "404 - Page Not Found",
};

export default async function NotFound() {
  const headersList = await headers();
  const pathname = headersList.get("x-url") || "";
  const segments = pathname.split("/");
  const firstSegment = segments[1]?.toLowerCase();
  const foundLocale = LOCALES.find((l) => l.code.toLowerCase() === firstSegment);
  const locale = foundLocale ? foundLocale.code : DEFAULT_LOCALE;

  return (
    <DefaultLayout locale={locale}>
      <NotFoundClient />
    </DefaultLayout>
  );
}
