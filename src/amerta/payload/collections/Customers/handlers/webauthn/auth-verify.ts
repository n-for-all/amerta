import { PayloadRequest } from "payload";
import { verifyAuthenticationResponse } from "@simplewebauthn/server";
import jwt from "jsonwebtoken";
import { CUSTOMER_AUTH_TOKEN } from "@/amerta/constants";
import { clearChallengeCookie, expectedOrigin, getPasskeySettings, json, readChallenge, rpIdFor } from "./shared";

// Finish a passkey sign-in: find the customer who owns the passkey, verify the signature, start a session.
export default async function authVerifyHandler(req: PayloadRequest) {
  const settings = await getPasskeySettings();
  if (!settings) return json({ message: "Passkeys are not enabled" }, 404);

  const { payload } = req;
  const body = req.json ? await req.json().catch(() => ({})) : {};
  const assertionResponse = body?.assertionResponse;
  if (!assertionResponse?.id) return json({ message: "Missing parameters" }, 400);

  const expectedChallenge = readChallenge(req, payload.secret);
  if (!expectedChallenge) return json({ message: "Sign-in timed out, please try again" }, 400);

  const found = await payload.find({
    collection: "customers",
    where: { "passkeys.credentialID": { equals: assertionResponse.id } },
    limit: 1,
    depth: 0,
  });
  const user: any = found.docs[0];
  const dbCred = user?.passkeys?.find((c: any) => c.credentialID === assertionResponse.id);
  if (!user || !dbCred) return json({ message: "This passkey isn't linked to an account here" }, 400, { "Set-Cookie": clearChallengeCookie() });

  try {
    const verification = await verifyAuthenticationResponse({
      response: assertionResponse,
      expectedChallenge,
      expectedOrigin: expectedOrigin(req),
      expectedRPID: rpIdFor(req, settings),
      credential: {
        id: dbCred.credentialID,
        publicKey: Buffer.from(dbCred.publicKey, "base64url"),
        counter: dbCred.counter || 0,
        transports: dbCred.transports || undefined,
      },
      requireUserVerification: settings.userVerification === "required",
    });
    if (!verification.verified) return json({ message: "Passkey could not be verified" }, 400, { "Set-Cookie": clearChallengeCookie() });

    await payload.update({
      collection: "customers",
      id: user.id,
      data: {
        passkeys: user.passkeys.map((c: any) =>
          c.credentialID === dbCred.credentialID ? { ...c, counter: verification.authenticationInfo.newCounter, lastUsedAt: new Date().toISOString() } : c,
        ),
      },
      depth: 0,
    });

    const token = jwt.sign({ email: user.email, id: user.id, collection: "customers" }, payload.secret, { expiresIn: "7d" });
    const session = [`${CUSTOMER_AUTH_TOKEN}=${token}`, "Path=/", "HttpOnly", "SameSite=Lax", "Max-Age=604800"];
    if (process.env.NODE_ENV === "production") session.push("Secure");

    const headers = new Headers({ "Content-Type": "application/json" });
    headers.append("Set-Cookie", session.join("; "));
    headers.append("Set-Cookie", clearChallengeCookie());
    return new Response(JSON.stringify({ user: { id: user.id, email: user.email } }), { status: 200, headers });
  } catch (e: any) {
    console.error("Passkey sign-in error", e);
    return json({ message: "Passkey could not be verified" }, 400, { "Set-Cookie": clearChallengeCookie() });
  }
}
