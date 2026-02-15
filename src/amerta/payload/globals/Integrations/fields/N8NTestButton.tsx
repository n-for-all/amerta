// amerta/fields/Integrations/N8NTestButton.tsx
"use client";
import React, { useState } from "react";
import { useFormFields, Button, Modal, useModal } from "@payloadcms/ui";

const modalSlug = "n8n-result-modal";

export const N8NTestButton: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; data?: any; error?: string } | null>(null);
  const { toggleModal } = useModal();

  const orderField = useFormFields(([fields]) => fields.testOrder);
  const orderId = orderField?.value;

  const handleSendTest = async () => {
    if (!orderId) return alert("Please select an order first!");

    setLoading(true);
    try {
      const res = await fetch("/api/globals/integrations/test-n8n", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const data = await res.json();
      setResult({
        success: res.ok,
        data: data, // Full details from your endpoint/n8n
        error: res.ok ? null : data.error || "Failed to connect to n8n",
      });

      toggleModal(modalSlug);
    } catch (e) {
      setResult({ success: false, error: "Network error: Could not reach Amerta API" });
      toggleModal(modalSlug);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ marginTop: "20px" }}>
      <Button buttonStyle="primary" onClick={handleSendTest} disabled={loading || !orderId}>
        {loading ? "Processing..." : "Send Test Order to n8n"}
      </Button>

      <Modal
        slug={modalSlug}
        className="modal-dialog"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "rgba(0,0,0,0.8)",
          zIndex: 9999,
        }}
      >
        <div
          style={{
            padding: "30px",
            width: "90vw",
            maxWidth: "600px",
            backgroundColor: "var(--theme-elevation-100)",
            borderRadius: "4px",
            maxHeight: "80vh",
            overflowY: "auto",
          }}
        >
          <h2
            style={{
              marginBottom: "15px",
              color: result?.success ? "var(--theme-success-500)" : "var(--theme-error-500)",
            }}
          >
            {result?.success ? "✅ Webhook Sent" : "❌ Integration Error"}
          </h2>

          <div style={{ marginBottom: "20px" }}>{result?.success ? <p>The order payload was successfully delivered to n8n. Below are the details received:</p> : <p>Something went wrong during the integration test:</p>}</div>

          <pre
            style={{
              padding: "15px",
              backgroundColor: "var(--theme-elevation-50)",
              borderRadius: "4px",
              fontSize: "12px",
              overflowX: "auto",
              border: "1px solid var(--theme-elevation-200)",
              color: "var(--theme-text)",
            }}
          >
            {JSON.stringify(result?.data || result?.error, null, 2)}
          </pre>

          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "25px" }}>
            <Button buttonStyle="secondary" onClick={() => toggleModal(modalSlug)}>
              Close
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
