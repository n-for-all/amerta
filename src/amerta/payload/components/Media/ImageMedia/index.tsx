"use client";

import type { StaticImageData } from "next/image";

import NextImage from "next/image";
import React from "react";

import type { Props as MediaProps } from "../types";

const { breakpoints } = {
  breakpoints: {
    "3xl": 1920,
    "2xl": 1536,
    xl: 1280,
    lg: 1024,
    md: 768,
    sm: 640,
  },
};

export function formatImageSrc(url: string | null | undefined): string {
  if (!url) return "";

  const localPrefix = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/;

  if (localPrefix.test(url)) {
    return url.replace(localPrefix, "");
  }

  return url;
}

// A compact base64 encoded blur placeholder (much smaller and better quality)
// const placeholderBlur = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48ZmlsdGVyIGlkPSJibHVyIj48ZmVHYXVzc2lhbkJsdXIgc3RkRGV2aWF0aW9uPSIyIi8+PC9maWx0ZXI+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9IiNFNUU3RUIiIGZpbHRlcj0idXJsKCNibHVyKSIvPjwvc3ZnPg==";

export const ImageMedia: React.FC<{
  alt?: string;
  fill?: boolean;
  imgClassName?: string;
  priority?: boolean;
  resource?: MediaProps["resource"];
  size?: string;
  src?: StaticImageData | string | null;
  loading?: "lazy" | "eager";
  width?: number;
  height?: number;
  onLoad?: () => void;
}> = (props) => {
  const { alt: altFromProps, fill, onLoad, imgClassName, priority, resource, size: sizeFromProps, src: srcFromProps, loading: loadingFromProps, width: widthFromProps, height: heightFromProps } = props;

  let width: number | undefined = widthFromProps;
  let height: number | undefined = heightFromProps;
  let alt = altFromProps;
  let src: StaticImageData | string = srcFromProps || "";

  if (!src && resource && typeof resource === "object") {
    const { alt: altFromResource, height: fullHeight, url, width: fullWidth } = resource;

    width = fullWidth!;
    height = fullHeight!;
    alt = altFromResource || "";
    const cacheTag = resource.filesize || "";
    src = `${url}?v=${cacheTag}`;
  }

  let imageUrl = typeof src === "string" ? src : "";

  if (!imageUrl && typeof src !== "string" && src.src) {
    imageUrl = src.src;
  }

  const loading = loadingFromProps || (!priority ? "lazy" : undefined);
  const aspectRatio = width && height ? `${width} / ${height}` : null;

  // NOTE: this is used by the browser to determine which image to download at different screen sizes
  const sizes = sizeFromProps
    ? sizeFromProps
    : Object.entries(breakpoints)
        .map(([, value]) => `(max-width: ${value}px) ${value * 2}w`)
        .join(", ");

  return (
    <NextImage
      alt={alt || ""}
      className={imgClassName}
      fill={fill}
      height={!fill ? height : undefined}
      priority={priority}
      quality={100}
      loading={loading}
      sizes={sizes}
      src={formatImageSrc(imageUrl)}
      width={!fill ? width : undefined}
      style={{ aspectRatio: aspectRatio ? aspectRatio : undefined }}
      onLoad={onLoad}
    />
  );
};
