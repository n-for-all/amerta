import { getMeCustomer } from "@/amerta/utilities/getMeCustomer";
import { ReactNode } from "react";
import { AccountSidebar } from "@/amerta/theme/components/Account/AccountSidebar";
import { getURL } from "@/amerta/utilities/getURL";

export default async function AccountLayout({ children, params }: { children: ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  await getMeCustomer({
    unverifiedUserRedirect: `${getURL("/login", locale)}?error=${encodeURIComponent("Your account is not verified.")}&redirect=${encodeURIComponent(`${getURL("/account", locale)}`)}&errorType=unverified`,
    nullUserRedirect: `${getURL("/login", locale)}`,
  });

  return (
    <div className="container">
      <div className="w-full">
        <h2 className="mt-8 mb-4 text-2xl font-semibold sr-only">My Account</h2>
        <div className="flex flex-col items-start mx-auto md:flex-row">
          <AccountSidebar locale={locale} />
          <main className="flex-1 w-full md:py-8 md:pl-8 md:border-l md:border-border min-h-[500px] md:border-zinc-200 dark:md:border-zinc-800 rtl:md:pl-0 rtl:md:pr-8 rtl:md:border-l-0 rtl:md:border-r"> {children}</main>
        </div>
      </div>
    </div>
  );
}
