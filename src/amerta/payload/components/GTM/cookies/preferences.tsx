"use client";

import Link from "next/link";
import { useCookieStore } from "./hooks/useCookieStore";
import { Switch } from "@/amerta/theme/ui/switch";

const Dialog = ({ open, modal, children, onOpenChange }: { open: boolean; modal?: boolean; children: React.ReactNode; onOpenChange?: (open: boolean) => void }) => {
  if (!open) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && onOpenChange) {
      onOpenChange(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 duration-300 bg-black/60 backdrop-blur-sm animate-in fade-in" onClick={handleBackdropClick} role="dialog" aria-modal={modal}>
      <div className="relative w-full max-w-md max-h-[90vh] overflow-y-auto bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-700 animate-in zoom-in-95 duration-300" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

export function Preferences({ open, privacyUrl, onOpenChange }: { open: boolean; privacyUrl: string; onOpenChange: (open: boolean) => void }) {
  const { preferences, setPreference, acceptCookies, declineCookies } = useCookieStore();

  return (
    <Dialog open={open} modal={true} onOpenChange={onOpenChange}>
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-zinc-900 dark:text-white">Cookie Preferences</h2>
          <button onClick={() => onOpenChange(false)} className="p-1 transition-colors rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800" aria-label="Close preferences">
            <svg className="w-5 h-5 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Description */}
        <p className="mb-4 text-sm text-zinc-600 dark:text-zinc-400">Manage your cookie preferences. You can change these settings at any time.</p>

        {/* Cookie Categories */}
        <div className="grid gap-2 mb-4 space-y-2 lg:grid-cols-2">
          <div className="flex items-start justify-between col-span-2 gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Essential Cookies</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Required for core site features such as language settings, login status, and user preferences.</p>
            </div>
            <Switch id="functional" checked={preferences.functional} disabled aria-label="Essential cookies (always enabled)" />
          </div>

          <div className="flex items-start justify-between col-span-2 gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Security Cookies</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Protect against security threats and ensure user session integrity.</p>
            </div>
            <Switch id="security" checked={preferences.security} disabled aria-label="Security cookies (always enabled)" />
          </div>

          <div className="flex items-start justify-between col-span-2 gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Analytics Cookies</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Help us understand how visitors interact with the website using aggregated data.</p>
            </div>
            <Switch id="analytics" checked={preferences.analytics} onChange={(checked) => setPreference("analytics", checked)} aria-label="Enable analytics cookies" />
          </div>

          <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Marketing Cookies</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Store data to serve ads that are more relevant to users.</p>
            </div>
            <Switch id="marketing" checked={preferences.marketing} onChange={(checked) => setPreference("marketing", checked)} aria-label="Enable marketing cookies" />
          </div>

          <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">User Data Cookies</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Used to collect identifiable user data for targeted advertising.</p>
            </div>
            <Switch id="user-data" checked={preferences.userData} onChange={(checked) => setPreference("userData", checked)} aria-label="Enable user data cookies" />
          </div>

          <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Ad Personalization</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Enables personalised ads based on browsing and usage history.</p>
            </div>
            <Switch id="ad-personalization" checked={preferences.adPersonalization} onChange={(checked) => setPreference("adPersonalization", checked)} aria-label="Enable ad personalization" />
          </div>

          <div className="flex items-start justify-between gap-2 p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800">
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-900 dark:text-white">Content Personalization</p>
              <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">Adjusts content based on individual user behavior and preferences.</p>
            </div>
            <Switch id="content-personalization" checked={preferences.contentPersonalization} onChange={(checked) => setPreference("contentPersonalization", checked)} aria-label="Enable content personalization" />
          </div>
        </div>

        {/* Footer */}
        <div className="pt-4 border-t border-zinc-200 dark:border-zinc-700">
          <p className="mb-4 text-xs text-zinc-500 dark:text-zinc-400">
            By saving your preferences, you consent to the use of cookies as described in our <Link href={privacyUrl} className="text-blue-600 dark:text-blue-400 hover:underline">
              Privacy Policy
            </Link>. You can change your preferences at any time.
          </p>

          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                declineCookies();
                onOpenChange(false);
              }}
              className="px-4 py-2 text-sm font-medium transition-colors bg-white border rounded-lg text-zinc-700 border-zinc-300 hover:bg-zinc-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-zinc-800 dark:text-zinc-300 dark:border-zinc-600 dark:hover:bg-zinc-700"
              aria-label="Decline all optional cookies"
            >
              Decline All
            </button>
            <button
              onClick={() => {
                acceptCookies(preferences);
                onOpenChange(false);
              }}
              className="px-4 py-2 text-sm font-medium text-white transition-colors bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:bg-blue-500 dark:hover:bg-blue-600"
              aria-label="Accept selected cookie preferences"
            >
              Save Preferences
            </button>
          </div>
        </div>
      </div>
    </Dialog>
  );
}
