"use client";
import React, { useState } from "react";
import { Button } from "@payloadcms/ui/elements/Button";
import { getAdminApiURL } from "@/amerta/utilities/getAdminURL";

export const ImportBlogs = () => {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0); // State for progress

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    setUploadProgress(0);
    setLogs(["Reading file...", "Starting upload..."]);

    const formData = new FormData();
    formData.append("file", file);

    // Use XMLHttpRequest to track upload progress
    const xhr = new XMLHttpRequest();
    xhr.open("POST", getAdminApiURL("/import-wp-xml"), true);

    // Track Progress
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        setUploadProgress(percentComplete);

        if (percentComplete === 100) {
          setLogs((prev) => [...prev, "Upload complete. Waiting for server to process XML..."]);
        }
      }
    };

    // Handle Response
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const json = JSON.parse(xhr.responseText);
          if (json.logs) {
            setLogs(json.logs);
          } else if (json.error) {
            setLogs((prev) => [...prev, `Error: ${json.error}`]);
          }
        } catch (error: any) {
          setLogs((prev) => [...prev, "Error parsing server response: " + error.message]);
        }
      } else {
        setLogs((prev) => [...prev, `Server Error: ${xhr.statusText}`]);
      }
      setLoading(false);
    };

    // Handle Network Errors
    xhr.onerror = () => {
      setLogs((prev) => [...prev, "Failed to connect to server."]);
      setLoading(false);
    };

    xhr.send(formData);
  };

  return (
    <div>
      <h1 style={{ marginBottom: "20px" }}>Import WordPress XML</h1>
      <p style={{ marginBottom: "40px", maxWidth: "600px", color: "#888" }}>Upload a standard WordPress XML export file. This will import Categories first, then Posts, linking them together.</p>

      <input type="file" accept=".xml" onChange={handleUpload} style={{ display: "none" }} id="wp-file-upload" disabled={loading} />

      <div style={{ display: "flex", alignItems: "center", gap: "20px", marginBottom: "20px" }}>
        <label htmlFor="wp-file-upload">
          <Button size="large" onClick={() => document.getElementById("wp-file-upload")?.click()} disabled={loading}>
            {loading ? "Processing..." : "Select XML File"}
          </Button>
        </label>

        {/* Progress Bar Container */}
        {loading && (
          <div style={{ flex: 1, maxWidth: "300px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: "5px",
                fontSize: "12px",
                color: "#888",
              }}
            >
              <span>{uploadProgress < 100 ? "Uploading..." : "Processing..."}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div
              style={{
                width: "100%",
                height: "8px",
                background: "#333",
                borderRadius: "4px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: "100%",
                  background: uploadProgress < 100 ? "#0069ff" : "#00ff88", // Blue while uploading, Green when done
                  transition: "width 0.2s ease",
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div
        style={{
          marginTop: "20px",
          background: "#111",
          padding: "15px",
          borderRadius: "8px",
          height: "400px",
          overflowY: "auto",
          fontFamily: "monospace",
          fontSize: "12px",
          color: "#0f0", // Matrix green for logs
          whiteSpace: "pre-wrap",
        }}
      >
        {logs.map((l, i) => (
          <div key={i} style={{ marginBottom: "4px", borderBottom: "1px solid #222" }}>
            {l}
          </div>
        ))}
      </div>
    </div>
  );
};
