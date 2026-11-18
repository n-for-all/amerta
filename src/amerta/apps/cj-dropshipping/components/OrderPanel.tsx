"use client";

import React, { useCallback, useEffect, useState } from "react";
import { Button, toast, useDocumentInfo, useForm } from "@payloadcms/ui";

/**
 * Sidebar panel on orders that contain CJ products: review checks, pick shipping, send the order
 * to CJ (and pay it from the CJ wallet), then follow status and tracking. Renders nothing otherwise.
 */

const API = "/api/cj-dropshipping/order";

const box: React.CSSProperties = {
  border: "1px solid var(--theme-elevation-150)",
  borderRadius: "var(--style-radius-m, 4px)",
  padding: "1rem",
  marginBottom: "1.5rem",
  fontSize: "0.85rem",
  lineHeight: 1.45,
};
const muted: React.CSSProperties = { color: "var(--theme-elevation-500)" };
const row: React.CSSProperties = { display: "flex", justifyContent: "space-between", gap: "0.5rem" };
const levelColor: Record<string, string> = {
  high: "var(--theme-error-500, #d32f2f)",
  medium: "var(--theme-warning-500, #ed6c02)",
  info: "var(--theme-elevation-400)",
};
const usd = (n?: number | null) => (n == null || Number.isNaN(n) ? "—" : `$${Number(n).toFixed(2)}`);

