"use client";

import React, { useEffect, useState } from "react";
import { useAllFormFields, useDocumentInfo, useForm, Button, Drawer, DrawerToggler, useConfig, useModal, toast, useLocale } from "@payloadcms/ui";
import { translateFieldsAction } from "./actions/translate";
import { DEFAULT_LOCALE, LOCALES } from "@/amerta/localization/locales";

import RichText from "@/amerta/theme/components/RichText";

const drawerSlug = "ai-translate-drawer";

// --- Helper: Robust Content Scanner ---
const hasContent = (originalValue: any): boolean => {
  if (originalValue === null || originalValue === undefined) return false;
  if (typeof originalValue === "string") return originalValue.trim().length > 0;

  if (Array.isArray(originalValue)) return originalValue.some((item) => hasContent(item));

  let value = originalValue;
  if (originalValue.root) {
    value = value.root;
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") return value.text.trim().length > 0;
    if ("children" in value && Array.isArray(value.children)) return hasContent(value.children);

    const keysToIgnore = ["id", "type", "format", "direction", "mode", "style", "version", "indent", "root"];
    for (const key in value) {
      if (keysToIgnore.includes(key)) continue;
      if (hasContent(value[key])) return true;
    }
    return false;
  }
  return true;
};

// --- Helper: Find all translatable paths ---
const getTranslatableFields = (fields: any[], data: any, prefix = ""): string[] => {
  let paths: string[] = [];
  if (!fields) return paths;

  fields.forEach((field) => {
    const fieldName = field.name;
    const currentPath = prefix ? `${prefix}.${fieldName}` : fieldName;

    if (field.type === "tabs") {
      field.tabs.forEach((tab: any) => {
        const tabPath = tab.name ? (prefix ? `${prefix}.${tab.name}` : tab.name) : prefix;
        const tabData = tab.name ? data?.[tab.name] : data;
        paths = [...paths, ...getTranslatableFields(tab.fields, tabData, tabPath)];
      });
      return;
    }
    if (field.type === "collapsible" || field.type === "row") {
      paths = [...paths, ...getTranslatableFields(field.fields, data, prefix)];
      return;
    }
    if (field.type === "group") {
      const groupData = data?.[fieldName];
      const actualGroupData = field.localized && groupData?.[DEFAULT_LOCALE] ? groupData[DEFAULT_LOCALE] : groupData;
      paths = [...paths, ...getTranslatableFields(field.fields, actualGroupData, currentPath)];
      return;
    }
    if (field.type === "array") {
      const arrayData = data?.[fieldName];
      const actualArrayData = field.localized && arrayData?.[DEFAULT_LOCALE] ? arrayData[DEFAULT_LOCALE] : arrayData;
      if (Array.isArray(actualArrayData)) {
        actualArrayData.forEach((row: any, i: number) => {
          paths = [...paths, ...getTranslatableFields(field.fields, row, `${currentPath}.${i}`)];
        });
      }
      return;
    }
    if (field.type === "blocks") {
      const blocksData = data?.[fieldName];
      const actualBlocksData = field.localized && blocksData?.[DEFAULT_LOCALE] ? blocksData[DEFAULT_LOCALE] : blocksData;
      if (Array.isArray(actualBlocksData)) {
        actualBlocksData.forEach((row: any, i: number) => {
          const blockDef = field.blocks.find((b: any) => b.slug === row.blockType);
          if (blockDef) {
            paths = [...paths, ...getTranslatableFields(blockDef.fields, row, `${currentPath}.${i}`)];
          }
        });
      }
      return;
    }

    const validTypes = ["text", "textarea", "richText"];
    if (validTypes.includes(field.type) && field.localized) {
      paths.push(currentPath);
    }
  });
  return paths;
};

