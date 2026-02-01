import { Metadata } from "next";

import { getMeCustomer } from "@/amerta/utilities/getMeCustomer";
import LoginForm from "@/amerta/theme/components/LoginForm";
import { Logo } from "@/amerta/theme/blocks/common/Header/logo";
import { getURL } from "@/amerta/utilities/getURL";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";

export default async function Login({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  await getMeCustomer({
    validUserRedirect: `${getURL("/account", locale)}`,
  });
  return (
    <div className="py-16">
      <LoginForm logo={<Logo logoClassName="flex justify-center h-10 md:h-10" locale={locale} />} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "loginPage", locale, type: "login" });
  return metaData;
}
