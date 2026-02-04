"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { defaultTheme, getImplicitPreference, themeLocalStorageKey } from "./shared";
import { Theme, ThemeContextType, themeIsValid } from "./types";
import canUseDOM from "@/amerta/utilities/canUseDOM";

const initialContext: ThemeContextType = {
  theme: undefined,
  setTheme: () => null,
};

const ThemeContext = createContext(initialContext);

export const ThemeProvider: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  // 1. Initialize state with a lazy initializer to check localStorage immediately if possible
  const [theme, setThemeState] = useState<Theme | undefined>(() => {
    if (canUseDOM) {
      const preference = window.localStorage.getItem(themeLocalStorageKey);
      // If we have a valid stored preference, use it immediately
      if (themeIsValid(preference)) {
        return preference;
      }
      // Otherwise fallback to DOM attribute or undefined
      return (document.documentElement.getAttribute("data-theme") as Theme) || undefined;
    }
    return undefined;
  });

  const setTheme = useCallback((themeToSet: Theme | null) => {
    if (themeToSet === null) {
      window.localStorage.removeItem(themeLocalStorageKey);
      const implicitPreference = getImplicitPreference();
      document.documentElement.setAttribute("data-theme", implicitPreference || "");
      if (implicitPreference) setThemeState(implicitPreference);
    } else {
      setThemeState(themeToSet);
      window.localStorage.setItem(themeLocalStorageKey, themeToSet);
      document.documentElement.setAttribute("data-theme", themeToSet);
    }
  }, []);

  // 2. Sync effect to handle implicit preferences and ensure DOM matches state
  useEffect(() => {
    let themeToSet: Theme = defaultTheme;
    const preference = window.localStorage.getItem(themeLocalStorageKey);

    if (themeIsValid(preference)) {
      themeToSet = preference;
    } else {
      const implicitPreference = getImplicitPreference();
      if (implicitPreference) {
        themeToSet = implicitPreference;
      }
    }

    // Only update if the calculated theme is different from current state
    // or if the DOM attribute is out of sync
    if (themeToSet !== theme || document.documentElement.getAttribute("data-theme") !== themeToSet) {
      document.documentElement.setAttribute("data-theme", themeToSet);
      setThemeState(themeToSet);
    }
  }, [theme]); // Added theme dependency to ensure consistency

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => useContext(ThemeContext);
