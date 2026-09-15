import { getURL } from "@/amerta/utilities/getURL";

export const loginWith = async (provider: string, locale: string) => {
  try {
    const response = await fetch(`/api/auth/${provider}/${locale}/authenticate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({}),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || "Authentication failed");
    }
    if (data.error) {
      throw new Error(data.error);
    }

    if (data.status === "redirect" && data.url) {
      window.location.href = data.url;
      return;
    }

    if (data.user) {
      window.location.href = getURL(`/account`, locale);
      return;
    }

    throw new Error("No redirect URL or user returned");
  } catch (error: any) {
    console.error("Login error:", error);
    throw new Error(error.message || "Authentication failed");
  }
};
