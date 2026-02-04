import { redirect } from "next/navigation";
import type { Customer } from "@/payload-types";
import { getServerSideURL } from "./getURL";
import { cookies } from "next/headers";

export const getMeCustomer = async (args?: {
  nullUserRedirect?: string;
  validUserRedirect?: string;
  unverifiedUserRedirect?: string; // 1. Add new argument
}): Promise<{
  user: Customer | null;
}> => {
  const { nullUserRedirect, validUserRedirect, unverifiedUserRedirect } = args || {};

  const cookieStore = await cookies();
  const meUserReq = await fetch(`${getServerSideURL()}/api/customers/me`, {
    method: "GET",
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookieStore.toString(),
    },
    cache: "no-store",
  });

  if (!meUserReq.ok) {
    if (nullUserRedirect) {
      redirect(nullUserRedirect);
    }
    return { user: null };
  }

  const data = await meUserReq.json();
  const customer: Customer | null = data?.customer || null;
  const isUserValid = meUserReq.ok && customer;

  if (unverifiedUserRedirect && isUserValid && customer?._verified === false) {
    redirect(unverifiedUserRedirect);
  }

  if (validUserRedirect && isUserValid && customer?._verified !== false) {
    redirect(validUserRedirect);
  }

  if (nullUserRedirect && !isUserValid) {
    redirect(nullUserRedirect);
  }

  return {
    user: customer,
  };
};
