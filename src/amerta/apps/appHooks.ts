import { CollectionAfterChangeHook, Payload } from "payload";
import { availableApps } from "./index";

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
  req: { payload },
}) => {
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
