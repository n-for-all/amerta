import { Media } from "@/payload-types";
import placeholder from "@/amerta/theme/assets/images/placeholder.jpg";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

export const ImageOrPlaceholder = ({
  image,
  alt: titleAlt,
  className,
  loading,
  onLoad,
}: {
  image?:
    | string
    | Media
    | {
        url?: string | null;
        alt?: string | null;
      }
    | null;
  className?: string;
  loading?: "lazy" | "eager";
  alt?: string;
  onLoad?: () => void;
}) => {
  let src = placeholder.src;
  let alt = "";
  if (typeof image === "object" && image?.url) {
    alt = image.alt || "";
    src = image.url;
  } else if (typeof image === "string") {
    src = image;
  }

  if (titleAlt) {
    alt = titleAlt;
  }

  return <ImageMedia src={src} alt={alt} imgClassName={className} fill onLoad={onLoad} loading={loading ? loading : "eager"} />;
};
