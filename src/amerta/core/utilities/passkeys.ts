"use client";

import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";

export const passkeysSupported = () => typeof window !== "undefined" && browserSupportsWebAuthn();

/** Thrown when the shopper closes the passkey prompt; callers usually ignore it */
export class PasskeyCancelled extends Error {}

const rethrow = (e: any): never => {
  if (e?.name === "NotAllowedError" || e?.name === "AbortError") throw new PasskeyCancelled("cancelled");
  if (e?.name === "InvalidStateError") throw new Error("This device already has a passkey for your account.");
  throw e instanceof Error ? e : new Error(String(e));
};

async function post(path: string, body: any = {}) {
  const res = await fetch(`/api/customers/webauthn/${path}`, {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Something went wrong, please try again.");
  return data;
}

/** Signs in with a passkey saved on this device (no email needed). Sets the session cookie. */
export async function signInWithPasskey(email?: string) {
  const optionsJSON = await post("authenticate/options", email ? { email } : {});
  const assertionResponse = await startAuthentication({ optionsJSON }).catch(rethrow);
  return post("authenticate/verify", { assertionResponse });
}

/** Adds a passkey on this device to the signed-in customer's account */
export async function addPasskey(name = deviceName()) {
  const optionsJSON = await post("register/options");
  const attestationResponse = await startRegistration({ optionsJSON }).catch(rethrow);
  return post("register/verify", { attestationResponse, name });
}

/** A readable label for the passkey, e.g. "iPhone · Safari" */
export function deviceName() {
  if (typeof navigator === "undefined") return "Passkey";
  const ua = navigator.userAgent;
  const device = /iPhone/.test(ua) ? "iPhone" : /iPad/.test(ua) ? "iPad" : /Android/.test(ua) ? "Android" : /Mac OS X/.test(ua) ? "Mac" : /Windows/.test(ua) ? "Windows" : /Linux/.test(ua) ? "Linux" : "Device";
  const browser = /Edg\//.test(ua) ? "Edge" : /OPR\//.test(ua) ? "Opera" : /Firefox\//.test(ua) ? "Firefox" : /Chrome\//.test(ua) ? "Chrome" : /Safari\//.test(ua) ? "Safari" : "";
  return browser ? `${device} · ${browser}` : device;
}
