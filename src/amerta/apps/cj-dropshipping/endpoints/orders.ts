import { Endpoint, Payload, PayloadRequest } from "payload";
import { withGuard } from "@/amerta/utilities/withGuard";
import { sendShippedOrderEmail } from "@/amerta/utilities/emails/sendOrderEmail";
import { CJClient } from "../services/cjClient";

/**
 * Send paid orders with CJ products to CJ Dropshipping, pay them from the CJ wallet,
 * and bring tracking back. State lives on the order in `cjOrder`.
 */

const PAID_STATUSES = ["processing", "completed", "shipped"];
const CJ_FINAL_STATUSES = ["SHIPPED", "DELIVERED", "CANCELLED"];
const DISPOSABLE_DOMAINS = [
  "mailinator.com", "guerrillamail.com", "10minutemail.com", "tempmail.com", "temp-mail.org", "yopmail.com",
  "trashmail.com", "sharklasers.com", "getnada.com", "dispostable.com", "maildrop.cc", "throwawaymail.com",
];

export interface CJOrderState {
  orderId?: string;
  shipmentOrderId?: string;
  orderNumber?: string;
  status?: string;
  subStatus?: string | null;
  paid?: boolean;
  orderAmount?: number;
  productAmount?: number;
  postageAmount?: number;
  logisticName?: string;
  fromCountryCode?: string;
  trackNumber?: string;
  trackingProvider?: string;
  attempts?: number;
  sentAt?: string;
  syncedAt?: string;
  error?: string;
}

interface CJLine {
  name: string;
  variantText?: string;
  sku: string;
  vid?: string;
  pid: string;
  quantity: number;
  price: number;
  image?: string;
}

const idOf = (v: any) => (v && typeof v === "object" ? v.id : v);

async function readBody(req: PayloadRequest): Promise<any> {
  try {
    return req.json ? await req.json() : req.body || {};
  } catch {
    return {};
  }
}

/** The order's CJ items (products imported from CJ), with their CJ variant SKU */
async function getCJLines(payload: Payload, order: any): Promise<{ lines: CJLine[]; otherItems: number }> {
  const lines: CJLine[] = [];
  let otherItems = 0;
  for (const item of order.items || []) {
    const product: any = await payload.findByID({ collection: "products", id: idOf(item.product), depth: 0 }).catch(() => null);
    if (!product?.cjProductId) {
      otherItems++;
      continue;
    }
    const variant = item.variant ? (product.variants || []).find((v: any) => v.id === item.variant) : null;
    lines.push({
      name: item.productName || product.title,
      variantText: item.variantText || undefined,
      sku: variant?.sku || product.sku || "",
      pid: product.cjProductId,
      quantity: Number(item.quantity) || 1,
      price: Number(item.price) || 0,
    });
  }
  return { lines, otherItems };
}

/** Look up CJ variant ids (vid) by variant SKU; a product with a single variant uses that one */
async function resolveVids(lines: CJLine[]): Promise<void> {
  const byPid = new Map<string, any>();
  for (const line of lines) {
    if (!byPid.has(line.pid)) byPid.set(line.pid, await CJClient.getProductDetails(line.pid).catch(() => null));
    const variants: any[] = byPid.get(line.pid)?.variants || [];
    const match = variants.find((v) => v.variantSku === line.sku) || (variants.length === 1 ? variants[0] : null);
    if (match) {
      line.vid = match.vid;
      line.sku = match.variantSku || line.sku;
    }
  }
}

