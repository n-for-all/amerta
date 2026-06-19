import { PayloadRequest } from "payload";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import jwt from "jsonwebtoken";
import { CUSTOMER_AUTH_TOKEN } from "@/amerta/constants";
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

export default async function authVerifyHandler(req: PayloadRequest) {
  const { payload } = req;
  const body = req.json ? await req.json() : {};
  const { email, assertionResponse } = body || {};

  if (!email || !assertionResponse) {
    return new Response(JSON.stringify({ message: "Missing parameters" }), {
      status: 400,
    });
  }

  const found = await payload.find({
    collection: "customers",
    where: { email: { equals: email } },
  });
  const user = found?.docs?.[0];
  if (!user) {
    return new Response(JSON.stringify({ message: "User not found" }), {
      status: 404,
    });
  }

  // load provider settings
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

  const expectedChallenge = user.webauthnAuthenticationChallenge;
  if (!expectedChallenge) {
    return new Response(
      JSON.stringify({ message: "No authentication challenge found" }),
      { status: 400 },
    );
  }

  // Challenge TTL check
  try {
    const createdAt = user.webauthnAuthenticationChallengeCreatedAt;
    if (createdAt) {
      const ageMs = Date.now() - new Date(createdAt).getTime();
      const ttlSeconds = providerSettings?.challengeTTLSeconds ?? 300;
      const TTL_MS = Number(ttlSeconds) * 1000;
      if (ageMs > TTL_MS) {
        try {
          await payload.update({
            collection: "customers",
            id: user.id,
            data: {
              webauthnAuthenticationChallenge: null,
              webauthnAuthenticationChallengeCreatedAt: null,
            },
          });
        } catch (e) {
          console.warn("Failed to clear expired authentication challenge", e);
        }

        return new Response(
          JSON.stringify({ message: "Authentication challenge expired" }),
          { status: 400 },
        );
      }
    }
  } catch (e) {
    console.warn("Error while checking authentication challenge TTL", e);
  }

  try {
    const dbCred = (user.passkeys || []).find(
      (c: any) =>
        c.credentialID === assertionResponse.id ||
        c.credentialID === assertionResponse.rawId,
    );
    if (!dbCred) {
      return new Response(
        JSON.stringify({ message: "Credential not registered" }),
        { status: 400 },
      );
    }

    const verification = await verifyAuthenticationResponse({
      credential: assertionResponse,
      expectedChallenge: expectedChallenge,
      expectedOrigin: expectedOrigin,
      expectedRPID: expectedRPID,
      authenticator: {
        counter: dbCred.counter || 0,
        credentialPublicKey: Buffer.from(dbCred.publicKey!, "base64url"),
      },
    });

    if (!verification.verified) {
      return new Response(
        JSON.stringify({ message: "Assertion verification failed" }),
        { status: 400 },
      );
    }

    // Update counter
    const newCounter =
      verification.authenticationInfo?.newCounter ??
      verification.authenticationInfo?.counter ??
      dbCred.counter;
    const updatedCredentials = (user.passkeys || []).map((c: any) =>
      c.credentialID === dbCred.credentialID
        ? { ...c, counter: newCounter }
        : c,
    );

    // Save new counter and clear challenge
    await payload.update({
      collection: "customers",
      id: user.id,
      data: {
        passkeys: updatedCredentials,
        webauthnAuthenticationChallenge: null,
        webauthnAuthenticationChallengeCreatedAt: null,
      },
    });

    // Create session token and set cookie (reuse same approach as OAuth)
    const token = jwt.sign(
      { email: user.email, id: user.id, collection: "customers" },
      payload.secret,
      { expiresIn: "7d" },
    );

    const response = new Response(
      JSON.stringify({ user: { id: user.id, email: user.email }, token }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );

    // set cookie header
    const cookieOptions = [`${CUSTOMER_AUTH_TOKEN}=${token}`];
    cookieOptions.push("Path=/");
    cookieOptions.push("HttpOnly");
    if (process.env.NODE_ENV === "production") cookieOptions.push("Secure");
    cookieOptions.push("SameSite=Lax");
    cookieOptions.push("Max-Age=604800"); // 7 days

    response.headers.set("Set-Cookie", cookieOptions.join("; "));

    return response;
  } catch (e) {
    console.error("Auth verify error", e);
    return new Response(JSON.stringify({ message: "Verification error" }), {
      status: 500,
    });
  }
}
