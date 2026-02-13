/**
 * @module AI/Agent
 * @title AI Agent Admin Component
 * @description This React component provides an interface within the Payload CMS admin for AI-powered translation and content creation. It dynamically identifies translatable fields in the current document and allows users to generate translations or new content using AI models.
 */

"use client";

import React, { useEffect, useState } from "react";
import { useDocumentInfo, Drawer, DrawerToggler, useConfig, useModal } from "@payloadcms/ui";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";
import { TranslateTab } from "./tabs/TranslateTab";
import { CreateTab } from "./tabs/CreateTab";

const drawerSlug = "ai-manager-drawer";

export type FieldDef = { path: string; type: "text" | "textarea" | "richText" };

export const hasContent = (originalValue: any): boolean => {
  if (originalValue === null || originalValue === undefined) return false;

  if (typeof originalValue === "string") {
    return originalValue.trim().length > 0;
  }

  if (Array.isArray(originalValue)) {
    return originalValue.some((item) => hasContent(item));
  }

  if (typeof originalValue === "object") {
    if ("root" in originalValue) {
      return hasContent(originalValue.root);
    }

    if ("text" in originalValue && typeof originalValue.text === "string") {
      return originalValue.text.trim().length > 0;
    }

    if ("children" in originalValue && Array.isArray(originalValue.children)) {
      return hasContent(originalValue.children);
    }

    const ignore = ["id", "type", "format", "mode", "style", "version", "indent", "direction"];
    return Object.entries(originalValue).some(([k, v]) => !ignore.includes(k) && hasContent(v));
  }

  return true;
};

export const getTranslatableFields = (fields: any[], data: any, prefix = ""): FieldDef[] => {
  let results: FieldDef[] = [];
  if (!fields) return results;

  fields.forEach((field) => {
    const fieldName = field.name;
    const currentPath = prefix ? `${prefix}.${fieldName}` : fieldName;

    if (field.type === "tabs") {
      field.tabs.forEach((tab: any) => {
        const tabPath = tab.name ? (prefix ? `${prefix}.${tab.name}` : tab.name) : prefix;
        const tabData = tab.name ? data?.[tab.name] : data;
        results = [...results, ...getTranslatableFields(tab.fields, tabData, tabPath)];
      });
      return;
    }
    if (field.type === "collapsible" || field.type === "row") {
      results = [...results, ...getTranslatableFields(field.fields, data, prefix)];
      return;
    }
    if (field.type === "group") {
      const groupData = data?.[fieldName];
      const actualGroupData = field.localized && groupData?.[DEFAULT_LOCALE] ? groupData[DEFAULT_LOCALE] : groupData;
      results = [...results, ...getTranslatableFields(field.fields, actualGroupData, currentPath)];
      return;
    }
    if (field.type === "array" || field.type === "blocks") {
      const arrayData = data?.[fieldName];
      const actualArrayData = field.localized && arrayData?.[DEFAULT_LOCALE] ? arrayData[DEFAULT_LOCALE] : arrayData;
      if (Array.isArray(actualArrayData)) {
        actualArrayData.forEach((row: any, i: number) => {
          if (field.type === "blocks") {
            const blockDef = field.blocks.find((b: any) => b.slug === row.blockType);
            if (blockDef) results = [...results, ...getTranslatableFields(blockDef.fields, row, `${currentPath}.${i}`)];
          } else {
            results = [...results, ...getTranslatableFields(field.fields, row, `${currentPath}.${i}`)];
          }
        });
      }
      return;
    }

    const validTypes = ["text", "textarea", "richText"];
    if (validTypes.includes(field.type) && field.localized) {
      results.push({ path: currentPath, type: field.type as any });
    }
  });
  return results;
};

export const getLocalizedValue = (obj: any, path: string, locale: string) => {
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
  if (current && typeof current === "object") {
    if (locale in current) return current[locale];
    if (DEFAULT_LOCALE in current) return null;
  }
  return current;
};

export const AIAgentButton: React.FC = () => {
  const [activeTab, setActiveTab] = useState<"translate" | "create">("translate");
  const [allLocalesData, setAllLocalesData] = useState<any>(null);
  const [availableFields, setAvailableFields] = useState<FieldDef[]>([]);

  const { id, collectionSlug } = useDocumentInfo();
  const { config } = useConfig();

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

    const foundFields = getTranslatableFields(currentCollection.fields, allLocalesData);
    setAvailableFields(foundFields);
  }, [config, collectionSlug, allLocalesData]);

  if (!allLocalesData) return <div className="btn btn--style-secondary btn--size-medium">Loading AI...</div>;

  return (
    <>
      <DrawerToggler slug={drawerSlug} className="btn btn--style-primary btn--size-medium">
        ✨ AI Studio
      </DrawerToggler>

      <Drawer slug={drawerSlug} title="AI Content Studio">
        <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
          {}
          <div style={{ display: "flex", borderBottom: "1px solid #e5e7eb", gap: "15px", padding: "0 20px" }}>
            <TabButton label="Translate" isActive={activeTab === "translate"} onClick={() => setActiveTab("translate")} />
            <TabButton label="Remix & Create" isActive={activeTab === "create"} onClick={() => setActiveTab("create")} />
          </div>

          {}
          <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
            {activeTab === "translate" && <TranslateTab data={allLocalesData} fields={availableFields} drawerSlug={drawerSlug} />}

            {activeTab === "create" && <CreateTab data={allLocalesData} fields={availableFields} drawerSlug={drawerSlug} />}
          </div>
        </div>
      </Drawer>
    </>
  );
};

const TabButton = ({ label, isActive, onClick }: any) => (
  <button
    onClick={onClick}
    style={{
      padding: "16px 20px",
      fontWeight: 600,
      border: "1px solid",
      borderColor: isActive ? "#aaa" : "transparent",
      borderBottomColor: isActive ? "transparent" : "transparent",
      color: isActive ? "" : "#666",
      background: "none",
      borderRadius: "6px 6px 0 0",
      cursor: "pointer",
      transition: "all 0.2s",
      boxShadow: "none",
    }}
  >
    {label}
  </button>
);
