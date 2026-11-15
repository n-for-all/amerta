import { Metadata } from "next";
import { LogoutPage } from "@/amerta/theme/components/LogoutPage";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";



export default async function Logout({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <LogoutPage locale={locale} />;
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "logoutPage", locale, type: "logout" });
  return metaData;
}
