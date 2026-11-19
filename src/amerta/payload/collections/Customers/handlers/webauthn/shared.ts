import { Config, PayloadRequest } from "payload";
import jwt from "jsonwebtoken";
import { parse } from "cookie";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";

export const PASSKEY_CHALLENGE_COOKIE = "amerta-passkey-challenge";

export async function getPasskeySettings(): Promise<any | null> {
  const settings: any = await getCachedGlobal("settings" as keyof Config["globals"], 1)();
  return settings?.webauthnSettings?.enabled ? settings.webauthnSettings : null;
}

export const json = (body: any, status = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json", ...headers } });

export function expectedOrigin(req: PayloadRequest) {
  const env = process.env.NEXT_PUBLIC_SERVER_URL;
  if (env) return env.replace(/\/$/, "");
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (req.url?.startsWith("https") ? "https" : "http");
  return host ? `${proto}://${host}` : "";
}

export function rpIdFor(req: PayloadRequest, settings: any) {
  if (settings?.rpID) return settings.rpID as string;
  if (process.env.WEBAUTHN_RP_ID) return process.env.WEBAUTHN_RP_ID;
  // The host the shopper is on, without port (passkeys are tied to it)
  const origin = expectedOrigin(req);
  try {
    return new URL(origin).hostname;
  } catch {
    return "localhost";
  }
}

// Sign-in challenges live in a short-lived signed cookie, so a passkey can sign in without typing an email
export function challengeCookie(challenge: string, secret: string, ttlSeconds: number) {
  const token = jwt.sign({ challenge }, secret, { expiresIn: ttlSeconds });
  const parts = [`${PASSKEY_CHALLENGE_COOKIE}=${token}`, "Path=/api/customers/webauthn", "HttpOnly", "SameSite=Strict", `Max-Age=${ttlSeconds}`];
  if (process.env.NODE_ENV === "production") parts.push("Secure");
  return parts.join("; ");
}

export const clearChallengeCookie = () => `${PASSKEY_CHALLENGE_COOKIE}=; Path=/api/customers/webauthn; HttpOnly; SameSite=Strict; Max-Age=0`;

export function readChallenge(req: PayloadRequest, secret: string): string | null {
  const token = parse(req.headers.get("cookie") || "")[PASSKEY_CHALLENGE_COOKIE];
  if (!token) return null;
  try {
    return (jwt.verify(token, secret) as { challenge: string }).challenge || null;
  } catch {
    return null;
  }
}
