import { cookies } from "next/headers";
import { getURL } from "@/amerta/utilities/getURL";
import { SOURCE_COOKIE, isCatalogSource } from "../../settings";
import { getCatalogContext } from "../../services/catalogItems";
import { CatalogFrame } from "./CatalogFrame";
import { getCatalogFrameProps } from "./frameProps";

/**
 * A customer who came from the catalog keeps the catalog's look through checkout: the same slim
 * bar instead of the shop's header and footer, with a link back to the catalog. Everyone else
 * (and every shop without the Catalog app) gets the page unchanged.
 */
export async function CatalogCheckoutFrame({ locale, source, children }: { locale: string; source?: string | null; children: React.ReactNode }) {
  const from = source === undefined ? (await cookies()).get(SOURCE_COOKIE)?.value : source;
  if (!isCatalogSource(from)) return <>{children}</>;

  const ctx = await getCatalogContext(locale);
  if (!ctx) return <>{children}</>;

  return (
    <CatalogFrame {...(await getCatalogFrameProps(ctx))} backUrl={getURL("/catalog", locale)} wide>
      {children}
    </CatalogFrame>
  );
}
