import { PayloadRequest } from "payload";
import { verifyRegistrationResponse } from "@simplewebauthn/server";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import { Config } from "payload";
import { Settings } from "@/payload-types";

function deriveOriginFromRequest(req: PayloadRequest) {
  const proto = req.headers.get("x-forwarded-proto") || undefined;
  const host =
    req.headers.get("x-forwarded-host") || req.headers.get("host") || undefined;
  if (!host) return null;
  const scheme =
    proto || (req.url && req.url.startsWith("https") ? "https" : "http");
  return `${scheme}://${host}`;
}

function deriveRpIdFromHost(host?: string) {
  if (!host) return undefined;
  if (/^localhost(:|$)/i.test(host) || /^\d+\.\d+\.\d+\.\d+/.test(host))
    return host.split(":")[0];
  const parts = host.split(".");
  if (parts.length >= 2) return parts.slice(-2).join(".");
  return host;
}

export default async function registerVerifyHandler(req: PayloadRequest) {
  const { payload } = req;
  const body = req.json ? await req.json() : {};

  const { id: userIdFromBody, attestationResponse } = body || {};

  // Find user via req.user or id in body
  let user = null;
  if (req.user && req.user.id) {
    user = await payload.findByID({ collection: "customers", id: req.user.id });
  } else if (userIdFromBody) {
    user = await payload.findByID({
      collection: "customers",
      id: userIdFromBody,
    });
  }

  if (!user) {
    return new Response(JSON.stringify({ message: "User not found" }), {
      status: 404,
    });
  }

  // provider settings
  const authSettings: Settings = await getCachedGlobal(
    "settings" as keyof Config["globals"],
    1,
  )();
  const providerSettings = authSettings?.webauthnSettings || null;

  const envOrigin = process.env.NEXT_PUBLIC_SERVER_URL;
  const derivedOrigin = deriveOriginFromRequest(req);
  const expectedOrigin = envOrigin || derivedOrigin || "";

  let expectedRPID = providerSettings?.rpID || process.env.WEBAUTHN_RP_ID;
  if (!expectedRPID) {
    const host =
      req.headers.get("x-forwarded-host") ||
      req.headers.get("host") ||
      (envOrigin ? new URL(envOrigin).host : undefined);
    expectedRPID = deriveRpIdFromHost(host || undefined) || undefined;
  }

  const expectedChallenge = user.webauthnRegistrationChallenge;
  if (!expectedChallenge) {
    return new Response(
      JSON.stringify({ message: "No registration challenge found" }),
      { status: 400 },
    );
  }

  // Challenge TTL check
  try {
    const createdAt = user.webauthnRegistrationChallengeCreatedAt;
    if (createdAt) {
      const ageMs = Date.now() - new Date(createdAt).getTime();
      const ttlSeconds = providerSettings?.challengeTTLSeconds ?? 300;
      const TTL_MS = Number(ttlSeconds) * 1000;
      if (ageMs > TTL_MS) {
        // Optionally clear the expired challenge
        try {
          await payload.update({
            collection: "customers",
            id: user.id,
            data: {
              webauthnRegistrationChallenge: null,
              webauthnRegistrationChallengeCreatedAt: null,
            },
            disableCollectionOperations: true,
          });
        } catch (e) {
          console.warn("Failed to clear expired registration challenge", e);
        }

        return new Response(
          JSON.stringify({ message: "Registration challenge expired" }),
          { status: 400 },
        );
      }
    }
  } catch (e) {
    console.warn("Error while checking registration challenge TTL", e);
  }

  try {
    const verification = await verifyRegistrationResponse({
      credential: attestationResponse,
      expectedChallenge: expectedChallenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: expectedRPID,
    });

    if (!verification.verified) {
      return new Response(
        JSON.stringify({ message: "Registration verification failed" }),
        { status: 400 },
      );
    }

    const { registrationInfo } = verification;
    if (!registrationInfo) {
      return new Response(
        JSON.stringify({ message: "Missing registration info" }),
        { status: 500 },
      );
    }

    // Build credential record
    const credential = {
      credentialID: Buffer.from(registrationInfo.credentialID).toString(
        "base64url",
      ),
      publicKey: registrationInfo.credentialPublicKey.toString("base64url"),
      counter: registrationInfo.counter,
      transports: attestationResponse.transports || [],
      name: attestationResponse?.name || "passkey",
      createdAt: new Date().toISOString(),
    };

    const updatedPasskeys = (user.passkeys || []).concat([credential]);

    // Save credential and remove the challenge
    await payload.update({
      collection: "customers",
      id: user.id,
      data: {
        passkeys: updatedPasskeys,
        webauthnRegistrationChallenge: null,
        webauthnRegistrationChallengeCreatedAt: null,
      },
      disableCollectionOperations: true,
    });

    return new Response(JSON.stringify({ success: true }), { status: 200 });
  } catch (e) {
    console.error("Registration verify error", e);
    return new Response(JSON.stringify({ message: "Verification error" }), {
      status: 500,
    });
  }
}