// --- UPDATED Helper: Deep Get Value by Locale ---
const getLocalizedValue = (obj: any, path: string, locale: string) => {
  if (!obj) return null;
  const keys = path.split(".");
  let current = obj;

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i]!;
    if (current === undefined || current === null) return null;

    if (current[key] && typeof current[key] === "object" && locale in current[key]) {
      current = current[key][locale];
    } else if (current[locale] && current[locale][key]) {
      current = current[locale][key];
    } else {
      current = current[key];
    }
  }

  // Final Check: Did we land on a Localization Object?
  if (current && typeof current === "object") {
    // 1. Found the exact locale we wanted
    if (locale in current) {
      return current[locale];
    }
    // 2. We didn't find 'ar', but we see 'en'.
    // This means it IS a localized field, but our target translation is MISSING.
    // Return null so the UI knows it's empty.
    if (DEFAULT_LOCALE in current) {
      return null;
    }
  }

  return current;
};

export const AITranslatePagesButton: React.FC = () => {
  const [isPending, setIsPending] = useState(false);
  const [allLocalesData, setAllLocalesData] = useState<any>(null);
  const [selectedFields, setSelectedFields] = useState<string[]>([]);
  const [availableFields, setAvailableFields] = useState<string[]>([]);

  const { closeModal } = useModal();
  const [, dispatchFields] = useAllFormFields();
  const { id, collectionSlug } = useDocumentInfo();
  const { config } = useConfig();
  const locale = useLocale();
  const { setModified } = useForm();

  useEffect(() => {
    if (!id || !config) return;
    const fetchDocument = async () => {
      try {
        const response = await fetch(`${config.serverURL}${config.routes.api}/${collectionSlug}/${id}?locale=*&depth=1`);
        const data = await response.json();
        setAllLocalesData(data);
      } catch (e) {
        console.error("Error fetching doc", e);
      }
    };
    fetchDocument();
  }, [id, collectionSlug, config]);

  useEffect(() => {
    if (!config || !collectionSlug || !allLocalesData) return;
    const currentCollection = config.collections.find((c) => c.slug === collectionSlug);
    if (!currentCollection) return;

    const foundPaths = getTranslatableFields(currentCollection.fields, allLocalesData);
    setAvailableFields(foundPaths);

    // Initial Selection: Only select Missing Translations
    const fieldsToSelect = foundPaths.filter((path) => {
      const sourceValue = getLocalizedValue(allLocalesData, path, DEFAULT_LOCALE);
      const targetValue = getLocalizedValue(allLocalesData, path, locale.code);

      const sourceValid = hasContent(sourceValue);
      const targetValid = hasContent(targetValue);

      return sourceValid && !targetValid;
    });

    setSelectedFields(fieldsToSelect);
  }, [config, collectionSlug, allLocalesData, locale.code]);

  const handleTranslate = async () => {
    const foundLocale = LOCALES.find((l) => l.code === locale.code);
    if (!foundLocale) return;

    setIsPending(true);
    const dataToTranslate: Record<string, any> = {};

    selectedFields.forEach((path) => {
      const enValue = getLocalizedValue(allLocalesData, path, DEFAULT_LOCALE);
      if (hasContent(enValue)) {
        dataToTranslate[path] = enValue;
      }
    });

    if (Object.keys(dataToTranslate).length === 0) {
      toast.error("No content found to translate.");
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
      toast.success("Translated successfully!");
    } catch (err: any) {
      toast.error(err.message || "Translation failed.");
      setIsPending(false);
    }
  };

  if (!allLocalesData) return <div className="btn btn--style-secondary btn--size-medium">Loading...</div>;

  return (
    <>
      <DrawerToggler slug={drawerSlug} className="btn btn--style-secondary btn--size-medium">
        ✨ AI Translate
      </DrawerToggler>

      <Drawer slug={drawerSlug} title="AI Translation Manager">
        <div style={{ padding: "20px", paddingBottom: "100px" }}>
          <div style={{ marginBottom: "20px" }}>
            <h3>Target Language: {locale.label as string}</h3>
            <p style={{ color: "#666" }}>
              Scanning content from <strong>{DEFAULT_LOCALE.toUpperCase()}</strong>.
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "30px" }}>
            {availableFields.map((field) => {
              const enValue = getLocalizedValue(allLocalesData, field, DEFAULT_LOCALE);
              const targetValue = getLocalizedValue(allLocalesData, field, locale.code);

              const hasSource = hasContent(enValue);
              const hasTarget = hasContent(targetValue);

              console.log("Field:", field, "EN:", enValue, "TARGET:", targetValue, hasSource, hasTarget);

              return (
                <label
                  key={field}
                  style={{
                    display: "flex",
                    gap: "12px",
                    cursor: hasSource ? "pointer" : "not-allowed",
                    alignItems: "flex-start",
                    padding: "12px",
                    background: "#f8f8f8",
                    border: "1px solid #eee",
                    borderRadius: "6px",
                    opacity: hasSource ? 1 : 0.7,
                  }}
                >
                  <input
                    type="checkbox"
                    disabled={!hasSource}
                    checked={selectedFields.includes(field)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedFields([...selectedFields, field]);
                      else setSelectedFields(selectedFields.filter((f) => f !== field));
                    }}
                    style={{ width: "18px", height: "18px", marginTop: "4px", flexShrink: 0 }}
                  />

                  <div style={{ display: "flex", flexDirection: "column", width: "100%", overflow: "hidden", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: "0.85rem", fontWeight: "bold", fontFamily: "monospace", color: "#333" }}>{field}</span>
                      {hasTarget ? <span style={{ fontSize: "0.7rem", background: "#d1fae5", color: "#065f46", padding: "2px 6px", borderRadius: "4px" }}>Translated</span> : <span style={{ fontSize: "0.7rem", background: "#fee2e2", color: "#991b1b", padding: "2px 6px", borderRadius: "4px" }}>Missing</span>}
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#666" }}>SOURCE ({DEFAULT_LOCALE.toUpperCase()})</span>
                        <div style={{ fontSize: "0.8rem", color: "#555", background: "#fff", padding: "6px", borderRadius: "4px", border: "1px solid #ddd", maxHeight: "80px", overflow: "hidden" }}>
                          {hasSource ? (
                            typeof enValue === "string" ? (
                              <span>
                                "{enValue.substring(0, 80)}
                                {enValue.length > 80 ? "..." : ""}"
                              </span>
                            ) : (
                              <div style={{ transformOrigin: "top left", transform: "scale(0.8)" }}>
                                <RichText data={enValue} enableGutter={false} locale={DEFAULT_LOCALE} />
                              </div>
                            )
                          ) : (
                            <span style={{ fontStyle: "italic", color: "#aaa" }}>Empty</span>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                        <span style={{ fontSize: "0.7rem", fontWeight: "600", color: "#666" }}>TARGET ({locale.code.toUpperCase()})</span>
                        <div style={{ fontSize: "0.8rem", color: "#555", background: hasTarget ? "#fff" : "#fff5f5", padding: "6px", borderRadius: "4px", border: hasTarget ? "1px solid #ddd" : "1px dashed #fca5a5", maxHeight: "80px", overflow: "hidden" }}>
                          {hasTarget ? (
                            typeof targetValue === "string" ? (
                              <span dir="auto">
                                "{targetValue.substring(0, 80)}
                                {targetValue.length > 80 ? "..." : ""}"
                              </span>
                            ) : (
                              <div style={{ transformOrigin: "top left", transform: "scale(0.8)" }} dir="auto">
                                <RichText data={targetValue} enableGutter={false} locale={locale.code} />
                              </div>
                            )
                          ) : (
                            <span style={{ fontStyle: "italic", color: "#aaa" }}>Not translated yet</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </label>
              );
            })}
          </div>

          <div style={{ position: "sticky", bottom: 0, background: "white", padding: "10px 0", borderTop: "1px solid #eee", zIndex: 10 }}>
            <Button onClick={handleTranslate} disabled={isPending || selectedFields.length === 0} size="large">
              {isPending ? "Translating..." : `Translate ${selectedFields.length} Fields`}
            </Button>
          </div>
        </div>
      </Drawer>
    </>
  );
};
