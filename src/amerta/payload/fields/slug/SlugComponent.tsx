"use client";
import React, { useCallback, useEffect } from "react";
import { TextFieldClientProps } from "payload";

import { useField, Button, TextInput, FieldLabel, useFormFields, useForm, useLocale } from "@payloadcms/ui";

import { formatSlug } from "./formatSlug";
import "./index.scss";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";

type SlugComponentProps = {
  fieldToUse: string;
  checkboxFieldPath: string;
} & TextFieldClientProps;

export const SlugComponent: React.FC<SlugComponentProps> = ({ field, fieldToUse, checkboxFieldPath: checkboxFieldPathFromProps, path, readOnly: readOnlyFromProps }) => {
  const { label } = field;

  // 1. Get the current active locale (e.g., 'en' or 'ar')
  const { code: locale } = useLocale();

  const isFrontPage = useFormFields(([fields]) => {
    return fields.isFrontPage?.value as boolean;
  });

  const checkboxFieldPath = path?.includes(".") ? `${path}.${checkboxFieldPathFromProps}` : checkboxFieldPathFromProps;

  const { value, setValue } = useField<string>({ path: path || field.name });

  const { dispatchFields } = useForm();

  // The value of the checkbox
  const checkboxValue = useFormFields(([fields]) => {
    return fields[checkboxFieldPath]?.value as string;
  });

  // The value of the field we're listening to for the slug
  const targetFieldValue = useFormFields(([fields]) => {
    return fields[fieldToUse]?.value as string;
  });

  useEffect(() => {
    // 2. GUARD CLAUSE: Stop auto-generation if not in English
    // This prevents Arabic titles from overwriting the global slug
    if (locale !== DEFAULT_LOCALE) {
      return;
    }

    if (!checkboxValue) {
      if (targetFieldValue) {
        const formattedSlug = formatSlug(targetFieldValue);

        // Only update if it's actually different (prevents infinite loops)
        if (!isFrontPage && value !== formattedSlug) {
            setValue(formattedSlug);
        }
      } else {
        if (value !== "") setValue("");
      }
    }
  }, [targetFieldValue, checkboxValue, setValue, value, isFrontPage, locale]); // 👈 Added locale to dependencies

  const handleLock = useCallback(
    (e: React.MouseEvent<Element>) => {
      e.preventDefault();

      dispatchFields({
        type: "UPDATE",
        path: checkboxFieldPath,
        value: !checkboxValue,
      });
    },
    [checkboxValue, checkboxFieldPath, dispatchFields],
  );

  const readOnly = readOnlyFromProps || checkboxValue;

  return (
    <div className="field-type slug-field-component">
      <div className="label-wrapper">
        <FieldLabel htmlFor={`field-${path}`} label={label} />

        <Button className="lock-button" buttonStyle="none" onClick={handleLock}>
          {checkboxValue ? "Unlock" : "Lock"}
        </Button>
      </div>

      <TextInput value={value} onChange={setValue} path={path || field.name} readOnly={Boolean(readOnly)} />
    </div>
  );
};