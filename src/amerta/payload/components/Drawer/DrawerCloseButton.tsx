"use client";
import React from "react";
import { XIcon, useTranslation } from "@payloadcms/ui";

const baseClass = "drawer-close-button";

type Props = {
  readonly onClick: () => void;
};
export function DrawerCloseButton({ onClick }: Props) {
  const { t } = useTranslation();

  return (
    <button aria-label={t("general:close")} className={baseClass} onClick={onClick} type="button">
      <XIcon />
    </button>
  );
}
