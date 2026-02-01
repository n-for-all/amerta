import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { getURL } from "@/amerta/utilities/getURL";
import { Metadata } from "next/dist/lib/metadata/types/metadata-interface";
import { SearchParams } from "next/dist/server/request/search-params";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(getURL(`/blog`, locale));
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ locale: string }>; searchParams: Promise<SearchParams> }): Promise<Metadata> {
  const { locale } = await params;
  const { page } = await searchParams;

  const metaData = await generateStaticMeta({ pageName: "tagsPage", locale, type: "tags", pageNum: Number(page || 1) });
  return metaData;
}
