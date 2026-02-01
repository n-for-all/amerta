import { notFound } from "next/navigation";
import { getPayload } from "payload";
import config from "@payload-config";
import { decryptSignature } from "@/amerta/theme/utilities/decrypt-signature";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { OrderReceived } from "@/amerta/theme/components/OrderReceived";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { cookies } from "next/headers";

export default async function OrderReceivedPage({ params }: { params: Promise<{ orderKey: string; locale: string }> }) {
  const { orderKey, locale } = await params;
  const decryptedOrderKey = decryptSignature(decodeURIComponent(orderKey));
  if (!decryptedOrderKey) return notFound();

  const cookiesInstance = await cookies();
  const cartIdCookie = cookiesInstance.get("cartId")?.value;
  if (!cartIdCookie || !cartIdCookie.startsWith("cart_")) {
    return Response.json({ items: [] }, { status: 200 });
  }

  const decryptedOrderExpiry = decryptedOrderKey.split(":")[1];
  if (decryptedOrderExpiry && Date.now() > parseInt(decryptedOrderExpiry, 10)) {
    return (
      <div className="p-20 text-center text-red-600">
        <h1 className="text-2xl font-bold">Invalid or Expired Link</h1>
        <p>Please check your email for the order confirmation.</p>
      </div>
    );
  }

  const payload = await getPayload({ config });
  const orderData = decryptedOrderKey.split(":")[0]!;
  const splitIndex = orderData.lastIndexOf("__");
  const orderId = orderData.substring(0, splitIndex);
  const publicOrderId = orderData.substring(splitIndex + 2);

  const {
    docs: [order],
  } = await payload.find({
    collection: "orders",
    where: { id: { equals: orderId }, orderId: { equals: publicOrderId } },
    depth: 3, // Important: Depth 2 to populate 'orderedBy' relation
    overrideAccess: true,
  });

  if (!order) return notFound();
  const {
    docs: [payment],
  } = await payload.find({
    collection: "payments",
    where: { order: { equals: orderId } },
    depth: 2,
    limit: 1,
    overrideAccess: true,
  });

  let customerEmail = "";
  const customerName = `${order.address?.firstName} ${order.address?.lastName}`;
  //   const country = typeof order.address?.country === "string" ? order.address?.country : order.address?.country?.name || "";
  const customer = order.orderedBy; // Cast to access fields

  if (customer && typeof customer === "object") {
    if (customer.hasAccount === "0") {
      customerEmail = customer.contact_email!; // Assuming guest email is stored on the customer record
    } else {
      customerEmail = customer.email;
    }
  }

  const salesChannel = await getSalesChannel();

  const paymentGateway = payment?.gateway || (typeof order.paymentMethod === "object" ? order.paymentMethod.type : "");
  const isCOD = paymentGateway === "cod";
  const currency = getDefaultCurrency(salesChannel!);
  return <OrderReceived initialOrder={order} initialPayment={payment} customerEmail={customerEmail} customerName={customerName} locale={locale} currency={currency} isCOD={isCOD} orderKey={orderKey} />;
}
