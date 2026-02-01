import { Metadata } from "next";
import { getMeCustomer } from "@/amerta/utilities/getMeCustomer";
import OrdersTable from "@/amerta/theme/components/Account/OrdersTable";
import { RenderParams } from "@/amerta/components/RenderParams";
import { getURL } from "@/amerta/utilities/getURL";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { SearchParams } from "next/dist/server/request/search-params";
import { createTranslator } from "@/amerta/theme/utilities/translation";

export default async function Orders({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }) {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const __ = await createTranslator(locale);

  // 1. Authenticate
  const { user } = await getMeCustomer({
    nullUserRedirect: `${getURL("/login", locale)}?redirect=${encodeURIComponent(getURL("/account/orders", locale))}`,
  });

  return (
    <div className="container px-4 py-10 mx-auto space-y-8 md:px-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{__("My Orders")}</h1>
          <p className="mt-2 text-sm text-gray-500 text-muted-foreground">{__("View and manage your order history.")}</p>
        </div>
      </div>

      <RenderParams />

      <OrdersTable customerId={user!.id} locale={locale} page={page.toString()} />
    </div>
  );
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { locale } = await params;
  const { page: pageParam } = await searchParams;
  const page = Number(pageParam) || 1;
  const metaData = await generateStaticMeta({ pageName: "ordersPage", locale, type: "orders", pageNum: page });
  return metaData;
}
