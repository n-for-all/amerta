// src/components/LocaleSelector.tsx
"use client";

import React, { useEffect } from "react";
import { useField } from "@payloadcms/ui";
import { Label } from "@/amerta/theme/ui/label";
import { DEFAULT_LOCALE, LOCALES } from "@/amerta/localization/locales";

type Props = {
  path: string;
  label: string;
};

export const LocaleSelector: React.FC<Props> = ({ path, label }) => {
  const { value, setValue } = useField<string[]>({ path });

  const availableLocales = LOCALES;
  const allCodes = availableLocales.map((l: any) => (typeof l === "string" ? l : l.code));

  // Auto-fill defaults if empty
  useEffect(() => {
    if (!value || value.length === 0) {
      setValue(allCodes);
    }
  }, [allCodes, setValue, value]);

  // Derived state for "Select All"
  const isAllSelected = value?.length === allCodes.length;

  const handleToggle = (code: string) => {
    const current = Array.isArray(value) ? value : [];

    if (current.includes(code)) {
      if (current.length <= 1) return; // Prevent emptying list
      setValue(current.filter((c) => c !== code));
    } else {
      setValue([...current, code]);
    }
  };

  const handleSelectAll = () => {
    if (isAllSelected) {
      // If unchecking "Select All", reset to just the first locale (Safety fallback)
      // We cannot set to [] because the useEffect would just refill it all.
      setValue([allCodes[0]]);
    } else {
      setValue(allCodes);
    }
  };

  return (
    <div className="field-type locale-selector">
      {/* HEADER ROW: Label + Select All */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
        <Label htmlFor={path}>{label}</Label>

        <div
          onClick={handleSelectAll}
          style={{
            display: "flex",
            alignItems: "center",
            cursor: "pointer",
            fontSize: "0.85em",
            userSelect: "none",
          }}
        >
          <input type="checkbox" checked={isAllSelected} readOnly style={{ marginRight: "8px", cursor: "pointer" }} />
          <span>{isAllSelected ? "Deselect All" : "Select All"}</span>
        </div>
      </div>

      {/* GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
          gap: "10px",
        }}
      >
        {availableLocales.map((locale: any) => {
          const code = typeof locale === "string" ? locale : locale.code;
          const localeLabel = typeof locale === "string" ? locale : locale.label || locale.code;

          const isEnabled = Array.isArray(value) && value.includes(code);
          const isLastItem = isEnabled && value?.length === 1;

          return (
            <div
              key={code}
              onClick={() => !isLastItem && handleToggle(code)}
              style={{
                display: "flex",
                alignItems: "center",
                padding: "12px",
                border: `1px solid ${isEnabled ? "var(--theme-success-500)" : "var(--theme-elevation-200)"}`,
                borderRadius: "4px",
                cursor: isLastItem || DEFAULT_LOCALE === code ? "not-allowed" : "pointer",
                backgroundColor: isEnabled ? "rgba(var(--theme-success-500-rgb), 0.1)" : "transparent",
                opacity: isLastItem || DEFAULT_LOCALE === code ? 0.5 : 1,
                transition: "all 0.2s ease",
              }}
              title={isLastItem ? "At least one language must be enabled" : ""}
            >
              <input
                type="checkbox"
                checked={isEnabled || isLastItem || DEFAULT_LOCALE === code}
                readOnly
                style={{
                  marginRight: "10px",
                  cursor: isLastItem || DEFAULT_LOCALE === code ? "not-allowed" : "pointer",
                  width: "18px",
                  height: "18px",
                }}
              />
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontWeight: "bold" }}>{typeof localeLabel === "string" ? localeLabel : code}</span>
                <span style={{ fontSize: "0.8em", opacity: 0.7 }}>
                  Code: {code} {DEFAULT_LOCALE === code ? "(Default)" : ""}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* FOOTER INSTRUCTIONS */}
      <div
        style={{
          marginTop: "20px",
          paddingTop: "15px",
          borderTop: "1px solid var(--theme-elevation-200)",
          fontSize: "0.85em",
          color: "var(--theme-elevation-500)",
          lineHeight: "1.5",
        }}
      >
        <p style={{ margin: 0 }}>
          <strong>Missing a language?</strong> New locales must be added to the server configuration manually.
          <br />
          Please edit <code>payload.config.ts</code> or <a href="https://payloadcms.com/docs/configuration/localization" target="_blank" rel="noopener noreferrer" style={{ textDecoration: "underline", color: "var(--theme-primary-500)" }} onMouseOver={(e) => (e.currentTarget.style.color = "var(--theme-primary-600)")} onMouseOut={(e) => (e.currentTarget.style.color = "var(--theme-primary-500)")}>
            check the documentation
          </a> for more details, Please note that default locale can only be changed from the server configuration (.env) file.
        </p>
      </div>
    </div>
  );
};
