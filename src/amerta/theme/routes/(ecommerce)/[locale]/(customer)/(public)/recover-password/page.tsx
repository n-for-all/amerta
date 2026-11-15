import { Metadata } from "next";
import { RecoverPasswordForm } from "@/amerta/theme/components/RecoverPasswordForm";
import { Logo } from "@/amerta/theme/blocks/common/Header/logo";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";

export default async function RecoverPassword({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="py-16">
      <RecoverPasswordForm logo={<Logo logoClassName="flex justify-center h-10 md:h-10" locale={locale} />} locale={locale} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "recoverPasswordPage", locale, type: "recover-password" });
  return metaData;
}
