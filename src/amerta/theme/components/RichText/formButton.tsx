"use client";

import { Button } from "@/amerta/theme/ui/button";
import { Loader2, SendIcon } from "lucide-react";

export const renderSubmitButton = (formId, label, { isLoading, hasSubmitted }) => (
  <Button disabled={isLoading || hasSubmitted} form={formId} className="mt-6 " type="submit" size="sm" variant="default">
    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
    {!isLoading && <SendIcon className="w-4 h-4" />} {label}
  </Button>
);
