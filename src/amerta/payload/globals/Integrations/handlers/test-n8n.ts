import { Integrations } from "@/payload-types";

export const testN8N = async (req) => {
  const { orderId } = await req.json!();
  const settings: Integrations = await req.payload.findGlobal({ slug: "integrations" });

  if (!settings.enabled || !settings.webhookUrl) {
    return Response.json({ error: "n8n is disabled or URL is missing" }, { status: 400 });
  }

  const order = await req.payload.findByID({
    collection: "orders",
    id: orderId,
    depth: 2,
  });

  try {
    const response = await fetch(settings.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${settings.secretToken}`,
      },
      body: JSON.stringify({ ...order, _isTest: true }),
    });
    return Response.json({ success: response.ok, output: await response.text() });
  } catch (e: any) {
    console.error("Error sending to n8n:", e);
    return Response.json({ error: "Failed to send to n8n: " + e.message }, { status: 500 });
  }
};
