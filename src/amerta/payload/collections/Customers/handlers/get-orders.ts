/**
 * @module Collections/Customers/Handlers
 * @title Get Orders Handler
 * @description This handler retrieves the authenticated customer's orders. It validates the request, checks token validity, and fetches the orders data accordingly.
 */

import { PayloadRequest } from "payload";

export const getOrders = async (req: PayloadRequest) => {
  try {
    if (!req.user || req.user.collection !== "customers") {
      return Response.json({ message: "Unauthorized" }, { status: 401 });
    }

    const customerId = req.user.id;
    const url = new URL(req.url || "");
    const page = parseInt(url.searchParams.get("page") || "1");
    const limit = parseInt(url.searchParams.get("limit") || "10");
    const status = url.searchParams.get("status");

    const whereQuery: any = {
      orderedBy: {
        equals: customerId,
      },
    };

    if (status) {
      whereQuery.status = {
        equals: status,
      };
    }

    const orders = await req.payload.find({
      collection: "orders",
      where: whereQuery,
      limit,
      page,
      sort: "-createdAt",
    });

    return Response.json({
      success: true,
      docs: orders.docs,
      totalDocs: orders.totalDocs,
      totalPages: orders.totalPages,
      page: orders.page,
      limit: orders.limit,
      hasNextPage: orders.hasNextPage,
      hasPrevPage: orders.hasPrevPage,
    });
  } catch (error: any) {
    console.error("Error fetching customer orders:", error);
    return Response.json({ message: "Error fetching orders", error: error.message }, { status: 500 });
  }
};
