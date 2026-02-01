import { Metadata } from "next";

import { getMeCustomer } from "@/amerta/utilities/getMeCustomer";
import { Logo } from "@/amerta/theme/blocks/common/Header/logo";
import ResendVerificationEmail from "@/amerta/theme/components/ResendVerificationEmail";
import { getURL } from "@/amerta/utilities/getURL";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";

export default async function ResendVerificationEmailPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getMeCustomer({
    validUserRedirect: `${getURL("/account", locale)}?warning=${encodeURIComponent("You are already logged in.")}`,
  });

  return (
    <div className="py-16">
      <ResendVerificationEmail logo={<Logo logoClassName="flex justify-center h-10 md:h-10" locale={locale} />} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "resendVerificationEmailPage", locale, type: "resend-verification-email" });
  return metaData;
}