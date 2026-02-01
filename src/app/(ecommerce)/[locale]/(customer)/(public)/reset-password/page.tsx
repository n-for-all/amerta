import React from "react";
import { Metadata } from "next";
import { ResetPasswordForm } from "@/amerta/theme/components/ResetPasswordForm";
import { Logo } from "@/amerta/theme/blocks/common/Header/logo";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";

export default async function ResetPassword({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <div className="py-16">
      <ResetPasswordForm logo={<Logo logoClassName="flex justify-center h-10 md:h-10" locale={locale} />} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "resetPasswordPage", locale, type: "reset-password" });
  return metaData;
}
