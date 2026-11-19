import { PayloadRequest } from "payload";
import { generateRegistrationOptions } from "@simplewebauthn/server";
import { getPasskeySettings, json, rpIdFor } from "./shared";

// Start adding a passkey to the signed-in customer's account
export default async function registerOptionsHandler(req: PayloadRequest) {
  const settings = await getPasskeySettings();
  if (!settings) return json({ message: "Passkeys are not enabled" }, 404);
  if (!req.user || (req.user as any).collection !== "customers") return json({ message: "Log in to add a passkey" }, 401);

  const { payload } = req;
  const user: any = await payload.findByID({ collection: "customers", id: req.user.id, depth: 0 });
  if (!user) return json({ message: "User not found" }, 404);

  const options = await generateRegistrationOptions({
    rpName: settings.rpName || process.env.WEBAUTHN_RP_NAME || "Amerta",
    rpID: rpIdFor(req, settings),
    userID: Buffer.from(String(user.id)),
    userName: user.email || String(user.id),
    userDisplayName: [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email || "",
    timeout: 60000,
    attestationType: settings.attestationType || "none",
    authenticatorSelection: {
      // Saved on the device so the shopper can sign in without typing their email
      residentKey: "preferred",
      userVerification: settings.userVerification || "preferred",
    },
    excludeCredentials: (user.passkeys || []).map((cred: any) => ({ id: cred.credentialID, transports: cred.transports || undefined })),
  });

  await payload.update({
    collection: "customers",
    id: user.id,
    data: { webauthnRegistrationChallenge: options.challenge, webauthnRegistrationChallengeCreatedAt: new Date().toISOString() },
    depth: 0,
  });

  return json(options);
}
