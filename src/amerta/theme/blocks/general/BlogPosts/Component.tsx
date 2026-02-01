import React from "react";
import { ThemeShopBlogPostsBlock as ThemeShopBlogPostsBlockProps } from "@/payload-types";
import { BlogPostsCarousel } from "./Carousel";
import { cn } from "@/amerta/utilities/ui";
import Link from "next/link";
import { getLinkUrl } from "@/amerta/utilities/getURL";
import RichText from "@/amerta/theme/components/RichText";
import { getBlogPosts } from "@/amerta/theme/utilities/blog";
import { DEFAULT_LOCALE } from "@/amerta/localization/locales";

type Props = ThemeShopBlogPostsBlockProps & {
  className?: string;
  locale?: string;
};

export const ThemeShopBlogPostsBlock: React.FC<Props> = async ({ buttonPrimary, category, type, title, description, limit = 8, className, locale }) => {
  const categoryId = typeof category === "object" ? category?.id : category;
  const where: any = {};
  if (categoryId) {
    where.categories = { equals: categoryId };
  }
  switch (type) {
    case "latest":
      //by default we are fetching latest posts, so no additional filter needed
      break;
    case "featured":
      // Assuming there's a 'featured' field in posts to filter by
      (where as any).featured = { equals: true };
      break;
    default:
      break;
  }

  const { docs: blogPosts } = await getBlogPosts({ locale, limit: limit || 5, filter: where });

  let buttonPrimaryUrl: string | null = null;
  if (buttonPrimary) {
    buttonPrimaryUrl = getLinkUrl({ ...buttonPrimary, locale: locale as string | undefined });
  }

  return (
    <div className={cn("container mt-44", className)}>
      <div className="flex flex-wrap items-center justify-between gap-6">
        <div className="relative">
          <h2 className="text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none text font-medium">
            <RichText data={title} enableProse={false} enableGutter={false} locale={locale || DEFAULT_LOCALE} />
          </h2>
        </div>
        {buttonPrimary && buttonPrimaryUrl ? (
          <Link href={buttonPrimaryUrl} className="relative isolate inline-flex shrink-0 items-center justify-center gap-x-2 rounded-full border uppercase px-5 py-3.5 sm:px-6 sm:py-4 text-sm/none border-zinc-900 text-zinc-950 hover:bg-zinc-950/[2.5%] dark:border-white/40 dark:text-white dark:hover:bg-white/5 transition-colors">
            {buttonPrimary.label}
          </Link>
        ) : null}

        <p className="max-w-xs uppercase lg:max-w-sm text-sm/6 text-zinc-600 dark:text-zinc-400">{description}</p>
        <BlogPostsCarousel posts={blogPosts} locale={locale} />
      </div>
    </div>
  );
};
