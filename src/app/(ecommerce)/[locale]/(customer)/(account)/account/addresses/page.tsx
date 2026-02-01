import { Fragment } from "react";
import { Metadata } from "next";
import { AddressManager } from "@/amerta/theme/components/AddressManager";
import { RenderParams } from "@/amerta/components/RenderParams";
import { Separator } from "@/amerta/theme/ui/separator";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";
import { createTranslator } from "@/amerta/theme/utilities/translation";

export default async function Account({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const __ = await createTranslator(locale);
  return (
    <Fragment>
      <RenderParams />
      <AddressManager type="shipping" title={__("Shipping Addresses")} />
      <Separator className="my-8" />
      <AddressManager type="billing" title={__("Billing Addresses")} />
    </Fragment>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "addressesPage", locale, type: "addresses" });
  return metaData;
}
