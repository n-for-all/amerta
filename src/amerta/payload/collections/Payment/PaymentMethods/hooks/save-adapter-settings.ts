import { getPaymentAdapter } from "@/amerta/payments";
import { type CollectionBeforeChangeHook } from "payload";

export const saveAdapterSettings: CollectionBeforeChangeHook = async ({ data, req, operation, originalDoc }) => {
  if (data.type) {
    const adapter = getPaymentAdapter(data.type);
    if (adapter) {
      await adapter.onSaveSettings({ data, operation, originalDoc, req });
    }
  }
};
