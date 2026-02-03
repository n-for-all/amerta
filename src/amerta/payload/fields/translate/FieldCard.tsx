import React from "react";
import { hasContent } from "./AIAgentButton";
import RichText from "@/amerta/theme/components/RichText";

export const FieldCard = ({ field, type, leftValue, rightValue, leftLabel, rightLabel, isSelected, isDisabled, onToggle, badge, singleCol }: any) => {
  return (
    <label
      style={{
        display: "flex",
        gap: "12px",
        cursor: isDisabled ? "not-allowed" : "pointer",
        alignItems: "flex-start",
        padding: "12px",
        background: "#f9fafb",
        border: isSelected ? "1px solid var(--theme-primary-500)" : "1px solid #e5e7eb",
        borderRadius: "6px",
        opacity: isDisabled ? 0.6 : 1,
        transition: "all 0.2s",
      }}
    >
      <input type="checkbox" disabled={isDisabled} checked={isSelected} onChange={onToggle} style={{ width: "18px", height: "18px", marginTop: "4px", flexShrink: 0 }} />

      <div style={{ display: "flex", flexDirection: "column", width: "100%", overflow: "hidden", gap: "8px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "bold", fontFamily: "monospace", color: "#374151" }}>{field}</span>
            <span style={{ fontSize: "0.65rem", color: "#666", background: "#eee", padding: "1px 4px", borderRadius: "3px" }}>{type}</span>
          </div>
          <span
            style={{
              fontSize: "0.7rem",
              background: badge.color === "green" ? "#d1fae5" : badge.color === "blue" ? "#dbeafe" : badge.color === "red" ? "#fee2e2" : "#f3f4f6",
              color: badge.color === "green" ? "#065f46" : badge.color === "blue" ? "#1e40af" : badge.color === "red" ? "#991b1b" : "#6b7280",
              padding: "2px 6px",
              borderRadius: "4px",
            }}
          >
            {badge.text}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: singleCol ? "1fr" : "1fr 1fr", gap: "8px" }}>
          {/* Left / Source Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
            <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#9ca3af" }}>{leftLabel}</span>
            <div style={{ fontSize: "0.8rem", color: "#4b5563", background: "#fff", padding: "8px", borderRadius: "4px", border: "1px solid #e5e7eb", maxHeight: "80px", overflow: "hidden" }}>
              {hasContent(leftValue) ? (
                typeof leftValue === "string" ? (
                  <span>
                    "{leftValue.substring(0, 80)}
                    {leftValue.length > 80 ? "..." : ""}"
                  </span>
                ) : (
                  <div style={{ transformOrigin: "top left", transform: "scale(0.8)" }}>
                    <RichText data={leftValue} enableGutter={false} />
                  </div>
                )
              ) : (
                <span style={{ fontStyle: "italic", color: "#d1d5db" }}>Empty</span>
              )}
            </div>
          </div>

          {/* Right / Target Column */}
          {!singleCol && (
            <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
              <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#9ca3af" }}>{rightLabel}</span>
              <div style={{ fontSize: "0.8rem", color: "#4b5563", background: hasContent(rightValue) ? "#fff" : "#fff1f2", padding: "8px", borderRadius: "4px", border: hasContent(rightValue) ? "1px solid #e5e7eb" : "1px dashed #fca5a5", maxHeight: "80px", overflow: "hidden" }}>
                {hasContent(rightValue) ? (
                  typeof rightValue === "string" ? (
                    <span dir="auto">
                      "{rightValue.substring(0, 80)}
                      {rightValue.length > 80 ? "..." : ""}"
                    </span>
                  ) : (
                    <div style={{ transformOrigin: "top left", transform: "scale(0.8)" }} dir="auto">
                      <RichText data={rightValue} enableGutter={false} />
                    </div>
                  )
                ) : (
                  <span style={{ fontStyle: "italic", color: "#9ca3af" }}>Not translated yet</span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </label>
  );
};
