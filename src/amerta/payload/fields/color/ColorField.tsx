"use client";

import { useField, withCondition } from "@payloadcms/ui";
import React, { useCallback, useMemo, useEffect } from "react"; // 1. Import useEffect

import type { ClientField } from "payload";
import { ColorPickerFieldClientComponent } from "./types";
import { ColorPickerInput } from "./Input";

export const mergeFieldStyles = (field: ClientField | Omit<ClientField, "type">): React.CSSProperties => ({
  ...(field?.admin?.style || {}),
  ...(field?.admin?.width
    ? {
        "--field-width": field.admin.width,
      }
    : {
        flex: "1 1 auto",
      }),

  ...(field?.admin?.style?.flex
    ? {
        flex: field.admin.style.flex,
      }
    : {}),
});

const ColorPickerField: ColorPickerFieldClientComponent = (props) => {
  const {
    colors,
    defaultValue,
    field,
    field: { admin: { className, description, placeholder } = {}, label, localized, maxLength, minLength, required }, // 2. Destructure defaultValue
    inputRef,
    path,
    readOnly,
    validate,
  } = props;

  const memoizedValidate = useCallback(
    (value, options) => {
      if (typeof validate === "function") {
        return validate(value, { ...options, maxLength, minLength, required });
      }
      return "";
    },
    [validate, minLength, maxLength, required],
  );


  const {
    customComponents: { AfterInput, BeforeInput, Description, Error, Label } = {},
    setValue,
    showError,
    value,
  } = useField({
    path,
    validate: memoizedValidate,
  });

  // 3. THE FIX: Apply default value if value is undefined
  useEffect(() => {
    if (value === undefined && defaultValue !== undefined) {
      setValue(defaultValue);
    }
  }, [value, defaultValue, setValue]);

  const styles = useMemo(() => mergeFieldStyles(field), [field]);

  return (
    <ColorPickerInput
      AfterInput={AfterInput}
      BeforeInput={BeforeInput}
      className={className}
      colors={colors}
      Description={Description}
      description={description}
      Error={Error}
      inputRef={inputRef}
      Label={Label}
      label={label}
      localized={localized}
      onChange={(e) => {
        if (e.target.value !== value) {
          setValue(e.target.value);
        }
      }}
      path={path}
      placeholder={placeholder}
      readOnly={readOnly}
      required={required}
      showError={showError}
      style={styles}
      value={(value as string) || ""}
    />
  );
};

export const ColorPickerFieldComponent = withCondition(ColorPickerField);
