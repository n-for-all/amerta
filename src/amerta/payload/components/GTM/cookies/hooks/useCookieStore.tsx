import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CookiePreferences {
  functional: boolean;
  security: boolean;
  analytics: boolean;
  marketing: boolean;
  userData: boolean;
  adPersonalization: boolean;
  contentPersonalization: boolean;
}

interface CookieStore {
  hasConsented: boolean | null;
  preferences: CookiePreferences;
  setPreference: (category: keyof CookiePreferences, value: boolean) => void;
  acceptCookies: (preferences?: Partial<CookiePreferences>) => void;
  declineCookies: () => void;
}

const date = new Date();
date.setFullYear(date.getFullYear() + 1);

export const useCookieStore = create<CookieStore>()(
  persist(
    (set) => ({
      hasConsented: null,
      preferences: {
        functional: true,
        security: true,
        analytics: true,
        marketing: true,
        userData: true,
        adPersonalization: true,
        contentPersonalization: true,
      },
      setPreference: (category: keyof CookiePreferences, value: boolean) => {
        set((state) => ({
          preferences: {
            ...state.preferences,
            [category]: category === "functional" || category === "security" ? true : value,
          },
        }));
      },
      acceptCookies: (preferences?: Partial<CookiePreferences>) => {
        try {
          const newPreferences = {
            functional: true,
            security: true,
            analytics: true,
            marketing: true,
            userData: true,
            adPersonalization: true,
            contentPersonalization: true,
            ...preferences,
          };

          // Only set browser storage on client side
          if (typeof window !== 'undefined') {
            document.cookie = `cookieConsent=true; expires=${date.toUTCString()}; path=/; SameSite=Lax; Secure`;
            localStorage.setItem("cookieConsent", "true");
            localStorage.setItem("cookiePreferences", JSON.stringify(newPreferences));
            sessionStorage.removeItem("cookieConsent");
          }

          set({
            hasConsented: true,
            preferences: newPreferences,
          });
        } catch (error) {
          console.error("Error setting cookie consent:", error);
          set({ hasConsented: false });
        }
      },
      declineCookies: () => {
        try {
          const declinedPreferences = {
            functional: true,
            security: true,
            analytics: false,
            marketing: false,
            userData: false,
            adPersonalization: false,
            contentPersonalization: false,
          };

          // Only set browser storage on client side
          if (typeof window !== 'undefined') {
            localStorage.removeItem("cookieConsent");
            localStorage.removeItem("cookiePreferences");
            sessionStorage.setItem("cookieConsent", "false");
          }

          set({
            hasConsented: false,
            preferences: declinedPreferences,
          });
        } catch (error) {
          console.error("Error declining cookie consent:", error);
        }
      },
    }),
    {
      name: "cookie-storage",
      onRehydrateStorage: () => (state) => {
        // Only run on client side
        if (typeof window === 'undefined') return;

        try {
          const local = localStorage.getItem("cookieConsent");
          const session = sessionStorage.getItem("cookieConsent");

          if (session === "false") {
            return state?.declineCookies();
          }
          if (local === "true") {
            try {
              const storedPreferences = localStorage.getItem("cookiePreferences");
              const preferences = storedPreferences ? JSON.parse(storedPreferences) : undefined;
              return state?.acceptCookies(preferences);
            } catch (error) {
              console.error("Error loading cookie preferences:", error);
              return state?.acceptCookies();
            }
          }
        } catch (error) {
          console.error("Error checking cookie consent:", error);
          return state?.declineCookies();
        }
      },
    },
  ),
);
