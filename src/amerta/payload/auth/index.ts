import { AppleProvider } from "./providers/apple";
import { FacebookProvider } from "./providers/facebook";
import { GoogleProvider } from "./providers/google";
import { WebAuthnProvider } from "./providers/webauthn";

export const AUTH_PROVIDERS = [
  GoogleProvider,
  AppleProvider,
  FacebookProvider,
  WebAuthnProvider,
]; // All authentication providers

export function getAuthProvider(slug: string) {
  return AUTH_PROVIDERS.find((a) => a.slug === slug);
}
