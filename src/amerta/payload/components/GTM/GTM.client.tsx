"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useCookieStore } from "./cookies/hooks/useCookieStore";

declare global {
  interface Window {
    // dataLayer: Object[] | undefined;
    gtag?: (...args: any[]) => void;
  }
}

export type TrackItem = {
  item_id: string;
  item_name: string;
  price: number;
  quantity: number;
  item_variant?: string;
};

const round = (n: number) => Math.round((Number(n) || 0) * 100) / 100;

/**
 * Push a GA4-format ecommerce event to the GTM dataLayer.
 * GTM forwards it to GA4 / Meta Pixel / etc. `event_id` lets Meta dedupe with CAPI.
 */
export function trackEcommerce(
  event: "view_item" | "add_to_cart" | "begin_checkout" | "purchase",
  data: { currency: string; value: number; items: TrackItem[]; transaction_id?: string; tax?: number; shipping?: number; coupon?: string },
  options?: { test?: boolean },
) {
  if (typeof window === "undefined") return;
  const w = window as any;
  // Test orders / test customers: GA4 gets debug_mode (DebugView; excluded from reports by the
  // "Developer traffic" data filter), Meta gets is_test. Live events don't carry these keys at all.
  // The window flag is set once the customer has loaded; fall back to the value remembered from the
  // previous page so events fired early on a fresh page load (e.g. begin_checkout) are flagged too.
  let rememberedTest = false;
  try {
    rememberedTest = localStorage.getItem("amertaTestCustomer") === "1";
  } catch {}
  const isTest = options?.test ?? (typeof w.__amertaTestCustomer === "boolean" ? w.__amertaTestCustomer : rememberedTest);
  w.dataLayer = w.dataLayer || [];
  const ecommerce = {
    ...data,
    currency: (data.currency || "").toUpperCase(), // GA4/Meta require ISO 4217 uppercase (e.g. "AED")
    value: round(data.value),
    ...(data.tax !== undefined && { tax: round(data.tax) }),
    ...(data.shipping !== undefined && { shipping: round(data.shipping) }),
    items: data.items.map((i) => ({ ...i, price: round(i.price) })),
  };
  const eventId = data.transaction_id ? `${event}_${data.transaction_id}` : `${event}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  w.dataLayer.push({ ecommerce: null }); // clear previous ecommerce object
  w.dataLayer.push({ event, event_id: eventId, ...(isTest && { debug_mode: true, is_test: true }), ecommerce });
  // Reset so the flags don't leak into later events via the dataLayer's merged state
  if (isTest) w.dataLayer.push({ debug_mode: undefined, is_test: undefined });
}

export const GTM = ({ gtmId, withConsent }: { gtmId: string; withConsent?: boolean }) => {
  const { preferences, hasConsented } = useCookieStore();
  useEffect(() => {
    if (typeof window === "undefined" || hasConsented === null || !withConsent) return;

    function updateConsent() {
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: preferences.analytics ? "granted" : "denied",
          ad_storage: preferences.marketing ? "granted" : "denied",
          ad_user_data: preferences.userData ? "granted" : "denied",
          ad_personalization: preferences.adPersonalization ? "granted" : "denied",
          personalization_storage: preferences.contentPersonalization ? "granted" : "denied",
        });
      }
    }

    updateConsent();

    if (!window.gtag) {
      const scriptCheck = setInterval(() => {
        if (window.gtag) {
          updateConsent();
          clearInterval(scriptCheck);
        }
      }, 50);
      return () => clearInterval(scriptCheck);
    }
  }, [hasConsented, preferences, withConsent]);

  const defaultConsent = !withConsent ? "granted" : "denied";

  return (
    <>
      <Script id="gtm-consent" strategy="beforeInteractive">
        {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){window.dataLayer.push(arguments);}

            gtag('consent', 'default', {
                'functionality_storage': 'granted',
                'security_storage': 'granted',
                'analytics_storage': '${defaultConsent}',
                'ad_storage': '${defaultConsent}',
                'ad_user_data': '${defaultConsent}',
                'ad_personalization': '${defaultConsent}',
                'personalization_storage': '${defaultConsent}'
            });
            gtag('set', 'url_passthrough', true);
        `}
      </Script>

      <Script id="gtm-base" strategy="afterInteractive">
        {`
            (function(w,d,s,l,i){
                w[l]=w[l]||[];
                w[l].push({'gtm.start': new Date().getTime(),event:'gtm.js'});
                var f=d.getElementsByTagName(s)[0],
                    j=d.createElement(s), dl=l!='dataLayer'?'&l='+l:'';
                j.async=true;
                j.src='https://www.googletagmanager.com/gtm.js?id=${gtmId}'+dl;
                f.parentNode.insertBefore(j,f);
            })(window,document,'script','dataLayer','${gtmId}');
        `}
      </Script>
    </>
  );
};
