import { Integrations } from "@/payload-types";
import { CollectionAfterChangeHook, Payload } from "payload";

const PAID_STATUSES = ["processing", "completed", "shipped"];

async function postToN8N(payload: Payload, event: "order.paid" | "order.deleted", body: Record<string, unknown>) {
  const integrations: Integrations = await payload.findGlobal({ slug: "integrations" });
  if (!integrations?.enabled || !integrations.webhookUrl) return;

  try {
    const response = await fetch(integrations.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${integrations.secretToken}`,
        "X-Amerta-Environment": integrations.environment || "production",
        "X-Amerta-Event": event,
      },
      body: JSON.stringify({ ...body, _event: event }),
    });

    if (!response.ok) {
      payload.logger.error(`❌ n8n Webhook (${event}) failed for Order #${body.id}: ${response.statusText}`);
    }
  } catch (error) {
    payload.logger.error(error);
  }
}

/**
 * Sends the order to n8n once, when it becomes paid (processing / completed / shipped).
 * Previously this checked for a "paid" status, which does not exist, so it never fired.
 */
export const sendToN8N: CollectionAfterChangeHook = async ({ doc, previousDoc, context, req: { payload } }) => {
  if (context?.inventoryAdjustment) return doc;

  const becamePaid = PAID_STATUSES.includes(doc.status) && !PAID_STATUSES.includes(previousDoc?.status);
  if (becamePaid) {
    await postToN8N(payload, "order.paid", doc);
  }

  return doc;
};

/** Notifies n8n that an order was deleted (so automations can undo what they did). */
export async function sendOrderDeletedToN8N(doc: Record<string, unknown>, payload: Payload) {
  await postToN8N(payload, "order.deleted", doc);
}
