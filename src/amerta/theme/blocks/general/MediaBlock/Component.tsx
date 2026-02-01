import type { StaticImageData } from "next/image";

import { cn } from "@/amerta/utilities/ui";
import React from "react";

import type { ThemeShopMediaBlock as ThemeShopMediaBlockProps } from "@/payload-types";

import { Media } from "@/amerta/components/Media";
import RichText from "@/amerta/theme/components/RichText";

type Props = ThemeShopMediaBlockProps & {
  breakout?: boolean;
  captionClassName?: string;
  className?: string;
  enableGutter?: boolean;
  imgClassName?: string;
  staticImage?: StaticImageData;
  disableInnerContainer?: boolean;
  locale?: string;
};

export const ThemeShopMediaBlock: React.FC<Props> = (props) => {
  const { captionClassName, className, enableGutter = true, imgClassName, media, staticImage, disableInnerContainer, locale } = props;

  let caption;
  if (media && typeof media === "object") caption = media.caption;

  return (
    <div
      className={cn(
        "",
        {
          container: enableGutter,
        },
        className,
      )}
    >
      {(media || staticImage) && <Media imgClassName={cn("border border-border rounded-[0.8rem]", imgClassName)} resource={media} src={staticImage} />}
      {caption && (
        <div
          className={cn(
            "mt-6",
            {
              container: !disableInnerContainer,
            },
            captionClassName,
          )}
        >
          <RichText data={caption} enableGutter={false} locale={locale} />
        </div>
      )}
    </div>
  );
};
