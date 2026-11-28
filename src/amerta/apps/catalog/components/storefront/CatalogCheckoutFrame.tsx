import { notFound } from "next/navigation";
import { getURL } from "@/amerta/utilities/getURL";
import { getCatalogContext } from "@/amerta/apps/catalog/services/catalogItems";
import { CatalogFrame } from "@/amerta/apps/catalog/components/storefront/CatalogFrame";
import { getCatalogFrameProps } from "@/amerta/apps/catalog/components/storefront/frameProps";

/**
 * The frame of the catalog's own checkout page (/catalog/checkout): the catalog's slim bar with a
 * link back to the catalog, instead of the shop's header and footer. The shop's regular checkout
 * page is a different page and is not touched.
 */
export async function CatalogCheckoutFrame({ locale, children }: { locale: string; children: React.ReactNode }) {
  const ctx = await getCatalogContext(locale);
  if (!ctx) notFound();

  return (
    <CatalogFrame {...(await getCatalogFrameProps(ctx))} backUrl={getURL("/catalog", locale)} wide>
      {children}
    </CatalogFrame>
  );
}
