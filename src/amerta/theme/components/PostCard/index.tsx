import Link from "next/link";
import { FC } from "react";
import { Post } from "@/payload-types";
import { cn } from "@/amerta/utilities/ui";
import { getURL } from "@/amerta/utilities/getURL";
import { ImageMedia } from "@/amerta/components/Media/ImageMedia";

interface Props {
  className?: string;
  post: Post;
  size?: "sm" | "md";
  locale: string;
  timeToRead?: string | null;
}

const PostCard: FC<Props> = ({ className = "h-full", post, locale, timeToRead }) => {
  const { slug, title, publishedAt: date, heroImage: image, categories } = post;
  const category = categories && Array.isArray(categories) && categories.length > 0 ? (typeof categories[0] === "object" ? categories[0] : null) : null;

  const formattedDate = date
    ? new Date(date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "";

  return (
    <article className={cn("relative flex flex-col items-start", className)}>
      <div className="relative w-full aspect-square bg-zinc-50">
        {typeof image == "object" && image?.url && <ImageMedia src={image.url} alt={title || ""} fill imgClassName="object-cover" loading="lazy" />}

        {/* Category badge */}
        {category && (
          <div className="absolute top-3 left-3">
            <div className="rounded-full bg-white px-3.5 py-1.5 text-xs leading-none text-zinc-900 uppercase">
              <span dangerouslySetInnerHTML={{ __html: category.title }} />
            </div>
          </div>
        )}

        {/* Share icon */}
        <div className="absolute top-3 right-3">
          <div className="rounded-full bg-white p-1.5 text-zinc-900 hover:bg-zinc-100 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" color="currentColor" strokeWidth="1" stroke="currentColor">
              <path d="M9 6.65032C9 6.65032 15.9383 6.10759 16.9154 7.08463C17.8924 8.06167 17.3496 15 17.3496 15M16.5 7.5L6.5 17.5" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" />
            </svg>
          </div>
        </div>
      </div>

      <div className="max-w-xl">
        <div className="group">
          <h3 className="mt-6 text-base font-semibold uppercase text-zinc-900 group-hover:text-zinc-600 dark:text-zinc-100 dark:group-hover:text-zinc-300">
            <Link href={getURL(`/blog/article/${slug}`, locale)}>
              <span className="absolute inset-0"></span>
              <span dangerouslySetInnerHTML={{ __html: title }} />
            </Link>
          </h3>
        </div>

        <div className="mt-2.5 flex items-center gap-x-4 text-sm opacity-70">
          <time dateTime={date || ""}>{formattedDate}</time>
          {timeToRead && (
            <>
              <span>/</span>
              <span>{timeToRead}</span>
            </>
          )}
        </div>
      </div>
    </article>
  );
};

export default PostCard;
