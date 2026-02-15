import { Metadata } from "next";
import React from "react";
import { Pagination } from "@/amerta/theme/components/Pagination";
import { getBlogPosts } from "@/amerta/theme/utilities/blog";
import { createTranslator } from "@/amerta/theme/utilities/translation";
import { getTimeToRead } from "@/amerta/theme/utilities/get-time-to-read";
import { printf } from "fast-printf";
import PostCard from "@/amerta/theme/components/PostCard";
import { getURL } from "@/amerta/utilities/getURL";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { SearchParams } from "next/dist/server/request/search-params";

export default async function BlogPage({ searchParams, params }: { searchParams: Promise<SearchParams>; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const page = (await searchParams)?.page || "1";
  const { docs: blogPosts, totalPages } = await getBlogPosts({ page: page as string, locale });
  const __ = await createTranslator(locale);

  return (
    <div className="container">
      <div className="flex flex-col items-center text-center py-14 lg:py-20">
        <h1 className="mt-5 text-3xl leading-none sm:text-4xl xl:text-5xl/none text font-medium *:data-[slot=dim]:text-zinc-300 *:data-[slot=italic]:font-serif *:data-[slot=italic]:font-normal *:data-[slot=italic]:italic *:data-[slot=dim]:dark:text-zinc-500">
          <span className="underline">{__("Our Journal.")}</span>
        </h1>
        <div className="max-w-xl mt-5 uppercase text-sm/6">{__("Stay up-to-date with the latest news and insights.")}</div>
      </div>
      <div className="grid grid-cols-1 mt-5 gap-x-8 gap-y-16 md:grid-cols-2 lg:mx-0 xl:grid-cols-3">
        {blogPosts.map((post, index) => {
          const timeToRead = getTimeToRead(post.content);
          return <PostCard size="sm" locale={locale} key={`${post.id}-${index}`} post={post} timeToRead={timeToRead ? printf(__(`%s min read`), `${timeToRead}`) : undefined} />;
        })}
      </div>
      <Pagination currentPage={parseInt(page as string, 10)} totalPages={totalPages} baseUrl={getURL(`/blog`, locale)} locale={locale} />
    </div>
  );
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { locale } = await params;
  const { page } = await searchParams;

  const metaData = await generateStaticMeta({ pageName: "blogPage", locale, type: "blog", pageNum: Number(page || 1) });
  return metaData;
}