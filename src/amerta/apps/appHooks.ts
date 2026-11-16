import { CollectionAfterChangeHook, CollectionAfterDeleteHook, Payload } from "payload";
import { availableApps } from "./index";
import { adjustOrderStock } from "@/amerta/core/utilities/is-in-stock";
import { sendOrderDeletedToN8N } from "@/amerta/collections/Orders/hooks/sendToN8N";

const PAID_STATUSES = ["processing", "completed", "shipped"];
const CANCELLED_STATUSES = ["cancelled", "refunded"];

/**
 * Counts (direction 1) or gives back (-1) one use of the order's offers (cart rules) and coupon,
 * so their usage limits work. Runs together with the stock adjustment, so it happens once per paid order.
 */
async function adjustOfferUsage(doc: any, direction: 1 | -1, payload: Payload, req: any) {
  const ruleIds = (doc.appliedRules || []).map((r: any) => (typeof r === "object" ? r.id : r)).filter(Boolean);
  for (const id of ruleIds) {
    const rule = await payload.findByID({ collection: "cart-rules", id, depth: 0, req }).catch(() => null);
    if (rule) await payload.update({ collection: "cart-rules", id, data: { timesUsed: Math.max(0, (rule.timesUsed || 0) + direction) }, req });
  }
  if (doc.couponCode) {
    const coupons = await payload.find({ collection: "coupons", where: { code: { equals: doc.couponCode } }, limit: 1, depth: 0, req });
    const coupon = coupons.docs[0];
    if (coupon) await payload.update({ collection: "coupons", id: coupon.id, data: { timesUsed: Math.max(0, (coupon.timesUsed || 0) + direction) }, req });
  }
}

/**
 * Helper to fetch active apps from the apps global
 */
export async function getActiveAppSlugs(payload: Payload): Promise<string[]> {
  try {
    const appsGlobal = await payload.findGlobal({
      slug: "apps",
      depth: 0,
    });
    return (appsGlobal?.activeApps as string[]) || [];
  } catch (err) {
    console.warn("[AppHooks] Failed to fetch active apps:", err);
    return [];
  }
}

/**
 * Universal Order Hook for Payload CMS
 * Attached to Orders.hooks.afterChange: dynamically checks active apps
 * and triggers their lifecycle hooks.
 */
