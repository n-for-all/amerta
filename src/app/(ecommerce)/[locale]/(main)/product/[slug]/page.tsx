// Route implementation lives in the theme so each site can override it:
// copy src/amerta/theme/routes/(ecommerce)/[locale]/(main)/product/[slug]/page.tsx to src/themes/<your-theme>/routes/(ecommerce)/[locale]/(main)/product/[slug]/page.tsx and edit it there.
export { default, generateMetadata } from "@/amerta/theme/routes/(ecommerce)/[locale]/(main)/product/[slug]/page";

// Route segment config must be declared in this file (Next.js reads it at build time).
export const dynamic = "force-dynamic";
