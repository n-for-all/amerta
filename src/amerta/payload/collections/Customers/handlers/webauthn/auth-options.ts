import { PayloadRequest } from 'payload';
import { generateAuthenticationOptions } from '@simplewebauthn/server';
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
  if (/^localhost(:|$)/i.test(host) || /^\d+\.\d+\.\d+\.\d+/.test(host)) return host.split(':')[0];
  const parts = host.split('.');
  if (parts.length >= 2) return parts.slice(-2).join('.');
  return host;
}

export default async function authOptionsHandler(req: PayloadRequest) {
  const { payload } = req;
  const body = req.json ? await req.json() : {};
  const email = body?.email;

  // Lookup user by email
  if (!email) {
    return new Response(JSON.stringify({ message: 'Email required' }), { status: 400 });
  }

  const found = await payload.find({ collection: 'customers', where: { email: { equals: email } } });
  const user = found?.docs?.[0];
  if (!user) {
    return new Response(JSON.stringify({ message: 'User not found' }), { status: 404 });
  }

  const authSettings: Settings = await getCachedGlobal('settings' as keyof Config['globals'], 1)();
  const providerSettings = authSettings?.webauthnSettings || null;

  const derivedOrigin = deriveOriginFromRequest(req);
  const envOrigin = process.env.NEXT_PUBLIC_SERVER_URL;
  const expectedOrigin = envOrigin || derivedOrigin || undefined;

  const allowCredentials = (user.passkeys || []).map((cred: any) => ({
    id: cred.credentialID as string,
    transports: cred.transports || undefined,
  }));

  let rpID = providerSettings?.rpID || process.env.WEBAUTHN_RP_ID;
  if (!rpID) {
    const host = req.headers.get('x-forwarded-host') || req.headers.get('host') || (envOrigin ? new URL(envOrigin).host : undefined);
    rpID = deriveRpIdFromHost(host || undefined);
  }

  const options = await generateAuthenticationOptions({
    rpID: rpID || 'localhost',
    timeout: 60000,
    allowCredentials,
    userVerification: providerSettings?.userVerification || 'preferred',
  });

  // persist challenge to user record
  try {
    await payload.update({
      collection: 'customers',
      id: user.id,
      data: {
        webauthnAuthenticationChallenge: options.challenge,
        webauthnAuthenticationChallengeCreatedAt: new Date().toISOString(),
      },
    });
  } catch (e) {
    console.error('Failed to save auth challenge', e);
  }

  return new Response(JSON.stringify({ ...options, expectedOrigin }), { status: 200, headers: { 'Content-Type': 'application/json' } });
}
