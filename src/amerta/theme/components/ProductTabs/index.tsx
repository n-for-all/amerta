"use client";

import { useState } from "react";
import { Product, ProductReview } from "@/payload-types";
import ProductReviewForm from "@/amerta/theme/components/ProductReviewForm";
import Reviews from "@/amerta/theme/components/Reviews";
import { ImageOrPlaceholder } from "@/amerta/theme/components/Thumbnail";
import RichText from "@/amerta/theme/components/RichText";
import { useEcommerce } from "@/amerta/theme/providers/EcommerceProvider";

type TabType = "about" | "reviews" | "benefits" | "faqs";

interface ProductTabsProps {
  product: Product;
  reviews?: ProductReview[];
}

export default function ProductTabs({ product, reviews }: ProductTabsProps) {
  const [activeTab, setActiveTab] = useState<TabType>("about");
  const { locale } = useEcommerce();

  let tabs = [
    { id: "about" as TabType, label: "About" },
    { id: "reviews" as TabType, label: "Reviews" },
    { id: "benefits" as TabType, label: "Benefits" },
    { id: "faqs" as TabType, label: "FAQs" },
  ];

  tabs = tabs.filter((tab) => {
    if (tab.id === "benefits") {
      return product.showBenefits && product.benefits && product.benefits.length > 0;
    }
    if (tab.id === "faqs") {
      return product.showFAQs && product.faqs && product.faqs.length > 0;
    }
    return true;
  });
  return (
    <>
      <div className="flex justify-center w-full gap-4 p-1 rounded-full bg-zinc-50">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full rounded-full focus-visible:outline-none transition-colors ${activeTab === tab.id ? "bg-zinc-900 text-white" : "text-zinc-900 hover:bg-zinc-100"}`}>
            <p data-slot="text" className="py-4 uppercase text-sm/6">
              {tab.label}
            </p>
          </button>
        ))}
      </div>

      <div className="mt-10 lg:mt-16">
        <div className="max-w-none">
          {/* About Tab */}
          {activeTab === "about" && (
            <div className="flex flex-col-reverse justify-between gap-14 lg:flex-row lg:gap-12 xl:gap-20 2xl:gap-32">
              <div className="relative flex flex-3/7" style={{ height: "530px" }}>
                <ImageOrPlaceholder alt={product.title} image={product.images && product.images[0] ? product.images[0] : undefined} className="object-cover w-full h-full" />
              </div>
              <div className="flex flex-col gap-5 flex-4/7 lg:gap-10 2xl:gap-14">
                <h2 className="text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none text font-medium">
                  <span>Details &amp;</span>
                  <br />
                  <span className="font-serif italic">features</span>
                </h2>
                <div className="max-w-xl leading-relaxed">
                  <div className="space-y-8">
                    {product.description && (
                      <div>
                        <RichText data={product.description} locale={locale} />
                      </div>
                    )}
                    {product.showProductDetails && product.productDetails && product.productDetails.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm uppercase text-zinc-500">Product Details</p>
                        <ul className="list-inside list-disc *:marker:text-zinc-300">
                          {product.productDetails.map((item: any, idx: number) => (
                            <li key={idx}>{item.detail}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {product.showProductFeatures && product.productFeatures && product.productFeatures.length > 0 && (
                      <div>
                        <p className="mb-3 text-sm uppercase text-zinc-500">Product Features</p>
                        <ul className="list-inside list-disc *:marker:text-zinc-300">
                          {product.productFeatures.map((item: any, idx: number) => (
                            <li key={idx}>{item.feature}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <div className="max-w-2xl mx-auto lg:max-w-7xl">
              <Reviews reviews={reviews} />
              <div className="mt-12">
                <ProductReviewForm productId={product.id} />
              </div>
            </div>
          )}

          {/* Benefits Tab */}
          {activeTab === "benefits" && product.showBenefits && product.benefits && product.benefits.length > 0 ? (
            <div className="flex flex-col-reverse justify-between gap-14 lg:flex-row lg:gap-12 xl:gap-20 2xl:gap-32">
              <div className="relative flex flex-3/7" style={{ height: "530px" }}>
                <ImageOrPlaceholder image={null} className="object-cover w-full h-full" />
              </div>
              <div className="flex flex-col gap-5 flex-4/7 lg:gap-10 2xl:gap-14">
                <h2 className="text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none text font-medium">
                  <span>Key</span>
                  <br />
                  <span className="font-serif italic">benefits</span>
                </h2>
                <div className="max-w-xl leading-relaxed">
                  <div className="space-y-6">
                    {product.benefits.map((benefit: any, idx: number) => (
                      <div key={idx} className="flex gap-4">
                        <div className="flex items-center justify-center flex-shrink-0 w-6 h-6 text-sm font-bold text-white rounded-full bg-zinc-900">{benefit.icon || "✓"}</div>
                        <div>
                          <h3 className="mb-1 font-semibold text-zinc-900">{benefit.title}</h3>
                          <p className="text-sm text-zinc-600">{benefit.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}

          {/* FAQs Tab */}
          {activeTab === "faqs" && product.showFAQs && product.faqs && product.faqs.length > 0 ? (
            <div className="flex flex-col-reverse justify-between gap-14 lg:flex-row lg:gap-12 xl:gap-20 2xl:gap-32">
              <div className="relative flex flex-3/7" style={{ height: "530px" }}>
                <ImageOrPlaceholder image={null} className="object-cover w-full h-full" />
              </div>
              <div className="flex flex-col gap-5 flex-4/7 lg:gap-10 2xl:gap-14">
                <h2 className="text-[2rem] sm:text-4xl xl:text-[2.5rem] leading-none text font-medium">
                  <span>Frequently</span>
                  <br />
                  <span className="font-serif italic">asked questions</span>
                </h2>
                <div className="max-w-xl leading-relaxed">
                  <div className="space-y-6">
                    {product.faqs.map((faq: any, idx: number) => (
                      <div key={idx} className={idx === (product.faqs as any[]).length - 1 ? "pb-4" : "pb-4 border-b border-zinc-200"}>
                        <h3 className="mb-2 font-semibold text-zinc-900">{faq.question}</h3>
                        <p className="text-sm text-zinc-600">{faq.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}
