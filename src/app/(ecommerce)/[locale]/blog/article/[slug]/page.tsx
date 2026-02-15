import { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import PostCard from "@/amerta/theme/components/PostCard";
import { generateMeta } from "@/amerta/utilities/generateMeta";
import Avatar from "@/amerta/theme/components/Avatar";
import SocialsList from "@/amerta/theme/components/Blog/SocialsList";
import { calculateTimeToRead } from "@/amerta/theme/utilities/calculate-time-to-read";
import { Button } from "@/amerta/theme/ui/button";
import { ChevronLeftIcon } from "lucide-react";
import { getBlogPostByHandle, getRelatedPosts } from "@/amerta/theme/utilities/blog";
import { createTranslator } from "@/amerta/theme/utilities/translation";
import RichText from "@/amerta/theme/components/RichText";
import { getURL } from "@/amerta/utilities/getURL";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string; locale: string }> }) {
  const { slug, locale } = await params;
  const post = await getBlogPostByHandle(slug, locale);
  const __ = await createTranslator(locale);

  if (!post) {
    return notFound();
  }

  const { title, heroImage, authors, content } = post;
  const author = typeof authors === "object" && Array.isArray(authors) && authors.length > 0 ? authors[0] : null;
  const relatedPosts = await getRelatedPosts(post.id, 4, locale);
  const timeToReadPost = calculateTimeToRead(content);
  const timeToRead = timeToReadPost > 0 ? timeToReadPost + " min read" : null;
  const categories = post.categories && Array.isArray(post.categories) ? post.categories.filter((cat) => typeof cat === "object") : [];
  const tags = post.tags && Array.isArray(post.tags) ? post.tags : [];
  const sanitizedTitle = { __html: title || "" };
  const renderHeader = () => {
    return (
      <header className="px-4 mx-auto max-w-7xl rounded-xl xl:px-0">
        <div className="mx-auto flex w-full max-w-(--breakpoint-md) flex-col items-start gap-y-5">
          {/* Category badges */}
          {categories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {categories.map((cat: any, index: number) => (
                <Link key={cat.id || index} href={getURL(`/blog/categories/${cat.slug}`, locale)} className="inline-flex items-center px-3 py-1 text-xs font-medium bg-orange-200 rounded-full text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                  {cat.title}
                </Link>
              ))}
            </div>
          )}
          <h1 className="max-w-4xl text-3xl font-semibold text-zinc-900 md:text-4xl md:leading-[120%]! lg:text-4xl dark:text-zinc-100" dangerouslySetInnerHTML={sanitizedTitle}></h1>
          <div className="flex flex-wrap gap-2">
            {tags.map((tag: any, index: number) => (
              <Link key={tag.id || index} href={getURL(`/blog/tags/${tag.slug}`, locale)} className="inline-flex items-center px-3 py-1 text-xs font-medium border rounded-full border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700">
                {tag.title}
              </Link>
            ))}
          </div>

          <div className="flex w-full flex-wrap justify-between gap-2.5">
            {typeof author === "object" && author !== null && (
              <div className="flex flex-wrap items-center text-sm leading-none text-left nc-PostMeta2 shrink-0 text-zinc-700 dark:text-zinc-200">
                <Avatar initials={author?.name || ""} className="w-8 h-8 sm:h-11 sm:w-11" />
                <div className="ms-3">
                  <div className="flex items-center">
                    <span className="block font-semibold">{author?.name}</span>
                  </div>
                  <div className="mt-[6px] text-xs">
                    <span className="mx-2 font-semibold">·</span>
                    <span className="text-zinc-700 dark:text-zinc-300">{timeToRead} </span>
                  </div>
                </div>
              </div>
            )}
            <div className="mt-1 sm:mt-1.5">
              <SocialsList title={title} />
            </div>
          </div>
        </div>
      </header>
    );
  };

  const renderContent = () => {
    // render your content here / [content]
    // this for the demo purpose only
    return (
      <div id="single-entry-content" className="mx-auto prose prose-sm max-w-(--breakpoint-md)! sm:prose lg:prose-lg dark:prose-invert">
        <RichText data={content} enableProse={false} enableGutter={false} locale={locale} />
      </div>
    );
  };

  const renderAuthor = () => {
    if (!author || typeof author !== "object") return null;
    return (
      <div className="mx-auto w-full max-w-(--breakpoint-md) px-4 xl:px-0">
        <div className="flex nc-SingleAuthor">
          <Avatar initials={author?.name ? author.name.charAt(0) : ""} className="h-11 w-11 md:h-24 md:w-24" />
          <div className="flex flex-col max-w-lg ml-3 gap-y-1 sm:ml-5">
            <span className="text-xs tracking-wider uppercase text-zinc-400">written by</span>
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-200">
              <span className="block font-semibold">{author?.name}</span>
            </h2>
          </div>
        </div>
      </div>
    );
  };

  const renderRelatedPosts = () => {
    return (
      <div className="px-4 py-16 mt-16 bg-zinc-100 lg:mt-24 lg:py-24 dark:bg-zinc-800 xl:px-0">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-semibold">{__("Related posts")}</h2>

          <div className="grid gap-6 mt-10 sm:grid-cols-2 md:gap-8 lg:grid-cols-3 xl:grid-cols-4">
            {relatedPosts.map((post, index) => (
              <PostCard size="sm" locale={locale} key={`${post.id}-${index}`} post={post} />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pt-8 lg:pt-16">
      {renderHeader()}

      {typeof heroImage === "object" && heroImage !== null && heroImage.url && (
        <div className="max-w-(--breakpoint-md) mx-auto my-4 lg:my-10 sm:my-12 px-4 xl:px-0">{heroImage?.url && <ImageMedia alt={title || ""} src={heroImage?.url} width={heroImage?.width || 100} height={heroImage?.height || 100} imgClassName="rounded-xl" />}</div>
      )}
      <div className="flex flex-col px-4 mx-auto max-w-7xl gap-y-10 xl:px-0">
        {renderContent()}
        {/* {renderTags()} */}

        {author && (
          <>
            <div className="mx-auto w-full max-w-(--breakpoint-md) border-t border-b border-zinc-100 dark:border-zinc-700"></div>
            {renderAuthor()}
          </>
        )}
        {/* {renderCommentForm()} */}
        <div className="mx-auto w-full max-w-(--breakpoint-md) border-t py-5 border-zinc-100 dark:border-zinc-700">
          <Button variant="outline" asChild>
            <Link href={getURL(`/blog`, locale)}>
              <ChevronLeftIcon className="w-4 h-4 me-2" />
              Read More Articles
            </Link>
          </Button>
        </div>
      </div>

      {renderRelatedPosts()}
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  const post = await getBlogPostByHandle(slug, locale);
  if (!post) {
    return {};
  }
  return await generateMeta({ doc: post, type: "post", locale });
}
