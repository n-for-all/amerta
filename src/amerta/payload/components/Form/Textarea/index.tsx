import type { TextField } from "@payloadcms/plugin-form-builder/types";
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from "react-hook-form";

import { Label } from "@/amerta/theme/ui/label";
import { Textarea as TextAreaComponent } from "@/amerta/theme/ui/textarea";
import React from "react";

import { Error } from "../Error";
import { Width } from "../Width";

export const Textarea: React.FC<
  TextField & {
    errors: Partial<FieldErrorsImpl>;
    register: UseFormRegister<FieldValues>;
    rows?: number;
    placeholder?: string;
  }
> = ({ name, defaultValue, errors, label, register, required, rows = 3, width, placeholder }) => {
  return (
    <Width width={width}>
      {label && (
        <Label htmlFor={name} className="block w-full pl-2 mb-2">
          {label}

          {required && (
            <span className="required">
              * <span className="sr-only">(required)</span>
            </span>
          )}
        </Label>
      )}

      <TextAreaComponent defaultValue={defaultValue} id={name} rows={rows} {...register(name, { required: required })} placeholder={placeholder} />

      {errors[name] && <Error />}
    </Width>
  );
};
