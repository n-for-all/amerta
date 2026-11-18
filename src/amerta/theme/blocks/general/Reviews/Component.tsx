import React from "react";
import { cn } from "@/amerta/utilities/ui";
import { ThemeShopReviewsBlock as ReviewsBlockProps } from "@/payload-types";
import { getBlockReviews } from "@/amerta/core/utilities/get-block-reviews";
import { createTranslator } from "@/amerta/core/utilities/translation";

type Props = ReviewsBlockProps & {
  className?: string;
  locale?: string;
};

const STAR = "M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z";

export const ReviewStars = ({ value, className }: { value: number; className?: string }) => (
  <span className="flex items-center gap-0.5" role="img" aria-label={`${value.toFixed(1)} / 5`}>
    {[0, 1, 2, 3, 4].map((i) => (
      <svg key={i} viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={cn("size-4 shrink-0", i < Math.round(value) ? "text-yellow-400" : "text-zinc-300 dark:text-zinc-700", className)}>
        <path fillRule="evenodd" d={STAR} clipRule="evenodd" />
      </svg>
    ))}
  </span>
);

/** Approved product reviews as a grid of cards, with an optional average rating. Reviews show no dates. */
export const ThemeShopReviewsBlock = async ({ id, eyebrow, heading, description, source, products, limit, showSummary, className, locale }: Props) => {
  const { reviews, average } = await getBlockReviews({ source, products, limit });
  if (reviews.length === 0) return null;
  const __ = await createTranslator(locale);

  return (
    <section id={id || undefined} className={cn("container mt-16 sm:mt-28 lg:mt-40", className)}>
      <div className="max-w-2xl mx-auto text-center">
        {eyebrow && <p className="font-medium uppercase text-xs/6 text-zinc-500 dark:text-zinc-400">{eyebrow}</p>}
        {heading && <h2 className="mt-2 text-3xl font-medium sm:text-4xl text-zinc-900 dark:text-white">{heading}</h2>}
        {description && <p className="mt-4 text-zinc-500 dark:text-zinc-400 text-sm/6">{description}</p>}
        {showSummary !== false && (
          <div className="flex items-center justify-center gap-3 mt-6">
            <span className="text-3xl font-medium tabular-nums text-zinc-900 dark:text-white">{average.toFixed(1)}</span>
            <ReviewStars value={average} />
            <span className="text-sm text-zinc-500 dark:text-zinc-400">
              {reviews.length} {reviews.length === 1 ? __("review") : __("reviews")}
            </span>
          </div>
        )}
      </div>
      <div className="grid grid-cols-1 gap-5 mt-10 sm:grid-cols-2 lg:grid-cols-3">
        {reviews.map((review) => (
          <article key={review.id} dir="auto" className="flex flex-col p-6 bg-white border sm:p-8 border-zinc-100 dark:bg-zinc-900 dark:border-zinc-800">
            <ReviewStars value={review.rating || 0} />
            {review.title && <h3 className="mt-4 font-medium text-zinc-900 dark:text-white">{review.title}</h3>}
            <p className="mt-2 text-zinc-600 dark:text-zinc-400 text-sm/6">{review.content}</p>
            <p className="pt-6 mt-auto font-medium text-sm/6 text-zinc-900 dark:text-white">{review.author}</p>
          </article>
        ))}
      </div>
    </section>
  );
};
