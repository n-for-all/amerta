"use client";

import { useState } from "react";
import type { Form as FormType } from "@payloadcms/plugin-form-builder/types";
import { FormBlock } from "@/amerta/components/Form/Component";

interface ProductReviewFormProps {
  productId: string;
}

export default function ProductReviewForm({ productId }: ProductReviewFormProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Mock form structure - this would ideally come from Payload CMS
  const reviewForm: FormType = {
    id: "product-review-form",
    title: "Product Review",
    submitButtonLabel: "Submit Review",
    confirmationType: "message",
    emails: [], // we will manage this field from the endpoint
    confirmationMessage: "Thank you for your review! Your review will be displayed after moderation.",
    fields: [
      {
        name: "rating",
        label: "How would you rate this product?",
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
            placeholder: "Your Name...",
            required: true,
            blockType: "text",
          } as any,
          {
            name: "email",
            placeholder: "Email Address, ex: user@example.com",
            required: true,
            blockType: "email",
          } as any,
        ],
      },
      {
        name: "content",
        placeholder: "Your Review",
        width: 100,
        required: true,
        blockType: "textarea",
      } as any,
    ] as any,
  };

  if (!isOpen) {
    return (
      <div className="mt-8">
        <button onClick={() => setIsOpen(true)} className="inline-flex items-center justify-center px-6 py-3 text-sm font-medium uppercase transition-colors bg-white border rounded-full border-zinc-900 text-zinc-900 hover:bg-zinc-50">
          Write a Review
        </button>
      </div>
    );
  }

  return (
    <div className="pt-8 mt-8">
      <div className="mb-4">
        <button onClick={() => setIsOpen(false)} className="text-sm text-zinc-500 hover:text-zinc-700">
          ← Back to Reviews
        </button>
      </div>
      <FormBlock
        id="product-review-form"
        enableIntro={false}
        action={`/api/product-reviews/submit?productId=${productId}`}
        className="w-full"
        form={reviewForm as any}
        renderSubmitButton={(formId, label, { isLoading, hasSubmitted }) => (
          <button disabled={isLoading || hasSubmitted} form={formId} className="mt-4" type="submit">
            {isLoading ? "Submitting..." : label || "Submit Review"}
          </button>
        )}
      />
    </div>
  );
}
