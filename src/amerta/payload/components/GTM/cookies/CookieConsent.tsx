"use client";;
import { useEffect, useState } from "react";

import { useCookieStore } from "./hooks/useCookieStore";
import { Preferences } from "./preferences";
import { Cog, Cookie } from "lucide-react";
import { cn } from "@/amerta/utilities/ui";
import { Button } from "@/amerta/theme/ui/button";

export function CookieConsent({privacyUrl}) {
  const { hasConsented, acceptCookies, declineCookies, preferences } = useCookieStore();
  const [isOpen, setIsOpen] = useState(false);
  const [hide, setHide] = useState(false);
  const [showPreferences, setShowPreferences] = useState(false);

  const accept = () => {
    setIsOpen(false);
    setTimeout(() => {
      setHide(true);
    }, 700);
    acceptCookies(preferences); // Accept all cookies without passing preferences
  };

  const decline = () => {
    setIsOpen(false);
    setTimeout(() => {
      setHide(true);
    }, 700);
    declineCookies();
  };

  const manage = () => {
    setIsOpen(false);
    setTimeout(() => {
      setHide(true);
      setShowPreferences(true);
    }, 700);
  };

  useEffect(() => {
    if (hasConsented === null) {
      setIsOpen(true);
      setHide(false);
    } else {
      setIsOpen(false);
      setHide(true);
    }
  }, [hasConsented]);

  return (
    <>
      <Preferences privacyUrl={privacyUrl} open={showPreferences} onOpenChange={setShowPreferences} />

      <div role="dialog" aria-modal="true" aria-live="assertive" aria-labelledby="cookie-title-small" aria-describedby="cookie-description-small" className={cn("fixed bottom-4 left-1/2 z-[200] w-full -translate-x-1/2 transform p-4 sm:mx-0 sm:max-w-md sm:p-0", !isOpen ? "scale-95 opacity-0 transition-[opacity,transform]" : "scale-100 opacity-100 transition-[opacity,transform]", hide && "hidden")}>
        <div className="m-0 border rounded-lg shadow-lg dark:bg-card bg-background border-border sm:m-3">
          <div className="flex items-center justify-between p-3">
            <p id="cookie-title-small" className="text-base font-medium" role="heading" aria-level={2}>
              We use cookies
            </p>
            <Cookie className="h-4 w-4 sm:h-[1.2rem] sm:w-[1.2rem]" aria-hidden="true" />
          </div>
          <div className="p-3 -mt-3 space-y-1" id="cookie-description-small">
            <p className="text-xs text-left text-muted-foreground">We use cookies to improve your experience, analyse traffic, and deliver personalised content and ads. Essential cookies for security and core functionality are always enabled. By clicking &quot;Accept&quot;, you consent to our use of additional cookies.</p>
            <p className="text-xs text-left text-muted-foreground">
              For more information, see our privacy policy.
            </p>
          </div>
          <footer className="flex flex-col items-center gap-2 p-3 mt-2 border-t sm:flex-row">
            <Button onClick={manage} variant="outline" size="icon" className="w-full h-8 text-xs transition-all duration-300 cursor-pointer sm:h-9 sm:w-9" aria-label="Manage cookie consent">
              <Cog className="w-4 h-4" />
            </Button>
            <Button onClick={decline} className="flex-1 w-full h-8 text-xs transition-all duration-300 cursor-pointer sm:h-9" aria-label="Decline cookie consent">
              Decline
            </Button>
            <Button onClick={accept} className="flex-1 w-full h-8 text-xs transition-all duration-300 cursor-pointer sm:h-9" aria-label="Accept cookie consent">
              Accept
            </Button>
          </footer>
        </div>
      </div>
    </>
  );
}
