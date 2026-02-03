"use client";

import React, { useEffect, useState } from "react";
import { useAllFormFields, useForm, Button, useModal, toast, useLocale } from "@payloadcms/ui";
import { generateContentAction } from "../actions/generate";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { FieldDef, getLocalizedValue, hasContent } from "../AIAgentButton";
import { FieldCard } from "../FieldCard";

interface Props {
  data: any;
  fields: FieldDef[];
  drawerSlug: string;
}

export const CreateTab: React.FC<Props> = ({ data, fields, drawerSlug }) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [userPrompt, setUserPrompt] = useState("");
  const [isPending, setIsPending] = useState(false);

  const { closeModal } = useModal();
  const [, dispatchFields] = useAllFormFields();
  const locale = useLocale();
  const { setModified } = useForm();

  useEffect(() => {
    const toCreate = fields
      .filter((f) => {
        if (f.path === "title") return false;
        const val = getLocalizedValue(data, f.path, locale.code) || getLocalizedValue(data, f.path, DEFAULT_LOCALE);
        return hasContent(val);
      })
      .map((f) => f.path);
    setSelectedFields(toCreate);
  }, [data, fields, locale.code]);

  const handleCreate = async () => {
    if (!userPrompt.trim()) {
      toast.error("Please enter instructions.");
      return;
    }

    setIsPending(true);
    const dataToProcess: Record<string, any> = {};

    const fieldTypesMap: Record<string, string> = {};

    selectedFields.forEach((path) => {
      const fieldDef = fields.find((f) => f.path === path);
      if (fieldDef) {
        fieldTypesMap[path] = fieldDef.type;
      }

      const currentValue = getLocalizedValue(data, path, locale.code) || getLocalizedValue(data, path, DEFAULT_LOCALE);
      dataToProcess[path] = currentValue || "";
    });

    try {
      const generatedData = await generateContentAction(dataToProcess, fieldTypesMap, userPrompt, locale.code);

      Object.entries(generatedData).forEach(([key, value]) => {
        const freshValue = typeof value === 'object' ? JSON.parse(JSON.stringify(value)) : value;
        dispatchFields({ type: "UPDATE", path: key, value: freshValue });
      });

      setIsPending(false);
      setModified(true);
      closeModal(drawerSlug);
      toast.success("Content Generated!");
    } catch (err: any) {
      toast.error(err.message || "Generation failed.");
      setIsPending(false);
    }
  };

  return (
    <>
      <div style={{ flex: 1, padding: "20px", paddingBottom: "100px" }}>
        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "14px" }}>Instruction / Prompt</label>
          <textarea
            value={userPrompt}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="e.g. 'Rewrite content to be more energetic...'"
            style={{
              width: "100%",
              padding: "12px",
              borderRadius: "6px",
              border: "1px solid #ccc",
              minHeight: "100px",
              fontSize: "14px",
              fontFamily: "inherit",
              outline: "none",
            }}
          />
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <h4 style={{ margin: 0, fontSize: "14px" }}>Select Fields</h4>
          <button onClick={() => setSelectedFields(fields.filter((f) => f.path !== "title").map((f) => f.path))} style={{ fontSize: "12px", color: "var(--theme-primary-500)", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}>
            Select All
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {fields.map((f) => {
            const currentValue = getLocalizedValue(data, f.path, locale.code) || getLocalizedValue(data, f.path, DEFAULT_LOCALE);
            const hasVal = hasContent(currentValue);

            return (
              <FieldCard
                key={f.path}
                field={f.path}
                type={f.type}
                leftValue={currentValue}
                leftLabel="CURRENT CONTENT"
                isSelected={selectedFields.includes(f.path)}
                isDisabled={false}
                onToggle={() => {
                  setSelectedFields((prev) => (prev.includes(f.path) ? prev.filter((p) => p !== f.path) : [...prev, f.path]));
                }}
                badge={hasVal ? { text: "Has Content", color: "blue" } : { text: "Empty", color: "gray" }}
                singleCol
              />
            );
          })}
        </div>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "white", padding: "20px", borderTop: "1px solid #eee", zIndex: 10 }}>
        <Button onClick={handleCreate} disabled={isPending || selectedFields.length === 0 || !userPrompt.trim()} size="large" className="w-full">
          {isPending ? "Generating..." : `Generate Content for ${selectedFields.length} Fields`}
        </Button>
      </div>
    </>
  );
};
