"use client";

import React from "react";

import { AuthProvider } from "./Auth";
import { ThemeProvider } from "./Theme";
import { AppProgressBar as ProgressBar } from "next-nprogress-bar";

export const Providers: React.FC<{
  children: React.ReactNode;
}> = ({ children }) => {
  return (
    <>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
      <ProgressBar height="2px" color="#0088E9ee" options={{ showSpinner: true }} shallowRouting />
    </>
  );
};
