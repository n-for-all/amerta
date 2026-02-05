import { Order } from "@/payload-types";
import { PaymentMethod } from "@/amerta/theme/types";

export interface PaymentHandle {
  validate: () => Promise<boolean>;
  confirm: (orderId: string) => Promise<{ success: boolean; redirectUrl: string } | void>;
}

export interface PaymentGatewayProps {
  method: PaymentMethod;
  orderId?: string;
  amount: number;
  currencyCode: string;
  paymentRef: React.Ref<PaymentHandle>;
  onError: (msg: string) => void;
  onValid: () => void;
  countryCode?: string;
  locale: string;
}
