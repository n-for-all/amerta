"use client";
import React from "react";
import Link from "next/link";

import type { ThemeShopHeroBlock as ThemeShopHeroBlockProps } from "@/payload-types";
import { getLinkUrl } from "@/amerta/utilities/getURL";
import { ArrowRight } from "lucide-react";
import { Button } from "@/amerta/theme/ui/button";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

type Props = ThemeShopHeroBlockProps & {
  params?: Record<string, string | string[] | undefined>;
};

export const ThemeShopHeroBlock: React.FC<Props> = ({ params, topTitle, title, subtitle, buttonPrimary, image, className, backgroundColor }: Props) => {
  let buttonPrimaryUrl: string | null = null;
  if (buttonPrimary) {
    buttonPrimaryUrl = getLinkUrl({ ...buttonPrimary, locale: params?.locale as string | undefined });
  }

  const bgColor = backgroundColor || "#ECFF9F";
  const imageSrc = typeof image === "object" ? image?.url : image;

  return (
    <section className={"flex min-h-[calc(100vh-5rem)] relative flex-col justify-between sm:flex-row" + (className ? ` ${className}` : "")} style={{ backgroundColor: bgColor }}>
      {/* Left Content */}
      <div className="container flex">
        <div className="self-end w-3/5 py-16 pr-6 rtl:pl-6 rtl:pr-0 xl:pb-20">
          <div className="max-w-2xl">
            {/* Icon */}
            <div>
              <svg width="48" height="48" viewBox="0 0 33 33" fill="none" xmlns="http://www.w3.org/2000/svg">
                <g clipPath="url(#clip0_3045_1353)">
                  <path d="M16.5 0C16.5 0 17.9497 8.10256 21.4236 11.5764C24.8974 15.0503 33 16.5 33 16.5C33 16.5 24.8974 17.9497 21.4236 21.4236C17.9497 24.8974 16.5 33 16.5 33C16.5 33 15.0503 24.8974 11.5764 21.4236C8.10256 17.9497 0 16.5 0 16.5C0 16.5 8.10256 15.0503 11.5764 11.5764C15.0503 8.10256 16.5 0 16.5 0Z" fill="black"></path>
                </g>
                <defs>
                  <clipPath id="clip0_3045_1353">
                    <rect width="33" height="33" fill="white"></rect>
                  </clipPath>
                </defs>
              </svg>
            </div>

            {/* Title */}
            {topTitle && <h3 dangerouslySetInnerHTML={{ __html: topTitle }} className="mt-4 text-lg/tight md:text-2xl/tight lg:text-lg/tight" />}
            {title && <h2 dangerouslySetInnerHTML={{ __html: title }} className="mt-8 font-semibold text-5xl/tight md:text-6xl/tight lg:text-7xl/tight" />}

            {/* Subtitle */}
            {subtitle && <p className="max-w-sm mt-8 uppercase text-sm/6">{subtitle}</p>}

            {/* CTA Button */}
            {buttonPrimary && buttonPrimaryUrl && (
              <Button asChild variant={"secondary"} size={"xl"} className="mt-10">
                <Link href={buttonPrimaryUrl} target={buttonPrimary.newTab ? "_blank" : "_self"} className="relative px-16">
                  <span className="px-10">{buttonPrimary.label}</span>
                  <div className="absolute right-1.5 rtl:left-1.5 rtl:right-auto flex h-10 w-10 items-center justify-center rounded-full bg-zinc-900 text-white sm:h-12 sm:w-12">
                    <ArrowRight className="w-4 h-4 rtl:rotate-180" />
                  </div>
                </Link>
              </Button>
            )}
          </div>
        </div>

        {/* Right Image */}
        {imageSrc && (
          <div className="absolute top-0 right-0 w-2/5 h-full rtl:left-0 rtl:right-auto">
            <ImageMedia alt={buttonPrimary?.label || "hero"} src={imageSrc} width={815} height={987} imgClassName="object-cover object-center sm:absolute sm:h-full sm:w-full" priority />
          </div>
        )}
      </div>
    </section>
  );
};
