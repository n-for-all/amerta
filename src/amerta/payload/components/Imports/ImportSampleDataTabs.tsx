"use client";
import React, { useState } from "react";
import { ImportSampleDataClient } from "./ImportSampleDataClient";
import { ImportPagesClient } from "./ImportPagesClient";
import { ImportBlogsClient } from "./ImportBlogsClient";

const tabs = [
  { label: "Products", value: "products" },
  { label: "Pages", value: "pages" },
  { label: "Blogs", value: "blogs" },
];

export const ImportSampleDataTabs = () => {
  const [activeTab, setActiveTab] = useState("products");

  return (
    <div>
      <div
        style={{
          display: "flex",
          gap: "20px",
          borderBottom: "1px solid var(--theme-elevation-150)",
          marginBottom: "40px",
        }}
      >
        {tabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setActiveTab(tab.value)}
            style={{
              background: "none",
              border: "none",
              padding: "15px 0",
              cursor: "pointer",
              fontSize: "1rem",
              fontWeight: 600,
              color: activeTab === tab.value ? "var(--theme-text)" : "var(--theme-elevation-400)",
              borderBottom: activeTab === tab.value ? "2px solid var(--theme-text)" : "2px solid transparent",
              transition: "all 0.2s ease",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* --- Tab Content --- */}
      <div className="tab-content">
        {activeTab === "products" && <ImportSampleDataClient />}
        {activeTab === "pages" && <ImportPagesClient />}
        {activeTab === "blogs" && <ImportBlogsClient />}
      </div>
    </div>
  );
};
