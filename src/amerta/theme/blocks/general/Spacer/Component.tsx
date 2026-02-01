import React from "react";
import { ThemeShopSpacerBlock as ThemeShopSpacerBlockProps } from "@/payload-types";
import { cn } from "@/amerta/utilities/ui";

const heightMap: Record<string, string> = {
  hidden: "h-0",
  small: "h-4",
  medium: "h-8",
  large: "h-16",
  xlarge: "h-32",
};

export const ThemeShopSpacerBlock: React.FC<ThemeShopSpacerBlockProps> = (props) => {
  const { size, responsive } = props;
  const { tabletSize, mobileSize } = responsive || {};

  const mobileClass = mobileSize ? heightMap[mobileSize] : heightMap[size || "medium"];

  const tabletClass = tabletSize ? `md:${heightMap[tabletSize]}` : `md:${heightMap[size || "medium"]}`;

  const desktopClass = `lg:${heightMap[size || "medium"]}`;

  return <div aria-hidden="true" className={cn("w-full block", mobileClass, tabletClass, desktopClass)} />;
};
