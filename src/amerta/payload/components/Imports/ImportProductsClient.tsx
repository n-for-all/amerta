"use client";
import React, { useState } from "react";
import { Button } from "@payloadcms/ui/elements/Button";
import { getAdminApiURL } from "@/amerta/utilities/getAdminURL";

export const ImportProductsClient = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setLogs(["Uploading to server for processing..."]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch(getAdminApiURL("/import-woo-products"), {
        method: "POST",
        body: formData,
      });
      const json = await res.json();

      if (json.logs) {
        setLogs(json.logs);
      } else if (json.error) {
        setLogs([`Error: ${json.error}`]);
      }
    } catch {
      setLogs(["Failed to connect to server."]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Import Woocommerce Products</h1>
      <p style={{ marginBottom: "40px", maxWidth: "600px", color: "#888" }}>Upload a CSV file from Woocommerce to bulk import products into your store.</p>

      <input type="file" accept=".csv" onChange={handleUpload} style={{ display: "none" }} id="file-upload" disabled={loading} />
      <label htmlFor="file-upload">
        <Button size="large" onClick={() => document.getElementById("file-upload")?.click()} disabled={loading}>
          {loading ? "Processing on Server..." : "Select CSV File"}
        </Button>
      </label>

      <div style={{ marginTop: "20px", background: "#111", padding: "15px", borderRadius: "8px", height: "300px", overflowY: "auto", fontFamily: "monospace", fontSize: "12px", color: "#ccc" }}>
        {logs.map((l, i) => (
          <div key={i}>{l}</div>
        ))}
      </div>
    </div>
  );
};
