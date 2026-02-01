import { MetadataRoute } from "next";
import { getCachedGlobal } from "@/amerta/utilities/getGlobals";
import type { Settings } from "@/payload-types";
import { Config } from "payload";

export default async function manifest(): Promise<MetadataRoute.Manifest> {
  const settings: Settings = await getCachedGlobal("settings" as keyof Config["globals"], 1)();

  const icons: {
    src: string;
    sizes: string;
    type: string;
  }[] = [];

  if (settings.manifestIcon && typeof settings.manifestIcon === "object" && settings.manifestIcon.url) {
    const url = settings.manifestIcon.url;
    const extension = url.split(".").pop()?.toLowerCase();
    const mimeType = extension === "png" ? "image/png" : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "svg" ? "image/svg+xml" : extension === "webp" ? "image/webp" : "image/png";
    icons.push({
      src: url,
      sizes: "512x512",
      type: mimeType,
    });
  }

  const manifest: any = {
    display: "standalone",
    display_override: ["window-controls-overlay", "standalone", "minimal-ui"],
    start_url: "/",
  };

  if (settings.siteTitle) {
    manifest.name = settings.siteTitle;
    const shortName = settings.siteTitle.split(" - ")[0];
    if (shortName) {
      manifest.short_name = shortName;
    }
  }

  if (settings.siteDescription) {
    manifest.description = settings.siteDescription;
  }

  if (icons.length > 0) {
    manifest.icons = icons;
  }

  const screenshots: any[] = [];

  if (settings.desktopScreenshot && typeof settings.desktopScreenshot === "object" && settings.desktopScreenshot.url) {
    const url = settings.desktopScreenshot.url;
    const extension = url.split(".").pop()?.toLowerCase();
    const mimeType = extension === "png" ? "image/png" : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "webp" ? "image/webp" : "image/jpeg";

    screenshots.push({
      src: url,
      sizes: "1920x1080",
      type: mimeType,
      form_factor: "wide",
      label: "Desktop View",
    });
  }

  if (settings.mobileScreenshot && typeof settings.mobileScreenshot === "object" && settings.mobileScreenshot.url) {
    const url = settings.mobileScreenshot.url;
    const extension = url.split(".").pop()?.toLowerCase();
    const mimeType = extension === "png" ? "image/png" : extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "webp" ? "image/webp" : "image/jpeg";

    screenshots.push({
      src: url,
      sizes: "1080x1920",
      type: mimeType,
      form_factor: "narrow",
      label: "Mobile View",
    });
  }

  if (screenshots.length > 0) {
    manifest.screenshots = screenshots;
  }

  if (settings.themeColor) {
    manifest.theme_color = settings.themeColor;
  }
  if (settings.backgroundColor) {
    manifest.background_color = settings.backgroundColor;
  }
  manifest.scope = settings.scope || "/";

  manifest.lang = settings.lang || "en";
  manifest.dir = settings.dir || "ltr";
  manifest.id = settings.pwaId;
  return manifest;
}
