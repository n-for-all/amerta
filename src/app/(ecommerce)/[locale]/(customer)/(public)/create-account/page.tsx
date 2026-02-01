import { Metadata } from "next";
import { getMeCustomer } from "@/amerta/utilities/getMeCustomer";
import CreateAccountForm from "@/amerta/theme/components/CreateAccountForm";
import { Logo } from "@/amerta/theme/blocks/common/Header/logo";
import { getURL } from "@/amerta/utilities/getURL";
import { generateStaticMeta } from "@/amerta/utilities/generateMeta";

export default async function CreateAccount({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getMeCustomer({
    validUserRedirect: `${getURL("/account", locale)}?warning=${encodeURIComponent("Cannot create a new account while logged in, please log out and try again.")}`,
  });

  return (
    <div className="max-w-md mx-auto my-16">
      <CreateAccountForm logo={<Logo logoClassName="flex justify-center h-10 md:h-10" locale={locale} />} />
    </div>
  );
}

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const metaData = await generateStaticMeta({ pageName: "createAccountPage", locale, type: "create-account" });
  return metaData;
}
