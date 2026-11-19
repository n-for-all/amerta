"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Gutter, toast, Button, TextInput, SelectInput } from "@payloadcms/ui";
import {
  BulkImportItem,
  BulkImportProgress,
  CJCategory,
  CJProductDetail,
  CJProductListItem,
  CJSettings,
  CJShippingImportRule,
  CJRuleAction,
  CJRuleField,
  CJRuleOperator,
  parseCJWeight,
  resolveEffectiveProductWeight,
} from "../types";
import { CJ_REPLACE_FIELDS, type CJReplaceField } from "../types";
import { allShippingCountries } from "../constants/countries";
import "./index.scss";

export const SettingsClient = () => {
  const [activeTab, setActiveTab] = useState<"search" | "imported" | "pricing" | "shipping" | "settings">("search");

  // Settings State
  const [email, setEmail] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [tokenExpiry, setTokenExpiry] = useState("");
  const [markupType, setMarkupType] = useState<"multiplier" | "fixed" | "percentage">("multiplier");
  const [markupValue, setMarkupValue] = useState<number>(2.5);
  const [roundTo99, setRoundTo99] = useState(true);
  const [autoPublish, setAutoPublish] = useState(true);
  const [closeupSecondImage, setCloseupSecondImage] = useState(false);
  const [defaultStock, setDefaultStock] = useState<number>(100);
  const [salesChannelId, setSalesChannelId] = useState("");
  const [defaultShippingCountry, setDefaultShippingCountry] = useState("US");
  const [availableChannels, setAvailableChannels] = useState<{ label: string; value: string }[]>([]);

  // Smart Pricing Rules (In CJ USD $)
  const [enablePriceFloor, setEnablePriceFloor] = useState<boolean>(false);
  const [minPriceFloorUSD, setMinPriceFloorUSD] = useState<number>(14.99);

  const [enableShippingBuffer, setEnableShippingBuffer] = useState<boolean>(false);
  const [shippingBufferUSD, setShippingBufferUSD] = useState<number>(4.0);

  const [enableTieredMarkup, setEnableTieredMarkup] = useState<boolean>(false);
  const [tieredThresholdUSD, setTieredThresholdUSD] = useState<number>(5.0);
  const [tieredMultiplier, setTieredMultiplier] = useState<number>(3.5);

  // Multi-rule Shipping & Import Protection Rules Table
  const [shippingImportRules, setShippingImportRules] = useState<CJShippingImportRule[]>([
    {
      id: "rule-weight-light",
      name: "Allow products under 500g (+$3.00 Shipping Buffer)",
      field: "weight",
      operator: "less_than",
      value: 500,
      action: "allow",
      bufferUSD: 3.0,
      enabled: true,
    },
    {
      id: "rule-weight-heavy",
      name: "Block bulky products over 500g",
      field: "weight",
      operator: "greater_than",
      value: 500,
      action: "block",
      bufferUSD: 0,
      enabled: true,
    },
    {
      id: "rule-weight-missing",
      name: "Block products when weight is not set",
      field: "weight_not_set",
      operator: "is_not_set",
      action: "block",
      bufferUSD: 0,
      enabled: true,
    },
    {
      id: "rule-all-default",
      name: "Default: Allow all other products",
      field: "all",
      operator: "always",
      action: "allow",
      bufferUSD: 0,
      enabled: true,
    },
  ]);

  // Rule Modal state for adding/editing a rule
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [ruleFormName, setRuleFormName] = useState("");
  const [ruleFormField, setRuleFormField] = useState<CJRuleField>("weight");
  const [ruleFormOperator, setRuleFormOperator] = useState<CJRuleOperator>("less_than");
  const [ruleFormValue, setRuleFormValue] = useState<string>("500");
  const [ruleFormAction, setRuleFormAction] = useState<CJRuleAction>("allow");
  const [ruleFormBufferUSD, setRuleFormBufferUSD] = useState<string>("3.00");

  // Category / Collection Assignment State
  const [categoryMappingMode, setCategoryMappingMode] = useState<"auto_create" | "single_collection">("auto_create");
  const [defaultCollectionId, setDefaultCollectionId] = useState<string>("");
  const [storeCollections, setStoreCollections] = useState<{ label: string; value: string }[]>([]);
  const [modalCollectionId, setModalCollectionId] = useState<string>("__auto__");

  // Basic Search State
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [categories, setCategories] = useState<CJCategory[]>([]);
  const [searchResults, setSearchResults] = useState<CJProductListItem[]>([]);
  const [totalResults, setTotalResults] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [isSearching, setIsSearching] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  // Advanced CJ Filter States
  const [warehouseCountry, setWarehouseCountry] = useState("");
  const [productFlag, setProductFlag] = useState("");
  const [shippingFilter, setShippingFilter] = useState("");
  const [minInventory, setMinInventory] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [hideIneligibleProducts, setHideIneligibleProducts] = useState<boolean>(false);

  // Sentinel for Infinite Scrolling
  const observerTarget = useRef<HTMLDivElement | null>(null);
  // Each new search gets a number; responses from an older search are ignored
  const searchSeq = useRef(0);
  const SEARCH_PAGE_SIZE = 60; // CJ listV2 allows up to 100

  // Preview & Import State
  const [previewProduct, setPreviewProduct] = useState<CJProductDetail | null>(null);
  const [customTitle, setCustomTitle] = useState("");
  const [customPrice, setCustomPrice] = useState<number | undefined>(undefined);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [importingPid, setImportingPid] = useState<string | null>(null);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [hoverPreview, setHoverPreview] = useState<{ url: string; x: number; y: number } | null>(null);
  const [selectedVids, setSelectedVids] = useState<string[]>([]);

  // Shipping & Landed Cost State
  const [shippingCountry, setShippingCountry] = useState("US");
  const [shippingRates, setShippingRates] = useState<any[] | null>(null);
  const [loadingShipping, setLoadingShipping] = useState(false);
  const [isShippingOpen, setIsShippingOpen] = useState(false);
  const [isShippingExpanded, setIsShippingExpanded] = useState(false);
  const [modalBottomTab, setModalBottomTab] = useState<"variants" | "description">("variants");

  // Imported Products State
  const [importedProducts, setImportedProducts] = useState<any[]>([]);
  const [loadingImported, setLoadingImported] = useState(false);

  // Currency & Exchange Rate State (defaults to USD if no currency configured)
  const [channelCurrency, setChannelCurrency] = useState<{
    code: string;
    symbol: string;
    exchangeRate: number;
  }>({
    code: "USD",
    symbol: "$",
    exchangeRate: 1,
  });

  // Loading / Saving state
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Bulk Import State
  const [selectedPids, setSelectedPids] = useState<string[]>([]);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [isBulkImporting, setIsBulkImporting] = useState(false);
  const [bulkCollectionId, setBulkCollectionId] = useState("__auto__");
  const [bulkPublishStatus, setBulkPublishStatus] = useState<"published" | "draft">("published");
  const [bulkIgnoreRules, setBulkIgnoreRules] = useState(false);
  // Re-import of a product already in the store: choose what to replace
  const [reimportTarget, setReimportTarget] = useState<{ pid: string; title: string } | null>(null);
  const [reimportFields, setReimportFields] = useState<CJReplaceField[]>([]);
  const [bulkProgress, setBulkProgress] = useState<BulkImportProgress>({
    current: 0,
    total: 0,
    successCount: 0,
    failCount: 0,
  });
  const [bulkItems, setBulkItems] = useState<BulkImportItem[]>([]);
  const bulkAbortRef = useRef<boolean>(false);

  // Compute Normalized Image Array for Gallery
  const previewImages = useMemo(() => {
    if (!previewProduct) return [];
    let list: string[] = [];

    if (Array.isArray(previewProduct.productImageSet)) {
      list = previewProduct.productImageSet;
    } else if (typeof previewProduct.productImageSet === "string" && (previewProduct.productImageSet as string).trim()) {
      try {
        const parsed = JSON.parse(previewProduct.productImageSet);
        if (Array.isArray(parsed)) list = parsed;
        else list = [previewProduct.productImageSet];
      } catch {
        list = (previewProduct.productImageSet as string).split(",").map((s) => s.trim()).filter(Boolean);
      }
    }

    if (previewProduct.productImage && !list.includes(previewProduct.productImage)) {
      list.unshift(previewProduct.productImage);
    }

    if (Array.isArray(previewProduct.variants)) {
      for (const v of previewProduct.variants) {
        if (v.variantImage && !list.includes(v.variantImage)) {
          list.push(v.variantImage);
        }
      }
    }

    return list.filter((img) => typeof img === "string" && img.startsWith("http"));
  }, [previewProduct]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await fetch("/api/cj-dropshipping/categories");
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.categories)) {
          setCategories(data.categories);
        }
      }
    } catch (err) {
      console.warn("Could not load CJ categories:", err);
    }
  }, []);

  // Fetch initial configuration
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const res = await fetch("/api/globals/apps");
        if (res.ok) {
          const data = await res.json();
          const cj: CJSettings = data.appSettings?.["cj-dropshipping"] || {};
          if (cj) {
            setEmail(cj.email || "");
            setApiKey(cj.apiKey || "");
            setTokenExpiry(cj.tokenExpiryDate || "");
            setMarkupType(cj.markupType || "multiplier");
            setMarkupValue(cj.markupValue !== undefined ? cj.markupValue : 2.5);
            setRoundTo99(cj.roundTo99 !== undefined ? cj.roundTo99 : true);
            setAutoPublish(cj.autoPublish !== undefined ? cj.autoPublish : true);
            setCloseupSecondImage(cj.closeupSecondImage === true);
            setDefaultStock(cj.defaultStock || 100);
            setSalesChannelId(cj.defaultSalesChannelId || "");
            const savedCountry = cj.defaultShippingCountry || "US";
            setDefaultShippingCountry(savedCountry);
            setShippingCountry(savedCountry);
            setCategoryMappingMode(cj.categoryMappingMode || "auto_create");
            setDefaultCollectionId(cj.defaultCollectionId || "");

            // Populate Smart Dropshipping & Protection Rules (All in CJ USD $)
            setEnablePriceFloor(Boolean(cj.enablePriceFloor));
            const loadedFloorUSD =
              cj.minPriceFloorUSD !== undefined
                ? cj.minPriceFloorUSD
                : cj.minPriceFloor
                ? Number((cj.minPriceFloor / (channelCurrency.exchangeRate || 1)).toFixed(2))
                : 14.99;
            setMinPriceFloorUSD(loadedFloorUSD);
            setEnableShippingBuffer(Boolean(cj.enableShippingBuffer));
            setShippingBufferUSD(cj.shippingBufferUSD !== undefined ? cj.shippingBufferUSD : 4.0);
            setEnableTieredMarkup(Boolean(cj.enableTieredMarkup));
            setTieredThresholdUSD(cj.tieredThresholdUSD !== undefined ? cj.tieredThresholdUSD : 5.0);
            setTieredMultiplier(cj.tieredMultiplier !== undefined ? cj.tieredMultiplier : 3.5);

            if (Array.isArray(cj.shippingImportRules) && cj.shippingImportRules.length > 0) {
              setShippingImportRules(cj.shippingImportRules);
            }
          }
        }
      } catch (err) {
        console.error("Failed to load CJ settings:", err);
      }
    };

    const fetchChannels = async () => {
      try {
        const res = await fetch("/api/sales-channel?limit=100&depth=2");
        if (res.ok) {
          const data = await res.json();
          const channels = data.docs || [];
          setAvailableChannels(channels.map((sc: any) => ({ label: sc.name, value: sc.id })));

          const activeChannel =
            channels.find((sc: any) => sc.id === salesChannelId) ||
            channels.find((sc: any) => sc.isDefault) ||
            channels[0];

          if (activeChannel && Array.isArray(activeChannel.currencies)) {
            const defCurr =
              activeChannel.currencies.find((c: any) => c.isDefault) || activeChannel.currencies[0];
            if (defCurr) {
              const currObj = typeof defCurr.currency === "object" ? defCurr.currency : null;
              const code = (currObj?.code || "USD").toUpperCase();
              let rate = defCurr.exchangeRate ? Number(defCurr.exchangeRate) : 1;
              if ((!rate || rate === 1) && code === "AED") {
                rate = 3.67;
              } else if ((!rate || rate === 1) && code === "SAR") {
                rate = 3.75;
              } else if ((!rate || rate === 1) && code === "QAR") {
                rate = 3.64;
              }
              setChannelCurrency({
                code: currObj?.code || "USD",
                symbol: currObj?.symbolNative || currObj?.symbol || (code === "USD" ? "$" : currObj?.code || "$"),
                exchangeRate: rate > 0 ? rate : 1,
              });
            }
          }
        }
      } catch (err) {
        console.error("Failed to load sales channels:", err);
      }
    };

    const fetchCollections = async () => {
      try {
        const res = await fetch("/api/collections?limit=500&depth=0");
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data.docs)) {
            setStoreCollections(
              data.docs.map((c: any) => ({
                label: c.title || c.slug || "Untitled Collection",
                value: c.id,
              }))
            );
          }
        }
      } catch (err) {
        console.error("Failed to load store collections:", err);
      }
    };

    fetchConfig();
    fetchChannels();
    fetchCollections();
    fetchCategories();
    fetchImportedProducts();

    // Re-run the last search (saved in this browser) instead of starting blank
    const history = loadSearchHistory();
    setSearchHistory(history);
    if (history[0]) {
      applySearchFilters(history[0].filters);
      handleSearch(1, true, history[0].filters);
    } else {
      handleSearch(1, true);
    }
  }, []);

  // Fetch imported products on tab switch
  useEffect(() => {
    if (activeTab === "imported") {
      fetchImportedProducts();
    }
  }, [activeTab]);

  // Keyboard navigation for Fullscreen Lightbox
  useEffect(() => {
    if (!isLightboxOpen || previewImages.length <= 1) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") {
        setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : previewImages.length - 1));
      } else if (e.key === "ArrowRight") {
        setActiveImageIndex((prev) => (prev < previewImages.length - 1 ? prev + 1 : 0));
      } else if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isLightboxOpen, previewImages.length]);

  const fetchImportedProducts = async () => {
    setLoadingImported(true);
    try {
      const res = await fetch("/api/cj-dropshipping/imported?limit=100");
      if (res.ok) {
        const data = await res.json();
        setImportedProducts(data.docs || []);
      }
    } catch (err) {
      console.error("Failed to fetch imported products:", err);
    } finally {
      setLoadingImported(false);
    }
  };

  // Connect / Test API Credentials
  const handleConnect = async () => {
    if (!email || !apiKey) {
      toast.error("Please enter both Email and API Key.");
      return;
    }

    setIsConnecting(true);
    try {
      const res = await fetch("/api/cj-dropshipping/connect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, apiKey }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Authentication failed.");
      }

      setTokenExpiry(data.tokenExpiryDate || "");
      toast.success("Connected to CJ Dropshipping successfully!");
      fetchCategories();
    } catch (err: any) {
      toast.error(err.message || "Failed to connect to CJ Dropshipping.");
    } finally {
      setIsConnecting(false);
    }
  };

  // Save Settings & Markup Rules
  const handleSaveSettings = async () => {
    setIsSavingSettings(true);
    // Enforce requirement: At least 1 active shipping rule is required
    const activeRules = shippingImportRules.filter((r) => r.enabled);
    if (activeRules.length === 0) {
      toast.error("At least 1 active shipping rule is required. Products cannot be imported without shipping rules.");
      setIsSavingSettings(false);
      return;
    }

    try {
      const res = await fetch("/api/globals/apps");
      const currentGlobal = await res.json();
      const currentSettings = currentGlobal.appSettings || {};

      const updatedCjSettings: CJSettings = {
        ...(currentSettings["cj-dropshipping"] || {}),
        email,
        apiKey,
        markupType,
        markupValue: Number(markupValue) || 1,
        roundTo99,
        autoPublish,
        closeupSecondImage,
        defaultStock: Number(defaultStock) || 100,
        defaultSalesChannelId: salesChannelId,
        defaultShippingCountry: defaultShippingCountry || "US",
        categoryMappingMode,
        defaultCollectionId: categoryMappingMode === "single_collection" ? defaultCollectionId : undefined,

        // Smart Dropshipping & Pricing Protection Rules
        enablePriceFloor,
        minPriceFloorUSD: Number(minPriceFloorUSD) || 0,
        minPriceFloor: (Number(minPriceFloorUSD) || 0) * (channelCurrency.exchangeRate || 1),
        enableShippingBuffer,
        shippingBufferUSD: Number(shippingBufferUSD) || 0,
        enableTieredMarkup,
        tieredThresholdUSD: Number(tieredThresholdUSD) || 0,
        tieredMultiplier: Number(tieredMultiplier) || 1,

        // Multi-rule Shipping & Import Rules Table (Master controls)
        shippingImportRules,
      };

      const updateRes = await fetch("/api/globals/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appSettings: {
            ...currentSettings,
            "cj-dropshipping": updatedCjSettings,
          },
        }),
      });

      if (!updateRes.ok) {
        throw new Error("Failed to save settings.");
      }

      toast.success("CJ Dropshipping settings and shipping rules saved!");
    } catch (err: any) {
      toast.error(err.message || "Error saving settings.");
    } finally {
      setIsSavingSettings(false);
    }
  };

  // Save only the shipping rules (each rule change is saved right away)
  const persistShippingRules = async (rules: CJShippingImportRule[], message: string) => {
    setShippingImportRules(rules);
    try {
      const res = await fetch("/api/globals/apps");
      const currentGlobal = await res.json();
      const currentSettings = currentGlobal.appSettings || {};
      const updateRes = await fetch("/api/globals/apps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appSettings: {
            ...currentSettings,
            "cj-dropshipping": { ...(currentSettings["cj-dropshipping"] || {}), shippingImportRules: rules },
          },
        }),
      });
      if (!updateRes.ok) throw new Error("Failed to save shipping rules.");
      toast.success(`${message} and saved`);
    } catch (err: any) {
      toast.error(`${err.message || "Failed to save shipping rules."} Click "Save Shipping Rules" to retry.`);
    }
  };

  // Toggle a single rule's enabled state
  const handleToggleRule = (id: string) => {
    const next = shippingImportRules.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r));
    if (next.filter((r) => r.enabled).length === 0) {
      toast.warning("Warning: No active shipping rules! Imports are disabled until at least 1 rule is active.");
    }
    persistShippingRules(next, "Rule updated");
  };

  // Delete a rule
  const handleDeleteRule = (id: string) => {
    const next = shippingImportRules.filter((r) => r.id !== id);
    if (next.filter((r) => r.enabled).length === 0) {
      toast.warning("Warning: All shipping rules removed! Imports are disabled until at least 1 rule is added.");
    }
    persistShippingRules(next, "Rule removed");
  };

  // Open modal to add rule
  const handleOpenAddRule = () => {
    setEditingRuleId(null);
    setRuleFormName("");
    setRuleFormField("weight");
    setRuleFormOperator("less_than");
    setRuleFormValue("500");
    setRuleFormAction("allow");
    setRuleFormBufferUSD("3.00");
    setIsRuleModalOpen(true);
  };

  // Open modal to edit rule
  const handleOpenEditRule = (rule: CJShippingImportRule) => {
    setEditingRuleId(rule.id);
    setRuleFormName(rule.name);
    setRuleFormField(rule.field);
    setRuleFormOperator(rule.operator);
    setRuleFormValue(rule.value !== undefined ? String(rule.value) : "500");
    setRuleFormAction(rule.action);
    setRuleFormBufferUSD(rule.bufferUSD !== undefined ? String(rule.bufferUSD) : "0.00");
    setIsRuleModalOpen(true);
  };

  // Save rule from modal
  const handleSaveRuleModal = () => {
    const isWeightNotSet = ruleFormField === "weight_not_set";
    const isAll = ruleFormField === "all";
    const bufferVal = ruleFormAction === "allow" ? parseFloat(ruleFormBufferUSD) || 0 : 0;
    const generatedName =
      ruleFormName.trim() ||
      (isAll
        ? `All Products (${ruleFormAction === "allow" ? `Allow +$${bufferVal.toFixed(2)} buffer` : "Block"})`
        : isWeightNotSet
        ? `When weight is not set (${ruleFormAction === "allow" ? "Allow" : "Block"})`
        : `${ruleFormField === "weight" ? "Weight" : ruleFormField === "cost" ? "Cost" : "Variants"} ${ruleFormOperator === "greater_than" ? ">" : ruleFormOperator === "less_than" ? "<" : "=="} ${ruleFormValue}${ruleFormField === "weight" ? "g" : ruleFormField === "cost" ? "$" : ""} (${ruleFormAction === "allow" ? `Allow +$${bufferVal.toFixed(2)} buffer` : "Block"})`);

    const operator = isAll ? "always" : isWeightNotSet ? "is_not_set" : ruleFormOperator;
    const value = isAll || isWeightNotSet ? undefined : parseFloat(ruleFormValue) || 0;

    if (editingRuleId) {
      const next = shippingImportRules.map((r) =>
        r.id === editingRuleId
          ? {
              ...r,
              name: generatedName,
              field: ruleFormField,
              operator,
              value,
              action: ruleFormAction,
              bufferUSD: bufferVal,
            }
          : r
      );
      persistShippingRules(next, "Rule updated");
    } else {
      const newRule: CJShippingImportRule = {
        id: `rule-${Date.now()}`,
        name: generatedName,
        field: ruleFormField,
        operator,
        value,
        action: ruleFormAction,
        bufferUSD: bufferVal,
        enabled: true,
      };
      persistShippingRules([...shippingImportRules, newRule], "Rule added");
    }
    setIsRuleModalOpen(false);
  };

  // Client-side rule evaluator
  const evaluateRulesClient = useCallback(
    (product: {
      productWeight?: any;
      sellPrice?: string | number;
      variantsCount?: number;
      variants?: any[];
      weight?: any;
      weightPending?: boolean;
    }) => {
      const activeRules = shippingImportRules.filter((r) => r.enabled);

      // "there must be at least 1 rules and it shouldn't allow import if no rules for shipping are set"
      if (activeRules.length === 0) {
        return {
          blocked: true,
          reason: "No shipping rules configured. At least 1 active shipping rule is required to allow imports.",
          bufferUSD: 0,
        };
      }

      const weight = resolveEffectiveProductWeight(product);
      const cost = typeof product.sellPrice === "number" ? product.sellPrice : parseFloat(String(product.sellPrice)) || 0;
      const variantsCount = product.variantsCount || product.variants?.length || 0;

      for (const rule of activeRules) {
        let matches = false;

        if (rule.field === "all" || rule.operator === "always") {
          matches = true;
        } else if (product.weightPending && (rule.field === "weight_not_set" || rule.field === "weight")) {
          // Weight not loaded yet (search results); weight rules run on preview/import
          matches = false;
        } else if (rule.field === "weight_not_set") {
          matches = !weight || weight <= 0;
        } else if (rule.field === "weight") {
          const val = Number(rule.value) || 0;
          if (rule.operator === "greater_than") matches = weight > val;
          else if (rule.operator === "less_than") matches = weight > 0 && weight < val;
          else if (rule.operator === "equals") matches = weight === val;
          else if (rule.operator === "is_not_set") matches = !weight || weight <= 0;
        } else if (rule.field === "cost") {
          const val = Number(rule.value) || 0;
          if (rule.operator === "greater_than") matches = cost > val;
          else if (rule.operator === "less_than") matches = cost < val;
          else if (rule.operator === "equals") matches = cost === val;
        } else if (rule.field === "variants_count") {
          const val = Number(rule.value) || 0;
          if (rule.operator === "greater_than") matches = variantsCount > val;
          else if (rule.operator === "less_than") matches = variantsCount < val;
          else if (rule.operator === "equals") matches = variantsCount === val;
        }

        if (matches) {
          if (rule.action === "block") {
            return {
              blocked: true,
              reason: rule.name || (rule.field === "weight_not_set" ? "Weight is not set (0g)" : `Blocked by shipping rule: ${rule.name}`),
              bufferUSD: 0,
              matchedRuleName: rule.name,
            };
          }

          // action is allow
          return {
            blocked: false,
            bufferUSD: typeof rule.bufferUSD === "number" && rule.bufferUSD >= 0 ? rule.bufferUSD : 0,
            matchedRuleName: rule.name,
          };
        }
      }

      // "by default all should be allowed (rule default)"
      return {
        blocked: false,
        bufferUSD: 0,
        matchedRuleName: "Default (Allowed)",
      };
    },
    [shippingImportRules]
  );

  // Perform Catalog Search (supports all filters, initial load, and infinite scrolling)
  const handleSearch = async (
    page = 1,
    isNew = true,
    overrides?: {
      keyword?: string;
      categoryId?: string;
      minPrice?: string;
      maxPrice?: string;
      warehouseCountry?: string;
      productFlag?: string;
      shippingFilter?: string;
      minInventory?: string;
      productTypeFilter?: string;
    }
  ) => {
    const seq = isNew ? ++searchSeq.current : searchSeq.current;
    const isStale = () => seq !== searchSeq.current;

    if (isNew) {
      setIsSearching(true);
      setSearchResults([]);
    } else {
      setIsLoadingMore(true);
    }
    setCurrentPage(page);

    try {
      const params = new URLSearchParams();
      const kw = overrides?.keyword !== undefined ? overrides.keyword : searchKeyword;
      const cat = overrides?.categoryId !== undefined ? overrides.categoryId : selectedCategory;
      const minP = overrides?.minPrice !== undefined ? overrides.minPrice : minPrice;
      const maxP = overrides?.maxPrice !== undefined ? overrides.maxPrice : maxPrice;
      const wh = overrides?.warehouseCountry !== undefined ? overrides.warehouseCountry : warehouseCountry;
      const pf = overrides?.productFlag !== undefined ? overrides.productFlag : productFlag;
      const ship = overrides?.shippingFilter !== undefined ? overrides.shippingFilter : shippingFilter;
      const inv = overrides?.minInventory !== undefined ? overrides.minInventory : minInventory;
      const pt = overrides?.productTypeFilter !== undefined ? overrides.productTypeFilter : productTypeFilter;

      if (kw && kw.trim()) params.append("keyword", kw.trim());
      if (cat) params.append("categoryId", cat);
      if (minP) params.append("startPrice", minP);
      if (maxP) params.append("endPrice", maxP);
      if (wh) params.append("countryCode", wh);
      if (pf !== "") params.append("productFlag", pf);
      if (ship !== "") params.append("addMarkStatus", ship);
      if (inv) params.append("startWarehouseInventory", inv);
      if (pt !== "") params.append("productType", pt);

      params.append("pageNum", String(page));
      params.append("pageSize", String(SEARCH_PAGE_SIZE));

      const res = await fetch(`/api/cj-dropshipping/search?${params.toString()}`);
      const data = await res.json();
      if (isStale()) return; // a newer search started meanwhile

      if (!res.ok) {
        throw new Error(data.error || "Search failed.");
      }

      if (data.currencyCode) {
        setChannelCurrency({
          code: data.currencyCode,
          symbol: data.currencySymbol || data.currencyCode,
          exchangeRate: data.exchangeRate || 1,
        });
      }

      const newProducts = data.products || [];
      if (isNew) {
        setSearchResults(newProducts);
      } else {
        setSearchResults((prev) => [...prev, ...newProducts]);
      }
      setTotalResults(data.total || 0);

      if (isNew) {
        rememberSearch(
          {
            keyword: kw || "",
            categoryId: cat || "",
            minPrice: minP || "",
            maxPrice: maxP || "",
            warehouseCountry: wh || "",
            productFlag: pf || "",
            shippingFilter: ship || "",
            minInventory: inv || "",
            productTypeFilter: pt || "",
          },
          data.total || 0,
          (newProducts[0]?.categoryPath || []).find((c: { id: string }) => c.id === cat)?.name,
        );
      }
    } catch (err: any) {
      if (!isStale()) toast.error(err.message || "Failed to search CJ catalog.");
    } finally {
      if (!isStale()) {
        setIsSearching(false);
        setIsLoadingMore(false);
      }
    }
  };

  // ---- Search history (this browser only) ----
  const SEARCH_HISTORY_KEY = "cj-dropshipping-search-history";
  type SearchFilters = {
    keyword: string;
    categoryId: string;
    minPrice: string;
    maxPrice: string;
    warehouseCountry: string;
    productFlag: string;
    shippingFilter: string;
    minInventory: string;
    productTypeFilter: string;
  };
  type SearchHistoryEntry = { filters: SearchFilters; total: number; categoryName?: string; at: string };

  const [searchHistory, setSearchHistory] = useState<SearchHistoryEntry[]>([]);

  function loadSearchHistory(): SearchHistoryEntry[] {
    try {
      const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function saveSearchHistory(entries: SearchHistoryEntry[]) {
    setSearchHistory(entries);
    try {
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(entries));
    } catch {}
  }

  function applySearchFilters(f: SearchFilters) {
    setSearchKeyword(f.keyword);
    setSelectedCategory(f.categoryId);
    setMinPrice(f.minPrice);
    setMaxPrice(f.maxPrice);
    setWarehouseCountry(f.warehouseCountry);
    setProductFlag(f.productFlag);
    setShippingFilter(f.shippingFilter);
    setMinInventory(f.minInventory);
    setProductTypeFilter(f.productTypeFilter);
  }

  function rememberSearch(filters: SearchFilters, total: number, categoryName?: string) {
    const key = JSON.stringify(filters);
    const previous = loadSearchHistory().filter((e) => JSON.stringify(e.filters) !== key);
    const prevName = loadSearchHistory().find((e) => JSON.stringify(e.filters) === key)?.categoryName;
    saveSearchHistory([{ filters, total, categoryName: categoryName || prevName, at: new Date().toISOString() }, ...previous].slice(0, 10));
  }

  const describeSearch = (e: SearchHistoryEntry) => {
    const f = e.filters;
    const parts: string[] = [f.keyword ? `"${f.keyword}"` : "All products"];
    if (f.categoryId) {
      parts.push(e.categoryName || categories.find((c) => c.categoryId === f.categoryId)?.categoryName?.split(" > ").pop() || "Category");
    }
    if (f.warehouseCountry) parts.push(f.warehouseCountry);
    if (f.minPrice || f.maxPrice) parts.push(`$${f.minPrice || 0}–${f.maxPrice || "∞"}`);
    if (f.productFlag || f.shippingFilter || f.minInventory || f.productTypeFilter) parts.push("+ filters");
    return parts.join(" · ");
  };

  const handleHistoryClick = (entry: SearchHistoryEntry) => {
    applySearchFilters(entry.filters);
    handleSearch(1, true, entry.filters);
  };

  // Selected products as Markdown/JSON (pricing snapshot to paste into an AI chat or a doc)
  const buildSelectionExport = () => {
    const rate = channelCurrency.exchangeRate || 1;
    const items = selectedPids.map((pid) => getSelectedItem(pid)).filter((r): r is CJProductListItem => Boolean(r));
    const products = items.map((item) => {
      const costUSD = parseFloat(item.sellPrice) || 0;
      const ruleEval = evaluateRulesClient(item);
      const retail = item.calculatedRetailPrice || computePriceWithMarkup(costUSD, ruleEval.bufferUSD);
      const costStore = costUSD * rate;
      const profit = retail - costStore;
      const weight = resolveEffectiveProductWeight(item);
      return {
        pid: item.pid,
        sku: item.productSku || "",
        name: item.productNameEn,
        category: (item.categoryPath || []).map((c) => c.name).join(" > ") || item.categoryName || "",
        supplierCostUSD: Number(costUSD.toFixed(2)),
        retailPrice: Number(retail.toFixed(2)),
        retailPriceUSD: Number((retail / rate).toFixed(2)),
        estProfit: Number(profit.toFixed(2)),
        marginPct: retail > 0 ? Number(((profit / retail) * 100).toFixed(1)) : 0,
        shippingBufferUSD: ruleEval.bufferUSD || 0,
        ruleCheck: ruleEval.blocked ? `Blocked: ${ruleEval.reason || "shipping rule"}` : `Allowed (${ruleEval.matchedRuleName || "default"})`,
        weightGrams: weight > 0 ? weight : null,
        image: item.productImage,
      };
    });
    const context = {
      exportedAt: new Date().toISOString(),
      storeCurrency: channelCurrency.code,
      exchangeRateFromUSD: rate,
      pricing: { markupType, markupValue, roundTo99 },
      searchFilters: {
        keyword: searchKeyword || null,
        warehouse: warehouseCountry || "All",
        categoryId: selectedCategory || null,
        shippingCountry: defaultShippingCountry,
      },
      note: "Supplier cost excludes shipping unless a shipping buffer is shown. Weight is null when CJ search did not return it (open Preview to load it).",
    };

    const json = JSON.stringify({ ...context, products }, null, 2);

    const cur = channelCurrency.code;
    const md = [
      `# CJ products (${products.length} selected)`,
      "",
      `- Exported: ${context.exportedAt}`,
      `- Store currency: ${cur} (1 USD = ${rate} ${cur})`,
      `- Pricing: ${markupType} ${markupValue}${roundTo99 ? ", rounded to .99" : ""}`,
      `- Filters: keyword "${searchKeyword || "-"}", warehouse ${warehouseCountry || "All"}, shipping to ${defaultShippingCountry}`,
      `- ${context.note}`,
      "",
      `| # | Product | Category | Cost (USD) | Retail (${cur}) | Profit (${cur}) | Margin | Weight | Rule check | PID |`,
      "|---|---|---|---|---|---|---|---|---|---|",
      ...products.map((p, i) =>
        `| ${i + 1} | ${p.name.replace(/\|/g, "/")} | ${p.category.replace(/\|/g, "/") || "-"} | ${p.supplierCostUSD.toFixed(2)} | ${p.retailPrice.toFixed(2)} | ${p.estProfit.toFixed(2)} | ${p.marginPct}% | ${p.weightGrams ? `${p.weightGrams}g` : "?"} | ${p.ruleCheck.replace(/\|/g, "/")} | ${p.pid} |`,
      ),
      "",
    ].join("\n");

    return { md, json, count: products.length };
  };

  const [isExportOpen, setIsExportOpen] = useState(false);
  const [exportFormat, setExportFormat] = useState<"md" | "json">("md");

  const handleCopyExport = async () => {
    try {
      await navigator.clipboard.writeText(exportText);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Could not copy. Select the text and copy it manually.");
    }
  };

  const handleDownloadExport = () => {
    const blob = new Blob([exportText], { type: exportFormat === "md" ? "text/markdown" : "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cj-products-${new Date().toISOString().slice(0, 10)}.${exportFormat}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Search a product's category (any level) when its category link is clicked
  const handleCategoryClick = (categoryId: string) => {
    setSelectedCategory(categoryId);
    handleSearch(1, true, { categoryId });
  };

  // Small clickable category trail under a product: Top › Middle › Leaf
  const renderCategoryPath = (item: { categoryPath?: { id: string; name: string }[] }) => {
    if (!item.categoryPath?.length) return null;
    return (
      <div className="cj-category-path">
        {item.categoryPath.map((cat, idx) => (
          <React.Fragment key={cat.id}>
            {idx > 0 && <span className="cj-category-sep">›</span>}
            <button
              type="button"
              className={`cj-category-link ${selectedCategory === cat.id ? "active" : ""}`}
              title={`Show products in ${cat.name}`}
              onClick={(e) => {
                e.stopPropagation();
                handleCategoryClick(cat.id);
              }}
            >
              {cat.name}
            </button>
          </React.Fragment>
        ))}
      </div>
    );
  };

  // Reset all filters back to default
  const handleResetFilters = () => {
    setSearchKeyword("");
    setSelectedCategory("");
    setMinPrice("");
    setMaxPrice("");
    setWarehouseCountry("");
    setProductFlag("");
    setShippingFilter("");
    setMinInventory("");
    setProductTypeFilter("");
    handleSearch(1, true, {
      keyword: "",
      categoryId: "",
      minPrice: "",
      maxPrice: "",
      warehouseCountry: "",
      productFlag: "",
      shippingFilter: "",
      minInventory: "",
      productTypeFilter: "",
    });
  };

  // Infinite Scroll Observer
  useEffect(() => {
    const target = observerTarget.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0]?.isIntersecting &&
          !isSearching &&
          !isLoadingMore &&
          searchResults.length > 0 &&
          searchResults.length < totalResults
        ) {
          handleSearch(currentPage + 1, false);
        }
      },
      { threshold: 0.1, rootMargin: "300px" }
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, [
    isSearching,
    isLoadingMore,
    searchResults.length,
    totalResults,
    currentPage,
    searchKeyword,
    selectedCategory,
    minPrice,
    maxPrice,
    warehouseCountry,
    productFlag,
    shippingFilter,
    minInventory,
    productTypeFilter,
  ]);

  // Open Preview Modal
  const handleOpenPreview = async (pid: string) => {
    setLoadingPreview(true);
    setPreviewProduct(null);
    setActiveImageIndex(0);
    setIsLightboxOpen(false);
    setShippingRates(null);
    setIsShippingOpen(false);
    setIsShippingExpanded(false);
    setShippingCountry(defaultShippingCountry || "US");
    setModalCollectionId("__auto__");
    setModalBottomTab("variants");
    try {
      const res = await fetch(`/api/cj-dropshipping/details?pid=${encodeURIComponent(pid)}`);
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to load product details.");
      }

      if (data.currencyCode) {
        setChannelCurrency({
          code: data.currencyCode,
          symbol: data.currencySymbol || data.currencyCode,
          exchangeRate: data.exchangeRate || 1,
        });
      }

      setPreviewProduct(data.product);
      setSelectedVids(data.product.variants?.map((v: any) => v.vid) || []);
      setCustomTitle(data.product.productNameEn || data.product.productName);
      setCustomPrice(undefined);

      // Keep search result item synced with authoritative weight and variants from product details
      if (data.product) {
        const resolvedW = resolveEffectiveProductWeight(data.product);
        setSearchResults((prev) =>
          prev.map((p) =>
            p.pid === pid
              ? {
                  ...p,
                  productWeight: resolvedW || p.productWeight,
                  weightPending: false,
                  variants: data.product.variants || p.variants,
                }
              : p
          )
        );
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load product details.");
    } finally {
      setLoadingPreview(false);
    }
  };

  // Calculate retail price with current store markup rule and channel exchange rate
  const computePriceWithMarkup = (baseCostUSD: number, ruleBufferUSD?: number): number => {
    let effectiveCostUSD = baseCostUSD;
    if (typeof ruleBufferUSD === "number" && ruleBufferUSD >= 0) {
      effectiveCostUSD += ruleBufferUSD;
    }

    const costInStoreCurrency = effectiveCostUSD * (channelCurrency.exchangeRate || 1);
    let price = costInStoreCurrency;

    let activeMarkupType = markupType;
    let activeMarkupValue = markupValue;

    if (enableTieredMarkup && Number(tieredThresholdUSD) > 0 && baseCostUSD < Number(tieredThresholdUSD)) {
      activeMarkupType = "multiplier";
      activeMarkupValue = Number(tieredMultiplier) || 3.5;
    }

    if (activeMarkupType === "multiplier") {
      price = costInStoreCurrency * (activeMarkupValue || 1);
    } else if (activeMarkupType === "percentage") {
      price = costInStoreCurrency * (1 + (activeMarkupValue || 0) / 100);
    } else if (activeMarkupType === "fixed") {
      price = costInStoreCurrency + (activeMarkupValue || 0);
    }

    if (roundTo99) {
      price = Math.floor(price) + 0.99;
    } else {
      price = Math.round(price * 100) / 100;
    }

    if (enablePriceFloor && Number(minPriceFloorUSD) > 0) {
      let minFloorStoreCurr = Number(minPriceFloorUSD) * (channelCurrency.exchangeRate || 1);
      if (roundTo99) {
        minFloorStoreCurr = Math.floor(minFloorStoreCurr) + 0.99;
      } else {
        minFloorStoreCurr = Math.round(minFloorStoreCurr * 100) / 100;
      }
      price = Math.max(price, minFloorStoreCurr);
    }

    return Math.max(0.01, price);
  };

  // Calculate live freight / shipping estimates
  const handleCalculateShipping = async (country = shippingCountry) => {
    if (!previewProduct) return;
    setLoadingShipping(true);
    try {
      const firstVid = selectedVids[0] || previewProduct.variants?.[0]?.vid;
      const res = await fetch("/api/cj-dropshipping/shipping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pid: previewProduct.pid,
          vid: firstVid || undefined,
          countryCode: country,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to calculate shipping.");
      }

      setShippingRates(data.options || []);
      setIsShippingOpen(true);
      if (!data.options || data.options.length === 0) {
        const from = Array.isArray(data.stockOrigins) && data.stockOrigins.length ? ` from ${data.stockOrigins.join(", ")} warehouse` : "";
        toast.error(`No shipping options to ${country}${from}. This product can't be delivered there.`);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to calculate shipping rates.");
    } finally {
      setLoadingShipping(false);
    }
  };

  // Blocked by a shipping rule: say why and offer to import anyway
  const offerImportAnyway = (pid: string, message: string) => {
    toast.error(message, {
      duration: 10000,
      action: { label: "Import anyway", onClick: () => handleImportProduct(pid, { ignoreRules: true }) },
    } as any);
  };

  // After an import: show the products as in the store and take them out of the selection
  const markImported = (items: { pid: string; productId?: string }[]) => {
    const ids = new Map(items.map((i) => [i.pid, i.productId || "imported"]));
    setSearchResults((prev) => prev.map((r) => (ids.has(r.pid) ? { ...r, importedProductId: ids.get(r.pid) } : r)));
    setSelectedPids((prev) => prev.filter((id) => !ids.has(id)));
    fetchImportedProducts();
  };

  // Trigger Import
  const handleImportProduct = async (pid: string, opts: { ignoreRules?: boolean; replaceFields?: CJReplaceField[] } = {}) => {
    // Already in the store: ask what to replace first (nothing is overwritten without a choice)
    const listed = searchResults.find((r) => r.pid === pid);
    if (listed?.importedProductId && !opts.replaceFields) {
      setReimportFields([]);
      setReimportTarget({ pid, title: listed.productNameEn });
      return;
    }
    // Updating an existing product isn't an import, so shipping rules don't apply
    if (opts.replaceFields) opts = { ...opts, ignoreRules: true };

    const activeRules = shippingImportRules.filter((r) => r.enabled);
    if (activeRules.length === 0) {
      toast.error("No active shipping rules configured. At least one active shipping rule is required to allow imports.");
      return;
    }

    if (previewProduct && previewProduct.pid === pid && previewProduct.variants?.length && selectedVids.length === 0) {
      toast.error("Please select at least one variant to import.");
      return;
    }

    // Check rules: if blocked, notify that product will not be imported
    const targetProduct = previewProduct?.pid === pid ? previewProduct : searchResults.find((r) => r.pid === pid);
    if (targetProduct && !opts.ignoreRules) {
      const ruleEval = evaluateRulesClient(targetProduct);
      if (ruleEval.blocked) {
        offerImportAnyway(pid, `Product will not be imported: ${ruleEval.reason}`);
        return;
      }
    }

    setImportingPid(pid);
    try {
      const res = await fetch("/api/cj-dropshipping/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pid,
          customTitle: customTitle || undefined,
          customPrice: customPrice || undefined,
          salesChannelId: salesChannelId || undefined,
          collectionId: modalCollectionId && modalCollectionId !== "__auto__" ? modalCollectionId : undefined,
          publishStatus: autoPublish ? "published" : "draft",
          selectedVariantVids: previewProduct?.pid === pid && selectedVids.length > 0 ? selectedVids : undefined,
          ignoreRules: opts.ignoreRules || undefined,
          replaceFields: opts.replaceFields,
          // An update keeps the store's title unless "title" is chosen
          ...(opts.replaceFields ? { customTitle: undefined, customPrice: undefined } : {}),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Import failed.");
      }

      toast.success(data.message || "Product imported successfully into Amerta!");
      markImported([{ pid, productId: data.productId }]);
      setPreviewProduct(null);
    } catch (err: any) {
      const message = err.message || "Failed to import product.";
      if (!opts.ignoreRules && /blocked by shipping rules/i.test(message)) {
        offerImportAnyway(pid, message);
      } else {
        toast.error(message);
      }
    } finally {
      setImportingPid(null);
    }
  };

  // ---- Saved selection (this browser only) ----
  // Selected products are kept with their data, so a selection survives reloads and new searches.
  const SELECTION_KEY = "cj-dropshipping-selection";
  const [selectedCache, setSelectedCache] = useState<Record<string, CJProductListItem>>({});
  // Saving starts only once the restored selection is in state (otherwise the first run would save an empty one)
  const [selectionLoaded, setSelectionLoaded] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(SELECTION_KEY) || "null");
      if (saved && Array.isArray(saved.pids)) {
        setSelectedCache(saved.items || {});
        setSelectedPids(saved.pids);
      }
    } catch {}
    setSelectionLoaded(true);
  }, []);

  useEffect(() => {
    if (!selectionLoaded) return;
    setSelectedCache((prev) => {
      const next: Record<string, CJProductListItem> = {};
      for (const pid of selectedPids) {
        const item = searchResults.find((r) => r.pid === pid) || prev[pid];
        if (item) next[pid] = item;
      }
      try {
        localStorage.setItem(SELECTION_KEY, JSON.stringify({ pids: selectedPids, items: next }));
      } catch {}
      return next;
    });
  }, [selectedPids, searchResults, selectionLoaded]);

  /** A selected product's data: from the current results, else from the saved selection. */
  const getSelectedItem = (pid: string): CJProductListItem | undefined =>
    searchResults.find((r) => r.pid === pid) || selectedCache[pid];

  // Export panel content (computed here, after the saved selection it reads from)
  const selectionExport = isExportOpen ? buildSelectionExport() : null;
  const exportText = selectionExport ? (exportFormat === "md" ? selectionExport.md : selectionExport.json) : "";

  // Selection Handlers for Bulk Import
  const handleToggleSelect = (pid: string) => {
    if (searchResults.find((r) => r.pid === pid)?.importedProductId && !selectedPids.includes(pid)) {
      toast.info("Already in your store. Use Re-import to update it.");
      return;
    }
    setSelectedPids((prev) =>
      prev.includes(pid) ? prev.filter((id) => id !== pid) : [...prev, pid]
    );
  };

  // Calculate non-compliant items count on the current loaded page
  const blockedCountOnPage = useMemo(() => {
    return searchResults.filter((r) => evaluateRulesClient(r).blocked).length;
  }, [searchResults, evaluateRulesClient]);

  // Products displayed according to the hide/show ineligible toggle
  const displayedProducts = useMemo(() => {
    if (!hideIneligibleProducts) return searchResults;
    return searchResults.filter((r) => !evaluateRulesClient(r).blocked);
  }, [searchResults, hideIneligibleProducts, evaluateRulesClient]);

  const handleToggleSelectAllVisible = () => {
    // Only select items that are allowed by shipping rules among displayed products
    const allowedVisiblePids = displayedProducts
      .filter((r) => !evaluateRulesClient(r).blocked && !r.importedProductId)
      .map((r) => r.pid);
    const areAllSelected = allowedVisiblePids.length > 0 && allowedVisiblePids.every((id) => selectedPids.includes(id));

    if (areAllSelected) {
      setSelectedPids((prev) => prev.filter((id) => !allowedVisiblePids.includes(id)));
    } else {
      const combined = Array.from(new Set([...selectedPids, ...allowedVisiblePids]));
      setSelectedPids(combined);
    }
  };

  const handleClearSelection = () => {
    setSelectedPids([]);
  };

  const isAllVisibleSelected = useMemo(() => {
    const allowedVisiblePids = displayedProducts
      .filter((r) => !evaluateRulesClient(r).blocked && !r.importedProductId)
      .map((r) => r.pid);
    return allowedVisiblePids.length > 0 && allowedVisiblePids.every((id) => selectedPids.includes(id));
  }, [displayedProducts, selectedPids, evaluateRulesClient]);

  // Open Bulk Modal
  const handleOpenBulkModal = () => {
    const activeRules = shippingImportRules.filter((r) => r.enabled);
    if (activeRules.length === 0) {
      toast.error("No active shipping rules configured. At least one active shipping rule is required to allow imports.");
      return;
    }

    if (selectedPids.length === 0) {
      toast.error("Please select at least one product to import.");
      return;
    }

    const items: BulkImportItem[] = selectedPids.map((pid) => {
      const found = getSelectedItem(pid);
      const supplierCost = parseFloat(found?.sellPrice || "0") || 0;
      const ruleEval = found ? evaluateRulesClient(found) : { bufferUSD: 0, blocked: false, reason: "" };
      const retailPrice = found?.calculatedRetailPrice || computePriceWithMarkup(supplierCost, ruleEval.bufferUSD);
      return {
        pid,
        title: found?.productNameEn || pid,
        image: found?.productImage || "",
        cost: found?.sellPrice || "0",
        retailPrice,
        categoryName: found?.categoryName || "",
        status: ruleEval.blocked ? "failed" : "pending",
        message: ruleEval.blocked ? `Will not be imported (${ruleEval.reason})` : undefined,
      };
    });

    const blockedCount = items.filter((it) => it.status === "failed").length;
    if (blockedCount > 0) {
      toast.info(`${blockedCount} product(s) in queue will not be imported based on shipping rules.`);
    }

    setBulkItems(items);
    setBulkCollectionId(
      categoryMappingMode === "single_collection" && defaultCollectionId
        ? defaultCollectionId
        : "__auto__"
    );
    setBulkPublishStatus(autoPublish ? "published" : "draft");
    setBulkProgress({
      current: 0,
      total: items.length,
      successCount: 0,
      failCount: 0,
    });
    bulkAbortRef.current = false;
    setIsBulkModalOpen(true);
  };

  const handleRemoveFromBulkQueue = (pid: string) => {
    if (isBulkImporting) return;
    setSelectedPids((prev) => prev.filter((id) => id !== pid));
    setBulkItems((prev) => prev.filter((item) => item.pid !== pid));
  };

  const handleAbortBulkImport = () => {
    bulkAbortRef.current = true;
    toast.info("Stopping bulk import after current item...");
  };

  // Import one queued product; updates its row. Returns true on success.
  const importBulkItem = async (pid: string, ignoreRules: boolean): Promise<boolean> => {
    setBulkItems((prev) => prev.map((it) => (it.pid === pid ? { ...it, status: "importing", message: undefined } : it)));
    try {
      const res = await fetch("/api/cj-dropshipping/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pid,
          salesChannelId: salesChannelId || undefined,
          collectionId: bulkCollectionId !== "__auto__" ? bulkCollectionId : undefined,
          publishStatus: bulkPublishStatus,
          ignoreRules: ignoreRules || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed.");
      markImported([{ pid, productId: data.productId }]);
      setBulkItems((prev) =>
        prev.map((it) => (it.pid === pid ? { ...it, status: "success", message: data.message || "Imported successfully" } : it)),
      );
      return true;
    } catch (err: any) {
      setBulkItems((prev) => prev.map((it) => (it.pid === pid ? { ...it, status: "failed", message: err.message || "Import failed" } : it)));
      return false;
    }
  };

  // Re-import failed/blocked queue items, ignoring shipping rules
  const handleRetryIgnoringRules = async (pids: string[]) => {
    if (pids.length === 0) return;
    setIsBulkImporting(true);
    bulkAbortRef.current = false;
    let ok = 0;
    for (const pid of pids) {
      if (bulkAbortRef.current) break;
      if (await importBulkItem(pid, true)) {
        ok++;
        setBulkProgress((prev) => ({ ...prev, successCount: prev.successCount + 1, failCount: Math.max(0, prev.failCount - 1) }));
      }
    }
    setIsBulkImporting(false);
    if (ok > 0) {
      setSelectedPids((prev) => prev.filter((id) => !pids.includes(id)));
      fetchImportedProducts();
    }
    if (ok === pids.length) toast.success(`Imported ${ok} product(s), ignoring shipping rules.`);
    else toast.error(`Imported ${ok} of ${pids.length}. The rest failed for other reasons, see each row.`);
  };

  // Execute bulk import sequentially with real-time feedback
  const handleStartBulkImport = async () => {
    if (bulkItems.length === 0) return;

    setIsBulkImporting(true);
    bulkAbortRef.current = false;

    let successes = 0;
    let failures = 0;
    const succeededPids: string[] = [];

    for (let i = 0; i < bulkItems.length; i++) {
      if (bulkAbortRef.current) {
        toast.info("Bulk import cancelled.");
        break;
      }

      const item = bulkItems[i]!;

      // Already imported from its row ("Import anyway")
      if (item.status === "success") {
        successes++;
        continue;
      }

      // If item is already blocked by shipping rules, skip it (unless rules are ignored)
      if (item.status === "failed" && !bulkIgnoreRules) {
        failures++;
        setBulkProgress((prev) => ({
          ...prev,
          current: i + 1,
          failCount: failures,
        }));
        continue;
      }

      if (await importBulkItem(item.pid, bulkIgnoreRules)) {
        successes++;
        succeededPids.push(item.pid);
      } else {
        failures++;
      }

      setBulkProgress({
        current: i + 1,
        total: bulkItems.length,
        successCount: successes,
        failCount: failures,
      });
    }

    setIsBulkImporting(false);

    if (succeededPids.length > 0) {
      setSelectedPids((prev) => prev.filter((id) => !succeededPids.includes(id)));
      fetchImportedProducts();
    }

    if (successes > 0 && failures === 0) {
      toast.success(`Successfully imported all ${successes} product(s)!`);
    } else if (successes > 0 && failures > 0) {
      toast.info(`Bulk import finished: ${successes} succeeded, ${failures} failed.`);
    } else if (failures > 0) {
      toast.error(`Bulk import failed for all ${failures} product(s).`);
    }
  };

  const isConnected = Boolean(tokenExpiry);

  return (
    <Gutter className="cj-dropshipping-dashboard">
      <div className="cj-header">
        <div className="cj-title">
          <h1>CJ Dropshipping</h1>
          <p>Search millions of products, customize pricing rules, and import directly to your catalog.</p>
        </div>
        <div className={`cj-status-pill ${isConnected ? "connected" : "disconnected"}`}>
          <span className="dot" style={{ width: 8, height: 8, borderRadius: 0, background: isConnected ? "#10b981" : "#ef4444" }} />
          {isConnected ? "Connected to CJ API" : "Not Connected"}
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="cj-tabs">
        <button
          type="button"
          className={`cj-tab-btn ${activeTab === "search" ? "active" : ""}`}
          onClick={() => setActiveTab("search")}
        >
          Search & Import Catalog
        </button>
        <button
          type="button"
          className={`cj-tab-btn ${activeTab === "imported" ? "active" : ""}`}
          onClick={() => setActiveTab("imported")}
        >
          Imported Products ({importedProducts.length})
        </button>
        <button
          type="button"
          className={`cj-tab-btn ${activeTab === "pricing" ? "active" : ""}`}
          onClick={() => setActiveTab("pricing")}
        >
          Pricing Rules
        </button>
        <button
          type="button"
          className={`cj-tab-btn ${activeTab === "shipping" ? "active" : ""}`}
          onClick={() => setActiveTab("shipping")}
        >
          Shipping Rules ({shippingImportRules.filter((r) => r.enabled).length} active)
        </button>
        <button
          type="button"
          className={`cj-tab-btn ${activeTab === "settings" ? "active" : ""}`}
          onClick={() => setActiveTab("settings")}
        >
          Settings
        </button>
      </div>

      {/* Tab 1: Search & Import Catalog */}
      {activeTab === "search" && (
        <div>
          <div className="cj-card">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSearch(1, true);
              }}
              className="cj-search-bar"
            >
              {/* Row 1: Primary Search Criteria */}
              <div className="cj-search-row">
                <div>
                  <TextInput
                    path="searchKeyword"
                    label="Search Keyword or SKU"
                    value={searchKeyword}
                    onChange={(e: any) => setSearchKeyword(e.target.value)}
                    onKeyDown={(e: any) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSearch(1, true);
                      }
                    }}
                    placeholder="e.g. Wireless Earbuds, Smart Watch, CJ..."
                  />
                </div>
                <div>
                  <SelectInput
                    path="selectedCategory"
                    name="selectedCategory"
                    label="Category"
                    value={selectedCategory}
                    onChange={(val: any) => {
                      const v = typeof val === "object" && val !== null ? val.value : val;
                      setSelectedCategory(v || "");
                    }}
                    options={[
                      { label: "All Categories", value: "" },
                      ...categories.map((c) => ({
                        label: c.categoryName || (c as any).name || (c as any).categoryFirstName || "Category",
                        value: c.categoryId || (c as any).id || (c as any).categoryFirstId || "",
                      })),
                    ]}
                  />
                </div>
                <div>
                  <SelectInput
                    path="warehouseCountry"
                    name="warehouseCountry"
                    label="Warehouse / Shipping Location"
                    value={warehouseCountry}
                    onChange={(val: any) => {
                      const v = typeof val === "object" && val !== null ? val.value : val;
                      setWarehouseCountry(v || "");
                    }}
                    options={[
                      { label: "All Warehouses (Global)", value: "" },
                      { label: "🇺🇸 United States Warehouse (Fast 2-5 Days)", value: "US" },
                      { label: "🇨🇳 China Central Warehouse (CN)", value: "CN" },
                      { label: "🇬🇧 United Kingdom Warehouse (GB)", value: "GB" },
                      { label: "🇩🇪 Germany Warehouse (DE)", value: "DE" },
                      { label: "🇫🇷 France Warehouse (FR)", value: "FR" },
                      { label: "🇦🇪 United Arab Emirates Warehouse (AE)", value: "AE" },
                      { label: "🇸🇦 Saudi Arabia Warehouse (SA)", value: "SA" },
                      { label: "🇹🇭 Thailand Warehouse (TH)", value: "TH" },
                      { label: "🇮🇩 Indonesia Warehouse (ID)", value: "ID" },
                      { label: "🇦🇺 Australia Warehouse (AU)", value: "AU" },
                      { label: "🇨🇦 Canada Warehouse (CA)", value: "CA" },
                      { label: "🇲🇽 Mexico Warehouse (MX)", value: "MX" },
                      { label: "🇧🇷 Brazil Warehouse (BR)", value: "BR" },
                      { label: "🇯🇵 Japan Warehouse (JP)", value: "JP" },
                      { label: "🇮🇳 India Warehouse (IN)", value: "IN" },
                      { label: "🇪🇸 Spain Warehouse (ES)", value: "ES" },
                      { label: "🇮🇹 Italy Warehouse (IT)", value: "IT" },
                      { label: "🇨🇿 Czechia Warehouse (CZ)", value: "CZ" },
                      { label: "🇷🇴 Romania Warehouse (RO)", value: "RO" },
                      { label: "🇵🇱 Poland Warehouse (PL)", value: "PL" },
                      { label: "🇸🇬 Singapore Warehouse (SG)", value: "SG" },
                      { label: "🇲🇾 Malaysia Warehouse (MY)", value: "MY" },
                      { label: "🇵🇭 Philippines Warehouse (PH)", value: "PH" },
                      { label: "🇻🇳 Vietnam Warehouse (VN)", value: "VN" },
                      { label: "🇳🇿 New Zealand Warehouse (NZ)", value: "NZ" },
                      { label: "🇨🇱 Chile Warehouse (CL)", value: "CL" },
                    ]}
                  />
                </div>
                <div>
                  <SelectInput
                    path="productFlag"
                    name="productFlag"
                    label="Product Highlights"
                    value={productFlag}
                    onChange={(val: any) => {
                      const v = typeof val === "object" && val !== null ? val.value : val;
                      setProductFlag(v !== undefined && v !== null ? String(v) : "");
                    }}
                    options={[
                      { label: "All Highlights", value: "" },
                      { label: "🔥 Trending Products", value: "0" },
                      { label: "⚡ New Arrivals", value: "1" },
                      { label: "🎥 Video Products", value: "2" },
                      { label: "📦 Clearance / Slow-moving", value: "3" },
                    ]}
                  />
                </div>
              </div>

              {/* Row 2: Pricing, Shipping & Inventory Filters */}
              <div className="cj-search-row">
                <div>
                  <TextInput
                    path="minPrice"
                    label="Min Cost ($)"
                    value={minPrice}
                    onChange={(e: any) => setMinPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <div>
                  <TextInput
                    path="maxPrice"
                    label="Max Cost ($)"
                    value={maxPrice}
                    onChange={(e: any) => setMaxPrice(e.target.value)}
                    placeholder="100"
                  />
                </div>
                <div>
                  <SelectInput
                    path="shippingFilter"
                    name="shippingFilter"
                    label="Shipping Option"
                    value={shippingFilter}
                    onChange={(val: any) => {
                      const v = typeof val === "object" && val !== null ? val.value : val;
                      setShippingFilter(v !== undefined && v !== null ? String(v) : "");
                    }}
                    options={[
                      { label: "All Shipping Types", value: "" },
                      { label: "🚚 Free Shipping Only", value: "1" },
                      { label: "Standard / Paid Shipping", value: "0" },
                    ]}
                  />
                </div>
                <div>
                  <SelectInput
                    path="minInventory"
                    name="minInventory"
                    label="Min Warehouse Stock"
                    value={minInventory}
                    onChange={(val: any) => {
                      const v = typeof val === "object" && val !== null ? val.value : val;
                      setMinInventory(v || "");
                    }}
                    options={[
                      { label: "Any In-Stock", value: "" },
                      { label: "50+ Units In Stock", value: "50" },
                      { label: "100+ Units In Stock", value: "100" },
                      { label: "500+ Units In Stock", value: "500" },
                    ]}
                  />
                </div>
                <div>
                  <SelectInput
                    path="productTypeFilter"
                    name="productTypeFilter"
                    label="Media & Supplier Type"
                    value={productTypeFilter}
                    onChange={(val: any) => {
                      const v = typeof val === "object" && val !== null ? val.value : val;
                      setProductTypeFilter(v !== undefined && v !== null ? String(v) : "");
                    }}
                    options={[
                      { label: "All Product Types", value: "" },
                      { label: "🎥 Video Asset Available", value: "10" },
                      { label: "🖼️ Standard Non-Video", value: "11" },
                      { label: "🏭 Direct Supplier Products", value: "4" },
                    ]}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="cj-search-actions">
                <Button
                  buttonStyle="secondary"
                  disabled={isSearching}
                  onClick={handleResetFilters}
                >
                  Reset Filters
                </Button>
                <Button
                  type="submit"
                  disabled={isSearching}
                  onClick={() => handleSearch(1, true)}
                >
                  {isSearching ? "Searching..." : "Search Catalog"}
                </Button>
              </div>

              {searchHistory.length > 0 && (
                <div className="cj-search-history">
                  <span className="cj-search-history-label">Recent</span>
                  {searchHistory.map((entry) => {
                    const key = JSON.stringify(entry.filters);
                    return (
                      <span key={key} className="cj-history-chip">
                        <button
                          type="button"
                          disabled={isSearching}
                          title={`Run again (${entry.total} results, ${new Date(entry.at).toLocaleString()})`}
                          onClick={() => handleHistoryClick(entry)}
                        >
                          {describeSearch(entry)}
                          <span className="cj-history-count">{entry.total}</span>
                        </button>
                        <button
                          type="button"
                          className="cj-history-remove"
                          title="Remove from history"
                          onClick={() => saveSearchHistory(searchHistory.filter((e) => JSON.stringify(e.filters) !== key))}
                        >
                          ×
                        </button>
                      </span>
                    );
                  })}
                  <button type="button" className="cj-history-clear" onClick={() => saveSearchHistory([])}>
                    Clear
                  </button>
                </div>
              )}
            </form>
          </div>

          {/* Results Grid / List */}
          {searchResults.length > 0 ? (
            <div>
              {/* Sticky / Banner Bulk Actions Bar */}
              {selectedPids.length > 0 && (
                <div className="cj-bulk-action-bar">
                  <div className="cj-bulk-bar-left">
                    <span className="cj-bulk-count-badge">
                      <span className="cj-bulk-check-icon">✓</span>
                      {selectedPids.length} product{selectedPids.length > 1 ? "s" : ""} selected
                    </span>
                    <button
                      type="button"
                      className="cj-bulk-action-link"
                      onClick={handleToggleSelectAllVisible}
                    >
                      {isAllVisibleSelected ? "Deselect Page" : `Select All on Page (${searchResults.length})`}
                    </button>
                    <button
                      type="button"
                      className="cj-bulk-action-link"
                      onClick={handleClearSelection}
                    >
                      Clear Selection
                    </button>
                  </div>
                  <div className="cj-bulk-bar-right">
                    <Button
                      buttonStyle="secondary"
                      onClick={() => setIsExportOpen(true)}
                    >
                      Copy as MD / JSON
                    </Button>
                    <Button
                      buttonStyle="primary"
                      onClick={handleOpenBulkModal}
                    >
                      Bulk Import ({selectedPids.length})
                    </Button>
                  </div>
                </div>
              )}

              <div className="cj-results-header">
                <div className="cj-results-count">
                  Found {totalResults} products on CJ Dropshipping
                  <span>
                    {hideIneligibleProducts
                      ? `(Showing ${displayedProducts.length} of ${searchResults.length} loaded • ${blockedCountOnPage} ineligible hidden)`
                      : `(Showing ${searchResults.length} of ${totalResults})`}
                  </span>
                </div>
                <div className="cj-results-controls">
                  <button
                    type="button"
                    className={`cj-toggle-filter-btn ${hideIneligibleProducts ? "active" : ""}`}
                    onClick={() => setHideIneligibleProducts((prev) => !prev)}
                    title={
                      hideIneligibleProducts
                        ? "Show all products including ineligible ones"
                        : "Hide products that don't satisfy the shipping rules"
                    }
                  >
                    {hideIneligibleProducts ? (
                      <>
                        <span>👁</span> Show Ineligible ({blockedCountOnPage})
                      </>
                    ) : (
                      <>
                        <span>🚫</span> Hide Ineligible ({blockedCountOnPage})
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    className={`cj-select-all-btn ${isAllVisibleSelected ? "active" : ""}`}
                    onClick={handleToggleSelectAllVisible}
                  >
                    {isAllVisibleSelected ? "✓ Deselect Page" : "Select All on Page"}
                  </button>
                  <div className="cj-view-toggle">
                    <button
                      type="button"
                      className={`cj-view-btn ${viewMode === "grid" ? "active" : ""}`}
                      onClick={() => setViewMode("grid")}
                    >
                      Grid View
                    </button>
                    <button
                      type="button"
                      className={`cj-view-btn ${viewMode === "list" ? "active" : ""}`}
                      onClick={() => setViewMode("list")}
                    >
                      List View
                    </button>
                  </div>
                </div>
              </div>

              {viewMode === "grid" ? (
                <div className="cj-product-grid">
                  {displayedProducts.length === 0 ? (
                    <div style={{ padding: "3rem 1.5rem", textAlign: "center", gridColumn: "1 / -1", color: "var(--theme-elevation-500)" }}>
                      <p style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                        All {searchResults.length} loaded products on this page don't satisfy your shipping rules.
                      </p>
                      <p style={{ fontSize: "0.88rem", marginBottom: "1rem" }}>
                        Click below to reveal all products.
                      </p>
                      <Button size="small" buttonStyle="secondary" onClick={() => setHideIneligibleProducts(false)}>
                        Show All Products ({searchResults.length})
                      </Button>
                    </div>
                  ) : (
                    displayedProducts.map((item) => {
                    const isSelected = selectedPids.includes(item.pid);
                    const supplierCostUSD = parseFloat(item.sellPrice) || 0;
                    const ruleEval = evaluateRulesClient(item);
                    const isBlocked = Boolean(ruleEval.blocked);
                    const blockedReason = ruleEval.reason || "Blocked by shipping rules";
                    const retailPrice = item.calculatedRetailPrice || computePriceWithMarkup(supplierCostUSD, ruleEval.bufferUSD);
                    const retailPriceUSD = (retailPrice / (channelCurrency.exchangeRate || 1)).toFixed(2);
                    const costInStoreCurr = supplierCostUSD * (channelCurrency.exchangeRate || 1);
                    const estimatedProfit = Math.max(0, retailPrice - costInStoreCurr).toFixed(2);

                    return (
                      <div
                        key={item.pid}
                        className={`cj-product-card ${isSelected ? "cj-card-selected" : ""} ${item.importedProductId ? "cj-card-imported" : ""}`}
                      >
                        <div
                          className="cj-card-image"
                          onClick={() => handleOpenPreview(item.pid)}
                        >
                          <div
                            className={`cj-card-select-overlay ${isSelected ? "selected" : ""}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleSelect(item.pid);
                            }}
                            title={isSelected ? "Deselect item" : "Select item"}
                          >
                            <input
                              type="checkbox"
                              className="cj-custom-checkbox"
                              checked={isSelected}
                              disabled={Boolean(item.importedProductId) && !isSelected}
                              onChange={() => handleToggleSelect(item.pid)}
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          <img src={item.productImage} alt={item.productNameEn} />
                          {item.importedProductId && <div className="cj-imported-badge">✓ In store</div>}
                          <div className="cj-profit-badge">+{channelCurrency.symbol} {estimatedProfit} est. profit</div>
                        </div>
                        <div className="cj-card-body">
                          <div className="cj-prod-title" title={item.productNameEn}>
                            {item.productNameEn}
                          </div>
                          {renderCategoryPath(item)}
                          <div className="cj-pricing-row">
                            <div className="cj-cost">
                              Supplier Cost {channelCurrency.code !== "USD" ? `(${channelCurrency.code})` : ""}
                              <br />
                              {channelCurrency.code !== "USD" && (
                                <span className="cj-usd-sub">
                                  ${supplierCostUSD.toFixed(2)} USD
                                </span>
                              )}
                              <span>
                                {channelCurrency.code !== "USD"
                                  ? `${channelCurrency.symbol} ${costInStoreCurr.toFixed(2)}`
                                  : `$${supplierCostUSD.toFixed(2)} USD`}
                              </span>
                            </div>
                            <div className="cj-retail">
                              Retail ({channelCurrency.code})
                              <br />
                              {channelCurrency.code !== "USD" && (
                                <span className="cj-usd-sub">
                                  ${retailPriceUSD} USD
                                </span>
                              )}
                              <span>{channelCurrency.symbol} {retailPrice.toFixed(2)}</span>
                            </div>
                          </div>

                          {/* Rule Check Label Under */}
                          <div className={`cj-rule-check-box ${isBlocked ? "blocked" : "allowed"}`}>
                            <div className="cj-rule-check-header">
                              <span className="cj-rule-check-title">Rule Check</span>
                              <span className="cj-rule-check-badge">
                                {isBlocked ? "Will not import" : "Allowed"}
                              </span>
                            </div>
                            <div className="cj-rule-check-details">
                              {isBlocked ? (
                                <span>
                                  Product will not be imported ({blockedReason}){" "}
                                  <button
                                    type="button"
                                    className="cj-import-anyway"
                                    disabled={importingPid === item.pid}
                                    onClick={() => handleImportProduct(item.pid, { ignoreRules: true })}
                                  >
                                    Import anyway
                                  </button>
                                </span>
                              ) : (
                                <span>
                                  Price after import: <strong>{channelCurrency.symbol} {retailPrice.toFixed(2)}</strong> (${retailPriceUSD} USD)
                                  {ruleEval.bufferUSD > 0 ? ` (+$${ruleEval.bufferUSD.toFixed(2)} buffer)` : ""}
                                  {item.weightPending ? " · Weight rules checked on preview/import" : ""}
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="cj-card-actions">
                            <Button
                              size="small"
                              buttonStyle="secondary"
                              onClick={() => handleOpenPreview(item.pid)}
                              disabled={loadingPreview}
                            >
                              Preview
                            </Button>
                            {item.importedProductId && item.importedProductId !== "imported" && (
                              <Button
                                size="small"
                                buttonStyle="secondary"
                                el="anchor"
                                url={`/admin/collections/products/${item.importedProductId}`}
                                newTab
                              >
                                View
                              </Button>
                            )}
                            <Button
                              size="small"
                              buttonStyle={item.importedProductId ? "secondary" : "primary"}
                              onClick={() => handleImportProduct(item.pid, { ignoreRules: isBlocked && Boolean(item.importedProductId) })}
                              disabled={importingPid === item.pid}
                            >
                              {importingPid === item.pid ? "Importing..." : item.importedProductId ? "Re-import" : "Import"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            ) : (
              <div className="cj-table-container">
                <table className="cj-results-table">
                  <thead>
                    <tr>
                      <th className="th-checkbox">
                        <input
                          type="checkbox"
                          className="cj-custom-checkbox"
                          checked={isAllVisibleSelected}
                          onChange={handleToggleSelectAllVisible}
                          title="Select/Deselect All on Page"
                        />
                      </th>
                      <th className="th-img">Image</th>
                      <th>Title & SKU</th>
                      <th>Category</th>
                      <th>Weight</th>
                      <th>Supplier Cost {channelCurrency.code !== "USD" ? `(${channelCurrency.code})` : "(USD)"}</th>
                      <th>Retail Price ({channelCurrency.code})</th>
                      <th>Est. Profit ({channelCurrency.code})</th>
                      <th className="th-actions">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: "center", padding: "3rem 1.5rem", color: "var(--theme-elevation-500)" }}>
                          <p style={{ fontSize: "1.05rem", fontWeight: 600, marginBottom: "0.5rem" }}>
                            All {searchResults.length} loaded products on this page don't satisfy your shipping rules.
                          </p>
                          <Button size="small" buttonStyle="secondary" onClick={() => setHideIneligibleProducts(false)}>
                            Show All Products ({searchResults.length})
                          </Button>
                        </td>
                      </tr>
                    ) : (
                      displayedProducts.map((item) => {
                        const isSelected = selectedPids.includes(item.pid);
                        const supplierCostUSD = parseFloat(item.sellPrice) || 0;
                        const ruleEval = evaluateRulesClient(item);
                        const isBlocked = Boolean(ruleEval.blocked);
                        const blockedReason = ruleEval.reason || "Blocked by shipping rules";
                        const retailPrice = item.calculatedRetailPrice || computePriceWithMarkup(supplierCostUSD, ruleEval.bufferUSD);
                        const retailPriceUSD = (retailPrice / (channelCurrency.exchangeRate || 1)).toFixed(2);
                        const costInStoreCurr = supplierCostUSD * (channelCurrency.exchangeRate || 1);
                        const estimatedProfit = Math.max(0, retailPrice - costInStoreCurr).toFixed(2);

                        return (
                          <tr
                            key={item.pid}
                            className={isSelected ? "cj-row-selected" : ""}
                          >
                            <td
                              className="td-checkbox"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <input
                                type="checkbox"
                                className="cj-custom-checkbox"
                                checked={isSelected}
                                onChange={() => handleToggleSelect(item.pid)}
                                title={isSelected ? "Deselect item" : "Select item"}
                              />
                            </td>
                            <td>
                              <div
                                className="cj-table-thumb"
                                onClick={() => handleOpenPreview(item.pid)}
                                onMouseEnter={(e) => setHoverPreview({ url: item.productImage, x: e.clientX, y: e.clientY })}
                                onMouseMove={(e) => setHoverPreview({ url: item.productImage, x: e.clientX, y: e.clientY })}
                                onMouseLeave={() => setHoverPreview(null)}
                              >
                                <img src={item.productImage} alt="" />
                              </div>
                            </td>
                            <td className="cj-table-title-cell">
                              <div
                                className="cj-table-title"
                                onClick={() => handleOpenPreview(item.pid)}
                                title={item.productNameEn}
                              >
                                {item.productNameEn}
                              </div>
                              {item.importedProductId && <span className="cj-imported-inline">✓ In store</span>}
                              <div className="cj-table-sku">
                                <span>{item.productSku || item.pid}</span>
                              </div>
                              {/* Rule Check label under */}
                              <div className={`cj-rule-check-inline ${isBlocked ? "blocked" : "allowed"}`}>
                                <span className="cj-rule-check-title">Rule Check:</span>
                                {isBlocked ? (
                                  <span className="cj-rule-check-text blocked">
                                    Product will not be imported ({blockedReason})
                                  </span>
                                ) : (
                                  <span className="cj-rule-check-text allowed">
                                    Allowed • Price after import: <strong>{channelCurrency.symbol} {retailPrice.toFixed(2)}</strong> (${retailPriceUSD} USD){ruleEval.bufferUSD > 0 ? ` (+$${ruleEval.bufferUSD.toFixed(2)} buffer)` : ""}{item.weightPending ? " · Weight rules checked on preview/import" : ""}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="cj-table-meta">
                              {item.categoryPath?.length ? renderCategoryPath(item) : item.categoryName || "—"}
                            </td>
                            <td className="cj-table-meta">
                              {(() => {
                                const w = resolveEffectiveProductWeight(item);
                                return w > 0 ? `${w}g` : "—";
                              })()}
                            </td>
                            <td className="cj-table-cost">
                              {channelCurrency.code !== "USD" && (
                                <div style={{ fontSize: "0.72rem", color: "var(--theme-elevation-500)", marginBottom: "0.15rem" }}>
                                  ${supplierCostUSD.toFixed(2)} USD
                                </div>
                              )}
                              <div>
                                {channelCurrency.code !== "USD"
                                  ? `${channelCurrency.symbol} ${costInStoreCurr.toFixed(2)}`
                                  : `$${supplierCostUSD.toFixed(2)} USD`}
                              </div>
                            </td>
                            <td className="cj-table-retail">
                              {channelCurrency.code !== "USD" && (
                                <div style={{ fontSize: "0.72rem", color: "var(--theme-elevation-500)", marginBottom: "0.15rem" }}>
                                  ${retailPriceUSD} USD
                                </div>
                              )}
                              <div>{channelCurrency.symbol} {retailPrice.toFixed(2)}</div>
                            </td>
                            <td>
                              <span className="cj-table-profit">
                                +{channelCurrency.symbol} {estimatedProfit}
                              </span>
                            </td>
                            <td className="cj-table-actions">
                              <div className="cj-actions-group">
                                <Button
                                  size="small"
                                  buttonStyle="secondary"
                                  onClick={() => handleOpenPreview(item.pid)}
                                  disabled={loadingPreview}
                                >
                                  Preview
                                </Button>
                                <Button
                                  size="small"
                                  buttonStyle={item.importedProductId ? "secondary" : "primary"}
                                  onClick={() => handleImportProduct(item.pid)}
                                  disabled={importingPid === item.pid}
                                >
                                  {importingPid === item.pid ? "Importing..." : item.importedProductId ? "Re-import" : "Import"}
                                </Button>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  </table>
                </div>
              )}

              {/* Infinite Scroll Sentinel */}
              <div ref={observerTarget} style={{ height: 30, margin: "1rem 0" }} />

              {/* Loading More Indicator */}
              {isLoadingMore && (
                <div className="cj-infinite-scroll-status">
                  <div className="cj-spinner" />
                  <span>Loading more products...</span>
                </div>
              )}

              {/* Load more (also loads on scroll) */}
              {!isSearching && !isLoadingMore && searchResults.length > 0 && searchResults.length < totalResults && (
                <div className="cj-infinite-scroll-status">
                  <Button buttonStyle="secondary" size="small" onClick={() => handleSearch(currentPage + 1, false)}>
                    Load more ({searchResults.length} of {totalResults})
                  </Button>
                </div>
              )}

              {/* Reached End */}
              {!isLoadingMore && searchResults.length >= totalResults && searchResults.length > 0 && (
                <div className="cj-infinite-scroll-status">
                  <span>✓ All {totalResults} products loaded</span>
                </div>
              )}
            </div>
          ) : (
            <div className="cj-card" style={{ textAlign: "center", padding: "3rem 1rem" }}>
              <p style={{ fontSize: "1.1rem", color: "var(--theme-elevation-500)", margin: 0 }}>
                {isSearching
                  ? "Searching CJ Dropshipping catalog..."
                  : "No products matched your search filters. Try clearing or adjusting filters above."}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Imported Products */}
      {activeTab === "imported" && (
        <div className="cj-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
            <div className="cj-card-title" style={{ margin: 0 }}>Products Imported from CJ Dropshipping</div>
            <button
              type="button"
              className="cj-btn cj-btn-secondary"
              onClick={fetchImportedProducts}
              disabled={loadingImported}
              style={{ fontSize: "0.8rem", padding: "0.35rem 0.75rem", borderRadius: 0 }}
            >
              {loadingImported ? "Refreshing..." : "↻ Refresh"}
            </button>
          </div>
          {loadingImported ? (
            <p>Loading imported catalog...</p>
          ) : importedProducts.length > 0 ? (
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid var(--theme-elevation-200)" }}>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Image</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Title</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>SKU</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Retail Price ({channelCurrency.code})</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                    <th style={{ padding: "0.75rem 0.5rem" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {importedProducts.map((prod) => (
                    <tr key={prod.id} style={{ borderBottom: "1px solid var(--theme-elevation-100)" }}>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        {prod.images?.[0]?.url || prod.images?.[0]?.thumbnailURL ? (
                          <img
                            src={prod.images[0].url || prod.images[0].thumbnailURL}
                            alt=""
                            style={{ width: 48, height: 48, objectFit: "cover", borderRadius: 0 }}
                          />
                        ) : (
                          <div style={{ width: 48, height: 48, background: "var(--theme-elevation-150)", borderRadius: 0 }} />
                        )}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem", fontWeight: 600 }}>{prod.title}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "var(--theme-elevation-500)" }}>{prod.sku}</td>
                      <td style={{ padding: "0.75rem 0.5rem", color: "#10b981", fontWeight: 700 }}>
                        {channelCurrency.symbol} {prod.price?.toFixed(2)}
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <span
                          style={{
                            padding: "0.2rem 0.5rem",
                            borderRadius: 0,
                            fontSize: "0.75rem",
                            background: prod._status === "published" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                            color: prod._status === "published" ? "#10b981" : "#f59e0b",
                          }}
                        >
                          {prod._status}
                        </span>
                      </td>
                      <td style={{ padding: "0.75rem 0.5rem" }}>
                        <a
                          href={`/admin/collections/products/${prod.id}`}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: "var(--theme-primary-500)", textDecoration: "none", fontWeight: 600 }}
                        >
                          Edit Product ↗
                        </a>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{ color: "var(--theme-elevation-500)" }}>No products imported from CJ yet.</p>
          )}
        </div>
      )}

      {/* Tab 3: Pricing Rules */}
      {activeTab === "pricing" && (
        <div className="cj-settings-grid">
          {/* Automated Pricing Markup Strategy */}
          <div className="cj-card">
            <div className="cj-card-title">1. Automated Pricing Markup Strategy</div>
            <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Automatically calculate retail prices when importing products from CJ Dropshipping.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <SelectInput
                  path="markupType"
                  name="markupType"
                  label="Markup Strategy"
                  value={markupType}
                  onChange={(val: any) => setMarkupType(val?.value || "multiplier")}
                  options={[
                    { label: "Price Multiplier (e.g. 2.5x wholesale cost)", value: "multiplier" },
                    { label: "Percentage Margin (e.g. +100% markup)", value: "percentage" },
                    { label: `Fixed Amount Markup (e.g. +15.00 ${channelCurrency.code})`, value: "fixed" },
                  ]}
                />
              </div>
              <div>
                <TextInput
                  path="markupValue"
                  label={
                    markupType === "multiplier"
                      ? "Multiplier Factor (e.g. 2.5)"
                      : markupType === "percentage"
                      ? "Percentage Margin (%)"
                      : `Fixed Markup Amount (${channelCurrency.symbol || channelCurrency.code})`
                  }
                  value={String(markupValue)}
                  onChange={(e: any) => setMarkupValue(parseFloat(e.target.value) || 0)}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="roundTo99"
                  checked={roundTo99}
                  onChange={(e) => setRoundTo99(e.target.checked)}
                />
                <label htmlFor="roundTo99" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                  Round prices to <strong>.99</strong> (e.g. {channelCurrency.symbol} 29.99 psychological pricing)
                </label>
              </div>

              <div style={{
                background: "var(--theme-elevation-100)",
                border: "1px solid var(--theme-elevation-200)",
                padding: "0.75rem 1rem",
                fontSize: "0.85rem",
                lineHeight: 1.5,
              }}>
                <strong>Formula:</strong> Final Retail Price = (CJ Supplier Cost USD + Shipping Buffer from matched Shipping Rule) × {markupType === "multiplier" ? `${markupValue}x Multiplier` : markupType === "percentage" ? `+${markupValue}%` : `+${markupValue} Fixed`} × Exch Rate ({channelCurrency.exchangeRate || 1}) {roundTo99 ? "→ Round to .99" : ""}.
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? "Saving..." : "Save Pricing Rules"}
                </Button>
              </div>
            </div>
          </div>

          {/* Advanced Pricing Protection Rules */}
          <div className="cj-card">
            <div className="cj-card-title">2. Advanced Pricing Protection Rules (Currency: USD $)</div>
            <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.9rem", marginBottom: "0.75rem", lineHeight: 1.5 }}>
              Protect against selling low-value products at a loss. Fixed carrier dispatch costs and processing fees make low-cost items unprofitable without price floors or tiered multipliers.
            </p>

            <div style={{
              background: "var(--theme-elevation-100)",
              border: "1px solid var(--theme-elevation-200)",
              padding: "0.75rem 1rem",
              marginBottom: "1.25rem",
              fontSize: "0.85rem",
              lineHeight: 1.5,
            }}>
              <strong>💡 Unified Currency Standard (CJ USD $):</strong> All rule amounts below are configured directly in CJ's native currency (<strong>USD $</strong>). Retail prices are automatically converted to your store currency (<strong>{channelCurrency.code}</strong>) using your active exchange rate ($1.00 USD = {channelCurrency.exchangeRate || 1} {channelCurrency.code}).
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Rule 1: Minimum Retail Price Floor */}
              <div className={`cj-rule-card ${enablePriceFloor ? "active" : ""}`}>
                <div className="cj-rule-header">
                  <div className="cj-rule-title-wrap">
                    <input
                      type="checkbox"
                      id="enablePriceFloor"
                      checked={enablePriceFloor}
                      onChange={(e) => setEnablePriceFloor(e.target.checked)}
                    />
                    <label htmlFor="enablePriceFloor">Rule 1: Minimum Retail Price Floor ($ USD)</label>
                  </div>
                  <span className={`cj-rule-badge ${enablePriceFloor ? "active" : "inactive"}`}>
                    {enablePriceFloor ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="cj-rule-desc">
                  No product will ever be sold below this floor price in USD ($). Prevents selling at a loss due to fixed parcel dispatch fees, advertising acquisition costs, and courier base rates.
                </div>
                {enablePriceFloor && (
                  <div className="cj-rule-body">
                    <TextInput
                      path="minPriceFloorUSD"
                      label="Minimum Retail Price Floor ($ USD)"
                      value={String(minPriceFloorUSD)}
                      onChange={(e: any) => setMinPriceFloorUSD(parseFloat(e.target.value) || 0)}
                    />
                    <div style={{ fontSize: "0.8rem", color: "var(--theme-elevation-500)", marginTop: "0.15rem" }}>
                      Store conversion preview: <strong>${minPriceFloorUSD || 0} USD</strong> ≈{" "}
                      <strong>{channelCurrency.symbol} {((Number(minPriceFloorUSD) || 0) * (channelCurrency.exchangeRate || 1)).toFixed(2)} {channelCurrency.code}</strong>
                    </div>
                  </div>
                )}
              </div>

              {/* Rule 2: Tiered Markup for Low-Cost Products */}
              <div className={`cj-rule-card ${enableTieredMarkup ? "active" : ""}`}>
                <div className="cj-rule-header">
                  <div className="cj-rule-title-wrap">
                    <input
                      type="checkbox"
                      id="enableTieredMarkup"
                      checked={enableTieredMarkup}
                      onChange={(e) => setEnableTieredMarkup(e.target.checked)}
                    />
                    <label htmlFor="enableTieredMarkup">Rule 2: Tiered Markup for Low-Cost Products ($ USD)</label>
                  </div>
                  <span className={`cj-rule-badge ${enableTieredMarkup ? "active" : "inactive"}`}>
                    {enableTieredMarkup ? "Active" : "Disabled"}
                  </span>
                </div>
                <div className="cj-rule-desc">
                  Low-cost items (e.g. &lt; $5.00 USD) have an unusually high shipping-to-cost ratio. When activated, any item whose supplier cost is below the threshold automatically receives a higher multiplier to absorb parcel dispatch fees.
                </div>
                {enableTieredMarkup && (
                  <div className="cj-rule-body">
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                      <TextInput
                        path="tieredThresholdUSD"
                        label="Low-Cost Threshold ($ USD)"
                        value={String(tieredThresholdUSD)}
                        onChange={(e: any) => setTieredThresholdUSD(parseFloat(e.target.value) || 0)}
                      />
                      <TextInput
                        path="tieredMultiplier"
                        label="Tiered Multiplier (e.g. 3.5x)"
                        value={String(tieredMultiplier)}
                        onChange={(e: any) => setTieredMultiplier(parseFloat(e.target.value) || 0)}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ marginTop: "0.5rem" }}>
                <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                  {isSavingSettings ? "Saving..." : "Save Pricing Rules"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Shipping Rules */}
      {activeTab === "shipping" && (
        <div className="cj-settings-grid">
          {/* Status Alert Banner if No Rules */}
          {shippingImportRules.filter((r) => r.enabled).length === 0 ? (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "rgba(239, 68, 68, 0.12)",
                border: "1px solid rgba(239, 68, 68, 0.4)",
                color: "#ef4444",
                padding: "1rem 1.25rem",
                borderRadius: 0,
                fontSize: "0.92rem",
                lineHeight: 1.5,
              }}
            >
              <strong>🚫 Product Imports Blocked:</strong> No active shipping rules are configured. You must configure and enable <strong>at least 1 shipping rule</strong> below before products can be imported from CJ Dropshipping.
            </div>
          ) : (
            <div
              style={{
                gridColumn: "1 / -1",
                background: "var(--theme-elevation-100)",
                border: "1px solid var(--theme-elevation-200)",
                padding: "0.85rem 1.25rem",
                fontSize: "0.88rem",
                lineHeight: 1.5,
              }}
            >
              <strong>💡 Shipping Rules Control Everything:</strong> Each rule defines the criteria (e.g. weight &lt; 500g, weight not set, cost), whether to <strong>Allow</strong> or <strong>Block</strong> import, and what <strong>Shipping Buffer Cushion ($ USD)</strong> to add to wholesale costs. By default, all products not explicitly blocked by a rule are allowed to be imported.
            </div>
          )}

          {/* Shipping & Import Rules Table */}
          <div className="cj-card" style={{ gridColumn: "1 / -1" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
              <div>
                <div className="cj-card-title">Shipping & Import Rules Table</div>
                <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.9rem", margin: "0.25rem 0 0" }}>
                  Configure your shipping rules with criteria, import permissions (Allow / Block), and custom shipping buffer cushions in USD ($).
                </p>
              </div>
              <Button size="small" buttonStyle="primary" onClick={handleOpenAddRule}>
                + Add New Shipping Rule
              </Button>
            </div>

            <div style={{ overflowX: "auto", marginTop: "1rem" }}>
              <table className="cj-rules-table">
                <thead>
                  <tr>
                    <th style={{ width: 60, textAlign: "center" }}>Active</th>
                    <th>Rule Name</th>
                    <th>Condition / Criteria</th>
                    <th>Import Permission</th>
                    <th>Shipping Buffer Cushion</th>
                    <th style={{ width: 120, textAlign: "center" }}>Manage</th>
                  </tr>
                </thead>
                <tbody>
                  {shippingImportRules.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: "center", padding: "2.5rem", color: "#ef4444" }}>
                        <strong>No shipping rules configured.</strong> Click "+ Add New Shipping Rule" above to create at least 1 rule.
                      </td>
                    </tr>
                  ) : (
                    shippingImportRules.map((rule) => {
                      const formatCriteria = (r: CJShippingImportRule) => {
                        if (r.field === "all" || r.operator === "always") {
                          return <span>All Products (Default / Catch-all)</span>;
                        }
                        if (r.field === "weight_not_set") {
                          return <span>Weight is not set (0g / missing)</span>;
                        }
                        const fieldName = r.field === "weight" ? "Weight" : r.field === "cost" ? "Supplier Cost" : "Variants Count";
                        const opSymbol = r.operator === "greater_than" ? ">" : r.operator === "less_than" ? "<" : "==";
                        const unit = r.field === "weight" ? "g" : r.field === "cost" ? "$ USD" : "";
                        return <span><strong>{fieldName}</strong> {opSymbol} {r.value} {unit}</span>;
                      };

                      return (
                        <tr key={rule.id} style={{ opacity: rule.enabled ? 1 : 0.55 }}>
                          <td style={{ textAlign: "center" }}>
                            <input
                              type="checkbox"
                              checked={rule.enabled}
                              onChange={() => handleToggleRule(rule.id)}
                              title={rule.enabled ? "Disable rule" : "Enable rule"}
                            />
                          </td>
                          <td>
                            <strong>{rule.name}</strong>
                          </td>
                          <td>{formatCriteria(rule)}</td>
                          <td>
                            {rule.action === "block" ? (
                              <span className="cj-action-badge block">🚫 Block Import</span>
                            ) : (
                              <span className="cj-action-badge allow">✓ Allow Import</span>
                            )}
                          </td>
                          <td>
                            {rule.action === "allow" && (Number(rule.bufferUSD) || 0) > 0 ? (
                              <strong style={{ color: "#10b981" }}>+${(Number(rule.bufferUSD) || 0).toFixed(2)} USD</strong>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td style={{ textAlign: "center" }}>
                            <div style={{ display: "inline-flex", gap: "0.5rem" }}>
                              <button
                                type="button"
                                onClick={() => handleOpenEditRule(rule)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "var(--theme-primary-500)",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                }}
                              >
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteRule(rule.id)}
                                style={{
                                  background: "none",
                                  border: "none",
                                  color: "#ef4444",
                                  cursor: "pointer",
                                  fontSize: "0.85rem",
                                  fontWeight: 600,
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            <div style={{ marginTop: "1.25rem" }}>
              <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? "Saving..." : "Save Shipping Rules"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: Settings */}
      {activeTab === "settings" && (
        <div className="cj-settings-grid">
          {/* CJ API Credentials */}
          <div className="cj-card">
            <div className="cj-card-title">1. CJ Dropshipping API Credentials</div>
            <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Get your API credentials from your CJ Dropshipping account under <strong>Authorization &gt; API</strong>.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <TextInput
                  path="email"
                  label="CJ Account Email"
                  value={email}
                  onChange={(e: any) => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                />
              </div>
              <div>
                <TextInput
                  path="apiKey"
                  label="CJ API Key"
                  value={apiKey}
                  onChange={(e: any) => setApiKey(e.target.value)}
                  placeholder="Your CJ API Key"
                />
              </div>
              {tokenExpiry && (
                <p style={{ fontSize: "0.85rem", color: "#10b981", margin: 0 }}>
                  ✓ Token Active (Expires: {new Date(tokenExpiry).toLocaleDateString()})
                </p>
              )}
              <Button onClick={handleConnect} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : "Test & Connect to CJ"}
              </Button>
            </div>
          </div>

          {/* Catalog & Channel Defaults */}
          <div className="cj-card">
            <div className="cj-card-title">2. Catalog & Channel Defaults</div>
            <p style={{ color: "var(--theme-elevation-500)", fontSize: "0.9rem", marginBottom: "1.25rem" }}>
              Configure defaults applied to imported products.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="autoPublish"
                  checked={autoPublish}
                  onChange={(e) => setAutoPublish(e.target.checked)}
                />
                <label htmlFor="autoPublish" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                  Publish products immediately upon import (otherwise save as Draft)
                </label>
              </div>
              <div style={{ display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
                <input
                  type="checkbox"
                  id="closeupSecondImage"
                  checked={closeupSecondImage}
                  onChange={(e) => setCloseupSecondImage(e.target.checked)}
                  style={{ marginTop: "0.2rem" }}
                />
                <label htmlFor="closeupSecondImage" style={{ fontSize: "0.9rem", cursor: "pointer" }}>
                  Use the close-up as the second (hover) image
                  <span style={{ display: "block", color: "var(--theme-elevation-500)", fontSize: "0.8rem" }}>
                    Picks the photo where the item fills the least of the frame (pills, powder, a detail shot). Works well for supplements; check the result for other products.
                  </span>
                </label>
              </div>
              <div>
                <TextInput
                  path="defaultStock"
                  label="Default Variant Stock Quantity"
                  value={String(defaultStock)}
                  onChange={(e: any) => setDefaultStock(parseInt(e.target.value, 10) || 100)}
                />
              </div>
              <div>
                <SelectInput
                  path="salesChannelId"
                  name="salesChannelId"
                  label="Default Sales Channel"
                  value={salesChannelId}
                  onChange={(val: any) => setSalesChannelId(val?.value || "")}
                  options={[
                    { label: "Default Channel", value: "" },
                    ...availableChannels.map((c) => ({ label: c.label, value: c.value })),
                  ]}
                />
              </div>
              <div>
                <SelectInput
                  path="defaultShippingCountry"
                  name="defaultShippingCountry"
                  label="Default Shipping Country (for shipping estimates & pricing)"
                  value={defaultShippingCountry}
                  onChange={(val: any) => {
                    const code = typeof val === "string" ? val : val?.value || "US";
                    setDefaultShippingCountry(code);
                  }}
                  options={allShippingCountries}
                />
              </div>
              <div>
                <SelectInput
                  path="categoryMappingMode"
                  name="categoryMappingMode"
                  label="Category / Collection Assignment Strategy"
                  value={categoryMappingMode}
                  onChange={(val: any) => {
                    const mode = typeof val === "string" ? val : val?.value || "auto_create";
                    setCategoryMappingMode(mode as "auto_create" | "single_collection");
                  }}
                  options={[
                    { label: "1. Auto-Create Categories (Matches CJ category or creates new collection)", value: "auto_create" },
                    { label: "2. Import all products under one selected Category / Collection", value: "single_collection" },
                  ]}
                />
              </div>
              {categoryMappingMode === "single_collection" && (
                <div>
                  <SelectInput
                    path="defaultCollectionId"
                    name="defaultCollectionId"
                    label="Target Store Category / Collection"
                    value={defaultCollectionId}
                    onChange={(val: any) => {
                      const id = typeof val === "string" ? val : val?.value || "";
                      setDefaultCollectionId(id);
                    }}
                    options={[
                      { label: "-- Select a Collection --", value: "" },
                      ...storeCollections,
                    ]}
                  />
                </div>
              )}
              <Button onClick={handleSaveSettings} disabled={isSavingSettings}>
                {isSavingSettings ? "Saving..." : "Save App Settings"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewProduct && (
        <div className="cj-modal-overlay" onClick={() => setPreviewProduct(null)}>
          <div className="cj-modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="cj-modal-header">
              <h2>Product Import Preview</h2>
              <button
                type="button"
                onClick={() => setPreviewProduct(null)}
                className="cj-modal-close-btn"
              >
                ✕
              </button>
            </div>

            <div className="cj-modal-grid">
              {/* Gallery Section */}
              <div className="cj-gallery">
                <div className="cj-gallery-main">
                  {previewImages.length > 0 ? (
                    <>
                      <img
                        src={previewImages[activeImageIndex] || previewImages[0]}
                        alt=""
                        onClick={() => setIsLightboxOpen(true)}
                        title="Click to zoom / view full image"
                      />

                      {/* Navigation arrows */}
                      {previewImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            className="cj-slider-nav prev"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : previewImages.length - 1));
                            }}
                            title="Previous image"
                          >
                            ‹
                          </button>
                          <button
                            type="button"
                            className="cj-slider-nav next"
                            onClick={(e) => {
                              e.stopPropagation();
                              setActiveImageIndex((prev) => (prev < previewImages.length - 1 ? prev + 1 : 0));
                            }}
                            title="Next image"
                          >
                            ›
                          </button>
                        </>
                      )}

                      {/* Zoom Button */}
                      <button
                        type="button"
                        className="cj-zoom-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          setIsLightboxOpen(true);
                        }}
                      >
                        🔍 Full Size
                      </button>

                      {/* Counter */}
                      <div className="cj-gallery-counter">
                        {activeImageIndex + 1} / {previewImages.length}
                      </div>
                    </>
                  ) : (
                    <div style={{ color: "var(--theme-elevation-500)", fontSize: "0.9rem" }}>No image available</div>
                  )}
                </div>

                {/* Thumbnails row */}
                {previewImages.length > 1 && (
                  <div className="cj-gallery-thumbs">
                    {previewImages.map((img, idx) => (
                      <button
                        key={idx}
                        type="button"
                        className={`cj-thumb-item ${activeImageIndex === idx ? "active" : ""}`}
                        onClick={() => setActiveImageIndex(idx)}
                      >
                        <img src={img} alt="" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Form Actions Section */}
              <div className="cj-modal-form">
                {(() => {
                  const previewRuleEval = evaluateRulesClient(previewProduct);
                  const previewCost = parseFloat(previewProduct.sellPrice || "0") || (previewProduct.variants?.[0]?.variantSellPrice || 0);
                  const previewRetail = computePriceWithMarkup(previewCost, previewRuleEval.bufferUSD);
                  const previewRetailUSD = (previewRetail / (channelCurrency.exchangeRate || 1)).toFixed(2);

                  return (
                    <div className={`cj-rule-check-box ${previewRuleEval.blocked ? "blocked" : "allowed"}`} style={{ margin: "0 0 1rem 0" }}>
                      <div className="cj-rule-check-header">
                        <span className="cj-rule-check-title">Rule Check</span>
                        <span className="cj-rule-check-badge">
                          {previewRuleEval.blocked ? "Will not import" : "Allowed"}
                        </span>
                      </div>
                      <div className="cj-rule-check-details">
                        {previewRuleEval.blocked ? (
                          <span>Product will not be imported ({previewRuleEval.reason})</span>
                        ) : (
                          <span>
                            Price after import: <strong>{channelCurrency.symbol} {previewRetail.toFixed(2)}</strong> (${previewRetailUSD} USD)
                            {previewRuleEval.bufferUSD > 0 ? ` (+$${previewRuleEval.bufferUSD.toFixed(2)} buffer)` : ""}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div>
                  <TextInput
                    path="customTitle"
                    label="Custom Store Title"
                    value={customTitle}
                    onChange={(e: any) => setCustomTitle(e.target.value)}
                  />
                </div>
                <div>
                  <TextInput
                    path="customPrice"
                    label={`Retail Price Override (${channelCurrency.symbol || channelCurrency.code})`}
                    placeholder="Leave blank to use automatic markup rule"
                    value={customPrice !== undefined ? String(customPrice) : ""}
                    onChange={(e: any) => setCustomPrice(e.target.value ? parseFloat(e.target.value) : undefined)}
                  />
                </div>
                <div>
                  <SelectInput
                    path="modalCollectionId"
                    name="modalCollectionId"
                    label="Assign to Collection (Category)"
                    value={modalCollectionId}
                    onChange={(opt: any) => setModalCollectionId(typeof opt === "string" ? opt : opt?.value || "__auto__")}
                    options={[
                      {
                        label:
                          categoryMappingMode === "auto_create"
                            ? `Auto-Create / Match CJ ("${previewProduct.categoryName || previewProduct.entryNameEn || "General"}")`
                            : storeCollections.find((c) => c.value === defaultCollectionId)?.label
                            ? `Store Default ("${storeCollections.find((c) => c.value === defaultCollectionId)?.label}")`
                            : "Auto-Create / Match CJ",
                        value: "__auto__",
                      },
                      ...storeCollections,
                    ]}
                  />
                </div>
                <div className="cj-modal-specs">
                  <p><strong>SKU:</strong> {previewProduct.productSku}</p>
                  <p><strong>Weight:</strong> {(() => {
                    const effW = resolveEffectiveProductWeight(previewProduct);
                    return effW > 0 ? `${effW}g` : "Not set";
                  })()}</p>
                  <p><strong>Variants:</strong> {previewProduct.variants?.length || 0} variant(s)</p>
                </div>
                <div className="cj-modal-actions">
                  <Button
                    buttonStyle="secondary"
                    onClick={() => {
                      if (!isShippingOpen) {
                        handleCalculateShipping();
                      } else {
                        setIsShippingOpen(false);
                      }
                    }}
                    disabled={loadingShipping}
                  >
                    {loadingShipping
                      ? "Calculating Shipping..."
                      : isShippingOpen
                      ? "Hide Shipping Rates"
                      : "Check Shipping & Landed Cost"}
                  </Button>
                  <Button
                    onClick={() => handleImportProduct(previewProduct.pid)}
                    disabled={importingPid === previewProduct.pid}
                  >
                    {importingPid === previewProduct.pid
                      ? "Importing to Store..."
                      : "Confirm & Import to Store"}
                  </Button>
                </div>
              </div>

              {/* Shipping & Landed Cost Overlay Panel (Expands/Reduces over the panel) */}
              {isShippingOpen && (
                <div className={`cj-shipping-overlay ${isShippingExpanded ? "expanded" : ""}`}>
                  <div className="cj-shipping-overlay-header">
                    <h5>Shipping & Landed Cost ({shippingCountry})</h5>
                    <div className="cj-shipping-header-actions">
                      <button
                        type="button"
                        className="cj-overlay-action-btn"
                        onClick={() => setIsShippingExpanded(!isShippingExpanded)}
                        title={isShippingExpanded ? "Reduce to side panel" : "Expand over full modal"}
                      >
                        {isShippingExpanded ? "⤡ Reduce" : "⤢ Expand"}
                      </button>
                      <button
                        type="button"
                        className="cj-overlay-action-btn close"
                        onClick={() => {
                          setIsShippingOpen(false);
                          setIsShippingExpanded(false);
                        }}
                        title="Close shipping calculator"
                      >
                        ✕ Close
                      </button>
                    </div>
                  </div>

                  <SelectInput
                    path="shippingCountry"
                    name="shippingCountry"
                    label="Destination Country"
                    value={shippingCountry}
                    options={allShippingCountries}
                    onChange={(opt: any) => {
                      const val = typeof opt === "string" ? opt : opt?.value || "US";
                      setShippingCountry(val);
                      handleCalculateShipping(val);
                    }}
                  />

                  {loadingShipping ? (
                    <div className="cj-shipping-loading">
                      Calculating live freight rates from CJ...
                    </div>
                  ) : shippingRates && shippingRates.length > 0 ? (
                    <>
                      <div className="cj-shipping-rates-container">
                        <table className="cj-shipping-rates-table">
                          <thead>
                            <tr>
                              <th>Courier</th>
                              <th>Delivery Time</th>
                              <th>Cost</th>
                              <th>Tracking</th>
                            </tr>
                          </thead>
                          <tbody>
                            {shippingRates.slice(0, 6).map((rate, idx) => (
                              <tr key={idx}>
                                <td className="rate-method">
                                  {rate.name}
                                  {rate.origin ? ` (from ${rate.origin})` : ""}
                                </td>
                                <td className="rate-time">{rate.aging}</td>
                                <td className="rate-cost">{rate.price === 0 ? "Free" : `$${rate.price.toFixed(2)}`}</td>
                                <td className="rate-track">{rate.trackingType}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Landed Cost Breakdown */}
                      {(() => {
                        const cheapestRate = shippingRates[0]?.price || 0;
                        const productCost =
                          parseFloat(previewProduct.sellPrice || "0") ||
                          (previewProduct.variants?.[0]?.variantSellPrice || 0);
                        const landedCost = productCost + cheapestRate;
                        const suggestedRetail = computePriceWithMarkup(landedCost, 0);

                        return (
                          <div className="cj-landed-cost-summary">
                            <div className="cj-landed-row">
                              <span>Product Cost (Wholesale):</span>
                              <span>${productCost.toFixed(2)}</span>
                            </div>
                            <div className="cj-landed-row">
                              <span>Estimated Shipping ({shippingRates[0]?.name}):</span>
                              <span>{cheapestRate === 0 ? "Free" : `+$${cheapestRate.toFixed(2)}`}</span>
                            </div>
                            <div className="cj-landed-row total">
                              <span>Total Landed Cost:</span>
                              <span className="highlight">${landedCost.toFixed(2)}</span>
                            </div>
                            <div className="cj-landed-row suggested">
                              <span>Suggested Retail ({markupType === "multiplier" ? `${markupValue}x Markup` : "Store Markup"}):</span>
                              <span style={{ textAlign: "right" }}>
                                {channelCurrency.code !== "USD" && (
                                  <small style={{ display: "block", fontSize: "0.75rem", color: "var(--theme-elevation-500)", fontWeight: "normal", marginBottom: "0.15rem" }}>
                                    ${(suggestedRetail / (channelCurrency.exchangeRate || 1)).toFixed(2)} USD
                                  </small>
                                )}
                                {channelCurrency.symbol} {suggestedRetail.toFixed(2)}
                              </span>
                            </div>
                            <button
                              type="button"
                              className="cj-apply-landed-btn"
                              onClick={() => {
                                setCustomPrice(suggestedRetail);
                                toast.success(`Retail price set to ${channelCurrency.symbol} ${suggestedRetail.toFixed(2)} (covering shipping + markup)`);
                                setIsShippingOpen(false);
                                setIsShippingExpanded(false);
                              }}
                            >
                              Apply {channelCurrency.symbol} {suggestedRetail.toFixed(2)} to Retail Price & Return
                            </button>
                          </div>
                        );
                      })()}
                    </>
                  ) : (
                    <div className="cj-shipping-empty">
                      No shipping rates returned for {shippingCountry}.
                    </div>
                  )}

                  <div className="cj-shipping-overlay-footer">
                    <Button
                      buttonStyle="secondary"
                      onClick={() => {
                        setIsShippingOpen(false);
                        setIsShippingExpanded(false);
                      }}
                    >
                      ← Back to Product Details
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Bottom Tabs (Variants vs Supplier Description) */}
            <div className="cj-modal-tabs">
              <button
                type="button"
                className={`cj-modal-tab-btn ${modalBottomTab === "variants" ? "active" : ""}`}
                onClick={() => setModalBottomTab("variants")}
              >
                Product Variants ({selectedVids.length} of {previewProduct.variants?.length || 0} selected)
              </button>
              <button
                type="button"
                className={`cj-modal-tab-btn ${modalBottomTab === "description" ? "active" : ""}`}
                onClick={() => setModalBottomTab("description")}
              >
                Supplier Description & Specs
              </button>
            </div>

            {modalBottomTab === "variants" ? (
              /* Variants table */
              previewProduct.variants && previewProduct.variants.length > 0 ? (
                <div className="cj-variant-section">
                  <div className="cj-variant-header-row">
                    <h4 className="cj-variant-title">
                      Variant List ({selectedVids.length} of {previewProduct.variants.length} selected)
                    </h4>
                    <div className="cj-variant-actions">
                      <button
                        type="button"
                        className="cj-btn-link"
                        onClick={() => setSelectedVids(previewProduct.variants.map((v) => v.vid))}
                      >
                        Select All
                      </button>
                      <span>•</span>
                      <button
                        type="button"
                        className="cj-btn-link"
                        onClick={() => setSelectedVids([])}
                      >
                        Deselect All
                      </button>
                    </div>
                  </div>

                  <div className="cj-variant-table-container">
                    <table>
                      <thead>
                        <tr>
                          <th className="th-select">
                            <input
                              type="checkbox"
                              checked={
                                previewProduct.variants.length > 0 &&
                                selectedVids.length === previewProduct.variants.length
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedVids(previewProduct.variants.map((v) => v.vid));
                                } else {
                                  setSelectedVids([]);
                                }
                              }}
                              title="Select / Deselect all variants"
                            />
                          </th>
                          <th>Variant</th>
                          <th>SKU</th>
                          <th>Wholesale Cost {channelCurrency.code !== "USD" ? `(${channelCurrency.code})` : "(USD)"}</th>
                          <th>Calculated Retail ({channelCurrency.code})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewProduct.variants.map((v) => {
                          const isSelected = selectedVids.includes(v.vid);
                          return (
                            <tr
                              key={v.vid}
                              onClick={() => {
                                if (isSelected) {
                                  setSelectedVids((prev) => prev.filter((id) => id !== v.vid));
                                } else {
                                  setSelectedVids((prev) => [...prev, v.vid]);
                                }
                              }}
                              style={{
                                cursor: "pointer",
                                opacity: isSelected ? 1 : 0.45,
                              }}
                            >
                              <td
                                className="td-select"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedVids((prev) => [...prev, v.vid]);
                                    } else {
                                      setSelectedVids((prev) => prev.filter((id) => id !== v.vid));
                                    }
                                  }}
                                />
                              </td>
                              <td>
                                <div className="cj-variant-cell">
                                  {v.variantImage && (
                                    <img
                                      src={v.variantImage}
                                      alt=""
                                      className="cj-variant-thumb"
                                    />
                                  )}
                                  <span className="cj-variant-name">
                                    {v.variantKey || v.variantNameEn || v.variantName || v.variantProperty || "Standard"}
                                  </span>
                                </div>
                              </td>
                              <td className="td-sku">{v.variantSku}</td>
                              <td className="td-cost">
                                {channelCurrency.code !== "USD" && (
                                  <div style={{ fontSize: "0.72rem", color: "var(--theme-elevation-500)", marginBottom: "0.15rem" }}>
                                    ${Number(v.variantSellPrice || 0).toFixed(2)} USD
                                  </div>
                                )}
                                <div>
                                  {channelCurrency.code !== "USD"
                                    ? `${channelCurrency.symbol} ${(Number(v.variantSellPrice || 0) * (channelCurrency.exchangeRate || 1)).toFixed(2)}`
                                    : `$${Number(v.variantSellPrice || 0).toFixed(2)} USD`}
                                </div>
                              </td>
                              <td className="td-retail">
                                {channelCurrency.code !== "USD" && v.calculatedRetailPrice !== undefined && (
                                  <div style={{ fontSize: "0.72rem", color: "var(--theme-elevation-500)", marginBottom: "0.15rem" }}>
                                    ${(v.calculatedRetailPrice / (channelCurrency.exchangeRate || 1)).toFixed(2)} USD
                                  </div>
                                )}
                                <div>{channelCurrency.symbol} {v.calculatedRetailPrice?.toFixed(2)}</div>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "1.5rem", textAlign: "center", color: "var(--theme-elevation-500)" }}>
                  This product is a single-variant item without separate variations.
                </div>
              )
            ) : (
              /* Description Tab */
              <div className="cj-description-section">
                {previewProduct.description ? (
                  <div
                    className="cj-description-content"
                    dangerouslySetInnerHTML={{ __html: previewProduct.description }}
                  />
                ) : (
                  <div className="cj-description-empty">
                    <p>No text description was provided by the CJ supplier for this item.</p>
                    <p className="subtext">
                      You can write, customize, or generate a description in Amerta after importing.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Fullscreen Lightbox Overlay */}
      {isLightboxOpen && previewImages.length > 0 && (
        <div className="cj-lightbox-overlay" onClick={() => setIsLightboxOpen(false)}>
          <button
            type="button"
            className="cj-lightbox-close"
            onClick={() => setIsLightboxOpen(false)}
            title="Close Fullscreen View (Esc)"
          >
            ✕
          </button>

          {/* Navigation Arrows */}
          {previewImages.length > 1 && (
            <>
              <button
                type="button"
                className="cj-lightbox-nav prev"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : previewImages.length - 1));
                }}
                title="Previous image (Left Arrow)"
              >
                ‹
              </button>
              <button
                type="button"
                className="cj-lightbox-nav next"
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveImageIndex((prev) => (prev < previewImages.length - 1 ? prev + 1 : 0));
                }}
                title="Next image (Right Arrow)"
              >
                ›
              </button>
            </>
          )}

          <div className="cj-lightbox-main" onClick={(e) => e.stopPropagation()}>
            <img
              className="cj-lightbox-img"
              src={previewImages[activeImageIndex] || previewImages[0]}
              alt=""
            />
          </div>

          <div className="cj-lightbox-footer" onClick={(e) => e.stopPropagation()}>
            <div className="cj-lightbox-counter">
              {activeImageIndex + 1} / {previewImages.length}
            </div>
            {previewImages.length > 1 && (
              <div className="cj-lightbox-thumbs">
                {previewImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    className={`cj-lightbox-thumb ${activeImageIndex === idx ? "active" : ""}`}
                    onClick={() => setActiveImageIndex(idx)}
                  >
                    <img src={img} alt="" />
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected products export (Markdown / JSON) */}
      {isExportOpen && selectionExport && (
        <div className="cj-modal-overlay" onClick={() => setIsExportOpen(false)}>
          <div className="cj-modal-content cj-export-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cj-modal-header">
              <div>
                <h2>Selected Products ({selectionExport.count})</h2>
                <p className="cj-bulk-modal-subtitle">Pricing snapshot to paste into a chat or doc.</p>
              </div>
              <button type="button" className="cj-modal-close-btn" onClick={() => setIsExportOpen(false)}>
                ×
              </button>
            </div>
            <div className="cj-export-toolbar">
              <div className="cj-modal-tabs">
                <button
                  type="button"
                  className={`cj-modal-tab-btn ${exportFormat === "md" ? "active" : ""}`}
                  onClick={() => setExportFormat("md")}
                >
                  Markdown
                </button>
                <button
                  type="button"
                  className={`cj-modal-tab-btn ${exportFormat === "json" ? "active" : ""}`}
                  onClick={() => setExportFormat("json")}
                >
                  JSON
                </button>
              </div>
              <div className="cj-export-actions">
                <Button buttonStyle="secondary" size="small" onClick={handleDownloadExport}>
                  Download .{exportFormat}
                </Button>
                <Button buttonStyle="primary" size="small" onClick={handleCopyExport}>
                  Copy
                </Button>
              </div>
            </div>
            <textarea className="cj-export-text" readOnly value={exportText} onFocus={(e) => e.currentTarget.select()} />
          </div>
        </div>
      )}

      {/* Re-import: choose what to replace */}
      {reimportTarget && (
        <div className="cj-modal-overlay" onClick={() => setReimportTarget(null)}>
          <div className="cj-modal-content cj-reimport-modal" onClick={(e) => e.stopPropagation()}>
            <div className="cj-modal-header">
              <div>
                <h2>Update from CJ</h2>
                <p className="cj-bulk-modal-subtitle">{reimportTarget.title}</p>
              </div>
              <button type="button" className="cj-modal-close-btn" onClick={() => setReimportTarget(null)}>
                ×
              </button>
            </div>
            <p className="cj-reimport-note">Already in your store. Only what you tick is replaced; everything else stays as you edited it.</p>
            <div className="cj-reimport-fields">
              {CJ_REPLACE_FIELDS.map((f) => (
                <label key={f.value} className="cj-reimport-field">
                  <input
                    type="checkbox"
                    checked={reimportFields.includes(f.value)}
                    onChange={(e) =>
                      setReimportFields((prev) => (e.target.checked ? [...prev, f.value] : prev.filter((x) => x !== f.value)))
                    }
                  />
                  <span>
                    <strong>{f.label}</strong>
                    <small>{f.hint}</small>
                  </span>
                </label>
              ))}
            </div>
            <div className="cj-reimport-footer">
              <Button buttonStyle="secondary" onClick={() => setReimportTarget(null)}>
                Cancel
              </Button>
              <Button
                buttonStyle="primary"
                disabled={reimportFields.length === 0 || importingPid === reimportTarget.pid}
                onClick={async () => {
                  const target = reimportTarget;
                  setReimportTarget(null);
                  await handleImportProduct(target.pid, { replaceFields: reimportFields });
                }}
              >
                {reimportFields.length ? `Update ${reimportFields.length} item${reimportFields.length > 1 ? "s" : ""}` : "Choose what to update"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isBulkModalOpen && (
        <div className="cj-modal-overlay">
          <div className="cj-modal-content cj-bulk-modal">
            <div className="cj-modal-header">
              <div>
                <h2>Bulk Import ({bulkItems.length} Products)</h2>
                <p className="cj-bulk-modal-subtitle">
                  Import selected CJ Dropshipping products directly into your Amerta catalog.
                </p>
              </div>
              <button
                type="button"
                className="cj-modal-close-btn"
                disabled={isBulkImporting}
                onClick={() => {
                  if (!isBulkImporting) setIsBulkModalOpen(false);
                }}
              >
                ×
              </button>
            </div>

            {/* Target Collection & Publishing Configuration */}
            <div className="cj-bulk-options-card">
              <div className="cj-bulk-option-grid">
                <div>
                  <SelectInput
                    path="bulkCollectionId"
                    name="bulkCollectionId"
                    label="Assign to Collection (Category)"
                    value={bulkCollectionId}
                    readOnly={isBulkImporting}
                    onChange={(opt: any) =>
                      setBulkCollectionId(typeof opt === "string" ? opt : opt?.value || "__auto__")
                    }
                    options={[
                      {
                        label:
                          categoryMappingMode === "auto_create"
                            ? "Auto-Create / Match from CJ (Per Product)"
                            : storeCollections.find((c) => c.value === defaultCollectionId)?.label
                            ? `Store Default ("${storeCollections.find((c) => c.value === defaultCollectionId)?.label}")`
                            : "Auto-Create / Match from CJ (Per Product)",
                        value: "__auto__",
                      },
                      ...storeCollections,
                    ]}
                  />
                </div>
                <div>
                  <SelectInput
                    path="bulkPublishStatus"
                    name="bulkPublishStatus"
                    label="Publishing Status"
                    value={bulkPublishStatus}
                    readOnly={isBulkImporting}
                    onChange={(opt: any) =>
                      setBulkPublishStatus(
                        (typeof opt === "string" ? opt : opt?.value) === "draft" ? "draft" : "published"
                      )
                    }
                    options={[
                      { label: "Publish Immediately (Live)", value: "published" },
                      { label: "Save as Draft (Review Later)", value: "draft" },
                    ]}
                  />
                </div>
              </div>
              <label className="cj-bulk-ignore-rules">
                <input
                  type="checkbox"
                  checked={bulkIgnoreRules}
                  disabled={isBulkImporting}
                  onChange={(e) => setBulkIgnoreRules(e.target.checked)}
                />
                Ignore shipping rules (also import products the rules block)
              </label>
            </div>

            {/* Progress Bar & Status (shown when importing or after running) */}
            {(isBulkImporting || bulkProgress.current > 0) && (
              <div className="cj-bulk-progress-panel">
                <div className="cj-bulk-progress-header">
                  <div className="cj-bulk-progress-text">
                    {isBulkImporting ? (
                      <span>
                        Importing <strong>{bulkProgress.current}</strong> of <strong>{bulkProgress.total}</strong> products...
                      </span>
                    ) : (
                      <span>
                        Import Complete: <strong>{bulkProgress.successCount}</strong> succeeded,{" "}
                        <strong>{bulkProgress.failCount}</strong> failed
                      </span>
                    )}
                  </div>
                  <div className="cj-bulk-progress-percent">
                    {Math.round((bulkProgress.current / Math.max(1, bulkProgress.total)) * 100)}%
                  </div>
                </div>
                <progress
                  className="cj-bulk-native-progress"
                  max={Math.max(1, bulkProgress.total)}
                  value={bulkProgress.current}
                />
                <div className="cj-bulk-progress-stats">
                  <span className="stat-success">✓ {bulkProgress.successCount} Successful</span>
                  <span className="stat-fail">✕ {bulkProgress.failCount} Failed</span>
                  <span className="stat-remaining">
                    ⏳ {Math.max(0, bulkProgress.total - bulkProgress.current)} Remaining
                  </span>
                </div>
              </div>
            )}

            {/* Selected Products List */}
            <div className="cj-bulk-items-list-container">
              <div className="cj-bulk-items-header">
                <span>Selected Queue ({bulkItems.length})</span>
                {!isBulkImporting && bulkProgress.current === 0 && (
                  <span className="cj-bulk-tip">Each product imports all variants, images, and description</span>
                )}
              </div>
              <div className="cj-bulk-items-scroll">
                {bulkItems.map((item) => (
                  <div key={item.pid} className={`cj-bulk-item-row status-${item.status}`}>
                    <div className="cj-bulk-item-thumb">
                      {item.image ? <img src={item.image} alt="" /> : <div className="cj-no-thumb" />}
                    </div>
                    <div className="cj-bulk-item-info">
                      <div className="cj-bulk-item-title">{item.title}</div>
                      <div className="cj-bulk-item-meta">
                        <span>Cost: ${item.cost} USD</span>
                        <span>Est. Retail: {channelCurrency.symbol} {item.retailPrice?.toFixed(2)}</span>
                        {item.categoryName && <span>Cat: {item.categoryName}</span>}
                      </div>
                      {item.message && (
                        <div className={`cj-bulk-item-msg ${item.status}`}>
                          {item.message}
                          {item.status === "failed" && !isBulkImporting && (
                            <>
                              {" · "}
                              <button
                                type="button"
                                className="cj-import-anyway"
                                title="Import this product even though a shipping rule blocks it"
                                onClick={() => handleRetryIgnoringRules([item.pid])}
                              >
                                Import anyway
                              </button>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="cj-bulk-item-status">
                      {item.status === "pending" && <span className="badge-pending">Pending</span>}
                      {item.status === "importing" && (
                        <span className="badge-importing">
                          <span className="cj-mini-spinner" /> Importing...
                        </span>
                      )}
                      {item.status === "success" && <span className="badge-success">✓ Imported</span>}
                      {item.status === "failed" && <span className="badge-failed">✕ Failed</span>}

                      {!isBulkImporting && bulkProgress.current === 0 && (
                        <button
                          type="button"
                          className="cj-bulk-remove-item"
                          title="Remove from queue"
                          onClick={() => handleRemoveFromBulkQueue(item.pid)}
                        >
                          ×
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Actions */}
            <div className="cj-bulk-modal-footer">
              {isBulkImporting ? (
                <Button
                  buttonStyle="secondary"
                  onClick={handleAbortBulkImport}
                >
                  Stop Import
                </Button>
              ) : bulkProgress.current > 0 ? (
                <div className="cj-bulk-footer-done-actions">
                  <Button
                    buttonStyle="secondary"
                    onClick={() => setIsBulkModalOpen(false)}
                  >
                    Close
                  </Button>
                  {bulkItems.some((it) => it.status === "failed") && (
                    <Button
                      buttonStyle="secondary"
                      onClick={() => handleRetryIgnoringRules(bulkItems.filter((it) => it.status === "failed").map((it) => it.pid))}
                    >
                      Import {bulkItems.filter((it) => it.status === "failed").length} failed anyway
                    </Button>
                  )}
                  <Button
                    buttonStyle="primary"
                    onClick={() => {
                      setIsBulkModalOpen(false);
                      setActiveTab("imported");
                    }}
                  >
                    View in Imported Products →
                  </Button>
                </div>
              ) : (
                <div className="cj-bulk-footer-initial-actions">
                  <Button
                    buttonStyle="secondary"
                    onClick={() => setIsBulkModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    buttonStyle="primary"
                    disabled={bulkItems.length === 0}
                    onClick={handleStartBulkImport}
                  >
                    Start Bulk Import ({bulkItems.length} Products)
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Rule Add/Edit Modal */}
      {isRuleModalOpen && (
        <div className="cj-modal-overlay" onClick={() => setIsRuleModalOpen(false)}>
          <div
            className="cj-modal-content"
            style={{ maxWidth: 540, borderRadius: 0 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cj-modal-header">
              <h2>{editingRuleId ? "Edit Protection Rule" : "Add Shipping & Import Protection Rule"}</h2>
              <button
                type="button"
                className="cj-modal-close-btn"
                onClick={() => setIsRuleModalOpen(false)}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}>
              <div>
                <TextInput
                  path="ruleFormName"
                  label="Rule Name (Optional - auto-generated if blank)"
                  value={ruleFormName}
                  onChange={(e: any) => setRuleFormName(e.target.value)}
                  placeholder="e.g. Block bulky products over 500g, or Block missing weight"
                />
              </div>

              <div>
                <SelectInput
                  path="ruleFormField"
                  name="ruleFormField"
                  label="Condition Field / Criteria"
                  value={ruleFormField}
                  onChange={(val: any) => {
                    const v = typeof val === "string" ? val : val?.value || "weight";
                    setRuleFormField(v as CJRuleField);
                  }}
                  options={[
                    { label: "Product Weight (grams)", value: "weight" },
                    { label: "Weight is Not Set (0g or missing)", value: "weight_not_set" },
                    { label: "Supplier Cost ($ USD)", value: "cost" },
                    { label: "Variants Count", value: "variants_count" },
                    { label: "All Products (Default / Catch-all)", value: "all" },
                  ]}
                />
              </div>

              {ruleFormField !== "weight_not_set" && ruleFormField !== "all" && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                  <div>
                    <SelectInput
                      path="ruleFormOperator"
                      name="ruleFormOperator"
                      label="Operator"
                      value={ruleFormOperator}
                      onChange={(val: any) => {
                        const v = typeof val === "string" ? val : val?.value || "less_than";
                        setRuleFormOperator(v as CJRuleOperator);
                      }}
                      options={[
                        { label: "Less than (<)", value: "less_than" },
                        { label: "Greater than (>)", value: "greater_than" },
                        { label: "Equal to (==)", value: "equals" },
                      ]}
                    />
                  </div>
                  <div>
                    <TextInput
                      path="ruleFormValue"
                      label={
                        ruleFormField === "weight"
                          ? "Threshold (grams)"
                          : ruleFormField === "cost"
                          ? "Threshold ($ USD)"
                          : "Variants Count"
                      }
                      value={ruleFormValue}
                      onChange={(e: any) => setRuleFormValue(e.target.value)}
                      placeholder="e.g. 500"
                    />
                  </div>
                </div>
              )}

              <div>
                <SelectInput
                  path="ruleFormAction"
                  name="ruleFormAction"
                  label="Import Permission"
                  value={ruleFormAction}
                  onChange={(val: any) => {
                    const v = typeof val === "string" ? val : val?.value || "allow";
                    setRuleFormAction(v as CJRuleAction);
                  }}
                  options={[
                    { label: "✓ Allow Import", value: "allow" },
                    { label: "🚫 Block Import (Do Not Import)", value: "block" },
                  ]}
                />
              </div>

              {ruleFormAction === "allow" && (
                <div>
                  <TextInput
                    path="ruleFormBufferUSD"
                    label="Shipping Buffer Cushion ($ USD)"
                    value={ruleFormBufferUSD}
                    onChange={(e: any) => setRuleFormBufferUSD(e.target.value)}
                    placeholder="e.g. 3.00"
                  />
                  <div style={{ fontSize: "0.8rem", color: "var(--theme-elevation-500)", marginTop: "0.25rem" }}>
                    Cushion amount in USD ($) added directly to product cost before retail markup is calculated. Leave 0.00 for no buffer.
                  </div>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <Button
                  buttonStyle="secondary"
                  onClick={() => setIsRuleModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSaveRuleModal}
                >
                  {editingRuleId ? "Save Changes" : "Add Shipping Rule"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hover Preview Panel */}
      {hoverPreview && (
        <div
          className="cj-hover-preview-panel"
          style={{
            left: Math.min(typeof window !== "undefined" ? window.innerWidth - 380 : 800, hoverPreview.x + 24),
            top: Math.min(typeof window !== "undefined" ? window.innerHeight - 380 : 600, Math.max(16, hoverPreview.y - 180)),
          }}
        >
          <img src={hoverPreview.url} alt="" />
        </div>
      )}
    </Gutter>
  );
};
