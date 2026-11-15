// Route implementation lives in the theme so each site can override it:
// copy src/amerta/theme/routes/(ecommerce)/[locale]/(main)/tags/page.tsx to src/theme/routes/(ecommerce)/[locale]/(main)/tags/page.tsx and edit it there.
export { default, generateMetadata } from "@/amerta/theme/routes/(ecommerce)/[locale]/(main)/tags/page";

// Route segment config must be declared in this file (Next.js reads it at build time).
export const revalidate = 60;
