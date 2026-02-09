"use client";

import React, { useEffect, useState } from "react";
import { useAllFormFields, useForm, Button, useModal, toast, useLocale } from "@payloadcms/ui";
import { translateFieldsAction } from "../actions/translate";
import { DEFAULT_LOCALE, LOCALES } from "@/amerta/localization/locales";
import { FieldDef, getLocalizedValue, hasContent } from "../AIAgentButton";
import { FieldCard } from "../FieldCard";

interface Props {
  data: any;
  fields: FieldDef[];
  drawerSlug: string;
}

export const TranslateTab: React.FC<Props> = ({ data, fields, drawerSlug }) => {
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [isPending, setIsPending] = useState(false);

  const { closeModal } = useModal();
  const [, dispatchFields] = useAllFormFields();
  const locale = useLocale();
  const { setModified } = useForm();

  useEffect(() => {
    const toTranslate = fields
      .filter((f) => {
        const source = getLocalizedValue(data, f.path, DEFAULT_LOCALE);
        const target = getLocalizedValue(data, f.path, locale.code);

        return hasContent(source) && !hasContent(target);
      })
      .map((f) => f.path);

    if (toTranslate.length > 0) {
      setSelectedFields((prev) => (prev.length === 0 ? toTranslate : prev));
    }
  }, [data, fields, locale.code]);

  const handleTranslate = async () => {
    const foundLocale = LOCALES.find((l) => l.code === locale.code);
    if (!foundLocale) return;

    setIsPending(true);
    const dataToTranslate: Record<string, any> = {};

    selectedFields.forEach((path) => {
      const enValue = getLocalizedValue(data, path, DEFAULT_LOCALE);
      if (hasContent(enValue)) {
        dataToTranslate[path] = enValue;
      }
    });

    if (Object.keys(dataToTranslate).length === 0) {
      toast.error("No content selected.");
      setIsPending(false);
      return;
    }

    try {
      const translatedData = await translateFieldsAction(dataToTranslate, foundLocale.label);

      Object.entries(translatedData).forEach(([key, value]) => {
        dispatchFields({ type: "UPDATE", path: key, value: value });
      });

      setIsPending(false);
      setModified(true);
      closeModal(drawerSlug);
      toast.success("Translation Complete!");
    } catch (err: any) {
      console.error(err);
      toast.error("Translation failed.");
      setIsPending(false);
    }
  };

  if (DEFAULT_LOCALE.toUpperCase() === locale.code.toUpperCase()) {
    return (
      <div style={{ padding: "20px 0" }}>
        <div style={{ color: "#b91c1c", padding: "15px", background: "#fef2f2", borderRadius: "6px", fontSize: "14px" }}>You are viewing the default locale. Please switch the locale using the language switcher at the top to translate content.</div>
      </div>
    );
  }

  return (
    <>
      <div style={{ flex: 1, padding: "20px 0", paddingBottom: "100px" }}>
        <div style={{ marginBottom: "20px", background: "#f0f9ff", padding: "15px", borderRadius: "8px" }}>
          <h4 style={{ margin: "0 0 5px 0", fontSize: "14px" }}>Translation Mode</h4>
          <p style={{ margin: 0, fontSize: "13px", color: "#666" }}>
            Translating from <strong>{DEFAULT_LOCALE.toUpperCase()}</strong> to <strong>{locale.code.toUpperCase()}</strong>.
          </p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {fields.map((f) => {
            const enValue = getLocalizedValue(data, f.path, DEFAULT_LOCALE);
            const targetValue = getLocalizedValue(data, f.path, locale.code);

            const hasSource = hasContent(enValue);
            const hasTarget = hasContent(targetValue);

            return (
              <FieldCard
                key={f.path}
                field={f.path}
                type={f.type}
                leftValue={enValue}
                rightValue={targetValue}
                leftLabel={DEFAULT_LOCALE.toUpperCase()}
                rightLabel={locale.code.toUpperCase()}
                isSelected={selectedFields.includes(f.path)}
                isDisabled={!hasSource}
                onToggle={() => {
                  setSelectedFields((prev) => (prev.includes(f.path) ? prev.filter((p) => p !== f.path) : [...prev, f.path]));
                }}
                badge={hasTarget ? { text: "Done", color: "green" } : { text: "Missing", color: "red" }}
              />
            );
          })}
        </div>
      </div>

      <div style={{ position: "sticky", bottom: 0, background: "white", padding: "20px 0", borderTop: "1px solid #eee", zIndex: 10 }}>
        <Button onClick={handleTranslate} disabled={isPending || selectedFields.length === 0} size="large" className="w-full">
          {isPending ? "Translating..." : `Translate ${selectedFields.length} Fields`}
        </Button>
      </div>
    </>
  );
};
