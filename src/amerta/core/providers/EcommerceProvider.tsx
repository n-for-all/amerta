"use client";

import { Currency, SalesChannel } from "@/payload-types";
import React, { createContext, useContext, ReactNode, useMemo, useCallback, useRef, useEffect } from "react";
import { reportMissingTranslation } from "./actions/reportMissingTranslation";
import { getDefaultCurrency } from "../utilities/get-default-currency";
import { getExchangeRate } from "../utilities/get-exchange-rate";
import { SOURCE_COOKIE, SOURCE_MAX_AGE, cleanSource, isCatalogSource } from "@/amerta/apps/catalog/settings";

type Dictionary = Record<string, Record<string, string>>;

export interface EcommerceContextType {
  currency: Currency;
  locale: string;
  salesChannel: SalesChannel;
  exchangeRate: number;
  dictionary: Dictionary;
  defaultPhoneCountryCode: string;
  activeApps: string[];
  isAppActive: (slug: string) => boolean;
  __: (key: string, domain?: string) => string;
}

const EcommerceContext = createContext<EcommerceContextType | undefined>(undefined);

interface EcommerceProviderProps {
  children: ReactNode;
  currency: Currency;
  salesChannel: SalesChannel;
  locale?: string;
  defaultPhoneCountryCode?: string;
  dictionary?: Dictionary;
  activeApps?: string[];
}

export const EcommerceProvider: React.FC<EcommerceProviderProps> = ({
  children,
  currency,
  salesChannel,
  locale = "en",
  defaultPhoneCountryCode = "+1",
  dictionary = {},
  activeApps = [],
}) => {

  const reportedKeys = useRef<Set<string>>(new Set());
  const pendingReports = useRef<Array<{ key: string; domain: string }>>([]);
  useEffect(() => {
    reportedKeys.current.clear();
  }, [locale]);

  const __ = useCallback(
    (key: string, domain: string = "default") => {
      const domainValue = dictionary[domain]?.[key];
      if (domainValue) return domainValue;

      // Step B: Check default domain
      if (domain !== "default") {
        const defaultValue = dictionary["default"]?.[key];
        if (defaultValue) return defaultValue;
      }

      // Step C: Queue it (Synchronous, safe)
      const uniqueId = `${domain}:${key}`;
      if (!reportedKeys.current.has(uniqueId)) {
        reportedKeys.current.add(uniqueId);
        pendingReports.current.push({ key, domain });
      }

      return key;
    },
    [dictionary],
  );

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (pendingReports.current.length === 0) return;

      // Snapshot and clear queue
      const batch = [...pendingReports.current];
      pendingReports.current = [];
      batch.forEach(({ key, domain }) => {
        reportMissingTranslation(key, domain, locale).catch((err) => console.error(`Failed to report: ${key}`, err));
      });
    }, 2000); // Check every 2 seconds

    return () => clearInterval(intervalId);
  }, [locale]);

  // Catalog app: a visit that arrives from a catalog link (utm_source=catalog…) is remembered,
  // so the order placed afterwards records that it came from the catalog.
  const catalogActive = activeApps.includes("catalog");
  useEffect(() => {
    if (!catalogActive) return;
    const source = new URLSearchParams(window.location.search).get("utm_source");
    if (isCatalogSource(source)) {
      document.cookie = `${SOURCE_COOKIE}=${cleanSource(source)}; path=/; max-age=${SOURCE_MAX_AGE}; samesite=lax`;
    }
  }, [catalogActive]);

  const exchangeRate = useMemo(() => {
    const defaultCurrency = getDefaultCurrency(salesChannel);
    return getExchangeRate(defaultCurrency, currency, salesChannel);
  }, [salesChannel, currency]);

  const isAppActive = useCallback(
    (slug: string) => activeApps.includes(slug),
    [activeApps]
  );

  const value = useMemo(
    () => ({
      currency,
      locale,
      salesChannel,
      exchangeRate,
      dictionary,
      defaultPhoneCountryCode,
      activeApps,
      isAppActive,
      __,
    }),
    [currency, locale, salesChannel, exchangeRate, dictionary, defaultPhoneCountryCode, activeApps, isAppActive, __],
  );

  return <EcommerceContext.Provider value={value}>{children}</EcommerceContext.Provider>;
};

export const useEcommerce = (): EcommerceContextType => {
  const context = useContext(EcommerceContext);
  if (context === undefined) {
    throw new Error("useEcommerce must be used within a EcommerceProvider");
  }
  return context;
};
