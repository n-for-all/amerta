import { NextResponse } from "next/server";
import { checkRole } from "@/amerta/access/checkRole";
import { PayloadRequest } from "payload";
import { getSalesChannel } from "@/amerta/core/utilities/get-sales-channel"; // Ensure path is correct
import { getDefaultCurrency } from "@/amerta/core/utilities/get-default-currency"; // Ensure path is correct
import { User } from "@/payload-types";

export const getDashboardStats = async (request: PayloadRequest) => {
  // 1. Security Check
  if (!request.user || !checkRole(["admin"], request.user as User)) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url!);

  // 2. Sales Channel & Currency Logic
  // Try to get ID from URL, otherwise fetch the default channel from DB
  const paramChannelId = searchParams.get("channel");
  let activeChannel;

  if (paramChannelId) {
    activeChannel = await request.payload.findByID({
      collection: "sales-channel",
      id: paramChannelId,
    });
  } else {
    activeChannel = await getSalesChannel();
  }

  if (!activeChannel) {
    return NextResponse.json({ message: "No Sales Channel found" }, { status: 400 });
  }

  const currency = await getDefaultCurrency(activeChannel);

  // 3. Date Range Logic
  const to = searchParams.get("to") ? new Date(searchParams.get("to")!) : new Date();
  const from = searchParams.get("from") ? new Date(searchParams.get("from")!) : new Date();

  if (!searchParams.get("from")) from.setDate(to.getDate() - 30);
  from.setHours(0, 0, 0, 0);
  to.setHours(23, 59, 59, 999);

  // 4. Fetch Orders (Filtered by Date AND Sales Channel)
  const orders = await request.payload.find({
    collection: "orders",
    limit: 10000,
    where: {
      and: [
        { createdAt: { greater_than_equal: from.toISOString() } },
        { createdAt: { less_than_equal: to.toISOString() } },
        { salesChannel: { in: [activeChannel.id] } }, // 👈 Filter by Channel
      ],
    },
  });

  // 5. Fetch Customers (Filtered by Date AND Sales Channel)
  const customers = await request.payload.count({
    collection: "customers",
    where: {
      and: [{ createdAt: { greater_than_equal: from.toISOString() } }],
    },
  });

  // 6. Data Aggregation
  // Paid = the gateway confirmed the money (paidAt), or staff moved it past pending (COD, manual payments).
  // Unpaid = still pending: abandoned or declined checkouts. Cancelled / refunded count as neither.
  const PAID_STATUSES = ["processing", "shipped", "completed"];
  const isPaid = (order: any) => !!order.paidAt || PAID_STATUSES.includes(order.status);
  const isUnpaid = (order: any) => !isPaid(order) && (order.status === "pending" || order.status === "on-hold");

  const dateMap = new Map<string, { date: string; sales: number; unpaid: number; orders: number }>();

  // Fill gaps
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dateMap.set(key, { date: key, sales: 0, unpaid: 0, orders: 0 });
  }

  let grossSales = 0;
  let netRevenue = 0;
  let unpaidTotal = 0;
  let unpaidCount = 0;

  orders.docs.forEach((order) => {
    const key = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    const orderTotal = order.total || 0; // Gross
    const day = dateMap.get(key);

    if (isPaid(order)) {
      grossSales += orderTotal;
      netRevenue += (order.subtotal || orderTotal) - (order.tax || 0); // Approx Net
      if (day) {
        day.sales += orderTotal;
        day.orders += 1;
      }
    } else if (isUnpaid(order)) {
      unpaidTotal += orderTotal;
      unpaidCount += 1;
      if (day) day.unpaid += orderTotal;
    }
  });

  const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();

  orders.docs.filter(isPaid).forEach((order) => {
    // Check if order has items
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item) => {
        // Handle different Payload schema structures (sometimes item is a direct relation, sometimes nested)
        const product = item.product;
        let productName = typeof product === "object" && product?.title ? product.title : "Unknown Product";

        if (item.variantText) {
          // Append variant info to product name if available
          productName += ` (${item.variantText})`;
        }
        // Ensure numbers
        const qty = item.quantity || 0;
        // Calculate item revenue (price * qty) or use item total if stored
        // Adjust this logic based on your exact schema
        const price = item.price || 0;
        const revenue = price * qty;

        if (productMap.has(productName)) {
          const entry = productMap.get(productName)!;
          entry.revenue += revenue;
          entry.quantity += qty;
        } else {
          productMap.set(productName, { name: productName, revenue, quantity: qty });
        }
      });
    }
  });

  const topProducts = Array.from(productMap.values())
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 5);

  return NextResponse.json({
    chartData: Array.from(dateMap.values()),
    topProducts,
    metrics: {
      ordersCount: orders.totalDocs,
      grossSales,
      netRevenue,
      unpaidTotal,
      unpaidCount,
      customersCount: customers.totalDocs,
      sessions: 0,
    },
    currency: currency,
    salesChannelId: activeChannel?.id,
  });
};
