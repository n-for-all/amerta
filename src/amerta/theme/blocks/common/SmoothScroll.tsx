"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export const SmoothScroll = () => {
  const router = useRouter();

  useEffect(() => {
    const scrollToElement = (hash: string) => {
      if (hash.startsWith("#!") || hash.startsWith("#")) {
        const sectionId = hash.replace("#!", "").replace("#", "");
        const element = document.getElementById(sectionId);

        if (element) {
          element.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });

          setTimeout(() => {
            router.replace(window.location.pathname + window.location.search, { scroll: false });
          }, 100);
        }
      }
    };

    const handleHashChange = () => {
      scrollToElement(window.location.hash);
    };

    // Handle clicks on hash links
    const handleLinkClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const link = target.closest('a[href*="#"]') as HTMLAnchorElement;
      
      if (link && link.href) {
        const url = new URL(link.href);
        if (url.hash && (url.hash.startsWith("#!") || url.hash.startsWith("#"))) {
          e.preventDefault();
          scrollToElement(url.hash);
        }
      }
    };

    // Handle initial load
    if (window.location.hash) {
      setTimeout(() => scrollToElement(window.location.hash), 0);
    }

    // Listen for hash changes and link clicks
    window.addEventListener("hashchange", handleHashChange);
    document.addEventListener("click", handleLinkClick);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
      document.removeEventListener("click", handleLinkClick);
    };
  }, [router]);

  return null;
};
