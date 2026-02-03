"use client";
import { useState, useRef } from "react";
import { Button } from "@payloadcms/ui"; // Ensure you import TextInput
import { getAdminApiURL } from "@/amerta/utilities/getAdminURL";

export const ImportShopifyDataClient = () => {
  const [url, setUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [message, setMessage] = useState("");
  const [logs, setLogs] = useState<string[]>([]);

  const abortControllerRef = useRef<AbortController | null>(null);

  const handleImport = async () => {
    if (!url) {
      setMessage("❌ Please enter a Shopify URL");
      return;
    }

    setImporting(true);
    setProgress(0);
    setLogs([]);
    setMessage("Starting connection...");

    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      const response = await fetch(getAdminApiURL("/import-shopify-data"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }), // Send URL here
        signal: abortController.signal,
      });

      if (!response.body) throw new Error("No response body");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let done = false;

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;

        if (value) {
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n").filter((line) => line.trim() !== "");

          for (const line of lines) {
            try {
              const data = JSON.parse(line);

              if (data.error) throw new Error(data.error);
              if (data.done) {
                setMessage("Import Complete!");
                setProgress(100);
                setImporting(false);
                return;
              }

              if (data.progress) setProgress(data.progress);
              if (data.message) setMessage(data.message);
              if (data.logs) setLogs(data.logs);
            } catch (e) {
              console.error("Error parsing chunk", e);
            }
          }
        }
      }
    } catch (error: any) {
      if (error.name === "AbortError") {
        setMessage("❌ Import Cancelled");
      } else {
        setMessage(`❌ Error: ${error.message}`);
      }
      setImporting(false);
    }
  };

  const handleCancel = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  };

  return (
    <div style={{ padding: "20px 0", borderTop: "1px solid var(--theme-elevation-200)" }}>      
      <div style={{ marginBottom: "20px", maxWidth: "400px" }}>
        <label 
            style={{ 
                display: "block", 
                marginBottom: "8px", 
                fontSize: "12px", 
                fontWeight: "bold",
                color: "var(--theme-elevation-800)" 
            }}
        >
            Shopify Store URL
        </label>
        <input 
            type="text" 
            placeholder="https://www.shopify-sample-store.com"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            disabled={importing}
            style={{
                width: "100%",
                padding: "10px",
                border: "1px solid var(--theme-elevation-200)",
                background: "var(--theme-elevation-50)",
                color: "var(--theme-elevation-800)",
                borderRadius: "4px"
            }}
        />
        <p style={{ fontSize: "11px", color: "var(--theme-elevation-500)", marginTop: "5px" }}>
            The URL must be a public Shopify storefront.
        </p>
      </div>

      {importing && (
        <div style={{ margin: "20px 0" }}>
          <div
            style={{
              height: "10px",
              width: "100%",
              background: "var(--theme-elevation-200)",
              borderRadius: "5px",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                height: "100%",
                width: `${progress}%`,
                background: "var(--theme-success-500)",
                transition: "width 0.3s ease",
              }}
            />
          </div>
          <p style={{ marginTop: "10px", fontSize: "12px", color: "var(--theme-elevation-800)" }}>
            {message} ({progress}%)
          </p>
        </div>
      )}

      <div style={{ display: "flex", gap: "10px" }}>
        {!importing ? (
          <Button onClick={handleImport} size="large" disabled={!url}>
            Start Import
          </Button>
        ) : (
          <Button onClick={handleCancel} buttonStyle="secondary" size="large">
            Cancel
          </Button>
        )}
      </div>

      {logs.length > 0 && (
        <div style={{ marginTop: "20px", maxHeight: "200px", overflowY: "auto", background: "var(--theme-elevation-50)", padding: "10px", fontSize: "11px", fontFamily: "monospace", borderRadius: "4px", border: "1px solid var(--theme-elevation-100)" }}>
          {logs.map((l, i) => (
            <div key={i} style={{ marginBottom: "2px" }}>{l}</div>
          ))}
        </div>
      )}
    </div>
  );
};