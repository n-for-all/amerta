import { Payload } from "payload";

const CATALOG_URL = "https://catalog.shopify.com/api/ucp/mcp";
const TOKEN_URL = "https://api.shopify.com/auth/access_token";
// Shopify's hosted example profile; it declares the catalog search and lookup capabilities
export const DEFAULT_AGENT_PROFILE = "https://shopify.dev/ucp/agent-profiles/examples/2026-08-25/valid-with-capabilities.json";

export type ShopifyCatalogSettings = {
  clientId?: string;
  clientSecret?: string;
  catalogId?: string;
  agentProfileUrl?: string;
  country?: string;
  currency?: string;
};

export async function getCatalogSettings(payload: Payload): Promise<ShopifyCatalogSettings> {
  const apps: any = await payload.findGlobal({ slug: "apps", depth: 0 });
  return apps?.appSettings?.["shopify-catalog"] || {};
}

// Tokens last 60 minutes; keep one per client id and renew a minute early
const tokens = new Map<string, { token: string; expiresAt: number }>();

async function getToken(settings: ShopifyCatalogSettings): Promise<string | null> {
  if (!settings.clientId || !settings.clientSecret) return null;
  const cached = tokens.get(settings.clientId);
  if (cached && cached.expiresAt > Date.now() + 60_000) return cached.token;

  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: settings.clientId, client_secret: settings.clientSecret, grant_type: "client_credentials" }),
  });
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok || !data.access_token) {
    throw new Error(`Shopify token request failed (${res.status}): ${data.error_description || data.error || "check the Client ID and secret"}`);
  }
  tokens.set(settings.clientId, { token: data.access_token, expiresAt: Date.now() + (Number(data.expires_in) || 3600) * 1000 });
  return data.access_token;
}

export async function callCatalog(settings: ShopifyCatalogSettings, tool: string, catalog: Record<string, any>) {
  const token = await getToken(settings);
  const res = await fetch(CATALOG_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(token && { Authorization: `Bearer ${token}` }) },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: Date.now(),
      method: "tools/call",
      params: {
        name: tool,
        arguments: { meta: { "ucp-agent": { profile: settings.agentProfileUrl || DEFAULT_AGENT_PROFILE } }, catalog },
      },
    }),
  });

  if (res.status === 429) {
    throw new Error(`Shopify rate limit reached, try again in ${res.headers.get("retry-after") || "a few"} seconds.`);
  }
  const data: any = await res.json().catch(() => null);
  if (!res.ok || !data) throw new Error(`Shopify Catalog returned ${res.status}`);
  if (data.error) throw new Error(data.error.message || "Shopify Catalog error");

  const result = data.result?.structuredContent || data.result || {};
  return { ...result, authenticated: Boolean(token) };
}
