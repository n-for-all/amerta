import { getCustomerOrders } from "@/amerta/theme/utilities/get-customer-orders";
import { getMeCustomer } from "@/amerta/utilities/getMeCustomer";
import OrdersTable from "../OrdersTable";
import { Button } from "@/amerta/theme/ui/button";
import Link from "next/link";
import { getURL } from "@/amerta/utilities/getURL";
import { createTranslator } from "@/amerta/theme/utilities/translation";

const AccountDashboard = async ({ locale }) => {
  //count user order
  const { user } = await getMeCustomer({
    nullUserRedirect: getURL(`/login`, locale),
    unverifiedUserRedirect: getURL(`/login`, locale) + `?error=${encodeURIComponent("Your account is not verified.")}&redirect=${encodeURIComponent(getURL(`/account`, locale))}&errorType=unverified`,
  });

  const { totalDocs } = await getCustomerOrders(user!.id);
  const __ = await createTranslator(locale);

  return (
    <>
      <div className="mb-10 space-y-6">
        <div>
          <h1 className="mb-2 text-3xl font-bold">{__("Dashboard")}</h1>
          <p className="text-muted-foreground">{__("Welcome to your account dashboard")}</p>
        </div>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="p-6 text-center border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-1 text-sm text-muted-foreground">{__("Total Purchases")}</p>
            <p className="text-3xl font-bold">{totalDocs || 0}</p>
          </div>
          <div className="p-6 text-center border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-1 text-sm text-muted-foreground">{__("Member Since")}</p>
            <p className="text-lg font-semibold">{user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : "N/A"}</p>
          </div>
          <div className="p-6 text-center border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="mb-1 text-sm text-muted-foreground">{__("Email")}</p>
            <p className="text-sm font-semibold truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between mb-2 ">
        <h3 className="text-sm font-medium">{__("Recent Orders")}</h3>
        <Button variant="link" asChild>
          <Link href={getURL(`/account/orders`, locale)}>{__("View All")}</Link>
        </Button>
      </div>
      <OrdersTable customerId={user!.id} locale={locale} recentOnly={true} />
    </>
  );
};

export default AccountDashboard;
