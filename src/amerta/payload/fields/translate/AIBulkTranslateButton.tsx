"use client";

import React, { useState, useEffect } from "react";
import { useSelection, useConfig, DrawerToggler, Drawer, Button, useModal } from "@payloadcms/ui";
import { toast } from "sonner";
import { applyTranslations, generateTranslationPreviews } from "./actions/translateBulk";

// Type definitions
type FieldPreview = { key: string; original: string; translated: string };
type DocPreview = { id: string; title: string; fields: FieldPreview[] };

const drawerSlug = "ai-bulk-translate-drawer";

export const AIBulkTranslateButton: React.FC<{ collectionSlug: string }> = ({ collectionSlug }) => {
  const { selected, count } = useSelection();
  const { config } = useConfig();
  const { closeModal } = useModal();

  // State Management
  const [step, setStep] = useState<"config" | "preview" | "saving">("config");
  const [targetLocale, setTargetLocale] = useState<string>("");
  const [previews, setPreviews] = useState<DocPreview[]>([]);
  const [selectedUpdates, setSelectedUpdates] = useState<Record<string, string[]>>({});
  
  // 1. New Loading State
  const [isGenerating, setIsGenerating] = useState(false);

  // Reset state when drawer opens/closes or count changes
  useEffect(() => {
    if (count === 0) return;
    const codes = config.localization ? config.localization.locales.map((l) => l.code) : [];
    if (codes.length > 1 && !targetLocale) setTargetLocale(codes[1]!);
  }, [config, count]);

  // --- HANDLERS ---

  const handleGeneratePreviews = async () => {
    if (!targetLocale) return toast.error("Please select a target locale");

    // 2. Start Loading
    setIsGenerating(true);
    toast.info("Generating translations...");

    try {
      // Don't switch step yet! Wait for data.
      const ids = Array.from(selected.keys()) as string[];
      const result = await generateTranslationPreviews(collectionSlug, ids, targetLocale);

      if (result.success) {
        setPreviews(result.previews);

        // Auto-select all generated fields
        const initialSelection: Record<string, string[]> = {};
        result.previews.forEach((doc) => {
          initialSelection[doc.id] = doc.fields.map((f) => f.key);
        });
        setSelectedUpdates(initialSelection);
        
        // 3. Data ready, NOW switch to preview
        setStep("preview");
      } else {
        toast.error("Failed to generate previews");
      }
    } catch (e) {
      toast.error("An unexpected error occurred");
      console.error(e);
    } finally {
      // 4. Stop Loading
      setIsGenerating(false);
    }
  };

  const handleToggleField = (docId: string, fieldKey: string) => {
    setSelectedUpdates((prev) => {
      const currentFields = prev[docId] || [];
      const isSelected = currentFields.includes(fieldKey);

      if (isSelected) {
        return { ...prev, [docId]: currentFields.filter((k) => k !== fieldKey) };
      } else {
        return { ...prev, [docId]: [...currentFields, fieldKey] };
      }
    });
  };

  const handleApply = async () => {
    setStep("saving");

    const finalData = previews
      .map((doc) => ({
        id: doc.id,
        fields: doc.fields.filter((f) => selectedUpdates[doc.id]?.includes(f.key)),
      }))
      .filter((doc) => doc.fields.length > 0);

    if (finalData.length === 0) {
      toast.warning("No fields selected to apply");
      setStep("preview");
      return;
    }

    const result = await applyTranslations(collectionSlug, finalData, targetLocale);

    if (result.success) {
      toast.success(`Updated ${result.count} records!`);
      closeModal(drawerSlug);
      setStep("config");
    } else {
      toast.error("Failed to save changes");
      setStep("preview");
    }
  };

  const localization = config.localization;
  if (!localization) return null;

  return (
    <>
      <div style={{ display: "flex", justifyContent: "flex-end", "--margin-block": "1rem" } as React.CSSProperties}>
        <DrawerToggler slug={drawerSlug} className="btn btn--style-secondary btn--size-small btn--icon-style-with-border">
          ✨ AI Translate ({count})
        </DrawerToggler>
      </div>

      <Drawer slug={drawerSlug}>
        <div style={{ padding: "40px", maxWidth: "800px", margin: "0 auto" }}>
          <h2 style={{ marginBottom: "20px" }}>AI Translation Helper</h2>

          {/* STEP 1: CONFIGURATION */}
          {step === "config" && (
            <div className="flex flex-col gap-6">
              <div className="field-type">
                <label className="field-label">Target Language</label>
                <select
                  className="payload-input"
                  style={{ width: "100%", padding: "10px", border: "1px solid #ccc", borderRadius: "4px" }}
                  value={targetLocale}
                  onChange={(e) => setTargetLocale(e.target.value)}
                  disabled={isGenerating} // Disable input while loading
                >
                  <option value="" disabled>Select Locale</option>
                  {localization?.locales.map((l) => (
                    <option key={l.code} value={l.code}>
                      {(l.label || l.code) as string}
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-4 text-sm text-gray-600 bg-gray-100 rounded" style={{ background: "#f3f3f3", padding: "15px", borderRadius: "4px" }}>
                <p>This will generate translation drafts for <strong>{count}</strong> selected documents.</p>
                <p>You will be able to review and approve changes in the next step.</p>
              </div>

              {/* 5. Updated Button with Loading State */}
              <Button 
                onClick={handleGeneratePreviews} 
                size="large"
                disabled={isGenerating || !targetLocale}
              >
                {isGenerating ? "Generating Drafts..." : "Generate Previews"}
              </Button>
            </div>
          )}

          {/* STEP 2: REVIEW & APPROVE */}
          {step === "preview" && (
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
                <h3>Review Translations ({targetLocale})</h3>
                <Button buttonStyle="secondary" size="small" onClick={() => setStep("config")}>
                  Back
                </Button>
              </div>
              {/* ... (Existing Preview JSX) ... */}
              <div style={{ maxHeight: "60vh", overflowY: "auto", border: "1px solid #eaeaea", borderRadius: "4px" }}>
                {previews.map((doc) => (
                  <div key={doc.id} style={{ borderBottom: "1px solid #eaeaea", padding: "20px" }}>
                    <h4 style={{ marginBottom: "10px", fontSize: "0.9em", color: "#888" }}>Document: {doc.title}</h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {doc.fields.map((field) => (
                        <label
                          key={field.key}
                          style={{
                            display: "grid",
                            gridTemplateColumns: "30px 100px 1fr 1fr",
                            alignItems: "start",
                            gap: "10px",
                            cursor: "pointer",
                            background: selectedUpdates[doc.id]?.includes(field.key) ? "#f0f9ff" : "transparent",
                            padding: "10px",
                            borderRadius: "4px",
                          }}
                        >
                          <input type="checkbox" checked={selectedUpdates[doc.id]?.includes(field.key) || false} onChange={() => handleToggleField(doc.id, field.key)} style={{ marginTop: "5px" }} />
                          <span style={{ fontWeight: "bold", fontSize: "0.85em" }}>{field.key}</span>
                          <span style={{ fontSize: "0.9em", color: "#666" }}>{field.original}</span>
                          <span style={{ fontSize: "0.9em", color: "#000" }}>{field.translated}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <Button buttonStyle="none" onClick={() => closeModal(drawerSlug)}>Cancel</Button>
                <Button onClick={handleApply} size="large">Apply Selected Changes</Button>
              </div>
            </div>
          )}

          {/* STEP 3: SAVING */}
          {step === "saving" && (
            <div style={{ textAlign: "center", padding: "40px" }}>
              {/* Optional: Add a simple spinner here */}
              <div style={{ marginBottom: '15px', fontSize: '24px' }}>💾</div>
              <h3>Saving translations...</h3>
              <p>Please wait while we update your records.</p>
            </div>
          )}
        </div>
      </Drawer>
    </>
  );
};