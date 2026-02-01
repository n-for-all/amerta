import React, { Fragment } from "react";
import { Metadata } from "next";
import { notFound } from "next/navigation";

import { type Order } from "@/payload-types";
import { getMeCustomer } from "@/amerta/utilities/getMeCustomer";
import { OrderAdmin } from "@/amerta/theme/components/Account/Order";
import { getServerSideURL, getURL } from "@/amerta/utilities/getURL";

export default async function Order({ params }: { params: Promise<{ id: string; locale: string }> }) {
  const { id, locale } = await params;
  const { token } = await getMeCustomer({
    nullUserRedirect: `${getURL("/login", locale)}?redirect=${encodeURIComponent(getURL(`/account/orders/${id}`, locale))}`,
  });

  let order: Order | null = null;

  try {
    order = await fetch(`${getServerSideURL()}/api/orders/${id}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${token}`,
      },
    })?.then(async (res) => {
      if (!res.ok) notFound();
      const json = await res.json();
      if ("error" in json && json.error) notFound();
      if ("errors" in json && json.errors) notFound();
      return json;
    });
  } catch (error) {
    console.error(error); // eslint-disable-line no-console
  }

  if (!order) {
    notFound();
  }

  return (
    <>
      <OrderAdmin order={order} locale={locale} />
    </>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; locale }> }): Promise<Metadata> {
  const { id, locale } = await params;
  return {
    title: `Order ${id}`,
    description: `Order details for order ${id}.`,
    openGraph: {
      title: `Order ${id}`,
      url: getURL(`/account/orders/${id}`, locale),
    },
  };
}
