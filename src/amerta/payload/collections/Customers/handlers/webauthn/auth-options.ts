import { PayloadRequest } from "payload";
import { generateAuthenticationOptions } from "@simplewebauthn/server";
import { challengeCookie, getPasskeySettings, json, rpIdFor } from "./shared";

// Start a passkey sign-in. Without an email the browser offers every passkey saved for this site;
// with one, only that customer's. Unknown emails get the same answer, so this can't be used to probe accounts.
export default async function authOptionsHandler(req: PayloadRequest) {
  const settings = await getPasskeySettings();
  if (!settings) return json({ message: "Passkeys are not enabled" }, 404);

  const { payload } = req;
  const body = req.json ? await req.json().catch(() => ({})) : {};
  const email = typeof body?.email === "string" ? body.email.trim().toLowerCase() : "";

  let allowCredentials: { id: string; transports?: any }[] = [];
  if (email) {
    const found = await payload.find({ collection: "customers", where: { email: { equals: email } }, limit: 1, depth: 0 });
    allowCredentials = (found.docs[0]?.passkeys || []).map((cred: any) => ({ id: cred.credentialID, transports: cred.transports || undefined }));
  }

  const options = await generateAuthenticationOptions({
    rpID: rpIdFor(req, settings),
    timeout: 60000,
    allowCredentials,
    userVerification: settings.userVerification || "preferred",
  });

  const ttl = Number(settings.challengeTTLSeconds) || 300;
  return json(options, 200, { "Set-Cookie": challengeCookie(options.challenge, payload.secret, ttl) });
}
