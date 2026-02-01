"use client";
import React from "react";
import Link from "next/link";
import { Category, Page, Post } from "@/payload-types";
import { getLinkUrl } from "@/amerta/utilities/getURL";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

interface ThemeShopGridShowcaseBlockProps {
  leftTitle?: string;
  leftDescription?: string;
  leftImage?: any;
  leftBackgroundColor?: string;
  centerImage?: any;
  rightTopImage?: any;
  rightBottomTitle?: string;
  rightBottomDescription?: string;
  link?: {
    type?: ("reference" | "custom") | null;
    reference?:
      | ({
          relationTo: "pages";
          value: string | Page;
        } | null)
      | ({
          relationTo: "posts";
          value: string | Post;
        } | null)
      | ({
          relationTo: "categories";
          value: string | Category;
        } | null);
    url?: string | null;
    newTab?: boolean | null;
    label: string;
  };
  className?: string;
  params?: Record<string, string | string[] | undefined>;
}

export const ThemeShopGridShowcaseBlock: React.FC<ThemeShopGridShowcaseBlockProps> = ({ params, leftTitle = "", leftDescription, leftImage, leftBackgroundColor = "#ECFF9F", centerImage, rightTopImage, rightBottomTitle = "", rightBottomDescription, link, className = "" }) => {
  const leftImageSrc = typeof leftImage === "object" ? leftImage?.url : leftImage;
  const centerImageSrc = typeof centerImage === "object" ? centerImage?.url : centerImage;
  const rightTopImageSrc = typeof rightTopImage === "object" ? rightTopImage?.url : rightTopImage;

  let buttonUrl: string | null = null;
  if (link) {
    buttonUrl = getLinkUrl({ ...link, locale: params?.locale as string | undefined });
  }

  return (
    <section className={`mt-24 sm:mt-28 lg:mt-40 ${className}`}>
      <div className="container">
        <div className="grid grid-cols-12 overflow-hidden rounded-lg ">
          {/* Left Section */}
          <div className="flex flex-col justify-between col-span-12 sm:col-span-6 xl:col-span-4" style={{ backgroundColor: leftBackgroundColor }}>
            <div className="max-w-md p-6 pb-0 lg:p-10 lg:pb-0">
              <h2 className="font-medium text-4xl/none sm:text-5xl/none xl:text-6xl/none 2xl:text-7xl/none">{leftTitle}</h2>
            </div>

            {leftImageSrc && <ImageMedia alt={leftDescription} src={leftImageSrc} width={643} height={494} imgClassName="w-full h-auto" priority />}

            {leftDescription && (
              <div className="max-w-md p-6 pt-0 lg:p-10 lg:pt-0">
                <p className="uppercase text-sm/6">{leftDescription}</p>
              </div>
            )}
          </div>

          {/* Center Image */}
          {centerImageSrc && (
            <div className="relative col-span-12 aspect-square sm:col-span-6 sm:aspect-[unset] xl:col-span-4">
              <ImageMedia alt={leftTitle} src={centerImageSrc} fill imgClassName="object-cover object-center" />
            </div>
          )}

          {/* Right Section */}
          <div className="grid grid-cols-2 col-span-12 xl:col-span-4 xl:block">
            {/* Right Top Image */}
            {rightTopImageSrc && (
              <div className="col-span-2 sm:col-span-1 xl:col-[unset]">
                <ImageMedia alt={leftTitle} src={rightTopImageSrc} width={640} height={599} imgClassName="object-cover object-center w-full h-auto" />
              </div>
            )}

            {/* Right Bottom Content */}
            <div className="col-span-2 max-w-xl px-6 pt-10 pb-7 sm:col-span-1 lg:px-10 xl:col-[unset]">
              {rightBottomTitle && <h2 className="text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none font-medium">{rightBottomTitle}</h2>}

              {rightBottomDescription && <p className="uppercase mt-7 text-sm/6">{rightBottomDescription}</p>}

              {link && buttonUrl && (
                <Link href={buttonUrl} className="mt-7 relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 rounded-full border uppercase px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none border-zinc-900 text-zinc-950 hover:bg-zinc-950/[2.5%] transition-colors">
                  {link.label}
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
