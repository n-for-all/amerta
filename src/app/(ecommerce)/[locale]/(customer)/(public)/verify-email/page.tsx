import { Metadata } from "next";
import VerifyEmail from "@/amerta/theme/components/Account/VerifyEmail";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";

export default async function VerifyEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <VerifyEmail locale={locale} />;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "verifyEmailPage", locale, type: "verify-email" });
  return metaData;
}