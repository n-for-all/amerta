"use client";

import { getURL } from "@/amerta/utilities/getURL";
import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function VerifyEmail({ locale }: { locale: string }) {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();
  const [status, setStatus] = useState("Verifying...");

  useEffect(() => {
    const verifyUser = async () => {
      if (!token) {
        setStatus("Invalid token.");
        return;
      }

      try {
        // Call Payload's built-in verify endpoint
        const res = await fetch(`/api/customers/verify/${token}`, {
          method: "POST",
        });

        if (res.ok) {
          setStatus("Success! Redirecting to login...");
          setTimeout(() => router.push(getURL(`/login`, locale)), 2000);
        } else {
          setStatus("Verification failed. Token may be invalid or expired.");
        }
      } catch (e) {
        console.error("Error verifying email:", e);
        setStatus("An error occurred.");
      }
    };

    verifyUser();
  }, [token, router, locale]);

  return (
    <div style={{ padding: "50px", textAlign: "center" }}>
      <h1>{status}</h1>
    </div>
  );
}
