/**
 * @module Collections/PaymentMethods/Hooks
 * @title Save Adapter Settings
 * @description This module defines a hook for saving adapter settings in the Payment Methods collection in Amerta, allowing custom logic to be executed when adapter settings are saved.
 */
    
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
