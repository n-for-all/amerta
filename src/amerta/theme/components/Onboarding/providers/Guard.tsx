"use client";
import React, { useEffect, useState } from "react";
import { Onboarding } from "..";
import { getAdminApiURL } from "@/amerta/utilities/getAdminURL";
import { useAuth } from "@payloadcms/ui";

export const SetupGuardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isSetup, setIsSetup] = useState<boolean | null>(null);
  const { user } = useAuth();
  const checkStatus = async () => {
    try {
      const res = await fetch(getAdminApiURL("/setup-status"));
      const data = await res.json();
      setIsSetup(!!data.isSetup);
    } catch (e) {
      setIsSetup(false);
      console.error("Failed to check setup status: ", e);
    }
  };

  useEffect(() => {
    if (!user) {
      return;
    }
    checkStatus();
  }, [user]);

  if (user) {
    if (isSetup === null) {
      return <div style={{ height: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>Loading Amerta Configuration...</div>;
    }

    if (isSetup === false) {
      return <Onboarding onSuccess={() => setIsSetup(true)} />;
    }
  }
  return <>{children}</>;
};
