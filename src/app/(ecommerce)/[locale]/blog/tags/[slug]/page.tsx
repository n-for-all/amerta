import { Metadata } from "next";
import React from "react";
import { Pagination } from "@/amerta/theme/components/Pagination";
import { getAllTags, getBlogPostsByTag, getTagBySlug } from "@/amerta/theme/utilities/blog";
import PostCard from "@/amerta/theme/components/PostCard";
import { notFound } from "next/navigation";
import { TagsSwitch } from "@/amerta/theme/components/Blog/TagsSwitch";
import RichText from "@/amerta/theme/components/RichText";
import { getURL } from "@/amerta/utilities/getURL";
import { createTranslator } from "@/amerta/theme/utilities/translation";

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<{ page?: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const { page = "1" } = await searchParams;

  const pageNum = parseInt(page, 10);
  const isFirstPage = pageNum === 1;

  // For page 1, use base blog metadata without page numbers
  const title = isFirstPage ? "Blog | Latest Articles and Insights" : `Blog - Page ${pageNum} | Latest Articles and Insights`;

  const description = isFirstPage ? "Discover the latest articles, insights, and stories. Stay informed with our comprehensive collection of blog posts covering various topics and interests." : `Page ${pageNum} of our blog featuring the latest articles, insights, and stories. Stay informed with our comprehensive collection of content.`;

  const keywords = isFirstPage ? ["blog", "articles", "insights", "news", "stories", "content"] : ["blog", "articles", "insights", "news", "stories", "content", "page", pageNum.toString()];

  return {
    title,
    description,
    keywords,
    authors: [{ name: "Blog Team" }],
    creator: "Blog",
    publisher: "Blog",
    openGraph: {
      title,
      description,
      url: isFirstPage ? getURL(`/blog`, locale) : getURL(`/blog/${page}`, locale),
      siteName: "Blog",
      type: "website",
      locale: "en_US",
      images: [
        {
          url: "/assets/images/blog.png",
          width: 1200,
          height: 630,
          alt: isFirstPage ? "Blog Articles and Insights" : `Blog Articles and Insights - Page ${pageNum}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: ["/assets/images/blog.png"],
      creator: "@blog",
    },
    robots: {
      index: isFirstPage, // Index the first page, don't index pagination pages
      follow: true,
      googleBot: {
        index: isFirstPage,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    alternates: {
      canonical: isFirstPage ? getURL(`/blog`, locale) : getURL(`/blog/${page}`, locale),
    },
    other: {
      "article:author": "Blog Team",
      "article:publisher": "Blog",
      "article:section": "Blog",
    },
  };
}

const BlogTagPage: React.FC<{ searchParams: Promise<{ page?: string }>; params: Promise<{ locale: string; slug: string }> }> = async ({ searchParams, params }) => {
  const { locale, slug } = await params;
  const page = (await searchParams)?.page || "1";
  const tag = await getTagBySlug(slug, locale);
  const { docs: blogPosts, totalPages } = await getBlogPostsByTag({ page, tag: tag?.id || "---", locale });

  if (!tag) {
    return notFound();
  }

  const tags = await getAllTags(locale);
  const __ = await createTranslator(locale);

  return (
    <div className="container">
      <div className="flex flex-col items-center text-center py-14 lg:py-20">
        <h1 className="mt-5 text-3xl leading-none sm:text-4xl xl:text-5xl/none text font-medium *:data-[slot=dim]:text-zinc-300 *:data-[slot=italic]:font-serif *:data-[slot=italic]:font-normal *:data-[slot=italic]:italic *:data-[slot=dim]:dark:text-zinc-500">
          <span dangerouslySetInnerHTML={{ __html: tag?.title }}></span>
          <br />
          <span data-slot="italic font-serif" className="underline">
            {__("Tag.")}
          </span>
        </h1>
        <div className="max-w-xl mt-5 uppercase text-sm/6">
          <RichText data={tag?.description} locale={locale} />
        </div>
        {/* Tag Navigation */}
        <div className="mt-6">
          <TagsSwitch label={"Other Tags"} tags={tags} slug={slug} locale={locale} />
        </div>
      </div>
      <div className="grid grid-cols-1 mt-5 gap-x-8 gap-y-16 md:grid-cols-2 lg:mx-0 xl:grid-cols-3">
        {blogPosts.map((post, index) => (
          <PostCard size="sm" locale={locale} key={`${post.id}-${index}`} post={post} />
        ))}
      </div>
      <Pagination currentPage={parseInt(page, 10)} totalPages={totalPages} baseUrl={getURL(`/blog/tags/${slug}/`, locale)} locale={locale} />
    </div>
  );
};

export default BlogTagPage;
