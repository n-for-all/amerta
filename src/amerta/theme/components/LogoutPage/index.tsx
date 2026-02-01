"use client";
import React, { Fragment, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/amerta/providers/Auth";
import { Button } from "@/amerta/theme/ui/button";
import { ArrowLeft } from "lucide-react";
import { getURL } from "@/amerta/utilities/getURL";

export const LogoutPage: React.FC<{ locale: string }> = ({ locale }) => {
  const { logout } = useAuth();
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [countdown, setCountdown] = useState(5);
  const router = useRouter();

  useEffect(() => {
    const performLogout = async () => {
      try {
        await logout();
        setSuccess("Logged out successfully.");
      } catch {
        setError("You are logged out.");
      }
    };

    performLogout();
  }, [logout]);

  useEffect(() => {
    if (success || error) {
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            router.push(getURL(`/`, locale));
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [success, error, router, locale]);

  const handleRedirectNow = () => {
    router.push(getURL(`/`, locale));
  };

  return (
    <Fragment>
      {(error || success) && (
        <div className="max-w-md py-16 mx-auto">
          <h1 className="mb-2 text-xl font-bold lg:text-3xl lg:mb-4">{error || success}</h1>

          <div className="pb-4 mb-4 border-b">
            <p className="mb-2">
              Redirecting to homepage in <strong>{countdown}</strong> seconds...
            </p>
          </div>
          <Button onClick={handleRedirectNow}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Go to Homepage Now
          </Button>
        </div>
      )}
    </Fragment>
  );
};
