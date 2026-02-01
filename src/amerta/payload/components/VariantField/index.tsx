"use client";
import { SelectInput, TextInput, usePayloadAPI } from "@payloadcms/ui";
import { useField } from "@payloadcms/ui";

import "./index.css";
import { ProductOption } from "@/payload-types";
import { Option } from "@payloadcms/ui/elements/ReactSelect";

const VariantField = ({ field: { label, required = false }, path }: { field: { label: string; required?: boolean }; path: string }) => {
  const { value, setValue } = useField<any>({ path });

  const [{ data, isError, isLoading }, { setParams }] = usePayloadAPI("/api/product-options");

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (isError) {
    return <div>Error loading product options.</div>;
  }

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
                value={value && value[item.id] ? value[item.id].value || "" : ""}
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
                value={value && value[item.id] ? value[item.id].value || "" : ""}
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
                value={value && value[item.id] ? value[item.id].value || "" : ""}
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
      <div className="variant-field-items">{items}</div>
      <input type="hidden" name={path} value={JSON.stringify(value)} />
    </div>
  );
};

export default VariantField;
