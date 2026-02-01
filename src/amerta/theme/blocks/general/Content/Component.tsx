import React from "react";

import { ThemeShopContentBlock as ThemeShopContentBlockProps } from "@/payload-types";
import { CMSLink } from "@/amerta/components/Link";
import RichText from "@/amerta/theme/components/RichText";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";

export const ThemeShopContentBlock: React.FC<
  ThemeShopContentBlockProps & {
    id?: string;
    locale?: string;
  }
> = (props) => {
  const { columns, removeContainer, locale } = props;

  return (
    <div className={removeContainer ? "" : "relative mx-auto prose lg:prose-xl max-w-7xl perspective-distant gap-4 lg:px-0 grid md:grid-cols-12"}>
      {columns &&
        columns.length > 0 &&
        columns.map((col, index) => {
          const { enableLink, richText, link, size, className } = col;
          const classes: { [key: string]: string } = {
            "1": "md:col-span-1",
            "2": "md:col-span-2",
            "3": "md:col-span-3",
            "4": "md:col-span-4",
            "5": "md:col-span-5",
            "6": "md:col-span-6",
            "7": "md:col-span-7",
            "8": "md:col-span-8",
            "9": "md:col-span-9",
            "10": "md:col-span-10",
            "11": "md:col-span-11",
            "12": "md:col-span-12",
            column: "flex flex-col",
            link: "mt-4 inline-block text-primary hover:underline",
          };

          const newSize = size?.replace("_", "") || "12";
          return (
            <div key={index} className={[classes.column, newSize ? classes[newSize] : "", className || ""].join(" ")}>
              <RichText data={richText} enableGutter={false} locale={locale || DEFAULT_LOCALE} />
              {enableLink && <CMSLink className={classes.link} {...link} locale={locale!} />}
            </div>
          );
        })}
    </div>
  );
};