/** CJ shipping fields from the order's shipping address, plus what is missing */
async function mapAddress(payload: Payload, order: any) {
  const a = order.address || {};
  const country: any = a.country ? await payload.findByID({ collection: "country", id: idOf(a.country), depth: 0 }).catch(() => null) : null;
  const phone = a.phone ? [a.phoneCountryCode, a.phone].filter(Boolean).join(" ") : "";
  const fields = {
    shippingCustomerName: [a.firstName, a.lastName].filter(Boolean).join(" "),
    shippingCountryCode: String(country?.iso_2 || "").toUpperCase(),
    shippingCountry: country?.display_name || country?.name || a.countryName || "",
    shippingProvince: a.state || "",
    shippingCity: a.city || "",
    shippingAddress: [a.building, a.street].filter(Boolean).join(" ") || a.address || "",
    shippingAddress2: [a.apartment && `Apt ${a.apartment}`, a.floor && `Floor ${a.floor}`, a.street ? a.address : ""].filter(Boolean).join(", "),
    shippingZip: a.postalCode || "",
    shippingPhone: phone,
  };
  const missing: string[] = [];
  if (!fields.shippingCustomerName) missing.push("name");
  if (!fields.shippingCountryCode) missing.push("country");
  if (!fields.shippingProvince) missing.push("state");
  if (!fields.shippingCity) missing.push("city");
  if (!fields.shippingAddress) missing.push("street address");
  if (!fields.shippingZip) missing.push("ZIP / postal code");
  return { fields, missing };
}

/** Signals worth a look before buying the goods. Nothing here is proof of fraud on its own. */
async function riskChecks(payload: Payload, order: any, customer: any) {
  const checks: { level: "high" | "medium" | "info"; text: string }[] = [];
  const ship = order.address || {};
  const bill = order.billingAddress || {};

  if (!PAID_STATUSES.includes(order.status)) checks.push({ level: "high", text: `Order is "${order.status}", not paid yet` });
  if (order.isTest) checks.push({ level: "medium", text: "Marked as a test order" });

  if (bill.country && ship.country && idOf(bill.country) !== idOf(ship.country)) {
    checks.push({ level: "high", text: "Billing and shipping countries are different" });
  }
  const shipName = `${ship.firstName || ""} ${ship.lastName || ""}`.trim().toLowerCase();
  const billName = `${bill.firstName || ""} ${bill.lastName || ""}`.trim().toLowerCase();
  if (shipName && billName && shipName !== billName) checks.push({ level: "medium", text: "Billing name differs from shipping name (can be a gift)" });

  const email = String(customer?.email || "").toLowerCase();
  const domain = email.split("@")[1] || "";
  if (domain && DISPOSABLE_DOMAINS.includes(domain)) checks.push({ level: "high", text: `Throwaway email address (${domain})` });

  const qtyMax = Math.max(0, ...(order.items || []).map((i: any) => Number(i.quantity) || 0));
  if (qtyMax >= 4) checks.push({ level: "medium", text: `${qtyMax}× of one item (resellers and card testers buy in bulk)` });

  if (customer?.id) {
    const previous = await payload.count({
      collection: "orders",
      where: { and: [{ orderedBy: { equals: customer.id } }, { id: { not_equals: order.id } }, { status: { in: PAID_STATUSES } }] },
    });
    if (previous.totalDocs === 0) checks.push({ level: "info", text: "First order from this customer" });
    else checks.push({ level: "info", text: `Returning customer (${previous.totalDocs} earlier paid order${previous.totalDocs > 1 ? "s" : ""})` });

    const dayAgo = new Date(new Date(order.createdAt).getTime() - 24 * 3600 * 1000).toISOString();
    const recent = await payload.count({
      collection: "orders",
      where: { and: [{ orderedBy: { equals: customer.id } }, { id: { not_equals: order.id } }, { createdAt: { greater_than: dayAgo } }] },
    });
    if (recent.totalDocs >= 2) checks.push({ level: "medium", text: `${recent.totalDocs + 1} orders from this customer in 24 hours` });

    if (customer.createdAt && new Date(order.createdAt).getTime() - new Date(customer.createdAt).getTime() < 10 * 60 * 1000) {
      checks.push({ level: "info", text: "Account created minutes before ordering" });
    }
  } else {
    checks.push({ level: "info", text: "Guest order (no customer account)" });
  }

  if (ship.street && ship.postalCode) {
    const sameAddress = await payload.find({
      collection: "orders",
      where: { and: [{ "address.street": { equals: ship.street } }, { "address.postalCode": { equals: ship.postalCode } }, { id: { not_equals: order.id } }] },
      depth: 0,
      limit: 50,
      pagination: false,
    });
    const others = new Set(sameAddress.docs.map((o: any) => String(idOf(o.orderedBy) || "")).filter((c) => c && c !== String(customer?.id || "")));
    if (others.size > 0) checks.push({ level: "medium", text: `Same address used by ${others.size} other customer${others.size > 1 ? "s" : ""}` });
  }

  return checks;
}

