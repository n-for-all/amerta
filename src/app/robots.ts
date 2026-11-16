import { MetadataRoute } from "next";
import { getServerSideURL } from "@/amerta/utilities/getURL";

export const dynamic = "force-dynamic";

/**
 * /robots.txt: lets search engines crawl the shop, keeps private pages (admin, account, cart, checkout)
 * out, and points to the sitemap. /api stays crawlable because product and media images are served from it.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl = getServerSideURL();
  const privatePaths = ["/admin", "/account", "/cart", "/checkout", "/login", "/logout", "/create-account", "/recover-password", "/reset-password", "/verify-email", "/resend-verification-email"];

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      // Each private path with and without a language prefix (e.g. /account and /ar/account)
      disallow: [...privatePaths, ...privatePaths.filter((p) => p !== "/admin").map((p) => `/*${p}`)],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
