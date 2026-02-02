"use client";
import { FormBlock } from "@/amerta/components/Form/Component";
import { Button } from "@/amerta/theme/ui/button";
import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import { Loader2, SendIcon } from "lucide-react";

export const Form = ({
  baseForm,
}: {
  baseForm: {
    form: FormType;
  };
}) => {
  if (!baseForm || !baseForm.form) return null;
  return (
    <FormBlock
      id={"footerForm"}
      enableIntro
      className="w-full max-w-md lg:col-span-5 lg:pt-2"
      form={baseForm?.form as FormType}
      renderSubmitButton={(formId, label, { isLoading, hasSubmitted }) => (
        <Button disabled={isLoading || hasSubmitted} form={formId} className="absolute top-0 right-0 px-2 mt-1 mr-1 rtl:ml-1 rtl:left-0 rtl:right-auto" type="submit" size="sm" variant="default">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {!isLoading && <SendIcon className="w-4 h-4 rtl:rotate-270" />}
        </Button>
      )}
    />
  );
};
