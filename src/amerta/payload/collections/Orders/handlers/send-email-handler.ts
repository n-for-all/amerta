/**
 * @module Collections/Orders/Handlers
 * @title Send Order Email Handler
 * @description This handler sends emails related to order status changes. It validates the request, fetches the order and customer details, and sends the appropriate email based on the action specified.
 */

import { NextResponse } from "next/server";
import { PayloadRequest } from "payload";
import { Order, Customer } from "@/payload-types";
import { sendNewOrderEmail, sendInvoiceEmail, sendProcessingOrderEmail, sendShippedOrderEmail, sendCompletedOrderEmail, sendCancelledOrderEmail, sendRefundedOrderEmail, sendOnHoldOrderEmail } from "@/amerta/utilities/emails/sendOrderEmail"; // Update your path

export const sendOrderEmailHandler = async (req: PayloadRequest): Promise<Response> => {
  const { payload, routeParams } = req;
  const id = routeParams?.id as string;

  if (!id) {
    return NextResponse.json({ error: "Missing Order ID" }, { status: 400 });
  }

  try {
    const body = await req.json!();
    const { action } = body;

    // 1. Fetch the Order from DB
    const order = await payload.findByID({
      collection: "orders",
      id,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // 2. Resolve Customer
    let customer: Customer | null = null;
    if (order.orderedBy) {
      if (typeof order.orderedBy === "object") {
        customer = order.orderedBy as Customer;
      } else {
        customer = await payload.findByID({
          collection: "customers",
          id: order.orderedBy as string,
        });
      }
    }

    if (!customer) {
      return NextResponse.json({ error: "No customer linked to this order" }, { status: 400 });
    }

    // 3. Execute Action
    switch (action) {
      case "resend_receipt":
        await sendNewOrderEmail(customer, order, false);
        break;

      case "resend_invoice":
        await sendInvoiceEmail(customer, order);
        break;

      case "send_status_email":
        // Sends the email matching the CURRENT status in the DB
        switch (order.status) {
          case "processing":
            await sendProcessingOrderEmail(customer, order);
            break;
          case "shipped":
            await sendShippedOrderEmail(customer, order);
            break;
          case "completed":
            await sendCompletedOrderEmail(customer, order);
            break;
          case "cancelled":
            await sendCancelledOrderEmail(customer, order);
            break;
          case "refunded":
            await sendRefundedOrderEmail(customer, order);
            break;
          case "on-hold":
            await sendOnHoldOrderEmail(customer, order);
            break;
          default:
            return NextResponse.json({ error: `No email template for status: ${order.status}` }, { status: 400 });
        }
        break;

      default:
        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: "Email queued successfully" });
  } catch (error) {
    console.error("Email API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
};
