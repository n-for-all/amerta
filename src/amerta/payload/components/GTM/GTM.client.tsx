"use client";

import { useEffect } from "react";
import Script from "next/script";
import { useCookieStore } from "./cookies/hooks/useCookieStore";

declare global {
  interface Window {
    dataLayer: any[];
    gtag?: (...args: any[]) => void;
  }
}

export const GTM = ({ gtmId, withConsent }: { gtmId: string; withConsent?: boolean }) => {
  const { preferences, hasConsented, acceptCookies } = useCookieStore();
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
  }, [hasConsented, acceptCookies]);

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
