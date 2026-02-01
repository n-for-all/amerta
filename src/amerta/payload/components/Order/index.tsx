import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { OrderDetails } from "./Details";
import { OrderItems } from "./Items";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";

export const OrderAdmin: React.FC<any> = async () => {
  const salesChannel = await getSalesChannel();
  if (!salesChannel) return <div style={{ backgroundColor: "#00000005", padding: "1.5rem", borderRadius: "0px" }}>Please add a sales channel to view order details.</div>;
  const currency = getDefaultCurrency(salesChannel);
  return (
    <div style={{ backgroundColor: "#00000005", padding: "1.5rem", borderRadius: "0px" }}>
      <OrderDetails />
      <OrderItems currency={currency} />
    </div>
  );
};
