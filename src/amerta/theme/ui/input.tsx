import { cn } from "@/amerta/utilities/ui";
import * as React from "react";

const Input: React.FC<
  {
    ref?: React.Ref<HTMLInputElement>;
    error?: boolean;
  } & React.InputHTMLAttributes<HTMLInputElement>
> = ({ type, className, ref, error, ...props }) => {
  return <input className={cn("relative block w-full appearance-none rounded-full px-3.5 py-2 text-sm/6 text-zinc-950 placeholder:text-zinc-500 dark:text-white border border-zinc-300 data-hover:border-zinc-400 dark:border-white/10 dark:data-hover:border-white/20 bg-white dark:bg-white/5 focus:outline-hidden data-invalid:border-red-500 data-invalid:data-hover:border-red-500 dark:data-invalid:border-red-500 dark:data-invalid:data-hover:border-red-500 data-disabled:border-zinc-950/20 dark:data-disabled:border-white/15 dark:data-disabled:bg-white/[2.5%] dark:data-hover:data-disabled:border-white/15 dark:[color-scheme:dark]", error ? "border-destructive text-destructive focus-visible:ring-destructive" : "focus-visible:ring-ring", className)} ref={ref} type={type} {...props} />;
};

export { Input };
