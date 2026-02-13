"use client";
import { SelectInput, TextInput, usePayloadAPI } from "@payloadcms/ui";
import { useField } from "@payloadcms/ui";

import "./index.css";
import { ProductOption } from "@/payload-types";
import { Option } from "@payloadcms/ui/elements/ReactSelect";

export type VariantValue = {
  name: string;
  value: string;
};

export interface VariantSelection {
  [productOptionId: string]: VariantValue;
}

const VariantField = ({ field: { label, required = false }, path }: { field: { label: string; required?: boolean }; path: string }) => {
  const { value, setValue } = useField<VariantSelection>({ path });

  const [{ data, isError, isLoading }, { setParams }] = usePayloadAPI("/api/product-options");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading product options.</div>;
  }
  const existingOptionIds = new Set(data?.docs?.map((doc: any) => doc.id) || []);
  const ghostKeys = Object.keys(value || {}).filter((key) => !existingOptionIds.has(key));

  const removeGhostKey = (keyToRemove: string) => {
    const newValue = { ...value };
    delete newValue[keyToRemove];
    setValue(newValue);
  };
  let items = null;
  if (data && data.docs && data.docs.length) {
    items = data.docs.map((item: ProductOption) => {
      switch (item.type) {
        case "color":
          return (
            <div className={"variant-item"} key={item.id}>
              <SelectInput
                options={item.colors?.map((c) => ({
                  label: `${c.label} (${c.color})`,
                  value: c.color,
                }))}
                name={""}
                label={item.name}
                path={""}
                onChange={(option: Option<unknown> | Option<unknown>[]) => {
                  const newValue = {
                    ...value,
                    [item.id]: {
                      name: item.name,
                      type: item.type,
                      value: Array.isArray(option) ? option.map((opt) => opt.value).join(", ") : option.value,
                    },
                  };
                  setValue(newValue);
                }}
                value={item.id && value && value[item.id] ? value[item.id]!.value || "" : ""}
              />
            </div>
          );
        case "dropdown":
        case "image":
        case "radio":
          return (
            <div className={"variant-item"} key={item.id}>
              <SelectInput
                options={item.options?.map((c) => ({
                  label: `${c.label}`,
                  value: c.option,
                }))}
                path={""}
                name={""}
                label={item.name}
                onChange={(option: Option<unknown> | Option<unknown>[]) => {
                  const newValue = {
                    ...value,
                    [item.id]: {
                      name: item.name,
                      type: item.type,
                      value: Array.isArray(option) ? option.map((opt) => opt.value).join(", ") : option.value,
                    },
                  };
                  setValue(newValue);
                }}
                value={item.id && value && value[item.id] ? value[item.id]!.value || "" : ""}
              />
            </div>
          );
        default:
          return (
            <div className={"variant-item"} key={item.id}>
              <TextInput
                path={""}
                label={item.name}
                onChange={(option: Option<unknown> | Option<unknown>[]) => {
                  const newValue = {
                    ...value,
                    [item.id]: {
                      name: item.name,
                      type: item.type,
                      value: Array.isArray(option) ? option.map((opt) => opt.value).join(", ") : option.value,
                    },
                  };
                  setValue(newValue);
                }}
                value={item.id && value && value[item.id] ? value[item.id]!.value || "" : ""}
              />
            </div>
          );
      }
    });
  }

  return (
    <div className={"variant-field"}>
      {label ? (
        <label className={"field-label"}>
          {label} {required && <span className="required">*</span>}
        </label>
      ) : null}
      {ghostKeys.length > 0 && (
        <div className="ghost-warning-container" style={{ marginBottom: "15px", border: "1px solid #ffba00", padding: "10px", borderRadius: "4px", background: "#fff9eb" }}>
          <p style={{ color: "#856404", margin: "0 0 10px 0", fontSize: "13px", fontWeight: "bold" }}>⚠️ Unknown data detected! The following options were deleted or moved to trash:</p>
          {ghostKeys.map((key) => (
            <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff", padding: "5px 10px", marginBottom: "5px", borderRadius: "3px", border: "1px solid #eee" }}>
              <span style={{ fontSize: "12px", color: "#666" }}>
                ID: {key} (Value: {value[key]?.value})
              </span>
              <button type="button" onClick={() => removeGhostKey(key)} style={{ background: "#ff4d4d", color: "white", border: "none", borderRadius: "3px", padding: "2px 8px", cursor: "pointer", fontSize: "11px" }}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
      <div className="variant-field-items">{items}</div>
      <input type="hidden" name={path} value={JSON.stringify(value)} />
    </div>
  );
};

export default VariantField;
