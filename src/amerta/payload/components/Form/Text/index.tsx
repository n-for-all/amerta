import type { TextField } from "@payloadcms/plugin-form-builder/types";
import type { FieldErrorsImpl, FieldValues, UseFormRegister } from "react-hook-form";

import { Input } from "@/amerta/theme/ui/input";
import { Label } from "@/amerta/theme/ui/label";
import React from "react";

import { Error } from "../Error";
import { Width } from "../Width";

export const Text: React.FC<
  TextField & {
    errors: Partial<FieldErrorsImpl>;
    register: UseFormRegister<FieldValues>;
    placeholder?: string;
  }
> = ({ name, defaultValue, errors, label, register, required, width, placeholder }) => {
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
      <Input defaultValue={defaultValue} id={name} type="text" {...register(name, { required })} placeholder={placeholder} />
      {errors[name] && <Error />}
    </Width>
  );
};
