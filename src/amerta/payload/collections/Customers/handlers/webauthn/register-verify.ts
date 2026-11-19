import { PayloadRequest } from "payload";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { expectedOrigin, getPasskeySettings, json, rpIdFor } from "./shared";

// Finish adding a passkey to the signed-in customer's account
export default async function registerVerifyHandler(req: PayloadRequest) {
  const settings = await getPasskeySettings();
  if (!settings) return json({ message: "Passkeys are not enabled" }, 404);
  if (!req.user || (req.user as any).collection !== "customers") return json({ message: "Log in to add a passkey" }, 401);

  const { payload } = req;
  const body = req.json ? await req.json().catch(() => ({})) : {};
  const attestationResponse = body?.attestationResponse;
  if (!attestationResponse) return json({ message: "Missing parameters" }, 400);

  const user: any = await payload.findByID({ collection: "customers", id: req.user.id, depth: 0 });
  const expectedChallenge = user?.webauthnRegistrationChallenge;
  if (!expectedChallenge) return json({ message: "No passkey setup in progress, please try again" }, 400);

  const clearChallenge = () =>
    payload.update({ collection: "customers", id: user.id, data: { webauthnRegistrationChallenge: null, webauthnRegistrationChallengeCreatedAt: null }, depth: 0 });

  const ttlMs = (Number(settings.challengeTTLSeconds) || 300) * 1000;
  if (user.webauthnRegistrationChallengeCreatedAt && Date.now() - new Date(user.webauthnRegistrationChallengeCreatedAt).getTime() > ttlMs) {
    await clearChallenge();
    return json({ message: "Passkey setup timed out, please try again" }, 400);
  }

  try {
    const verification = await verifyRegistrationResponse({
      response: attestationResponse,
      expectedChallenge,
      expectedOrigin: expectedOrigin(req),
      expectedRPID: rpIdFor(req, settings),
      requireUserVerification: settings.userVerification === "required",
    });
    if (!verification.verified || !verification.registrationInfo) return json({ message: "Passkey could not be verified" }, 400);

    const { credential } = verification.registrationInfo;
    const name = typeof body.name === "string" && body.name.trim() ? body.name.trim().slice(0, 60) : "Passkey";

    await payload.update({
      collection: "customers",
      id: user.id,
      data: {
        passkeys: [
          ...(user.passkeys || []),
          {
            credentialID: credential.id, // already base64url
            publicKey: Buffer.from(credential.publicKey).toString("base64url"),
            counter: credential.counter,
            transports: credential.transports || attestationResponse.response?.transports || [],
            name,
            createdAt: new Date().toISOString(),
          },
        ],
        webauthnRegistrationChallenge: null,
        webauthnRegistrationChallengeCreatedAt: null,
      },
      depth: 0,
    });

    return json({ success: true });
  } catch (e: any) {
    console.error("Passkey registration error", e);
    await clearChallenge().catch(() => {});
    return json({ message: "Passkey could not be verified" }, 400);
  }
}
