"use client";

import React, { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import { ChevronLeft, ChevronRight, Facebook, Instagram, Twitter, Youtube, Linkedin, Github } from "lucide-react";
import { EcommerceSettings } from "@/payload-types";
import { CMSLink } from "@/amerta/components/Link";
import { cn } from "@/amerta/utilities/ui";

type Props = EcommerceSettings["announcementBar"] & { locale: string };
type SocialLinks = NonNullable<EcommerceSettings["announcementBar"]>["socialLinks"];

const SocialIcons = ({ links }: { links?: SocialLinks }) => {
  if (!links) return null;
  const renderIcon = (url: string | undefined, Icon: React.ElementType) => {
    if (!url) return null;
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="transition-opacity hover:opacity-75">
        <Icon size={16} strokeWidth={1} />
      </a>
    );
  };
  return (
    <div className="flex items-center justify-center gap-4 md:justify-end">
      {links.map((link) => {
        switch (link.platform) {
          case "facebook":
            return <div key="facebook">{renderIcon(link.url, Facebook)}</div>;
          case "instagram":
            return <div key="instagram">{renderIcon(link.url, Instagram)}</div>;
          case "x":
            return <div key="x">{renderIcon(link.url, Twitter)}</div>;
          case "youtube":
            return <div key="youtube">{renderIcon(link.url, Youtube)}</div>;
          case "github":
            return <div key="github">{renderIcon(link.url, Github)}</div>;
          default:
            return null;
        }
      })}
    </div>
  );
};

const isValidLink = (link: any): boolean => {
  return link && ((link.type === "reference" && link.reference) || (link.type === "custom" && link.url));
};

export const AnnouncementBar: React.FC<Props> = (props) => {
  const { showSocial, showButtons, socialLinks, locale, autoRotate, direction, speed, announcements } = props || {};

  const axis = direction === "scrollTop" ? "y" : "x";

  // Configuration
  const autoplayOptions = {
    delay: (speed || 5) * 1000,
    stopOnInteraction: false,
    stopOnMouseEnter: true, // Usually better UX to pause on hover
    rootNode: (emblaRoot: HTMLElement) => emblaRoot.parentElement as HTMLElement,
  };

  const hasAnnouncements = announcements && announcements.length > 0;
  const shouldAutoPlay = autoRotate && hasAnnouncements && announcements.length > 1;

  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      axis: axis,
      duration: 30,
    },
    shouldAutoPlay ? [Autoplay(autoplayOptions)] : [],
  );

  const scrollPrev = useCallback(() => emblaApi && emblaApi.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi && emblaApi.scrollNext(), [emblaApi]);

  // Layout Logic
  const hasSocials = showSocial && socialLinks && Object.values(socialLinks).some(Boolean);

  // Grid layout: If socials exist, split space. If not, center content.
  let gridClass = hasSocials ? "grid-cols-3" : "grid-cols-1";

  if (!hasAnnouncements) return null;

  return (
    <div className="relative z-10 w-full text-xs text-white bg-black dark:bg-zinc-800 md:text-sm">
      <div className={`w-full h-10 container mx-auto grid gap-4 items-center ${gridClass}`}>
        {hasSocials && (<div></div>)}
        <div className="relative flex items-center justify-center w-full h-full overflow-hidden">
          {announcements.length > 1 && showButtons && (
            <button onClick={scrollPrev} aria-label="Previous" className="left-0 z-10 hidden p-1 hover:opacity-70 md:block">
              <ChevronLeft className="rtl:rotate-180" size={16} />
            </button>
          )}

          {/* Embla Viewport */}
          <div className="w-full h-full mx-auto overflow-hidden" ref={emblaRef}>
            <div className={`flex h-full ${axis === "y" ? "flex-col" : "flex-row"}`}>
              {announcements.map((block) => (
                <div key={block.id} className={cn("flex-[0_0_100%] min-w-0 h-full flex items-center justify-center transition-opacity duration-500 ease-in-out", hasSocials ? "" : "")}>
                  {isValidLink(block.link) ? (
                    <CMSLink {...block.link} locale={locale} label={null} className="flex items-center max-w-full gap-2 truncate hover:underline">
                      <span className="truncate">{block.text}</span>
                      <svg className="flex-shrink-0 w-3 h-3" fill="none" viewBox="0 0 14 10">
                        <path fill="currentColor" fillRule="evenodd" d="M8.537.808a.5.5 0 0 1 .817-.162l4 4a.5.5 0 0 1 0 .708l-4 4a.5.5 0 1 1-.708-.708L11.793 5.5H1a.5.5 0 0 1 0-1h10.793L8.646 1.354a.5.5 0 0 1-.109-.546" clipRule="evenodd" />
                      </svg>
                    </CMSLink>
                  ) : (
                    <span className="max-w-full truncate">{block.text}</span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Next Button */}
          {announcements.length > 1 && showButtons && (
            <button onClick={scrollNext} aria-label="Next" className="right-0 z-10 hidden p-1 hover:opacity-70 md:block">
              <ChevronRight className="rtl:rotate-180" size={16} />
            </button>
          )}
        </div>

        {/* Right: Socials */}
        {hasSocials && (
          <div className="hidden md:block">
            <SocialIcons links={socialLinks} />
          </div>
        )}
      </div>
    </div>
  );
};
