import { Endpoint, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import {
  getLoyaltySettings,
  getCustomerLoyaltyAccount,
  adjustCustomerPoints,
  calculateTier,
} from "../services/loyaltyEngine";

export const adminSearchLoyaltyCustomersEndpoint: Endpoint = {
  path: "/loyalty/admin/customers",
  method: "get",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const url = new URL(req.url || "", "http://localhost");
      const q = (url.searchParams.get("q") || "").trim();
      const settings = await getLoyaltySettings(req.payload);

      let customerIds: string[] = [];

      if (q) {
        // 1. Check if q matches an order ID
        try {
          const matchingOrders = await req.payload.find({
            collection: "orders",
            where: {
              or: [
                { id: { equals: q } },
                { orderId: { equals: q } },
              ],
            },
            limit: 5,
          });

          for (const order of matchingOrders.docs) {
            const custId =
              typeof order.orderedBy === "string" ? order.orderedBy : order.orderedBy?.id;
            if (custId && !customerIds.includes(String(custId))) {
              customerIds.push(String(custId));
            }
          }
        } catch (e) {
          // not an order ID, ignore
        }

        // 2. Search customers by email or names (strictly exclude guests hasAccount: "0")
        const matchingCustomers = await req.payload.find({
          collection: "customers",
          where: {
            and: [
              { hasAccount: { not_equals: "0" } },
              {
                or: [
                  { email: { like: q } },
                  { firstName: { like: q } },
                  { lastName: { like: q } },
                  { displayName: { like: q } },
                  { contact_email: { like: q } },
                ],
              },
            ],
          },
          limit: 25,
        });

        for (const cust of matchingCustomers.docs) {
          if (!customerIds.includes(String(cust.id))) {
            customerIds.push(String(cust.id));
          }
        }
      } else {
        // Default: return recent registered customers only (exclude guests)
        const recentCustomers = await req.payload.find({
          collection: "customers",
          where: {
            hasAccount: { not_equals: "0" },
          },
          limit: 30,
          sort: "-createdAt",
        });
        customerIds = recentCustomers.docs.map((c) => String(c.id));
      }

      if (customerIds.length === 0) {
        return Response.json({ customers: [] });
      }

      // Fetch customer details and their loyalty metafields (strictly registered customers only)
      const customers = await req.payload.find({
        collection: "customers",
        where: {
          and: [
            { id: { in: customerIds } },
            { hasAccount: { not_equals: "0" } },
          ],
        },
        limit: customerIds.length,
      });

      const results = await Promise.all(
        customers.docs.map(async (cust) => {
          const account = await getCustomerLoyaltyAccount(String(cust.id), req.payload);
          const currentTier =
            settings.tiers.find((t) => t.slug === account.tierSlug) ||
            calculateTier(account.lifetimePoints, settings.tiers);

          const fullName = `${cust.firstName || ""} ${cust.lastName || ""}`.trim();
          const hasName = Boolean(cust.displayName || fullName);
          const displayName = cust.displayName || fullName || "";

          return {
            id: cust.id,
            email: cust.contact_email || cust.email,
            rawEmail: cust.email,
            firstName: cust.firstName || "",
            lastName: cust.lastName || "",
            displayName,
            hasName,
            hasAccount: cust.hasAccount,
            account,
            currentTier,
            createdAt: cust.createdAt,
          };
        })
      );

      return Response.json({ customers: results });
    } catch (err: any) {
      console.error("[Admin Loyalty Customers Error]:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }),
};

export const adminGetLoyaltyOrdersEndpoint: Endpoint = {
  path: "/loyalty/admin/orders",
  method: "get",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const url = new URL(req.url || "", "http://localhost");
      const q = (url.searchParams.get("q") || "").trim();

      let orderWhere: any = {};

      if (q) {
        orderWhere = {
          or: [
            { id: { equals: q } },
            { orderId: { like: q } },
          ],
        };
      }

      const orders = await req.payload.find({
        collection: "orders",
        where: orderWhere,
        limit: 50,
        sort: "-createdAt",
        depth: 1,
      });

      // Cache accounts in memory to prevent duplicate DB fetches
      const accountCache = new Map<string, any>();

      const results = await Promise.all(
        orders.docs.map(async (ord: any) => {
          const customerObj = typeof ord.orderedBy === "object" ? ord.orderedBy : null;
          const customerId = customerObj ? String(customerObj.id) : (ord.orderedBy ? String(ord.orderedBy) : null);
          const isGuest = customerObj ? customerObj.hasAccount === "0" : false;

          let pointsEarned = 0;
          let pointsRedeemed = 0;

          if (customerId && !isGuest) {
            let account = accountCache.get(customerId);
            if (!account) {
              account = await getCustomerLoyaltyAccount(customerId, req.payload);
              accountCache.set(customerId, account);
            }

            if (account && Array.isArray(account.history)) {
              const earnTx = account.history.find(
                (tx: any) => tx.type === "earn" && String(tx.orderId) === String(ord.id)
              );
              if (earnTx) pointsEarned = earnTx.points;

              const redeemTx = account.history.find(
                (tx: any) => tx.type === "redeem" && String(tx.orderId) === String(ord.id)
              );
              if (redeemTx) pointsRedeemed = Math.abs(redeemTx.points);
            }
          }

          return {
            id: ord.id,
            orderId: ord.orderId || `#${ord.id}`,
            customerId: customerId || "N/A",
            customerName: customerObj
              ? customerObj.displayName || `${customerObj.firstName || ""} ${customerObj.lastName || ""}`.trim() || customerObj.email
              : "Customer",
            customerEmail: customerObj ? (customerObj.contact_email || customerObj.email) : "N/A",
            isGuest,
            subtotal: ord.subtotal || 0,
            total: ord.total || 0,
            status: ord.status || "pending",
            pointsEarned,
            pointsRedeemed,
            createdAt: ord.createdAt,
          };
        })
      );

      return Response.json({ orders: results });
    } catch (err: any) {
      console.error("[Admin Loyalty Orders Error]:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }),
};

export const adminAdjustPointsEndpoint: Endpoint = {
  path: "/loyalty/admin/adjust-points",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const body = req.json ? await req.json() : req.body;
      const { customerId, pointsDelta, reason } = body || {};

      if (!customerId || pointsDelta === undefined || typeof pointsDelta !== "number") {
        return Response.json(
          { error: "customerId and numeric pointsDelta are required." },
          { status: 400 }
        );
      }

      const updatedAccount = await adjustCustomerPoints(
        customerId,
        pointsDelta,
        reason || "Manual adjustment from Admin Portal",
        req.payload
      );

      return Response.json({
        success: true,
        account: updatedAccount,
      });
    } catch (err: any) {
      console.error("[Admin Adjust Points Error]:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }),
};

export const adminUpdateCustomerEndpoint: Endpoint = {
  path: "/loyalty/admin/update-customer",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const body = req.json ? await req.json() : req.body;
      const { customerId, firstName, lastName, displayName } = body || {};

      if (!customerId) {
        return Response.json({ error: "customerId is required." }, { status: 400 });
      }

      const updatedCustomer = await req.payload.update({
        collection: "customers",
        id: customerId,
        data: {
          ...(firstName !== undefined ? { firstName } : {}),
          ...(lastName !== undefined ? { lastName } : {}),
          ...(displayName !== undefined ? { displayName } : {}),
        },
      });

      return Response.json({
        success: true,
        customer: updatedCustomer,
      });
    } catch (err: any) {
      console.error("[Admin Update Customer Error]:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }),
};