async function loadOrder(payload: Payload, id: string) {
  const order: any = await payload.findByID({ collection: "orders", id, depth: 0 });
  const customer: any = order.orderedBy
    ? await payload.findByID({ collection: "customers", id: idOf(order.orderedBy), depth: 0 }).catch(() => null)
    : null;
  return { order, customer };
}

async function saveState(payload: Payload, orderId: string, cjOrder: CJOrderState, extra: Record<string, any> = {}) {
  const lifecycleChange = "status" in extra;
  return payload.update({
    collection: "orders",
    id: orderId,
    data: { cjOrder, ...extra } as any,
    depth: 0,
    // Saving CJ state must not re-run order lifecycle hooks; a status change (shipped) should
    context: lifecycleChange ? {} : { inventoryAdjustment: true },
  });
}

/** Refresh CJ status/tracking. Copies new tracking onto the order, marks it shipped and emails the customer. */
async function syncOrder(payload: Payload, order: any, customer: any): Promise<{ state: CJOrderState; changed: boolean }> {
  const state: CJOrderState = { ...(order.cjOrder || {}) };
  if (!state.orderId) return { state, changed: false };
  const d = await CJClient.getOrderDetail(state.orderId);
  Object.assign(state, {
    status: d?.orderStatus || state.status,
    subStatus: d?.subStatus ?? null,
    orderAmount: d?.orderAmount != null ? Number(d.orderAmount) : state.orderAmount,
    productAmount: d?.productAmount != null ? Number(d.productAmount) : state.productAmount,
    postageAmount: d?.postageAmount != null ? Number(d.postageAmount) : state.postageAmount,
    logisticName: d?.logisticName || state.logisticName,
    trackNumber: d?.trackNumber || state.trackNumber,
    trackingProvider: d?.trackingProvider || state.trackingProvider,
    paid: state.paid || ["UNSHIPPED", "SHIPPED", "DELIVERED"].includes(d?.orderStatus),
    syncedAt: new Date().toISOString(),
    error: undefined,
  });

  const extra: Record<string, any> = {};
  const newTracking = state.trackNumber && state.trackNumber !== order.shippingTrackingNumber;
  if (newTracking) {
    extra.shippingTrackingNumber = state.trackNumber;
    extra.shippingCarrier = state.trackingProvider || state.logisticName || "";
    if (order.status === "processing") extra.status = "shipped";
  }
  const updated = await saveState(payload, order.id, state, extra);
  if (extra.status === "shipped" && customer) {
    await sendShippedOrderEmail(customer, updated as any);
  }
  return { state, changed: Boolean(newTracking) };
}

