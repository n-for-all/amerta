import { PayloadRequest } from 'payload';
import { generateRegistrationOptions } from '@simplewebauthn/server';
import { getCachedGlobal } from '@/amerta/utilities/getGlobals';
import { Config } from 'payload';
import { Settings } from '@/payload-types';

function deriveOriginFromRequest(req: PayloadRequest) {
  const proto = req.headers.get('x-forwarded-proto') || undefined;
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || undefined;
  if (!host) return null;
  const scheme = proto || (req.url && req.url.startsWith('https') ? 'https' : 'http');
  return `${scheme}://${host}`;
}

function deriveRpIdFromHost(host?: string) {
  if (!host) return undefined;
  // if host is localhost or IP, return host without port
  if (/^localhost(:|$)/i.test(host) || /^\d+\.\d+\.\d+\.\d+/.test(host)) return host.split(':')[0];
  // naive eTLD+1 derivation: take last two labels
  const parts = host.split('.');
  if (parts.length >= 2) return parts.slice(-2).join('.');
  return host;
}

export default async function registerOptionsHandler(req: PayloadRequest) {
  const { payload } = req;

  const body = req.json ? await req.json() : {};
  const email = body?.email;

  // Find the user either by session or email
  let user = null;
  if (req.user && req.user.id) {
    user = await payload.findByID({ collection: 'customers', id: req.user.id });
  } else if (email) {
    const found = await payload.find({ collection: 'customers', where: { email: { equals: email } } });
    user = found?.docs?.[0] ?? null;
  }

  if (!user) {
    return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
  }

  // Load provider settings from globals if present
  const authSettings: Settings = await getCachedGlobal('settings' as keyof Config['globals'], 1)();
  const providerSettings = authSettings?.webauthnSettings || null;

  const rpName = providerSettings?.rpName || process.env.WEBAUTHN_RP_NAME || 'Amerta';

  // Derive expected origin from NEXT_PUBLIC_SERVER_URL OR request
  const envOrigin = process.env.NEXT_PUBLIC_SERVER_URL;
  const derivedOrigin = deriveOriginFromRequest(req);
  const expectedOrigin = envOrigin || derivedOrigin || null;

  // Allowed origins: include derived + settings list
  const allowedOrigins = new Set<string>();
  if (providerSettings?.allowedOrigins && Array.isArray(providerSettings.allowedOrigins)) {
    providerSettings.allowedOrigins.forEach((o: any) => {
      if (o && o.origin) allowedOrigins.add(o.origin);
    });
  }
  if (derivedOrigin) allowedOrigins.add(derivedOrigin);
  if (envOrigin) allowedOrigins.add(envOrigin);

  // RPID: prefer settings, else derive from request host or env
  let rpID = providerSettings?.rpID || process.env.WEBAUTHN_RP_ID;
  if (!rpID) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || (envOrigin ? new URL(envOrigin).host : undefined);
    rpID = deriveRpIdFromHost(host || undefined);
  }

  const userID = user.id.toString();
  const userName = user.email || userID;

  const options = generateRegistrationOptions({
    rpName,
    rpID,
    userID,
    userName,
    timeout: 60000,
    attestationType: providerSettings?.attestationType || 'direct',
    authenticatorSelection: {
      userVerification: providerSettings?.userVerification || 'preferred',
    },
    // Exclude existing credentials
    excludeCredentials: (user.passkeys || []).map((cred: any) => ({
      id: Buffer.from(cred.credentialID, 'base64url'),
      type: 'public-key',
      transports: cred.transports || undefined,
    })),
  });

  // Persist the challenge to the user record temporarily. This must be used later to verify.
  try {
    await payload.update({
      collection: 'customers',
      id: userID,
      data: {
        webauthnRegistrationChallenge: options.challenge,
        // store a timestamp to expire the challenge after some time
        webauthnRegistrationChallengeCreatedAt: new Date().toISOString(),
      },
      // ensure no hooks trigger unintended behavior
      disableCollectionOperations: true,
    });
  } catch (e) {
    console.error('Failed to store registration challenge', e);
  }

  // Include the expectedOrigin in the response for client debug (not strictly required)
  return new Response(JSON.stringify({ ...options, expectedOrigin }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
