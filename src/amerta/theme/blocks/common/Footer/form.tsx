"use client";


import { Loader2, SendIcon } from "lucide-react";
import { FormBlock } from "@/amerta/components/Form/Component";
import { Button } from "@/amerta/theme/ui/button";

export const FooterForm = ({ form }) => {
  return (
    <FormBlock
      id={"footerForm"}
      enableIntro
      className="w-full rounded-md"
      form={form as any}
      renderSubmitButton={(formId, label, { isLoading, hasSubmitted }) => (
        <Button disabled={isLoading || hasSubmitted} form={formId} className="absolute top-0 right-0 px-2 mt-1 mr-1 rtl:mr-0 rtl:ml-1 rtl:left-0 rtl:right-auto " type="submit" size="sm" variant="default">
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
          {!isLoading && <SendIcon className="w-4 h-4 rtl:rotate-270" />}
        </Button>
      )}
    />
  );
};
