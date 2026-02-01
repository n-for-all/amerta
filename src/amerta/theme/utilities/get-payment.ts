import { getPayload } from "payload";
import configPromise from "@payload-config";

export const getPaymentByOrderId = async (orderId) => {
  const payload = await getPayload({ config: configPromise });

  const payment = await payload.find({
    collection: "payments",
    where: {
      order: {
        equals: orderId,
      },
    },
    limit: 1,
  });

  return payment.docs[0];
};
