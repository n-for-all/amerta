import { Integrations } from "@/payload-types";
import { CollectionAfterChangeHook } from "payload";

export const sendToN8N: CollectionAfterChangeHook = async ({
  doc, // The updated order
  previousDoc, // The order before the update
  req: { payload },
}) => {
  const integrations: Integrations = await payload.findGlobal({
    slug: "integrations",
  });

  const isAutomationEnabled = integrations?.enabled;
  const statusChangedToPaid = doc.status === "paid" && previousDoc.status !== "paid";

  if (isAutomationEnabled && statusChangedToPaid && integrations.webhookUrl) {
    try {
      const response = await fetch(integrations.webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${integrations.secretToken}`,
          "X-Amerta-Environment": integrations.environment || "production",
        },
        body: JSON.stringify(doc),
      });

      if (!response.ok) {
        payload.logger.error(`❌ n8n Webhook failed for Order #${doc.id}: ${response.statusText}`);
      }
    } catch (error) {
      payload.logger.error(error);
    }
  }

  return doc;
};
