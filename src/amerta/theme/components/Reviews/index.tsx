"use client";

import { ProductReview } from "@/payload-types";
import { useEcommerce } from "../../providers/EcommerceProvider";

interface ReviewsProps {
  reviews?: ProductReview[];
}

export default function Reviews({ reviews }: ReviewsProps) {
  const { __ } = useEcommerce();
  return (
    <>
      <h2 className="text-lg font-medium text-zinc-900">{reviews?.length || 0} Reviews</h2>
      <div className="mt-6 border-t border-b divide-y divide-zinc-900/10 border-zinc-900/10">
        {reviews && reviews.length > 0 ? (
          reviews.map((review: any, idx: number) => (
            <div key={idx} className="py-10 lg:grid lg:grid-cols-12 lg:gap-x-8">
              <div className="lg:col-span-8 lg:col-start-5 xl:col-span-9 xl:col-start-4 xl:grid xl:grid-cols-3 xl:items-start xl:gap-x-8">
                <div className="flex items-center xl:col-span-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true" className={`size-5 shrink-0 ${i < Math.floor(review.rating || 5) ? "text-yellow-400" : "text-gray-300"}`}>
                        <path
                          fillRule="evenodd"
                          d="M10.868 2.884c-.321-.772-1.415-.772-1.736 0l-1.83 4.401-4.753.381c-.833.067-1.171 1.107-.536 1.651l3.62 3.102-1.106 4.637c-.194.813.691 1.456 1.405 1.02L10 15.591l4.069 2.485c.713.436 1.598-.207 1.404-1.02l-1.106-4.637 3.62-3.102c.635-.544.297-1.584-.536-1.65l-4.752-.382-1.831-4.401Z"
                          clipRule="evenodd"
                        />
                      </svg>
                    ))}
                  </div>
                  <p className="ml-3 text-sm text-zinc-700">
                    {review.rating || 5}
                    <span className="sr-only"> out of 5 stars</span>
                  </p>
                </div>
                <div className="mt-4 lg:mt-6 xl:col-span-2 xl:mt-0">
                  <h3 className="text-sm font-medium text-zinc-900">{review.title}</h3>
                  <div className="mt-3 space-y-6 text-sm text-zinc-500">
                    <p>{review.content}</p>
                  </div>
                </div>
              </div>
              <div className="flex items-center mt-6 text-sm lg:col-span-4 lg:col-start-1 lg:row-start-1 lg:mt-0 lg:flex-col lg:items-start xl:col-span-3">
                <p className="font-medium capitalize text-zinc-900">{review.author}</p>
                <time dateTime={new Date(review.createdAt).toISOString().split("T")[0]} className="pl-4 ml-4 border-l border-zinc-200 text-zinc-500 lg:mt-2 lg:ml-0 lg:border-0 lg:pl-0">
                  {new Date(review.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                </time>
              </div>
            </div>
          ))
        ) : (
          <div className="py-10 text-center">
            <p className="text-zinc-500">{__("No reviews yet. Be the first to review this product!")}</p>
          </div>
        )}
      </div>
    </>
  );
}
