import { NextResponse } from "next/server";
import { checkRole } from "@/amerta/access/checkRole";
import { PayloadRequest } from "payload";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel"; // Ensure path is correct
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency"; // Ensure path is correct

export const getDashboardStats = async (request: PayloadRequest) => {
  // 1. Security Check
  if (!request.user || !checkRole(["admin"], request.user)) {
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
  const dateMap = new Map<string, { date: string; sales: number; payments: number }>();

  // Fill gaps
  for (let d = new Date(from); d <= to; d.setDate(d.getDate() + 1)) {
    const key = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    dateMap.set(key, { date: key, sales: 0, payments: 0 });
  }

  let grossSales = 0;
  let netRevenue = 0;

  orders.docs.forEach((order) => {
    const key = new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

    const orderTotal = order.total || 0; // Gross
    const orderNet = (order.subtotal || orderTotal) - (order.tax || 0); // Approx Net

    grossSales += orderTotal;
    netRevenue += orderNet;

    if (dateMap.has(key)) {
      dateMap.get(key)!.sales += orderTotal;
      if (order.status === "completed") {
        dateMap.get(key)!.payments += orderTotal;
      }
    }
  });

  const productMap = new Map<string, { name: string; revenue: number; quantity: number }>();

  orders.docs.forEach((order) => {
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
      customersCount: customers.totalDocs,
      sessions: 0,
    },
    currency: currency,
    salesChannelId: activeChannel?.id,
  });
};