const getInfo: Endpoint = {
  path: "/cj-dropshipping/order",
  method: "get",
  handler: withGuard(async (req: PayloadRequest) => {
    try {
      const id = new URL(req.url || "", "http://localhost").searchParams.get("id") || "";
      const refresh = new URL(req.url || "", "http://localhost").searchParams.get("refresh") === "1";
      const { order, customer } = await loadOrder(req.payload, id);
      const { lines, otherItems } = await getCJLines(req.payload, order);
      if (lines.length === 0) return Response.json({ isDropship: false });

      let cjOrder: CJOrderState = order.cjOrder || {};
      const sent = Boolean(cjOrder.orderId) && cjOrder.status !== "CANCELLED";

      if (sent) {
        let orderChanged = false;
        if (refresh && !CJ_FINAL_STATUSES.includes(cjOrder.status || "")) {
          try {
            const synced = await syncOrder(req.payload, order, customer);
            cjOrder = synced.state;
            orderChanged = synced.changed;
          } catch (err: any) {
            cjOrder = { ...cjOrder, error: err.message };
          }
        }
        const balance = cjOrder.paid ? null : await CJClient.getBalance().catch(() => null);
        return Response.json({ isDropship: true, sent, lines, otherItems, cjOrder, balance, orderChanged });
      }

      const address = await mapAddress(req.payload, order);
      const risks = await riskChecks(req.payload, order, customer);
      await resolveVids(lines);

      // Ship from the destination country when every item is stocked there (US → US is free with USPS)
      const dest = address.fields.shippingCountryCode || "US";
      let fromCountryCode = "CN";
      const stock = await Promise.all([...new Set(lines.map((l) => l.pid))].map((pid) => CJClient.getStockCountries(pid).catch(() => [])));
      if (stock.length && stock.every((countries) => countries.some((c) => c.countryCode === dest))) fromCountryCode = dest;
      else if (stock[0]?.[0]) fromCountryCode = stock[0][0].countryCode;

      let shipping: any[] = [];
      let shippingError = "";
      const withVid = lines.filter((l) => l.vid);
      if (withVid.length === lines.length) {
        try {
          const raw = await CJClient.calculateFreightForItems(fromCountryCode, dest, withVid.map((l) => ({ vid: l.vid!, quantity: l.quantity })));
          shipping = raw
            .map((o: any) => ({ name: o.logisticName, price: Number(o.logisticPrice ?? 0), aging: o.logisticAging || "" }))
            .filter((o) => o.name && Number.isFinite(o.price))
            .sort((a, b) => a.price - b.price);
        } catch (err: any) {
          shippingError = err.message;
        }
      } else {
        shippingError = "Some items could not be matched to a CJ variant";
      }

      const balance = await CJClient.getBalance().catch(() => null);
      return Response.json({
        isDropship: true,
        sent: false,
        lines,
        otherItems,
        cjOrder,
        address,
        risks,
        fromCountryCode,
        shipping,
        shippingError,
        balance,
        paid: PAID_STATUSES.includes(order.status),
      });
    } catch (err: any) {
      return Response.json({ error: err.message || "Failed to load CJ order info" }, { status: 400 });
    }
  }),
};

const sendOrder: Endpoint = {
  path: "/cj-dropshipping/order/send",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    const { id, logisticName, fromCountryCode, pay } = await readBody(req);
    try {
      const { order, customer } = await loadOrder(req.payload, id);
      const previous: CJOrderState = order.cjOrder || {};
      if (previous.orderId && previous.status !== "CANCELLED") throw new Error("This order was already sent to CJ.");
      if (!PAID_STATUSES.includes(order.status)) throw new Error(`Order is "${order.status}". Only paid orders can be sent to CJ.`);
      if (!logisticName) throw new Error("Choose a shipping method.");

      const { lines } = await getCJLines(req.payload, order);
      if (lines.length === 0) throw new Error("This order has no CJ products.");
      await resolveVids(lines);
      const unmatched = lines.filter((l) => !l.vid && !l.sku);
      if (unmatched.length) throw new Error(`No CJ variant for: ${unmatched.map((l) => l.name).join(", ")}`);

      const address = await mapAddress(req.payload, order);
      if (address.missing.length) throw new Error(`Shipping address is missing: ${address.missing.join(", ")}`);

      const attempts = (previous.attempts || 0) + 1;
      const orderNumber = attempts > 1 ? `${order.orderId}-${attempts}` : String(order.orderId || order.id);
      const created = await CJClient.createOrder({
        orderNumber,
        ...address.fields,
        email: customer?.email || undefined,
        logisticName,
        fromCountryCode: fromCountryCode || "CN",
        platform: "Api",
        // Test orders go to CJ's sandbox: real order flow, simulated payment
        ...(order.isTest ? { isSandbox: 1 } : {}),
        storeOrderTime: order.createdAt,
        products: lines.map((l) => ({
          ...(l.vid ? { vid: l.vid } : {}),
          sku: l.sku,
          quantity: l.quantity,
          storeProductName: l.name,
        })),
      });

      const state: CJOrderState = {
        orderId: created?.orderId,
        shipmentOrderId: created?.shipmentOrderId || undefined,
        orderNumber,
        status: created?.orderStatus || "CREATED",
        orderAmount: created?.orderAmount != null ? Number(created.orderAmount) : undefined,
        productAmount: created?.productAmount != null ? Number(created.productAmount) : undefined,
        postageAmount: created?.postageAmount != null ? Number(created.postageAmount) : undefined,
        logisticName,
        fromCountryCode,
        paid: false,
        attempts,
        sentAt: new Date().toISOString(),
      };
      if (!state.orderId) throw new Error("CJ did not return an order id.");
      await saveState(req.payload, order.id, state);

      let payError = "";
      if (pay) {
        try {
          await CJClient.payOrder({ orderId: state.orderId, shipmentOrderId: state.shipmentOrderId });
          state.paid = true;
        } catch (err: any) {
          payError = err.message;
          state.error = `Created on CJ, but payment failed: ${err.message}`;
        }
        await saveState(req.payload, order.id, state);
      }

      let finalState = state;
      try {
        finalState = (await syncOrder(req.payload, { ...order, cjOrder: state }, customer)).state;
      } catch {
        // Status refresh is best effort; the order exists on CJ either way
      }
      return Response.json({ success: true, cjOrder: finalState, payError });
    } catch (err: any) {
      return Response.json({ error: err.message || "Failed to send the order to CJ" }, { status: 400 });
    }
  }),
};

