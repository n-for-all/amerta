import { Metadata } from "next";
import React from "react";
import { Pagination } from "@/amerta/theme/components/Pagination";
import { getAllCategories, getBlogPostsByCategory, getCategoryBySlug } from "@/amerta/theme/utilities/blog";
import PostCard from "@/amerta/theme/components/PostCard";
import { notFound } from "next/navigation";
import { CategoriesSwitch } from "@/amerta/theme/components/Blog/CategoriesSwitch";
import RichText from "@/amerta/theme/components/RichText";
import { getURL } from "@/amerta/utilities/getURL";
import { generateMeta } from "@/amerta/utilities/generateMeta";
import { SearchParams } from "next/dist/server/request/search-params";

type Args = {
  params: Promise<{ locale: string; slug: string[] }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params, searchParams }: Args): Promise<Metadata> {
  const { locale, slug } = await params;
  const { page = "1" } = await searchParams;

  const currentSlug = slug[slug.length - 1]!;
  const category = await getCategoryBySlug(currentSlug, locale);

  const pageNum = parseInt(page as string, 10);
  return generateMeta({ doc: category, type: "category", pageNum, locale });
}

export default async function BlogCategoryPage({ searchParams, params }: Args) {
  const { locale, slug } = await params;
  const page = (await searchParams)?.page || "1";

  const currentSlug = slug[slug.length - 1]!;
  const category = await getCategoryBySlug(currentSlug, locale);
  const { docs: blogPosts, totalPages } = await getBlogPostsByCategory({ page: page as string, category: category?.id || "---", locale });

  if (!category) {
    return notFound();
  }

  const categories = await getAllCategories(locale);

  return (
    <div className="container">
      <div className="flex flex-col items-center text-center py-14 lg:py-20">
        <h1 className="mt-5 text-3xl leading-none sm:text-4xl xl:text-5xl/none text font-medium *:data-[slot=dim]:text-zinc-300 *:data-[slot=italic]:font-serif *:data-[slot=italic]:font-normal *:data-[slot=italic]:italic *:data-[slot=dim]:dark:text-zinc-500">
          <span dangerouslySetInnerHTML={{ __html: category?.title }}></span>
        </h1>
        <div className="max-w-xl mt-5 uppercase text-sm/6">
          <RichText data={category?.description} locale={locale} />
        </div>
        <div className="mt-6">
          <CategoriesSwitch label={"Other Categories"} categories={categories} slug={currentSlug} locale={locale} />
        </div>
      </div>
      <div className="grid grid-cols-1 mt-5 gap-x-8 gap-y-16 md:grid-cols-2 lg:mx-0 xl:grid-cols-3">
        {blogPosts.map((post) => (
          <PostCard size="sm" locale={locale} key={post.id} post={post} />
        ))}
      </div>
      <Pagination currentPage={parseInt(page as string, 10)} totalPages={totalPages} baseUrl={getURL(`/blog/categories/${slug.join("/")}/`, locale)} />
    </div>
  );
}
