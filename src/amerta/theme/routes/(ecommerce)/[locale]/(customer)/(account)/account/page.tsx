import React, { Fragment } from "react";
import { Metadata } from "next";
import AccountDashboard from "@/amerta/theme/components/Account/AccountDashboard";
import { RenderParams } from "@/amerta/components/RenderParams";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";

export default async function Account({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return (
    <Fragment>
      <RenderParams />
      <AccountDashboard locale={locale} />
    </Fragment>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "accountPage", locale, type: "account" });
  return metaData;
}
