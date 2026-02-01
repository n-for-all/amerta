import type { ThemeShopBannerBlock as ThemeShopBannerBlockProps } from "@/payload-types";
import RichText from "@/amerta/theme/components/RichText";

import { cn } from "@/amerta/utilities/ui";
import React from "react";

type Props = {
  className?: string;
  locale: string;
} & ThemeShopBannerBlockProps;

export const ThemeShopBannerBlock: React.FC<Props> = ({ className, content, style, locale }) => {
  return (
    <div className={cn("mx-auto my-8 w-full", className)}>
      <div
        className={cn("border py-3 px-6 flex items-center rounded", {
          "border-border bg-card": style === "info",
          "border-error bg-error/30": style === "error",
          "border-success bg-success/30": style === "success",
          "border-warning bg-warning/30": style === "warning",
        })}
      >
        <RichText data={content} enableGutter={false} enableProse={false} locale={locale} />
      </div>
    </div>
  );
};