const payOrder: Endpoint = {
  path: "/cj-dropshipping/order/pay",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    const { id } = await readBody(req);
    try {
      const { order, customer } = await loadOrder(req.payload, id);
      const state: CJOrderState = { ...(order.cjOrder || {}) };
      if (!state.orderId) throw new Error("This order has not been sent to CJ.");
      await CJClient.payOrder({ orderId: state.orderId, shipmentOrderId: state.shipmentOrderId });
      state.paid = true;
      state.error = undefined;
      await saveState(req.payload, order.id, state);
      const synced = await syncOrder(req.payload, { ...order, cjOrder: state }, customer).catch(() => ({ state, changed: false }));
      return Response.json({ success: true, cjOrder: synced.state });
    } catch (err: any) {
      return Response.json({ error: err.message || "Payment failed" }, { status: 400 });
    }
  }),
};

const cancelOrder: Endpoint = {
  path: "/cj-dropshipping/order/cancel",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    const { id } = await readBody(req);
    try {
      const { order } = await loadOrder(req.payload, id);
      const state: CJOrderState = { ...(order.cjOrder || {}) };
      if (!state.orderId) throw new Error("This order has not been sent to CJ.");
      await CJClient.deleteOrder(state.orderId);
      const next: CJOrderState = { attempts: state.attempts, status: "CANCELLED", orderNumber: state.orderNumber };
      await saveState(req.payload, order.id, next);
      return Response.json({ success: true, cjOrder: next });
    } catch (err: any) {
      return Response.json(
        { error: `${err.message || "Cancel failed"}. Paid CJ orders can only be cancelled from the CJ dashboard (My Orders), which refunds your CJ wallet.` },
        { status: 400 },
      );
    }
  }),
};

/** Refresh every open CJ order (tracking, status). Safe to call from a cron or a button. */
const syncAll: Endpoint = {
  path: "/cj-dropshipping/order/sync-all",
  method: "post",
  handler: withGuard(async (req: PayloadRequest) => {
    const open = await req.payload.find({
      collection: "orders",
      where: { and: [{ "cjOrder.orderId": { exists: true } }, { "cjOrder.status": { not_in: CJ_FINAL_STATUSES } }] },
      depth: 0,
      limit: 200,
      pagination: false,
    });
    let updated = 0;
    const errors: string[] = [];
    for (const order of open.docs as any[]) {
      try {
        const { customer } = await loadOrder(req.payload, order.id);
        await syncOrder(req.payload, order, customer);
        updated++;
      } catch (err: any) {
        errors.push(`${order.orderId}: ${err.message}`);
      }
    }
    return Response.json({ success: true, checked: open.docs.length, updated, errors });
  }),
};

export const cjOrderEndpoints: Endpoint[] = [getInfo, sendOrder, payOrder, cancelOrder, syncAll];
