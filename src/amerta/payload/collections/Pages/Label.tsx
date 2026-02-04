"use client";
import { RowLabelProps, useRowLabel } from "@payloadcms/ui";

export const Label: React.FC<RowLabelProps> = () => {
  const { data, rowNumber } = useRowLabel<any>();

  const isHidden = data?.hideOnFrontend;
  const originalLabel =
    data?.blockName ||
    (data?.blockType
      ? data.blockType
          .replace(/([A-Z])/g, " $1")
          .replace(/^./, (str: string) => str.toUpperCase())
      : `Block ${rowNumber !== undefined ? rowNumber + 1 : ""}`);

  return (
    <div
      style={{
        opacity: isHidden ? 0.6 : 1,
        color: isHidden ? "#888" : "inherit",
        display: "flex",
        alignItems: "center",
        gap: "6px",
      }}
    >
      {isHidden && <span>🚫</span>}
      <span style={{ fontWeight: 600 }}>{originalLabel}</span>
      {isHidden && <span style={{ fontSize: "0.8em", fontStyle: "italic" }}>(Hidden)</span>}
    </div>
  );
};
