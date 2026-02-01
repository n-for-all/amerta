import React from "react";
import { cn } from "@/amerta/utilities/ui";
import { ThemeShopBenefitsBlock as BenefitsBlockProps } from "@/payload-types";
import { DynamicIcon } from "@/amerta/components/Icon/DynamicIcon";

type Props = BenefitsBlockProps & {
  className?: string;
};

export const ThemeShopBenefitsBlock: React.FC<Props> = ({ items, className }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className={cn("grid grid-cols-1 gap-y-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 container mt-16 sm:mt-28 lg:mt-40", className)}>
      {items.map((item, index) => {
        const displayIndex = index + 1;
        return (
          <div key={item.id || index} className={cn("flex-col gap-2 border border-zinc-100 px-4 py-5 sm:px-8 sm:py-10 bg-white dark:bg-zinc-900 dark:border-zinc-800", "border-l-transparent", index === 0 ? "border-l-zinc-100 dark:border-l-zinc-800" : "")}>
            <p className="uppercase text-zinc-500 dark:text-zinc-500 text-sm/6">({displayIndex})</p>
            <p className="mt-2 font-medium uppercase text-sm/6 text-zinc-900 dark:text-white">{item.title}</p>
            <div className="mt-10 text-zinc-700 sm:mt-14 dark:text-zinc-300 [&>svg]:w-10 [&>svg]:h-10 [&>svg]:stroke-[1]">
              <DynamicIcon className="text-zinc-900 dark:text-white" name={item.icon || ""} />
            </div>
            <p className="mt-4 uppercase text-zinc-500 dark:text-zinc-400 text-sm/6">{item.description}</p>
          </div>
        );
      })}
    </div>
  );
};
