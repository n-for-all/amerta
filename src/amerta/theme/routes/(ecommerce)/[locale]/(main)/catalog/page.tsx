import { notFound } from "next/navigation";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { CatalogPage, getCatalogHeading } from "@/amerta/apps/catalog/components/storefront/CatalogPage";
import { getURL } from "@/amerta/utilities/getURL";

// Catalog app: a quick "buy now" page to link from Instagram, Facebook or WhatsApp.
// It only exists while the Catalog app is active.
export default async function CatalogRoute({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> }) {
  const { locale } = await params;
  const { page } = await searchParams;
  return <CatalogPage locale={locale} page={Math.max(1, parseInt(page || "1", 10) || 1)} />;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const heading = await getCatalogHeading(locale);
  if (!heading) notFound();
  return { title: heading, alternates: { canonical: getURL("/catalog", locale) } };
}
