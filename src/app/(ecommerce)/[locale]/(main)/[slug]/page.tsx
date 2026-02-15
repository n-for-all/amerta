import React from "react";
import { Metadata } from "next";
import { draftMode } from "next/headers";
import { notFound } from "next/navigation";

import { type Page } from "@/payload-types";
import { Blocks } from "@/amerta/theme/blocks/Blocks";
import { generateMeta } from "@/amerta/utilities/generateMeta";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { LivePreviewListener } from "@/amerta/components/LivePreviewListener";
import { LOCALES } from "@/amerta/localization/locales";
import { getPageBySlug } from "@/amerta/theme/utilities/get-page-by-slug";
import { getHomePage } from "@/amerta/theme/utilities/get-homepage";

export default async function Page({ params: pageParams }: { params: Promise<{ slug: string; locale?: string }> }) {
  const { isEnabled: draft } = await draftMode();

  const { slug, locale } = await pageParams;

  let url = "/" + (slug || "");

  let page: Page | null = null;

  try {
    if (!slug || slug === "" || slug === "/") {
      page = await getHomePage(locale);
      url = "/";
    } else {
      page = await getPageBySlug({
        locale,
        slug,
      });
    }
  } catch (error) {
    console.error(error);
  }

  if (!page) {
    return notFound();
  }

  const { layout } = page;

  return (
    <React.Fragment>
      {draft && <LivePreviewListener />}
      <Blocks blocks={layout} params={{ slug, locale }} />
    </React.Fragment>
  );
}

export async function generateStaticParams() {
  const payload = await getPayload({ config: configPromise });
  const pages = await payload.find({
    collection: "pages",
    draft: false,
    limit: 1000,
    overrideAccess: false,
    pagination: false,
    where: {
      _status: { equals: "published" },
    },
    select: {
      slug: true,
      isFrontPage: true,
    },
  });

  const params: { locale: string; slug: string }[] = [];

  pages.docs?.forEach((doc) => {
    if (doc.isFrontPage) return;

    // For every page, generate a route for EVERY locale
    LOCALES.forEach(({ code }) => {
      params.push({
        slug: doc.slug!,
        locale: code, // 👈 Explicitly define the locale
      });
    });
  });

  return params;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; locale: string }> }): Promise<Metadata> {
  const { slug, locale } = await params;
  let page: Page | null = null;

  try {
    if (!slug || slug === "" || slug === "/") {
      page = await getHomePage(locale);
    } else {
      page = await getPageBySlug({
        slug,
        locale,
      });
    }
  } catch {
    return {};
  }

  return generateMeta({ doc: page, type: "page", locale });
}
