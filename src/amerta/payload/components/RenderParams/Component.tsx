"use client";

import { useEffect } from "react";
import { useSearchParams } from "next/navigation";

import { Message } from "../Message";

export type Props = {
  params?: string[];
  actions?: { [K in "error" | "warning" | "success" | "message"]?: (paramValue: string, type: string) => React.ReactNode };
  message?: string;
  className?: string;
  onParams?: (paramValues: ((string | null | undefined) | string[])[]) => void;
};

export const RenderParamsComponent: React.FC<Props> = ({ params = ["error", "warning", "success", "message"], actions, className = "w-full", onParams }) => {
  const searchParams = useSearchParams();
  const paramValues = params.map((param) => searchParams?.get(param)).filter((value) => value !== null && value !== undefined && value !== "");
  const type = searchParams?.get("errorType") || "error";

  useEffect(() => {
    if (paramValues.length && onParams) {
      onParams(paramValues);
    }
  }, [paramValues, onParams]);

  if (paramValues.length) {
    return (
      <div className={className}>
        {paramValues.map((paramValue, index) => {
          if (!paramValue) return null;

          return (
            <Message
              className={"p-4 rounded text-sm"}
              key={paramValue}
              {...{
                [params[index] as string]: actions && actions[params[index] as "error" | "warning" | "success" | "message"] ? actions[params[index] as "error" | "warning" | "success" | "message"]!(paramValue, type) : paramValue,
              }}
            />
          );
        })}
      </div>
    );
  }

  return null;
};
