/**
 * @module Collections/Orders/Hooks
 * @title Populate Order Data Hook
 * @description This hook populates additional order data before creating or updating an order. It generates order IDs, populates payment and shipping method names, and resolves country and product details.
 */

import { APIError, CollectionBeforeChangeHook } from "payload";

export const populateOrderData: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if ((operation === "create" || operation === "update") && req.payload) {
    // Generate Order ID only on create
    if (operation === "create") {
      const ecommerceSettings = await req.payload.findGlobal({
        slug: "ecommerce-settings",
      });

      const orderIdTemplate = ecommerceSettings?.orderIdTemplate || "ORD-{YYYY}{MM}{DD}-{COUNTER}";
      const startOrderIdFrom = ecommerceSettings?.startOrderIdFrom || 1000;

      const now = new Date();
      const year = now.getFullYear().toString();
      const month = (now.getMonth() + 1).toString().padStart(2, "0");
      const day = now.getDate().toString().padStart(2, "0");

      // Get the last order's counter
      const lastOrder = await req.payload.find({
        collection: "orders",
        limit: 1,
        sort: "-orderCounter",
      });

      let counter = startOrderIdFrom;
      if (lastOrder.docs.length > 0 && lastOrder.docs[0]!.orderCounter) {
        counter = lastOrder.docs[0]!.orderCounter + 1;
      }

      // Replace template variables
      const orderId = orderIdTemplate.replace("{YYYY}", year).replace("{MM}", month).replace("{DD}", day).replace("{COUNTER}", counter.toString().padStart(4, "0"));

      data.orderId = orderId;
      data.orderCounter = counter;
    }

    // Populate payment method name
    if (data.paymentMethod) {
      const paymentMethod = await req.payload.findByID({
        collection: "payment-method",
        id: data.paymentMethod,
      });
      if (!paymentMethod) throw new APIError("The payment method is invalid", 400);
      data.paymentMethodName = paymentMethod.name || paymentMethod.label;
    }

    // Populate shipping method name
    if (data.shippingMethod) {
      const shippingMethod = await req.payload.findByID({
        collection: "shipping",
        id: data.shippingMethod,
      });

      if (!shippingMethod) throw new APIError("The shipping method is invalid", 400);

      data.shippingMethodName = shippingMethod.name || shippingMethod.label;
    }

    // Populate country name in address
    if (data.address && data.address.country) {
      const country = await req.payload.findByID({
        collection: "country",
        id: data.address.country,
      });

      if (country) {
        data.address.countryName = country.name;
      }
    }

    // Populate product names, SKUs, and variant text
    if (data.items && Array.isArray(data.items)) {
      for (const item of data.items) {
        if (item.product) {
          try {
            const product = await req.payload.findByID({
              collection: "products",
              id: typeof item.product === "string" ? item.product : item.product.id,
              depth: 0,
            });

            item.productName = product.title;
            item.productSKU = product.sku || "";

            // Build variant text from variantOptions
            if (item.metaData && Array.isArray(item.metaData)) {
              const variantParts: string[] = [];
              for (const opt of item.metaData) {
                if (opt.option && opt.value) {
                  // Fetch option name
                  try {
                    const optionDoc = await req.payload.findByID({
                      collection: "product-options",
                      id: typeof opt.option === "string" ? opt.option : opt.option.id,
                    });
                    variantParts.push(`${optionDoc.name}: ${opt.value}`);
                  } catch {
                    throw new APIError("This product option is invalid", 400);
                  }
                }
              }
              item.variantText = variantParts.join(", ");
            }
          } catch (e) {
            console.error(e);
            throw new APIError("This product is invalid", 400);
          }
        }
      }
    }

    // Calculate subtotal from items
    let calculatedSubtotal = 0;
    if (data.items && Array.isArray(data.items)) {
      calculatedSubtotal = data.items.reduce((sum, item) => {
        const price = item.price || 0;
        const quantity = item.quantity || 0;
        return sum + price * quantity;
      }, 0);
    }
    data.subtotal = calculatedSubtotal;

    // Calculate total: subtotal - discount + shipping
    const discount = data.discountTotal || 0;
    const shipping = data.shippingTotal || 0;
    const tax = data.tax || 0;
    data.total = calculatedSubtotal - discount + shipping + tax;

    data.customerTotal = data.total * (data.exchangeRate! || 1);
  }
  return data;
};
