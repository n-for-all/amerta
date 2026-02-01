"use client";
import React from "react";
import Link from "next/link";
import { getLinkUrl } from "@/amerta/utilities/getURL";
import { LinkType } from "@/amerta/theme/types";
import { Button } from "@/amerta/theme/ui/button";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

interface ThemeShopCTAFeatureBlockProps {
  title?: any;
  description?: string;
  link?: LinkType;
  leftImage?: any;
  rightImage?: any;
  backgroundColor?: "white" | "off-white" | "light-gray";
  className?: string;
}

// const bgColors = {
//   white: "bg-white",
//   "off-white": "bg-zinc-50",
//   "light-gray": "bg-zinc-100",
// };

type Props = ThemeShopCTAFeatureBlockProps & {
  params?: Record<string, string | string[] | undefined>;
};

export const ThemeShopCTAFeatureBlock: React.FC<Props> = ({ params, title, description, link, leftImage, rightImage, className = "" }) => {
  const leftImageSrc = typeof leftImage === "object" ? leftImage?.url : leftImage;
  const rightImageSrc = typeof rightImage === "object" ? rightImage?.url : rightImage;
  let buttonPrimaryUrl: string | null = null;
  if (link) {
    buttonPrimaryUrl = getLinkUrl({ ...link, locale: params?.locale as string | undefined });
  }
  return (
    <section className={`${className}`}>
      <div className="flex flex-col justify-between gap-8 lg:flex-row lg:items-center lg:gap-6 xl:gap-2.5 container mt-24 sm:mt-28 lg:mt-40">
        {/* Left Content */}
        <div className="flex flex-col gap-16 flex-2/3">
          {/* Title Section */}
          <div className="relative">
            <h2 className="max-w-[400px] text-5xl font-semibold font-medium">{title}</h2>
          </div>

          {/* Bottom Section with Images and Text */}
          <div className="mt-auto flex flex-col gap-8 sm:flex-row lg:gap-6 xl:gap-2.5">
            {/* Left Image */}
            {leftImageSrc && (
              <div className="flex-1/2 xl:flex-1/3">
                <ImageMedia alt={title} src={leftImageSrc} width={325} height={335} imgClassName="object-cover w-full h-auto rounded-lg" />
              </div>
            )}

            {/* Description and CTA */}
            <div className="flex flex-1/2 sm:justify-center xl:flex-2/3">
              <div className="self-end max-w-sm">
                {description && <p className="uppercase text-sm/6">{description}</p>}
                {link && buttonPrimaryUrl && (
                  <Button asChild variant={"outline"} size={"xl"} className="mt-4">
                    <Link href={buttonPrimaryUrl}>{link.label}</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Large Image */}
        {rightImageSrc && (
          <div className="flex flex-1/3">
            <ImageMedia alt={title} src={rightImageSrc} width={495} height={530} imgClassName="object-cover w-full h-auto" />
          </div>
        )}
      </div>
    </section>
  );
};
