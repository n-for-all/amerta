import React from "react";

import type { ThemeShopCallToActionTextBlock as CTABlockProps } from "@/payload-types";

import { CMSLink } from "@/amerta/components/Link";
import RichText from "@/amerta/theme/components/RichText";

export const ThemeShopCallToActionTextBlock: React.FC<
  CTABlockProps & {
    locale: string;
  }
> = ({ links, richText, locale }) => {
  return (
    <div className="container">
      <div className="flex flex-col gap-8 p-4 border rounded bg-card border-border md:flex-row md:justify-between md:items-center">
        <div className="max-w-[48rem] flex items-center">{richText && <RichText className="mb-0" data={richText} enableGutter={false} locale={locale} />}</div>
        <div className="flex flex-col gap-8">
          {(links || []).map(({ link }, i) => {
            return <CMSLink key={i} size="lg" {...link} locale={locale}/>;
          })}
        </div>
      </div>
    </div>
  );
};
