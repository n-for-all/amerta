import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import type { Customer } from "@/payload-types";
import { getServerSideURL } from "./getURL";
import { CUSTOMER_AUTH_TOKEN } from "../constants";

export const getMeCustomer = async (args?: {
  nullUserRedirect?: string;
  validUserRedirect?: string;
  unverifiedUserRedirect?: string; // 1. Add new argument
}): Promise<{
  user: Customer | null;
  token: string | undefined;
}> => {
  const { nullUserRedirect, validUserRedirect, unverifiedUserRedirect } = args || {};
  const cookieStore = await cookies();
  const token = cookieStore.get(CUSTOMER_AUTH_TOKEN)?.value;


  if (!token) {
    if (nullUserRedirect) redirect(nullUserRedirect);
    return { user: null, token: undefined };
  }

  const meUserReq = await fetch(`${getServerSideURL()}/api/customers/me`, {
    headers: {
      Authorization: `JWT ${token}`,
    },
    cache: "no-store", 
  });

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
    token,
  };
};
