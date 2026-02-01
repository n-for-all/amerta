"use client";
import type { ChangeEvent } from "react";

import { getTranslation } from "@payloadcms/translations";
import { Button, fieldBaseClass, FieldDescription, FieldError, FieldLabel, RenderCustomComponent, useTranslation } from "@payloadcms/ui";
import React, { useState, useRef } from "react";
import { HexAlphaColorPicker } from "react-colorful";
import cx from "clsx";
import styles from "./index.module.scss";
import { ColorPickerInputProps } from "./types";

export const ColorPickerInput: React.FC<ColorPickerInputProps> = (props) => {
  const { AfterInput, BeforeInput, className, colors, Description, description, Error, inputRef, Label, label, localized, onChange, onKeyDown, path, placeholder, readOnly, required, rtl, showError, style, value } = props;

  const [fieldIsFocused, setFieldIsFocused] = useState(false);
  const lastValueRef = useRef(value);

  const { i18n } = useTranslation();

  const handleChange = (evt: ChangeEvent<HTMLInputElement>) => {
    let newValue = evt.target.value;

    if (!newValue.startsWith("#")) {
      newValue = `#${newValue}`;
    }

    newValue = newValue.replace(/[^a-f0-9#]/gi, "").slice(0, 7);

    evt.target.value = newValue;

    if (lastValueRef.current !== newValue) {
      lastValueRef.current = newValue;
      onChange?.(evt as any);
    }
  };

  return (
    <div className={cx(fieldBaseClass, styles.colorField, "color text", className, showError && "error", readOnly && "read-only")} style={style}>
      <RenderCustomComponent CustomComponent={Label} Fallback={<FieldLabel label={label} localized={localized} path={path} required={required} />} />

      <div className={`${fieldBaseClass}__wrap`}>
        <RenderCustomComponent CustomComponent={Error} Fallback={<FieldError path={path} showError={showError} />} />
        {BeforeInput}

        <div
          className={styles.inputContainer}
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) {
              setFieldIsFocused(false);
            }
          }}
          onFocus={() => setFieldIsFocused(true)}
        >
          {!rtl && (
            <div
              className={styles.colorPreview}
              style={{
                background: value?.length && value?.length > 1 ? value : "#fff",
              }}
            />
          )}

          <input className={styles.input} data-rtl={rtl} disabled={readOnly} id={`field-${path.replace(/\./g, "__")}`} name={path} onChange={handleChange} onKeyDown={onKeyDown} placeholder={getTranslation(placeholder as string, i18n)} ref={inputRef} type="text" value={value || ""} />

          {rtl && (
            <div
              className={styles.colorPreview}
              style={{
                background: value?.length && value?.length > 1 ? value : "#fff",
              }}
            />
          )}

          <div className={cx(styles.colorPickerModal, rtl && styles.colorPickerModalRtl, fieldIsFocused && styles.colorPickerModalFocused)}>
            {colors && (
              <div className={styles.predefinedColors}>
                {colors.map((color, index) => (
                  <Button
                    buttonStyle="none"
                    className={styles.colorButton}
                    key={index}
                    onClick={() => {
                      if (color !== value) {
                        onChange?.({
                          target: {
                            name: path,
                            value: color,
                          },
                        } as any);
                      }
                    }}
                  >
                    <span
                      className={styles.colorButtonSwatch}
                      style={{
                        background: color,
                      }}
                    />
                  </Button>
                ))}
              </div>
            )}
            <HexAlphaColorPicker
              color={value || ""}
              onChange={(v) => {
                if (v !== value) {
                  onChange?.({
                    target: {
                      name: path,
                      value: v,
                    },
                  } as any);
                }
              }}
            />
          </div>
        </div>

        {AfterInput}
        <RenderCustomComponent CustomComponent={Description} Fallback={<FieldDescription description={description} path={path} />} />
      </div>
    </div>
  );
};
