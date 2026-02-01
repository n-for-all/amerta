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
            <svg width={48} height={48} viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g clipPath="url(#clip0_3045_1353)">
                <path d="M16.5 0C16.5 0 17.9497 8.10256 21.4236 11.5764C24.8974 15.0503 33 16.5 33 16.5C33 16.5 24.8974 17.9497 21.4236 21.4236C17.9497 24.8974 16.5 33 16.5 33C16.5 33 15.0503 24.8974 11.5764 21.4236C8.10256 17.9497 0 16.5 0 16.5C0 16.5 8.10256 15.0503 11.5764 11.5764C15.0503 8.10256 16.5 0 16.5 0Z" fill="black" />
              </g>
              <defs>
                <clipPath id="clip0_3045_1353">
                  <rect width={33} height={33} fill="white" />
                </clipPath>
              </defs>
            </svg>

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
