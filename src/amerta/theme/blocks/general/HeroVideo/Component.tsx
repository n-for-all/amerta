import React from "react";
import type { ThemeShopHeroVideoBlock as HeroVideoProps, Media } from "@/payload-types";
import { cn } from "@/amerta/utilities/ui";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";
import Link from "next/link";
import { Button } from "@/amerta/theme/ui/button";
import { CMSLink } from "@/amerta/components/Link";

type Props = {
  className?: string;
  locale: string;
} & HeroVideoProps;

export const ThemeShopHeroVideoBlock: React.FC<Props> = ({
  className,
  locale,
  alignment = "left",
  direction = "right",
  spacing = "gap-2",
  blur = 25,

  // Background Media
  bgVideoType,
  bgVideo,
  bgVideoUrl,
  bgImage,
  bgOverlay = "after:bg-black/50",

  // Foreground Media
  videoType,
  video,
  videoUrl,
  image,
  blocks,
}) => {
  // --- Video Resolution Helper ---
  const getResolvedVideoUrl = (type: string | null | undefined, upload: any, url: string | null | undefined) => {
    if (type === "url") return url;
    return typeof upload === "object" ? (upload as Media)?.url : null;
  };

  const finalBgVideoUrl = getResolvedVideoUrl(bgVideoType, bgVideo, bgVideoUrl);
  const finalFgVideoUrl = getResolvedVideoUrl(videoType, video, videoUrl);

  const bgImageUrl = typeof bgImage === "object" ? (bgImage as Media)?.url : null;
  const fgImageUrl = typeof image === "object" ? (image as Media)?.url : null;

  // Layout Logic (Identical to Liquid logic)
  let justify = "justify-center";
  if (alignment === "left") {
    justify = "justify-center lg:justify-start";
  } else if (alignment === "right") {
    justify = "justify-center lg:justify-end";
  }

  // Direction Logic
  let directionClass = "";
  let directionMargin = "";
  let buttonsClass = "";

  if (direction === "right") {
    directionClass = "lg:flex-row-reverse";
    directionMargin = "lg:-ml-20 rtl:lg:-mr-20 rtl:lg:ml-0";
    buttonsClass = `mb-6 lg:mb-0 ${justify}`;
  } else if (direction === "left") {
    directionClass = "lg:flex-row";
    directionMargin = "lg:-mr-20 rtl:lg:-ml-20 rtl:lg:mr-0";
    buttonsClass = `mb-6 lg:mb-0 ${justify}`;
  } else {
    // Center
    buttonsClass = `mb-6 ${justify}`;
  }

  // Text Alignment lg:text-center lg:text-right rtl:lg:text-left rtl:lg:text-center rtl:lg:text-right
  const alignmentClass = `lg:text-${alignment} rtl:lg:text-${alignment === "left" ? "right" : alignment === "right" ? "left" : "center"}`;

  return (
    <div className={"relative overflow-hidden"}>
      <div className={cn("flex flex-col w-full container mx-auto py-16 overflow-hidden text-white", className)}>
        {/* Background Layer */}
        <div className={cn("absolute -inset-8 after:content-[''] after:absolute after:inset-0", bgOverlay)} style={blur && blur > 0 ? { filter: `blur(${blur}px)` } : undefined}>
          <div className="block w-full">
            {finalBgVideoUrl ? (
              <video src={finalBgVideoUrl} autoPlay loop muted playsInline className="absolute top-0 left-0 object-cover w-full h-full" />
            ) : bgImageUrl ? (
              <ImageMedia src={bgImageUrl} alt="Background" imgClassName="absolute top-0 left-0 object-cover w-full h-full" width={1920} height={1080} />
            ) : (
              <div className="absolute top-0 left-0 object-cover w-full h-full bg-gray-200" />
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={cn("relative flex flex-col items-center w-full", directionClass)}>
          <div className={cn("relative z-10 flex flex-col justify-center flex-1 w-full mb-5 text-center lg:mb-0 lg:text-left", directionMargin)}>
            <div className={cn("w-full text-center", alignmentClass)}>
              {/* Loop 1: Text and Headings */}
              {blocks?.map((block, index) => {
                if (block.blockType === "heading") {
                  const Tag = block.type || "h1";

                  const style: React.CSSProperties = {};
                  if (block.textColor) {
                    style.color = block.textColor;
                  } else {
                    style.color = "#00000000";
                  }

                  if (block.strokeText && block.strokeColor) {
                    style.WebkitTextStroke = `1px ${block.strokeColor}`;
                    style.paintOrder = "stroke fill";
                  }

                  return (
                    <Tag key={index} className={cn(block.fontSize, block.fontWeight, block.marginTop, block.marginBottom, block.leading)} style={style}>
                      {block.text}
                    </Tag>
                  );
                }

                if (block.blockType === "text") {
                  return (
                    <div key={index} className={cn(block.fontSize, block.fontWeight, block.marginTop, block.marginBottom, block.leading)}>
                      {block.text}
                    </div>
                  );
                }
                return null;
              })}

              {/* Loop 2: Buttons */}
              <div className={cn("flex flex-wrap mt-5", buttonsClass, spacing)}>
                {blocks?.map((block, index) => {
                  if (block.blockType === "buttons") {
                    let btnClass = "";
                    if (block.casing) {
                      btnClass += ` ${block.casing}`;
                    }

                    return <CMSLink key={index} {...block.link} locale={locale}></CMSLink>;
                  }
                  return null;
                })}
              </div>
            </div>
          </div>

          {/* Foreground Media */}
          <div className="w-full lg:w-1/2">
            <div className="relative flex flex-col justify-center w-full">
              <div className="relative overflow-hidden rounded-md aspect-video">
                {finalFgVideoUrl ? (
                  <video src={finalFgVideoUrl} autoPlay loop muted playsInline className="absolute top-0 left-0 object-cover w-full h-full" />
                ) : fgImageUrl ? (
                  <ImageMedia src={fgImageUrl} alt="Hero Image" width={1600} height={900} imgClassName="absolute top-0 left-0 object-cover w-full h-full" />
                ) : (
                  <div className="absolute top-0 left-0 object-cover w-full h-full bg-gray-300" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
