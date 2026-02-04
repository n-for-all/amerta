import React from "react";
import { ThemeShopImageBlock as ThemeShopImageBlockProps, Media } from "@/payload-types";
import { cn } from "@/amerta/utilities/ui"; // Assuming you have a cn utility, or use template literals
import RichText from "@/amerta/theme/components/RichText";

export const ThemeShopImageBlock: React.FC<
  ThemeShopImageBlockProps & {
    locale?: string;
  }
> = (props) => {
  const { image, enableParallax, height, contentSettings, locale } = props;
  const { text, position, overlayOpacity } = contentSettings || {};

  // 1. Get Image URL safely
  const imgUrl = typeof image === "object" ? (image as Media)?.url : "";

  if (!imgUrl) return null;

  // 2. Define Height Classes
  const heightClass = {
    small: "md:min-h-[300px] min-h-[200px]",
    medium: "md:min-h-[500px] min-h-[300px]",
    large: "md:min-h-[700px] min-h-[500px]",
    screen: "min-h-screen",
  }[height || "medium"];

  const getPositionClasses = () => {
    // Base alignment
    const alignClass = "items-center"; // Vertical Center default
    let justifyClass = "justify-center"; // Horizontal Center default
    let textAlign = "text-center";

    if (position === "left") {
      justifyClass = "justify-start rtl:justify-end";
      textAlign = "text-left rtl:text-right";
    } else if (position === "right") {
      justifyClass = "justify-end rtl:justify-start";
      textAlign = "text-right rtl:text-left";
    }

    return `${justifyClass} ${alignClass} ${textAlign}`;
  };

  // 4. Overlay Opacity Map
  const overlayClass = {
    "0": "bg-black/0",
    "20": "bg-black/20",
    "50": "bg-black/50",
    "80": "bg-black/80",
  }[overlayOpacity || "50"];

  return (
    <section
      className={cn("relative w-full overflow-hidden flex", heightClass, getPositionClasses())}
      style={{
        // Parallax Magic: 'fixed' keeps image in place while scrolling
        backgroundImage: `url(${imgUrl})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: enableParallax ? "fixed" : "scroll",
      }}
    >
      {/* Overlay Layer */}
      <div className={cn("absolute inset-0 z-10 pointer-events-none transition-colors", overlayClass)} />

      {/* Content Layer */}
      <div className="container relative z-20 px-4 py-12 md:px-8">
        <div className="w-full prose prose-invert max-w-none lg:prose-xl">
          <RichText data={text} enableGutter={false} enableProse={false} locale={locale} />
        </div>
      </div>
    </section>
  );
};
