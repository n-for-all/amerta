"use client";

import { useState } from "react";

import { Preferences } from "./preferences";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

export function CookieButton({ className, privacyUrl }: { className?: string; privacyUrl: string }) {
  const [showPreferences, setShowPreferences] = useState(false);
  const { __ } = useEcommerce();

  return (
    <>
      <button onClick={() => setShowPreferences(true)} className={className}>
        {__("Cookie settings")}
      </button>
      <Preferences open={showPreferences} onOpenChange={setShowPreferences} privacyUrl={privacyUrl} />
    </>
  );
}
