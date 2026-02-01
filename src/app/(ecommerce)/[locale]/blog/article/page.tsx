import { getURL } from "@/amerta/utilities/getURL";
import { redirect } from "next/navigation";

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  redirect(getURL(`/blog`, locale));
}