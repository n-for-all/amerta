import React from "react";
import { cn } from "@/amerta/utilities/ui";
import { ThemeShopFeaturesBlock as FeaturesBlockProps } from "@/payload-types";
import { FeaturesAccordion } from "./FeaturesAccordion";
import RichText from "@/amerta/theme/components/RichText";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

type Props = FeaturesBlockProps & {
  className?: string;
  locale?: string;
};

export const ThemeShopFeaturesBlock: React.FC<Props> = ({ image, headline, features, className, locale }) => {
  const imageUrl = typeof image === "object" ? image?.url : null;
  const imageAlt = typeof image === "object" ? image?.alt || "" : "";

  return (
    <div className={cn("container mt-20 sm:mt-28 lg:mt-32", className)}>
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center">
        <div className="relative flex-1/2 2xl:flex-3/7">
          {imageUrl && (
            <div className="relative w-full aspect-square lg:aspect-[4/5]">
              <ImageMedia src={imageUrl} alt={imageAlt} fill imgClassName="object-cover rounded-lg" />
            </div>
          )}
        </div>
        <div className="relative flex flex-1/2 lg:justify-center 2xl:flex-4/7">
          <div className="self-end w-full max-w-md">
            <h2 className="mb-8 mt-6 text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none font-medium text-zinc-900 dark:text-white">
              <RichText data={headline} enableProse={false} enableGutter={false} locale={locale}/>
            </h2>
            {features && features.length > 0 && <FeaturesAccordion items={features} />}
          </div>
        </div>
      </div>
    </div>
  );
};
