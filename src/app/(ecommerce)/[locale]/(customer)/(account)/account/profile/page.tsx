import React, { Fragment } from "react";
import { Metadata } from "next";
import ProfileForm from "@/amerta/theme/components/ProfileForm";
import { RenderParams } from "@/amerta/components/RenderParams";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";

export default async function Account() {
  return (
    <Fragment>
      <RenderParams />
      <ProfileForm />
    </Fragment>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "profilePage", locale, type: "profile" });
  return metaData;
}
