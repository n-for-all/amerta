"use client";
import { RowLabelProps, useRowLabel, useWatchForm } from "@payloadcms/ui";

export const RowLabel: React.FC<RowLabelProps> = () => {
  const data = useRowLabel<any>();

  const label = data?.data?.link?.label ? `${data?.data?.link?.label || "No Label"} (${data?.data?.link?.type})` : `Link ${data.rowNumber !== undefined ? "#" + (data.rowNumber + 1) : ""}`;

  return <div>{label}</div>;
};

export const Label = (props: any) => {
  const { path, parentPath, field } = props;
  const { getDataByPath } = useWatchForm();
  const value = getDataByPath<any>(parentPath! + "." + field?.fields[0]?.name); // 'link' group data

  const linkType = value?.type;
  const url = value?.url;
  const reference = value?.reference;
  const label = value?.label;

  const getDynamicLabel = () => {
    if (linkType === "custom" && url) {
      const displayUrl = url.length > 30 ? `${url.substring(0, 30)}...` : url;
      return `(${displayUrl.substring(0, 50)})`;
    }

    if (linkType === "reference") {
      if (reference) {
        const refValue = reference.value;

        if (Array.isArray(refValue)) {
          return `(${refValue.length} Documents Selected)`;
        }

        if (typeof refValue === "object" && refValue !== null && "id" in refValue) {
          return `(${refValue.id})`;
        }

        if (typeof refValue === "string") {
          return `(${refValue})`;
        }
      }
      return (
        <span
          style={{
            marginLeft: "10px",
            fontSize: "0.9rem",
            padding: "2px 6px",
            backgroundColor: "#cd931eff",
            borderRadius: "4px",
            color: "#fff",
          }}
        >
          Not Set
        </span>
      );
    }

    return "";
  };

  let fieldLabel = field.fields[0]?.label || field.fields[0]?.name || "Link";

  return (
    <span style={{ fontWeight: "600" }}>
      {label && String(label).trim() != "" ? String(label) : fieldLabel} {getDynamicLabel()}
      {linkType && (
        <span
          style={{
            marginLeft: "10px",
            fontSize: "0.9rem",
            padding: "2px 6px",
            backgroundColor: linkType === "custom" ? "#f0f0f0" : "#c4e2f0ff",
            borderRadius: "4px",
            color: "#333",
          }}
        >
          {linkType === "custom" ? "Custom" : "Reference"} Type
        </span>
      )}
    </span>
  );
};