export const processAppOrderHooks: CollectionAfterChangeHook = async ({
  doc, // current order
  previousDoc, // order before update
  operation, // 'create' | 'update'
  req,
  context,
}) => {
  const { payload } = req;
  // Internal bookkeeping writes (e.g. setting stockReduced) must not re-trigger lifecycle events
  if (context?.inventoryAdjustment) return doc;

  // Inventory (core, independent of apps): reduce once when the order becomes paid,
  // restore when it is cancelled/refunded. `stockReduced` makes both idempotent.
  try {
    const isPaid = PAID_STATUSES.includes(doc.status);
    const isCancelled = CANCELLED_STATUSES.includes(doc.status);
    if (isPaid && !doc.stockReduced) {
      await adjustOrderStock(doc, -1, payload, req);
      await adjustOfferUsage(doc, 1, payload, req).catch((err) => console.error("[AppHooks] Offer usage count failed:", err));
      await payload.update({ collection: "orders", id: doc.id, data: { stockReduced: true }, req, context: { inventoryAdjustment: true } });
      doc.stockReduced = true;
    } else if (isCancelled && doc.stockReduced) {
      await adjustOrderStock(doc, 1, payload, req);
      await adjustOfferUsage(doc, -1, payload, req).catch((err) => console.error("[AppHooks] Offer usage count failed:", err));
      await payload.update({ collection: "orders", id: doc.id, data: { stockReduced: false }, req, context: { inventoryAdjustment: true } });
      doc.stockReduced = false;
    }
  } catch (err) {
    console.error("[AppHooks] Inventory adjustment failed:", err);
  }

  try {
    const activeAppSlugs = await getActiveAppSlugs(payload);
    if (!activeAppSlugs || activeAppSlugs.length === 0) {
      return doc;
    }

    const activeApps = availableApps.filter((app) =>
      activeAppSlugs.includes(app.slug)
    );

    // 1. Order Paid Event:
    // Either newly created as 'processing' / 'completed', or transitioned from another status
    const isPaidStatus =
      doc.status === "processing" ||
      doc.status === "completed" ||
      doc.status === "shipped";

    const wasPaidStatus =
      previousDoc?.status === "processing" ||
      previousDoc?.status === "completed" ||
      previousDoc?.status === "shipped";

    const becamePaid = isPaidStatus && !wasPaidStatus;
    const isInitialPaid = operation === "create" && isPaidStatus;

    if (becamePaid || isInitialPaid) {
      for (const app of activeApps) {
        if (app.hooks?.onOrderPaid) {
          try {
            await app.hooks.onOrderPaid(doc, previousDoc, payload);
          } catch (appErr) {
            console.error(`[AppHooks] Error in ${app.slug}.onOrderPaid:`, appErr);
          }
        }
      }
    }

    // 2. Order Cancelled / Refunded Event:
    const isCancelledStatus =
      doc.status === "cancelled" || doc.status === "refunded";
    const wasCancelledStatus =
      previousDoc?.status === "cancelled" || previousDoc?.status === "refunded";

    const becameCancelled = isCancelledStatus && !wasCancelledStatus;

    if (becameCancelled) {
      for (const app of activeApps) {
        if (app.hooks?.onOrderCancelled) {
          try {
            await app.hooks.onOrderCancelled(doc, previousDoc, payload);
          } catch (appErr) {
            console.error(
              `[AppHooks] Error in ${app.slug}.onOrderCancelled:`,
              appErr
            );
          }
        }
      }
    }

    // 3. Order Created Event:
    if (operation === "create") {
      for (const app of activeApps) {
        if (app.hooks?.onOrderCreated) {
          try {
            await app.hooks.onOrderCreated(doc, payload);
          } catch (appErr) {
            console.error(
              `[AppHooks] Error in ${app.slug}.onOrderCreated:`,
              appErr
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("[AppHooks] Error processing app order hooks:", err);
  }

  return doc;
};

/**
 * Order deleted: revert everything the order did, as if it had been cancelled.
 * - Apps get onOrderCancelled (e.g. loyalty points clawback) if the order was paid and not already cancelled
 * - Stock is restored if it had been reduced
 * - n8n is notified with event "order.deleted"
 */
export const processAppOrderDeleted: CollectionAfterDeleteHook = async ({ doc, req }) => {
  const { payload } = req;

  if (doc.stockReduced) {
    try {
      await adjustOrderStock(doc, 1, payload, req);
      await adjustOfferUsage(doc, -1, payload, req);
    } catch (err) {
      console.error("[AppHooks] Stock restore on delete failed:", err);
    }
  }

  if (!CANCELLED_STATUSES.includes(doc.status)) {
    try {
      const activeAppSlugs = await getActiveAppSlugs(payload);
      const activeApps = availableApps.filter((app) => activeAppSlugs.includes(app.slug));
      for (const app of activeApps) {
        if (app.hooks?.onOrderCancelled) {
          try {
            await app.hooks.onOrderCancelled(doc, doc, payload);
          } catch (appErr) {
            console.error(`[AppHooks] Error in ${app.slug}.onOrderCancelled (delete):`, appErr);
          }
        }
      }
    } catch (err) {
      console.error("[AppHooks] Error processing order delete:", err);
    }
  }

  await sendOrderDeletedToN8N(doc, payload);
  return doc;
};

/**
 * Universal Customer Hook for Payload CMS
 * Attached to Customers.hooks.afterChange
 */
export const processAppCustomerHooks: CollectionAfterChangeHook = async ({
  doc,
  operation,
  req: { payload },
}) => {
  try {
    if (operation === "create") {
      const activeAppSlugs = await getActiveAppSlugs(payload);
      const activeApps = availableApps.filter((app) =>
        activeAppSlugs.includes(app.slug)
      );

      for (const app of activeApps) {
        if (app.hooks?.onCustomerCreated) {
          try {
            await app.hooks.onCustomerCreated(doc, payload);
          } catch (appErr) {
            console.error(
              `[AppHooks] Error in ${app.slug}.onCustomerCreated:`,
              appErr
            );
          }
        }
      }
    }
  } catch (err) {
    console.error("[AppHooks] Error processing app customer hooks:", err);
  }

  return doc;
};
