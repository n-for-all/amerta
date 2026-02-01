import * as z from "zod";
import { SavedAddress } from "@/amerta/theme/components/Checkout/GuestAddressSection";

const baseOrderSchema = z.object({
  paymentMethodId: z.string(),
  deliveryMethodId: z.string(),
  cartTotal: z.number(),
  orderNote: z.string().optional(),
  locale: z.string(),
  useShippingAsBilling: z.boolean().default(true),
});

const customerOrderSchema = baseOrderSchema
  .extend({
    guest: z.literal(false).optional(),
    customerId: z.string(),
    shippingAddressId: z.string(),
    billingAddressId: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.useShippingAsBilling === false) {
        return !!data.billingAddressId;
      }
      return true;
    },
    {
      message: "Billing address is required",
      path: ["billingAddressId"],
    },
  );

const guestOrderSchema = baseOrderSchema
  .extend({
    guest: z.literal(true),
    email: z.string().email(),

    address: z.custom<SavedAddress>(),
    billingAddress: z.custom<SavedAddress>().optional(),
  })
  .refine(
    (data) => {
      if (data.useShippingAsBilling === false) {
        return !!data.billingAddress;
      }
      return true;
    },
    {
      message: "Billing address is required",
      path: ["billingAddress"],
    },
  );

export const orderSubmissionSchema = z.union([customerOrderSchema, guestOrderSchema]);

export type OrderSubmissionPayload = z.infer<typeof orderSubmissionSchema>;
