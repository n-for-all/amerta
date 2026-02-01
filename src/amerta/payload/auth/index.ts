import { AppleProvider } from "./providers/apple";
import { FacebookProvider } from "./providers/facebook";
import { GoogleProvider } from "./providers/google";

export const AUTH_PROVIDERS = [GoogleProvider, AppleProvider, FacebookProvider]; // Add more here

export function getAuthProvider(slug: string) {
  return AUTH_PROVIDERS.find((a) => a.slug === slug);
}
