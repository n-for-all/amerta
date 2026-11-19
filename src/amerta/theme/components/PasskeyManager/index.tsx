"use client";

import React, { useCallback, useEffect, useState } from "react";
import { KeyRound, Trash2 } from "lucide-react";
import { Button } from "@/amerta/theme/ui/button";
import { Separator } from "@/amerta/theme/ui/separator";
import { useToast } from "@/amerta/theme/ui/toast";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";
import { addPasskey, deviceName, PasskeyCancelled, passkeysSupported } from "@/amerta/core/utilities/passkeys";
import { X } from "lucide-react";

type Passkey = { id: string; name: string; createdAt: string | null; lastUsedAt: string | null };

// Remembered per device: passkeys belong to a device, so "Not now" on the laptop shouldn't hide the offer on the phone
const PROMPT_KEY = "amerta-passkey-prompt";
const rememberPrompt = (value: "dismissed" | "added") => {
  try {
    localStorage.setItem(PROMPT_KEY, value);
  } catch {}
};
const promptHandled = () => {
  try {
    return Boolean(localStorage.getItem(PROMPT_KEY));
  } catch {
    return true;
  }
};

/** "Sign in faster next time" offer shown after signing in, until the shopper adds a passkey on this device or says not now */
export function PasskeyPrompt({ className = "" }: { className?: string }) {
  const { __ } = useEcommerce();
  const toast = useToast();
  const [show, setShow] = useState(false);
  const [adding, setAdding] = useState(false);

  useEffect(() => {
    if (!passkeysSupported() || promptHandled()) return;
    fetch("/api/customers/webauthn/passkeys", { credentials: "include", cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        // Off in Settings, or this device already has one
        if (!data || (data.passkeys || []).some((p: Passkey) => p.name === deviceName())) return;
        setShow(true);
      })
      .catch(() => {});
  }, []);

  if (!show) return null;

  const onAdd = async () => {
    setAdding(true);
    try {
      await addPasskey();
      rememberPrompt("added");
      setShow(false);
      toast.success(__("Passkey added. Next time you can sign in with it."));
    } catch (e: any) {
      if (!(e instanceof PasskeyCancelled)) toast.error(__(e.message));
    } finally {
      setAdding(false);
    }
  };

  const onSkip = () => {
    rememberPrompt("dismissed");
    setShow(false);
  };

  return (
    <div className={`relative flex flex-col gap-4 p-5 pr-12 border sm:flex-row sm:items-center border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 ${className}`}>
      <KeyRound className="w-8 h-8 shrink-0 text-muted-foreground" />
      <div className="flex-1">
        <p className="font-semibold">{__("Sign in faster next time")}</p>
        <p className="text-sm text-muted-foreground">{__("Use Face ID, your fingerprint or your device PIN instead of a password.")}</p>
      </div>
      <div className="flex gap-2">
        <Button type="button" onClick={onAdd} disabled={adding}>
          {adding ? __("Waiting for your device...") : __("Add a passkey")}
        </Button>
        <Button type="button" variant="ghost" onClick={onSkip}>
          {__("Not now")}
        </Button>
      </div>
      <button type="button" onClick={onSkip} aria-label={__("Close")} className="absolute top-3 right-3 rtl:right-auto rtl:left-3 text-muted-foreground hover:text-foreground">
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}

// "Passkeys" section of Account Details. Renders nothing when passkeys are turned off in Settings.
export default function PasskeyManager() {
  const { __, locale } = useEcommerce();
  const toast = useToast();
  const [enabled, setEnabled] = useState(false);
  const [supported, setSupported] = useState(true);
  const [passkeys, setPasskeys] = useState<Passkey[]>([]);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [confirming, setConfirming] = useState<string | null>(null);

  const load = useCallback(async () => {
    const res = await fetch("/api/customers/webauthn/passkeys", { credentials: "include", cache: "no-store" }).catch(() => null);
    if (!res?.ok) return setEnabled(false);
    const data = await res.json();
    setPasskeys(data.passkeys || []);
    setEnabled(true);
  }, []);

  useEffect(() => {
    setSupported(passkeysSupported());
    load();
  }, [load]);

  const onAdd = async () => {
    setAdding(true);
    try {
      await addPasskey();
      rememberPrompt("added");
      toast.success(__("Passkey added. Next time you can sign in with it."));
      await load();
    } catch (e: any) {
      if (!(e instanceof PasskeyCancelled)) toast.error(__(e.message));
    } finally {
      setAdding(false);
    }
  };

  const onRemove = async (id: string) => {
    setRemoving(id);
    try {
      const res = await fetch(`/api/customers/webauthn/passkeys/${encodeURIComponent(id)}`, { method: "DELETE", credentials: "include" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Could not remove the passkey.");
      setPasskeys((list) => list.filter((p) => p.id !== id));
      toast.success(__("Passkey removed."));
    } catch (e: any) {
      toast.error(__(e.message));
    } finally {
      setRemoving(null);
      setConfirming(null);
    }
  };

  if (!enabled) return null;

  const formatDate = (d: string | null) => (d ? new Date(d).toLocaleDateString(locale, { year: "numeric", month: "short", day: "numeric" }) : "");

  return (
    <div className="space-y-4">
      <Separator />
      <div>
        <h3 className="text-lg font-semibold">{__("Passkeys")}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{__("Sign in with your fingerprint, face or device PIN instead of a password.")}</p>
      </div>

      {passkeys.length > 0 && (
        <ul className="border divide-y rounded-md border-zinc-200 dark:border-zinc-800 divide-zinc-200 dark:divide-zinc-800">
          {passkeys.map((p) => (
            <li key={p.id} className="flex items-center gap-3 px-4 py-3">
              <KeyRound className="w-5 h-5 shrink-0 text-muted-foreground" />
              <div className="flex-1 min-w-0">
                <div className="font-medium truncate">{p.name}</div>
                <div className="text-xs text-muted-foreground">
                  {p.createdAt && `${__("Added")} ${formatDate(p.createdAt)}`}
                  {p.lastUsedAt && ` · ${__("Last used")} ${formatDate(p.lastUsedAt)}`}
                </div>
              </div>
              {confirming === p.id ? (
                <div className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="destructive" disabled={removing === p.id} onClick={() => onRemove(p.id)}>
                    {removing === p.id ? __("Removing...") : __("Remove")}
                  </Button>
                  <Button type="button" size="sm" variant="ghost" onClick={() => setConfirming(null)}>
                    {__("Cancel")}
                  </Button>
                </div>
              ) : (
                <Button type="button" size="sm" variant="ghost" aria-label={__("Remove passkey")} onClick={() => setConfirming(p.id)}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {supported ? (
        <Button type="button" variant="outline" onClick={onAdd} disabled={adding}>
          <KeyRound className="w-4 h-4 mr-2 rtl:ml-2 rtl:mr-0" />
          {adding ? __("Waiting for your device...") : passkeys.length ? __("Add another passkey") : __("Add a passkey")}
        </Button>
      ) : (
        <p className="text-sm text-muted-foreground">{__("This browser doesn't support passkeys.")}</p>
      )}
    </div>
  );
}
