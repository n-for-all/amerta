import { PayloadRequest } from "payload";
import { getPasskeySettings, json } from "./shared";

const signedInCustomer = (req: PayloadRequest) => (req.user && (req.user as any).collection === "customers" ? (req.user as any) : null);

// The signed-in customer's passkeys, without the key material
export async function listPasskeysHandler(req: PayloadRequest) {
  if (!(await getPasskeySettings())) return json({ message: "Passkeys are not enabled" }, 404);
  const customer = signedInCustomer(req);
  if (!customer) return json({ message: "Log in to manage passkeys" }, 401);

  const user: any = await req.payload.findByID({ collection: "customers", id: customer.id, depth: 0 });
  return json({
    passkeys: (user.passkeys || []).map((p: any) => ({ id: p.id, name: p.name || "Passkey", createdAt: p.createdAt || null, lastUsedAt: p.lastUsedAt || null })),
  });
}

export async function deletePasskeyHandler(req: PayloadRequest) {
  if (!(await getPasskeySettings())) return json({ message: "Passkeys are not enabled" }, 404);
  const customer = signedInCustomer(req);
  if (!customer) return json({ message: "Log in to manage passkeys" }, 401);

  const passkeyId = req.routeParams?.id as string | undefined;
  const user: any = await req.payload.findByID({ collection: "customers", id: customer.id, depth: 0 });
  const remaining = (user.passkeys || []).filter((p: any) => p.id !== passkeyId);
  if (remaining.length === (user.passkeys || []).length) return json({ message: "Passkey not found" }, 404);

  await req.payload.update({ collection: "customers", id: customer.id, data: { passkeys: remaining }, depth: 0 });
  return json({ success: true });
}
