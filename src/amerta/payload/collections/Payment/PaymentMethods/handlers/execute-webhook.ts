import { getPaymentAdapter } from "@/amerta/payments";
import { PayloadRequest } from "payload";

export const executeWebhook = async (req: PayloadRequest) => {
  const { name } = req.routeParams as { name?: string };

  if (!name) {
    return new Response("Missing provider name", { status: 400 });
  }

  const adapter = getPaymentAdapter(name);

  if (!adapter) {
    return new Response(`Payment adapter '${name}' not found`, { status: 404 });
  }

  if(!adapter.handleWebhook) {
    return new Response(`Webhook handler not implemented for '${name}'`, { status: 501 });
  }
  console.log(`Executing webhook for payment adapter: ${name}`);

  try {
    return await adapter.handleWebhook(req);
  } catch (error: any) {
    console.error(`Webhook Error [${name}]:`, error);
    return new Response("Internal Webhook Error", { status: 500 });
  }
};
