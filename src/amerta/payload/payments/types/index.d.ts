import { PaymentMethod } from "@/payload-types";

export type PaymentResult =
  | {
      status: "success";
      transactionId: string;
    }
  | {
      status: "redirect";
      url: string;
      sessionId?: string;
    }
  | {
      status: "pending";
      message: string;
      transactionId: string;
    };

export interface PaymentAdapter {
  slug: string;
  label: string;

  settingsFields: Field[];

  onSaveSettings: (args: { data: Partial<PaymentMethod>; operation: CreateOrUpdateOperation; originalDoc?: T; req: PayloadRequest }) => Promise<any>;

  executeAction: (actionName: string, actionData: { amount: number; orderId?: string; currencyCode?: string; [key: string]: any }, method: PaymentMethod) => Promise<any>;

  handleWebhook?: (req: PayloadRequest) => Promise<Response>;
}
