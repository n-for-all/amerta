"use client";

import dynamic from "next/dynamic";
import { forwardRef } from "react";
import { PaymentGatewayProps, PaymentHandle } from "./gateways/types";

// Note: Loading fallback added
const StripePayment = dynamic(() => import("./gateways/StripePayment").then((mod) => mod.StripePayment), { loading: () => <div className="h-12 rounded-md bg-zinc-100 animate-pulse" /> });

const CODPayment = dynamic(() => import("./gateways/CODPayment").then((mod) => mod.CODPayment));
const MamoPayment = dynamic(() => import("./gateways/MamoPayment").then((mod) => mod.MamoPayment));

// 👇 1. Wrap in forwardRef
export const PaymentMethodRenderer = forwardRef<PaymentHandle, Omit<PaymentGatewayProps, "paymentRef">>((props, ref) => {
  switch (props.method.type) {
    case "mamo-pay":
      return <MamoPayment {...props} paymentRef={ref} />;
    case "stripe":
      return <StripePayment {...props} paymentRef={ref} />;
    case "cod":
      return <CODPayment {...props} paymentRef={ref} />;
    default:
      return null;
  }
});

PaymentMethodRenderer.displayName = "PaymentMethodRenderer";
