import { redirect } from "next/navigation";
import { AdminViewServerProps } from "payload";
import { checkRole } from "@/amerta/access/checkRole";
import { User } from "@/payload-types";

// Payload treats custom admin views as public and leaves the login check to the view.
// Without this, a stale or foreign login cookie still renders the page shell.
export function redirectUnlessAdmin(initPageResult: AdminViewServerProps["initPageResult"], params: AdminViewServerProps["params"]) {
  const user = initPageResult.req.user as User | null;
  if (user && checkRole(["admin"], user)) return;
  const adminRoute = initPageResult.req.payload.config.routes.admin || "/admin";
  const segments = ((params as any)?.segments as string[] | undefined) || [];
  redirect(`${adminRoute}/login?redirect=${encodeURIComponent(`${adminRoute}/${segments.join("/")}`)}`);
}
