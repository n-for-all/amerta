"use client";
import { Footer } from "@/payload-types";
import { RowLabelProps, useRowLabel } from "@payloadcms/ui";

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer["footerMenus"]>[number]>();

  const label = data?.data?.title ? `Menu ${data.rowNumber !== undefined ? data.rowNumber + 1 : ""}: ${data?.data?.title}` : "Menu " + (data.rowNumber !== undefined ? `#${data.rowNumber + 1}` : "");

  return <div>{label}</div>;
};

export const SocialMediaRowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<NonNullable<Footer["socialMedia"]>[number]>();

  const label = data?.data?.platform ? `Platform: ${data?.data?.platform}` : "Platform " + (data.rowNumber !== undefined ? `#${data.rowNumber + 1}` : "");

  return <div>{label}</div>;
};
