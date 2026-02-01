import { Order } from "@/payload-types";
import { OrderDetails } from "./Details";
import { OrderItems } from "./Items";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { getPaymentByOrderId } from "@/amerta/theme/utilities/get-payment";
import { Button } from "@/amerta/theme/ui/button";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getURL } from "@/amerta/utilities/getURL";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { createTranslator } from "@/amerta/theme/utilities/translation";

export const OrderAdmin: React.FC<{ order: Order; locale: string }> = async ({ order, locale }) => {
  const salesChannel = await getSalesChannel();
  if (!salesChannel) return <div style={{ backgroundColor: "#00000005", padding: "1.5rem", borderRadius: "0px" }}>Please add a sales channel to view order details.</div>;
  const currency = getDefaultCurrency(salesChannel);
  const payment = await getPaymentByOrderId(order.id || "");
  const __ = await createTranslator(locale);
  return (
    <div>
      <OrderDetails order={order} payment={payment} locale={locale} currency={currency} />
      <OrderItems order={order} payment={payment} locale={locale} currency={currency} />
      <div className="w-full h-px my-4 bg-gray-100 dark:bg-zinc-800" />
      <Button asChild variant="outline">
        <Link href={getURL(`/account/orders`, locale)}>
          <ChevronLeft className="w-4 h-4 mr-2 rtl:rotate-180 rtl:ml-2 rtl:mr-0" />
          {__("Back to all orders")}
        </Link>
      </Button>
    </div>
  );
};
