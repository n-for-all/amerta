"use client";

import { useState } from "react";
import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import { FormBlock } from "@/amerta/components/Form/Component";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";

interface ProductReviewFormProps {
  productId: string;
  /** Themes: wrapper around the button / form, and the look of the "Write a Review" and "Submit Review" buttons */
  className?: string;
  buttonClassName?: string;
}

const defaultButtonClassName = "inline-flex items-center justify-center px-6 py-3 text-sm font-medium uppercase transition-colors bg-white border rounded-full border-zinc-900 text-zinc-900 hover:bg-zinc-50";

export default function ProductReviewForm({ productId, className, buttonClassName }: ProductReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { __ } = useEcommerce();

  // Mock form structure - this would ideally come from Payload CMS
  const reviewForm: FormType = {
    id: "product-review-form",
    title: "Product Review",
    submitButtonLabel: __("Submit Review"),
    confirmationType: "message",
    emails: [], // we will manage this field from the endpoint
    confirmationMessage: __("Thank you for your review! Your review will be displayed after moderation.") as any,
    fields: [
      {
        name: "rating",
        label: __("How would you rate this product?"),
        width: 100,
        required: true,
        blockType: "rating",
      } as any,
      {
        type: "row",
        className: "grid grid-cols-1 gap-4 mb-4 md:grid-cols-2 last:mb-0",
        fields: [
          {
            className: "flex-1",
            name: "author",
            placeholder: __("Your Name..."),
            required: true,
            blockType: "text",
          } as any,
          {
            name: "email",
            placeholder: __("Email Address (optional)"),
            required: false,
            blockType: "email",
          } as any,
        ],
      },
      {
        name: "title",
        placeholder: __("Review Title (optional)"),
        width: 100,
        required: false,
        blockType: "text",
      } as any,
      {
        name: "content",
        placeholder: __("Your Review"),
        width: 100,
        required: true,
        blockType: "textarea",
      } as any,
    ] as any,
  };

  if (!isOpen) {
    return (
      <div className={className ?? "mt-8"}>
        <button onClick={() => setIsOpen(true)} className={buttonClassName ?? defaultButtonClassName}>
          {__("Write a Review")}
        </button>
      </div>
    );
  }

  return (
    <div className={className ? `${className} pt-8` : "pt-8 mt-8"}>
      <div className="mb-4">
        <button onClick={() => setIsOpen(false)} className="text-sm text-zinc-500 hover:text-zinc-700">
          {__("← Back to Reviews")}
        </button>
      </div>
      <FormBlock
        id="product-review-form"
        enableIntro={false}
        action={`/api/product-reviews/submit?productId=${productId}`}
        className="w-full"
        form={reviewForm as any}
        renderSubmitButton={(formId, label, { isLoading, hasSubmitted }) => (
          <button disabled={isLoading || hasSubmitted} form={formId} className={buttonClassName ? `mt-6 ${buttonClassName} disabled:opacity-50` : "mt-4"} type="submit">
            {isLoading ? __("Submitting...") : label || __("Submit Review")}
          </button>
        )}
      />
    </div>
  );
}