export const CJOrderPanel: React.FC = () => {
  const { id } = useDocumentInfo();
  const { fields } = useForm();
  const [info, setInfo] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [logisticName, setLogisticName] = useState("");
  const [confirming, setConfirming] = useState<null | "pay" | "create">(null);

  const formModified = Object.values(fields || {}).some((f: any) => f && typeof f === "object" && f.value !== f.initialValue);

  const load = useCallback(
    async (refresh = false) => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetch(`${API}?id=${encodeURIComponent(String(id))}${refresh ? "&refresh=1" : ""}`, { credentials: "include" });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Failed to load");
        setInfo(data);
        if (data.shipping?.length) setLogisticName((cur) => cur || data.shipping[0].name);
        // CJ added tracking / marked the order shipped: reload so the form shows it (and a save can't undo it)
        if (data.orderChanged) {
          if (!formModified) window.location.reload();
          else toast.info("CJ shipped this order. Reload the page before saving to keep the tracking number.");
        }
      } catch (err: any) {
        setInfo({ isDropship: true, loadError: err.message });
      } finally {
        setLoading(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [id],
  );

  useEffect(() => {
    load(true);
  }, [load]);

  const post = async (path: string, body: any, success: string) => {
    setBusy(true);
    try {
      const res = await fetch(`${API}/${path}`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...body }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Request failed");
      if (data.payError) toast.warning(`Order created on CJ, but payment failed: ${data.payError}`);
      else toast.success(success);
      await load(false);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setBusy(false);
      setConfirming(null);
    }
  };

  if (!id || !info || info.isDropship === false) return null;

  if (info.loadError) {
    return (
      <div style={box}>
        <strong>CJ Dropshipping</strong>
        <p style={{ color: levelColor.high, margin: "0.5rem 0" }}>{info.loadError}</p>
        <Button buttonStyle="secondary" size="small" onClick={() => load(true)}>
          Retry
        </Button>
      </div>
    );
  }

  const cj = info.cjOrder || {};
  const lines: any[] = info.lines || [];

  const itemList = (
    <ul style={{ listStyle: "none", padding: 0, margin: "0.5rem 0" }}>
      {lines.map((l, i) => (
        <li key={i} style={{ ...row, padding: "0.2rem 0" }}>
          <span>
            {l.quantity}× {l.name}
            {l.variantText ? <span style={muted}> · {l.variantText}</span> : null}
            {!info.sent && !l.vid ? <span style={{ color: levelColor.high }}> · no CJ variant</span> : null}
          </span>
        </li>
      ))}
    </ul>
  );

  // ---------- Already sent ----------
  if (info.sent) {
    const tracking = cj.trackNumber;
    return (
      <div style={box}>
        <div style={row}>
          <strong>CJ Dropshipping</strong>
          <span style={{ fontWeight: 600 }}>{cj.status}{cj.subStatus ? ` · ${cj.subStatus}` : ""}</span>
        </div>
        {itemList}
        <div style={muted}>CJ order {cj.orderNumber} · {cj.orderId}</div>
        <div style={{ margin: "0.6rem 0" }}>
          <div style={row}><span>Products</span><span>{usd(cj.productAmount)}</span></div>
          <div style={row}><span>Shipping ({cj.logisticName})</span><span>{usd(cj.postageAmount)}</span></div>
          <div style={{ ...row, fontWeight: 600 }}><span>You pay CJ</span><span>{usd(cj.orderAmount)}</span></div>
          <div style={row}><span>Paid</span><span>{cj.paid ? "Yes" : "No"}</span></div>
        </div>
        {tracking ? (
          <div style={{ margin: "0.6rem 0" }}>
            Tracking:{" "}
            <a href={`https://t.17track.net/en#nums=${encodeURIComponent(tracking)}`} target="_blank" rel="noreferrer">
              {tracking}
            </a>
            {cj.trackingProvider ? <span style={muted}> ({cj.trackingProvider})</span> : null}
          </div>
        ) : (
          <div style={{ ...muted, margin: "0.6rem 0" }}>No tracking yet. It is added to the order and emailed to the customer when CJ ships.</div>
        )}
        {cj.error ? <p style={{ color: levelColor.high }}>{cj.error}</p> : null}
        {!cj.paid && info.balance != null ? (
          <p style={info.balance < (cj.orderAmount || 0) ? { color: levelColor.high } : muted}>
            CJ wallet: {usd(info.balance)}
            {info.balance < (cj.orderAmount || 0) ? " (not enough, top up on cjdropshipping.com or pay there)" : ""}
          </p>
        ) : null}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
          {!cj.paid ? (
            <Button size="small" disabled={busy} onClick={() => post("pay", {}, "Paid from your CJ wallet")}>
              Pay {usd(cj.orderAmount)} from wallet
            </Button>
          ) : null}
          <Button buttonStyle="secondary" size="small" disabled={busy || loading} onClick={() => load(true)}>
            {loading ? "Checking…" : "Refresh status"}
          </Button>
          {!cj.paid ? (
            <Button buttonStyle="secondary" size="small" disabled={busy} onClick={() => post("cancel", {}, "CJ order cancelled")}>
              Cancel CJ order
            </Button>
          ) : null}
        </div>
        {cj.syncedAt ? <div style={{ ...muted, marginTop: "0.5rem", fontSize: "0.75rem" }}>Checked {new Date(cj.syncedAt).toLocaleString()}</div> : null}
      </div>
    );
  }

  // ---------- Not sent yet ----------
  const risks: any[] = info.risks || [];
  const missing: string[] = info.address?.missing || [];
  const blocked = !info.paid ? "Only paid orders can be sent." : missing.length ? `Address is missing: ${missing.join(", ")}.` : !logisticName ? "No shipping method available." : "";
  const chosen = (info.shipping || []).find((o: any) => o.name === logisticName);

  return (
    <div style={box}>
      <strong>CJ Dropshipping</strong>
      <div style={muted}>Not sent to CJ yet{cj.status === "CANCELLED" ? " (previous CJ order cancelled)" : ""}</div>
      {itemList}
      {info.otherItems ? <p style={{ color: levelColor.medium }}>{info.otherItems} other item(s) in this order are not from CJ. Ship those yourself.</p> : null}

      {risks.length ? (
        <div style={{ margin: "0.6rem 0" }}>
          <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Checks</div>
          {risks.map((r, i) => (
            <div key={i} style={{ display: "flex", gap: "0.4rem", alignItems: "baseline" }}>
              <span style={{ color: levelColor[r.level], fontSize: "0.7rem" }}>●</span>
              <span>{r.text}</span>
            </div>
          ))}
        </div>
      ) : null}

      <div style={{ margin: "0.6rem 0" }}>
        <div style={{ fontWeight: 600, marginBottom: "0.25rem" }}>Shipping from {info.fromCountryCode}</div>
        {(info.shipping || []).length ? (
          (info.shipping || []).map((o: any) => (
            <label key={o.name} style={{ display: "flex", gap: "0.4rem", alignItems: "baseline", cursor: "pointer" }}>
              <input type="radio" name="cj-logistic" checked={logisticName === o.name} onChange={() => setLogisticName(o.name)} />
              <span style={{ flex: 1 }}>
                {o.name} <span style={muted}>{o.aging ? `${o.aging} days` : ""}</span>
              </span>
              <span>{o.price === 0 ? "Free" : usd(o.price)}</span>
            </label>
          ))
        ) : (
          <div style={{ color: levelColor.high }}>{info.shippingError || "No shipping options"}</div>
        )}
      </div>

      {info.balance != null ? <div style={muted}>CJ wallet: {usd(info.balance)}</div> : null}
      {blocked ? <p style={{ color: levelColor.high }}>{blocked}</p> : null}

      {confirming ? (
        <div style={{ marginTop: "0.6rem" }}>
          <p style={{ margin: "0 0 0.5rem" }}>
            Send {lines.reduce((n, l) => n + l.quantity, 0)} item(s) to CJ with {logisticName}
            {chosen ? ` (${chosen.price === 0 ? "free shipping" : usd(chosen.price)})` : ""}
            {confirming === "pay" ? " and pay from your CJ wallet now?" : ". You pay later on CJ or here."}
          </p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <Button size="small" disabled={busy} onClick={() => post("send", { logisticName, fromCountryCode: info.fromCountryCode, pay: confirming === "pay" }, "Order sent to CJ")}>
              {busy ? "Sending…" : "Confirm"}
            </Button>
            <Button buttonStyle="secondary" size="small" disabled={busy} onClick={() => setConfirming(null)}>
              Back
            </Button>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem", marginTop: "0.6rem" }}>
          <Button size="small" disabled={Boolean(blocked) || busy} onClick={() => setConfirming("pay")}>
            Send to CJ & pay
          </Button>
          <Button buttonStyle="secondary" size="small" disabled={Boolean(blocked) || busy} onClick={() => setConfirming("create")}>
            Send, pay later
          </Button>
        </div>
      )}
    </div>
  );
};
