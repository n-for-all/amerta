/**
 * @module Collections/Products/Handlers
 * @title Submit Review Handler
 * @description This module defines the handlers related to the products collections in Amerta, specifically the submit review handler that processes review submissions, validates the data, updates product ratings, and triggers email notifications if enabled.
 */

import { getProductById } from "@/amerta/theme/utilities/get-product-by-id";
import { PayloadRequest } from "payload";
import z from "zod";

const ReviewSubmissionSchema = z.object({
  submissionData: z.array(
    z.object({
      field: z.string(),
      value: z.any(),
    }),
  ),
});

export const submitReview = async (req: PayloadRequest) => {
  try {
    const body = await req.json!();

    // Validate base structure
    const validated = ReviewSubmissionSchema.parse(body);

    // Extract fields into an object
    const formData: Record<string, any> = {};
    for (const item of validated.submissionData) {
      formData[item.field] = item.value;
    }

    // Validate individual fields with detailed errors
    const author = z.string().min(2, "Author must be at least 2 characters").parse(formData.author);
    const email = z.string().email("Invalid email address").parse(formData.email);
    const ratingValue = parseFloat(formData.rating);
    const rating = z.number().min(1, "Rating must be at least 1 star").max(5, "Rating cannot exceed 5 stars").parse(ratingValue);
    const content = z.string().min(10, "Review content must be at least 10 characters").parse(formData.content);

    const url = new URL(req.url || "");
    const productId = url.searchParams.get("productId");

    if (!productId) {
      return Response.json(
        {
          success: false,
          error: "Product ID is required",
        },
        { status: 400 },
      );
    }

    const product = await getProductById({ id: productId });
    if (!product) {
      return Response.json(
        {
          success: false,
          error: "Product is not found",
        },
        { status: 400 },
      );
    }

    const oldRating = product.rating || 0;
    const oldReviewCount = product.reviewCount || 0;

    const newReviewCount = oldReviewCount + 1;
    const newRating = (oldRating * oldReviewCount + rating) / newReviewCount;

    await req.payload.update({
      collection: "products",
      id: productId,
      data: {
        rating: newRating,
        reviewCount: newReviewCount,
      },
    });

    const savedReview = await req.payload.create({
      collection: "product-reviews",
      data: {
        product: productId,
        author,
        email,
        rating,
        content,
        status: "pending",
        verified: false,
      },
    });

    // Get settings for email notifications
    const settings = await req.payload.findGlobal({
      slug: "settings",
    });

    if (settings?.reviewNotificationsEnabled && settings?.reviewNotificationEmails && settings?.reviewNotificationEmails.length > 0) {
      const productName = product.title || "Unknown Product";
      const lexicalToText = (lexicalDoc: any): string => {
        if (!lexicalDoc || !lexicalDoc.root || !lexicalDoc.root.children) {
          return "";
        }

        const extractText = (children: any[]): string => {
          return children
            .map((child: any) => {
              if (child.type === "paragraph" || child.type === "heading") {
                return extractText(child.children || []);
              }
              if (child.type === "text") {
                return child.text || "";
              }
              return "";
            })
            .join("\n");
        };

        return extractText(lexicalDoc.root.children);
      };

      let emailContent = lexicalToText(settings.reviewNotificationTemplate);
      const placeholders: Record<string, string> = {
        "{productName}": productName,
        "{reviewAuthor}": author,
        "{reviewRating}": String(rating),
        "{reviewContent}": content,
        "{timestamp}": new Date().toLocaleString(),
      };

      Object.entries(placeholders).forEach(([key, value]) => {
        emailContent = emailContent.replace(new RegExp(key, "g"), value);
      });

      console.log(emailContent);
      if (settings.reviewNotificationEmails) {
        for (const recipient of settings.reviewNotificationEmails) {
          console.log(`📧 Email would be sent to: ${recipient.email}`);
          console.log(`   Subject: New Product Review for ${productName}`);
          console.log(`   Body:\n${emailContent}\n`);
        }
      }

      console.log("✓ Notification emails prepared");
    } else {
      console.log("⊘ Review notifications not enabled or no email addresses configured");
    }

    return Response.json(
      {
        success: true,
        message: "Form submission received and review saved",
        data: {
          author,
          email,
          rating,
          content,
          reviewId: savedReview.id,
        },
      },
      { status: 200 },
    );
  } catch (error) {
    console.error("Form submission error:", error);

    if (error instanceof z.ZodError) {
      return Response.json(
        {
          success: false,
          error: "Validation failed",
          errors: [{ message: z.prettifyError(error) }],
        },
        { status: 402 },
      );
    }

    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
        errors: [{ message: error instanceof Error ? error.message : "Unknown error occurred" }],
      },
      { status: 500 },
    );
  }
};
