
import { cn } from "@/amerta/utilities/ui";
import Link from "next/link";
import React from "react";
import { getLinkUrl, LinkReference } from "@/amerta/utilities/getURL";
import { Button, ButtonProps } from "@/amerta/theme/ui/button";

type CMSLinkType = {
  appearance?: "inline" | ButtonProps["variant"];
  children?: React.ReactNode;
  className?: string;
  label?: string | null;
  newTab?: boolean | null;
  reference?: LinkReference;
  size?: ButtonProps["size"] | null;
  type?: "custom" | "reference" | null;
  url?: string | null;
  locale: string;
};

export const CMSLink: React.FC<CMSLinkType> = (props) => {
  const { type, appearance = "inline", children, className, label, newTab, reference, size: sizeFromProps, url, locale } = props;
  const href = getLinkUrl({
    type,
    reference,
    url,
    locale
  });

  if (!href || href == "") return null;

  const size = sizeFromProps;
  const newTabProps = newTab ? { rel: "noopener noreferrer", target: "_blank" } : {};

  const scroll = href.startsWith("#") || href.startsWith("/#") ? false : undefined;
  const urlWithLocale = locale ? (href || url)?.replace('{locale}', locale) : href || url;
  /* Ensure we don't break any styles set by richText */
  if (appearance === "inline") {
    return (
      <Link scroll={scroll} className={cn(className)} href={urlWithLocale || ""} {...newTabProps}>
        {label && label}
        {children && children}
      </Link>
    );
  }

  return (
    <Button asChild className={className} size={size} variant={appearance}>
      <Link scroll={scroll} className={cn(className)} href={urlWithLocale || ""} {...newTabProps}>
        {label && label.trim()}
        {children && children}
      </Link>
    </Button>
  );
};
