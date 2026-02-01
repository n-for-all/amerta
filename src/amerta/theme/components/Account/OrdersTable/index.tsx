import React from "react";
import Link from "next/link";
import { Currency, Order, Settings } from "@/payload-types";
import { Button } from "@/amerta/theme/ui/button"; // Assuming you still have this, if not, use standard <button>
import { formatDateTime } from "@/amerta/utilities/formatDateTime";
import { getPaymentByOrderId } from "@/amerta/theme/utilities/get-payment";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { getCustomerOrders } from "@/amerta/theme/utilities/get-customer-orders";
import { getURL } from "@/amerta/utilities/getURL";
import { formatPrice } from "@/amerta/theme/utilities/format-price";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { createTranslator } from "@/amerta/theme/utilities/translation";
import { Config } from "payload";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { printf } from "fast-printf";

export default async function OrdersTable({ customerId, locale, page: pageParam, recentOnly }: { customerId: string; locale: string; page?: string; recentOnly?: boolean }) {
  const page = Number(pageParam) || 1;
  let orders: Order[] = [];
  let totalPages = 1;
  let hasNextPage = false;
  let hasPrevPage = false;
  const __ = await createTranslator(locale);

  try {
    const pDocs = await getCustomerOrders(customerId, { page });
    orders = pDocs.docs;
    totalPages = pDocs.totalPages;
    hasNextPage = pDocs.hasNextPage;
    hasPrevPage = pDocs.hasPrevPage;
  } catch (error) {
    console.error("Error fetching orders:", error);
  }

  const salesChannel = await getSalesChannel();
  const defaultCurrency = getDefaultCurrency(salesChannel!);
  const settings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
  const defaultDateFormat = settings.dateFormat || "MMM dd, yyyy";

  return (
    <div className="w-full">
      {!orders || orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center border rounded-lg border-zinc-200 bg-zinc-50/50">
          <div className="p-4 mb-4 rounded-full bg-zinc-100">
            <svg className="w-8 h-8 text-zinc-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold">{__("No orders found")}</h3>
          <p className="max-w-sm mt-2 mb-6 text-sm text-gray-500">{__("You haven't placed any orders yet. Start shopping to see your orders here.")}</p>
          <Button asChild>
            <Link href={getURL(`/products`, locale)}>{__("Start Shopping")}</Link>
          </Button>
        </div>
      ) : (
        <div className="overflow-hidden bg-white border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="relative w-full overflow-auto">
            <table className="w-full text-sm text-left rtl:text-right caption-bottom">
              <thead className="[&_tr]:border-b bg-zinc-50/50 dark:bg-zinc-900/50">
                <tr className="border-b transition-colors hover:bg-zinc-100/50 data-[state=selected]:bg-zinc-100 border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800">
                  <th className="h-12 px-4 font-medium align-middle text-zinc-500 dark:text-zinc-400">{__("Order ID")}</th>
                  <th className="h-12 px-4 font-medium align-middle text-zinc-500 dark:text-zinc-400">{__("Date")}</th>
                  <th className="h-12 px-4 font-medium align-middle text-zinc-500 dark:text-zinc-400">{__("Status")}</th>
                  <th className="h-12 px-4 font-medium text-right align-middle text-zinc-500 dark:text-zinc-400">{__("Total")}</th>
                  <th className="h-12 px-4 font-medium text-right align-middle text-zinc-500 dark:text-zinc-400">{__("Actions")}</th>
                </tr>
              </thead>
              <tbody className="[&_tr:last-child]:border-0">
                {orders.map(async (order) => {
                  const payment = await getPaymentByOrderId(order.id);
                  return (
                    <tr key={order.id} className="border-b transition-colors hover:bg-zinc-50/50 data-[state=selected]:bg-zinc-100 border-zinc-200 dark:border-zinc-800 dark:hover:bg-zinc-800">
                      <td className="p-4 font-medium align-middle">
                        <span className="font-mono text-zinc-500">#</span>
                        {order.orderId}
                      </td>
                      <td className="p-4 align-middle">{formatDateTime(order.createdAt, defaultDateFormat)}</td>
                      <td className="p-4 align-middle">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize border ${order.status === "completed" || order.status === "shipped" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-900" : "bg-zinc-100 text-zinc-700 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"}`}>{__(order.status || "Pending")}</span>
                      </td>
                      <td className="p-4 font-medium text-right align-middle">{payment ? formatPrice(payment?.amount, payment?.currency as Currency, 1) : formatPrice(order.total, defaultCurrency, 1)}</td>
                      <td className="p-4 text-right align-middle">
                        <Button asChild variant="outline" size="sm" className="h-8">
                          <Link href={getURL(`/account/orders/${order.id}`, locale)}>{__("View Details")}</Link>
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination Controls */}
      {totalPages > 1 && !recentOnly ? (
        <div className="flex items-center justify-end mt-4 space-x-2 rtl:justify-start">
          <Button variant="outline" size="sm" asChild disabled={!hasPrevPage} className={!hasPrevPage ? "pointer-events-none opacity-50" : ""}>
            <Link href={getURL(`/account/orders?page=${page - 1}`, locale)}>{__("Previous")}</Link>
          </Button>
          <div className="flex items-center justify-center text-sm font-medium min-w-[100px]">{printf(__("Page %s of %s"), page, totalPages)}</div>
          <Button variant="outline" size="sm" asChild disabled={!hasNextPage} className={!hasNextPage ? "pointer-events-none opacity-50" : ""}>
            <Link href={getURL(`/account/orders?page=${page + 1}`, locale)}>{__("Next")}</Link>
          </Button>
        </div>
      ) : null}
    </div>
  );
}
