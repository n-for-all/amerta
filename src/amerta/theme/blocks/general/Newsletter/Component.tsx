import React from "react";
import { cn } from "@/amerta/utilities/ui";
import type { ThemeShopNewsletterBlock as NewsletterProps } from "@/payload-types";
import RichText from "@/amerta/theme/components/RichText";
import { Form } from "./Form";

type Props = NewsletterProps & {
  className?: string;
  locale?: string;
};

export const ThemeShopNewsletterBlock: React.FC<Props> = async ({ headline, formText, baseForm, className, locale }) => {
  return (
    <div className={cn("container mt-16 pt-5 sm:mt-28 lg:mt-32", className)}>
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-8">
        {/* Headline Section */}
        <div className="max-w-xl lg:col-span-7">
          <div className="text-3xl leading-none sm:text-4xl xl:text-5xl/none text font-medium *:data-[slot=dim]:text-zinc-300 *:data-[slot=italic]:font-serif *:data-[slot=italic]:font-normal *:data-[slot=italic]:italic *:data-[slot=dim]:dark:text-zinc-500">
            <RichText data={headline} enableProse={false} enableGutter={false} locale={locale} />
          </div>
        </div>
        <div className="w-full max-w-md lg:col-span-5 lg:pt-2">
          {baseForm && (
            <>
              {baseForm.title ? (
                <label htmlFor="email" className="pl-1.5">
                  {baseForm.title}
                </label>
              ) : null}
              <Form baseForm={baseForm} />
              {baseForm.description ? <p>{baseForm.description}</p> : null}
            </>
          )}
          {formText && (
            <div className="mt-2 pl-1.5">
              <RichText data={formText} locale={locale}/>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
