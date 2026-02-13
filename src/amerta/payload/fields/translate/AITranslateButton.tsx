/**
 * @module AI/Translate
 * @title AI Translate Button
 * @description This React component provides an interface within the Payload CMS admin for AI-powered translation and content creation. It dynamically identifies translatable fields in the current document and allows users to generate translations or new content using AI models.
 */

"use client";

import React, { useEffect, useState, useMemo } from "react";
import { useAllFormFields, useDocumentInfo, useForm, Button, Drawer, DrawerToggler, useConfig, useModal, toast, useLocale } from "@payloadcms/ui";
import { translateFieldsAction } from "./actions/translate";
import { DEFAULT_LOCALE, LOCALES } from "@/amerta/localization/locales";

const drawerSlug = "ai-translate-drawer";

// Recursive helper to find localized fields in tabs, groups, etc.
const findLocalizedFields = (fields: any[], prefix = ""): string[] => {
  let paths: string[] = [];

  fields.forEach((field) => {
    // 1. Handle Tabs
    if (field.type === "tabs" && field.tabs) {
      field.tabs.forEach((tab: any) => {
        paths = [...paths, ...findLocalizedFields(tab.fields, prefix)];
      });
      return;
    }

    // 2. Handle Groups/Collapsibles (add prefix)
    if (field.type === "group" || field.type === "collapsible") {
      const newPrefix = prefix ? `${prefix}.${field.name}` : field.name;
      paths = [...paths, ...findLocalizedFields(field.fields, newPrefix)];
      return;
    }

    // 3. Handle standard fields
    // We only want Text, Textarea, and RichText that are LOCALIZED
    const validTypes = ["text", "textarea", "richText"];

    if (validTypes.includes(field.type) && field.localized) {
      const path = prefix ? `${prefix}.${field.name}` : field.name;
      paths.push(path);
    }
  });

  return paths;
};

export const AITranslateButton: React.FC = () => {
  const [isPending, setIsPending] = useState(false);
  const [allLocalesData, setAllLocalesData] = useState<any>(null);

  // Payload UI Hooks
  const { closeModal } = useModal();
  const [, dispatchFields] = useAllFormFields();
  const { id, collectionSlug } = useDocumentInfo();
  const { config } = useConfig();
  const locale = useLocale();
  const { setModified } = useForm();

  // 1. Dynamically find all translatable fields for THIS collection
  const availableFields = useMemo(() => {
    if (!config || !collectionSlug) return [];

    const currentCollection = config.collections.find((c) => c.slug === collectionSlug);
    if (!currentCollection) return [];

    return findLocalizedFields(currentCollection.fields);
  }, [config, collectionSlug]);

  // 2. Initialize selected fields (select all by default)
  const [selectedFields, setSelectedFields] = useState<string[]>([]);

  // Update selection when availableFields are computed
  useEffect(() => {
    if (availableFields.length > 0) {
      setSelectedFields(availableFields);
    }
  }, [availableFields]);

  // 3. Helper to get current English value safely
  const getDefaultValue = (path: string) => {
    if (!allLocalesData) return null;

    // Handle nested paths like "meta.title"
    const keys = path.split(".");
    let current = allLocalesData;

    for (const key of keys) {
      if (current === undefined || current === null) return null;
      current = current[key];
    }

    // Check if we reached a localized object (Payload returns { en: "...", ar: "..." })
    return current?.[DEFAULT_LOCALE] || null;
  };

  const handleTranslate = async () => {
    const foundLocale = LOCALES.find((l) => l.code === locale.code);
    if (!foundLocale) {
      return;
    }

    setIsPending(true);

    const dataToTranslate: Record<string, any> = {};

    selectedFields.forEach((field) => {
      const enValue = getDefaultValue(field);
      // Only send if it has value (don't translate nulls)
      if (enValue) dataToTranslate[field] = enValue;
    });

    if (Object.keys(dataToTranslate).length === 0) {
      toast.error("No English content found to translate.");
      setIsPending(false);
      return;
    }

    try {
      const translatedData = await translateFieldsAction(dataToTranslate, foundLocale.label);

      Object.entries(translatedData).forEach(([key, value]) => {
        dispatchFields({
          type: "UPDATE",
          path: key,
          value: value,
        });
      });

      setIsPending(false);
      setModified(true);
      closeModal(drawerSlug);
      toast.success("Translation applied!");
    } catch (err: any) {
      toast.error(err.message || "Translation failed.");
      setIsPending(false);
    }
  };

  // Fetch Data logic (unchanged)
  useEffect(() => {
    if (!id) return;
    const fetchDocument = async () => {
      try {
        const response = await fetch(`${config.serverURL}${config.routes.api}/${collectionSlug}/${id}?locale=*&depth=0`);
        const data = await response.json();
        setAllLocalesData(data);
      } catch {
        // toast.error("Failed to fetch document data.");
      }
    };
    fetchDocument();
  }, [id, collectionSlug, config]);

  if (!id) return null;
  if (!allLocalesData) return <div className="btn btn--style-secondary btn--size-medium">Loading...</div>;

  return (
    <>
      <DrawerToggler slug={drawerSlug} className="btn btn--style-secondary btn--size-medium">
        ✨ AI Translate
      </DrawerToggler>

      <Drawer slug={drawerSlug} title="AI Translation Helper">
        <div style={{ padding: "20px" }}>
          <h3>Select fields to translate</h3>
          <p style={{ marginBottom: "20px", color: "#888" }}>Detected {availableFields.length} localized text fields.</p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
            {availableFields.length === 0 && <p>No localized text fields found in this collection.</p>}

            {availableFields.map((field) => {
              const hasValue = !!getDefaultValue(field);

              return (
                <label key={field} style={{ display: "flex", gap: "10px", cursor: "pointer", alignItems: "center" }}>
                  <input
                    type="checkbox"
                    checked={selectedFields.includes(field)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedFields([...selectedFields, field]);
                      else setSelectedFields(selectedFields.filter((f) => f !== field));
                    }}
                    style={{ width: "20px", height: "20px" }}
                  />
                  <span style={{ flex: 1 }}>
                    <strong>{field}</strong>
                    <span style={{ fontSize: "0.85em", color: hasValue ? "green" : "red", marginLeft: "5px" }}>{hasValue ? " (Ready)" : " (Empty in EN)"}</span>
                  </span>
                </label>
              );
            })}
          </div>

          <Button onClick={handleTranslate} disabled={isPending || availableFields.length === 0} size="large">
            {isPending ? "Translating..." : "Run Translation"}
          </Button>
        </div>
      </Drawer>
    </>
  );
};
