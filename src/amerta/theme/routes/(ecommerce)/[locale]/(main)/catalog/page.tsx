import { notFound } from "next/navigation";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { CatalogPage, getCatalogHeading } from "@/amerta/apps/catalog/components/storefront/CatalogPage";
import { getURL } from "@/amerta/utilities/getURL";

// Catalog app: a quick "buy now" page to link from Instagram, Facebook or WhatsApp.
// It only exists while the Catalog app is active.
export default async function CatalogRoute({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <CatalogPage locale={locale} />;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const heading = await getCatalogHeading(locale);
  if (!heading) notFound();
  return { title: heading, alternates: { canonical: getURL("/catalog", locale) } };
}
