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
        <div className="flex items-start mx-auto">
          <AccountSidebar locale={locale} />
          <main className="flex-1 py-8 pl-8 border-l border-border min-h-[500px] border-zinc-200 dark:border-zinc-800 rtl:pl-0 rtl:pr-8 rtl:border-l-0 rtl:border-r"> {children}</main>
        </div>
      </div>
    </div>
  );
}
