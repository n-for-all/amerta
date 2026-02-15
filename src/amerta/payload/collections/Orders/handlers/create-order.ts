/**
 * @module Collections/Orders/Handlers
 * @title Create Order Handler
 * @description This handler creates a new order. It validates the request, calculates shipping and tax, and processes the payment accordingly.
 */

import { Order, Product, ProductMedia } from "@/payload-types";
import { getPaymentAdapter } from "@/amerta/payments";
import { orderSubmissionSchema } from "@/amerta/theme/types/order-submission";
import { calculateShippingById } from "@/amerta/theme/utilities/calculate-shipping-by-id";
import { calculateTax } from "@/amerta/theme/utilities/calculate-tax";
import { getCart } from "@/amerta/theme/utilities/get-cart";
import { getCurrentCurrency } from "@/amerta/theme/utilities/get-current-currency";
import { getDefaultCurrency } from "@/amerta/theme/utilities/get-default-currency";
import { getExchangeRate } from "@/amerta/theme/utilities/get-exchange-rate";
import { getSalesChannel } from "@/amerta/theme/utilities/get-sales-channel";
import { isInStock } from "@/amerta/theme/utilities/is-in-stock";
import { NextResponse } from "next/server";
import { PayloadRequest } from "payload";
import { cookies } from "next/headers";

export const createOrder = async (req: PayloadRequest) => {
  try {
    const { payload } = req;
    let customerId: string | null = null;

    const salesChannel = await getSalesChannel();
    if (!salesChannel) {
      return NextResponse.json({ error: "E-commerce sales channel settings not found." }, { status: 500 });
    }

    const responseData = await req.json!();

    const validationData = orderSubmissionSchema.parse(responseData);

    let address: Order["address"] | null = null;
    let billingAddress: Order["billingAddress"] | null = null;
    if (validationData.guest) {
      const email = validationData!.email;
      //check if customer with email exists
      const customers = await payload.find({
        collection: "customers",
        where: {
          email: {
            equals: email,
          },
        },
        limit: 1,
      });

      if (customers.totalDocs > 0) {
        return NextResponse.json({ error: "You already have an account with us. Please log in to continue.", errors: { email: "You already have an account with us. Please log in to continue." } }, { status: 400 });
      }

      address = {
        firstName: validationData.address.firstName,
        lastName: validationData.address.lastName,
        address: validationData.address.address,
        street: validationData.address.street,
        apartment: validationData.address.apartment,
        building: validationData.address.building,
        floor: validationData.address.floor,
        city: validationData.address.city,
        country: validationData.address.country,
        state: validationData.address.state,
        postalCode: validationData.address.postalCode,
        phoneCountryCode: validationData.address.phoneCountryCode,
        phone: Number(validationData.address.phone),
        isDefaultShipping: true,
      };

      if (validationData.useShippingAsBilling) {
        billingAddress = address;
      } else if (validationData.billingAddress) {
        billingAddress = {
          firstName: validationData.billingAddress.firstName,
          lastName: validationData.billingAddress.lastName,
          address: validationData.billingAddress.address,
          street: validationData.billingAddress.street,
          apartment: validationData.billingAddress.apartment,
          building: validationData.billingAddress.building,
          floor: validationData.billingAddress.floor,
          city: validationData.billingAddress.city,
          country: validationData.billingAddress.country,
          state: validationData.billingAddress.state,
          postalCode: validationData.billingAddress.postalCode,
          phoneCountryCode: validationData.billingAddress.phoneCountryCode,
          phone: Number(validationData.billingAddress.phone),
          isDefaultShipping: false,
        };
      } else {
        return NextResponse.json({ error: "Billing address is required if not using shipping address as billing." }, { status: 400 });
      }
    } else {
      const customer = req.user;
      if (!customer) {
        return NextResponse.json({ error: "You must be logged in to place an order." }, { status: 401 });
      }

      if (customer && customer.collection === "customers") {
        customerId = customer.id;
        // Get the address from customer's saved addresses
        const customerData = await payload.findByID({
          collection: "customers",
          id: customerId,
        });

        if (customerData && customerData.address && Array.isArray(customerData.address.items)) {
          const savedAddress = customerData.address.items.find((addr) => addr.id === validationData.shippingAddressId);
          if (savedAddress) {
            address = {
              firstName: savedAddress.firstName,
              lastName: savedAddress.lastName,
              address: savedAddress.address,
              street: savedAddress.street,
              apartment: savedAddress.apartment,
              building: savedAddress.building,
              floor: savedAddress.floor,
              city: savedAddress.city,
              country: savedAddress.country,
              state: savedAddress.state,
              postalCode: savedAddress.postalCode,
              phoneCountryCode: savedAddress.phoneCountryCode,
              phone: savedAddress.phone,
              isDefaultShipping: savedAddress.isDefaultShipping,
            };
          } else {
            return NextResponse.json({ error: "The selected shipping address is invalid, Please select a valid address." }, { status: 400 });
          }

          const billingSavedAddress = customerData.address.items.find((addr) => addr.id === validationData.billingAddressId);
          if (billingSavedAddress) {
            billingAddress = {
              firstName: billingSavedAddress.firstName,
              lastName: billingSavedAddress.lastName,
              address: billingSavedAddress.address,
              street: billingSavedAddress.street,
              apartment: billingSavedAddress.apartment,
              building: billingSavedAddress.building,
              floor: billingSavedAddress.floor,
              city: billingSavedAddress.city,
              country: billingSavedAddress.country,
              state: billingSavedAddress.state,
              postalCode: billingSavedAddress.postalCode,
              phoneCountryCode: billingSavedAddress.phoneCountryCode,
              phone: billingSavedAddress.phone,
              isDefaultShipping: billingSavedAddress.isDefaultShipping,
            };
          } else {
            return NextResponse.json({ error: "The selected billing address is invalid, Please select a valid address." }, { status: 400 });
          }
        } else {
          return NextResponse.json({ error: "No saved addresses found for your account, Please add an address before placing an order." }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: "You session has expired, please reload the page to create a new session." }, { status: 401 });
      }
    }
    const cookiesInstance = await cookies();
    const cartId = cookiesInstance.get("cartId");
    if (!cartId) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const cart = await getCart(cartId.value, validationData.locale);
    if (!cart || !cart.items || cart.items.length === 0) {
      return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
    }

    const shipping = await calculateShippingById(validationData.deliveryMethodId, address.country, address.city, cart.subtotal);
    const currency = await getCurrentCurrency(salesChannel);
    if (!currency) {
      return NextResponse.json({ error: "Sales channel currency is not properly configured." }, { status: 500 });
    }

    const defaultCurrency = getDefaultCurrency(salesChannel);
    const exchangeRate = getExchangeRate(defaultCurrency, currency, salesChannel); // Using current currency for both params to get 1:1 rate

    const tax = await calculateTax(address.country!, cart.total);
    const total = cart.total + tax.taxAmount + shipping.total;
    const computedCartTotal = total * Number(exchangeRate || 1);

    if (total.toFixed(1) != validationData.cartTotal.toFixed(1)) {
      console.error("Cart total mismatch. Computed total:", tax.taxAmount, shipping.total, cart.total);
      return NextResponse.json({ error: `Cart total ${total.toFixed(1)} ${validationData.cartTotal.toFixed(1)} has changed, Please review your order before placing it or reload the page to update the changes.` }, { status: 400 });
    }

    if (total <= 0) {
      return NextResponse.json({ error: "Order cannot be placed at this time, Your cart is empty, Please add items to your cart before placing an order." }, { status: 400 });
    }

    const paymentMethod = await payload.findByID({
      collection: "payment-method",
      id: validationData.paymentMethodId,
    });

    if (!paymentMethod || !paymentMethod.active) {
      return NextResponse.json({ error: "The selected payment method is invalid, Please select a valid payment method." }, { status: 400 });
    }
    const paymentAdapter = await getPaymentAdapter(paymentMethod.type);
    if (!paymentAdapter) {
      return NextResponse.json({ error: "The selected payment method is not available, Please select a different payment method." }, { status: 500 });
    }

    let productIds = cart.items.map((item) => (typeof item.product === "string" ? item.product : item.product.id));
    productIds = Array.from(new Set(productIds)); //get unique ids

    const productsMap: Record<string, Product> = {};
    const products = await payload.find({
      collection: "products",
      where: {
        id: {
          in: productIds,
        },
      },
      limit: productIds.length,
    });

    products.docs.forEach((product) => {
      productsMap[product.id] = product;
    });

    const items = cart.items
      .map((item) => {
        const populatedProduct = typeof item.product === "string" ? null : item.product;
        if (!populatedProduct || populatedProduct._status !== "published") {
          return null;
        }
        const product = productsMap[populatedProduct.id];
        if (!product || !isInStock(product, item.variantOptions, item.quantity || 1)) {
          return null;
        }
        const image = product.images && product.images.length > 0 ? (product.images[0] as ProductMedia).id : null;
        return {
          product: populatedProduct.id,
          variantOptions: item.variantOptions || null,
          image,
          quantity: item.quantity || 1,
          price: populatedProduct.price || 0,
          metaData: item.variantOptions || null,
        };
      })
      .filter((itm) => itm !== null); // Remove null items

    if (cart.items.length !== items.length) {
      const unavailableProducts = cart.items
        .filter((item) => {
          const populatedProduct = typeof item.product === "string" ? null : item.product;
          if (!populatedProduct || populatedProduct._status !== "published") {
            return true;
          }
          return !populatedProduct || !isInStock(populatedProduct, item.variantOptions, item.quantity || 1);
        })
        .map((item) => {
          const product = productsMap[(item.product as Product).id];
          return product ? product.title : "Unknown Product";
        })
        .join(", ");

      return NextResponse.json({ error: `${unavailableProducts} are not available or not in stock. Please review your cart before placing the order.` }, { status: 400 });
    }

    if (validationData.guest) {
      const newCustomer = await payload.create({
        collection: "customers",
        data: {
          email: `guest_${Math.floor(Date.now()/1000)}@email.com`,
          displayName: `${validationData!.address.firstName} ${validationData!.address.lastName} - Guest`,
          contact_email: validationData!.email,
          firstName: validationData!.address.firstName,
          lastName: validationData!.address.lastName,
          password: Math.random().toString(36).slice(-8),
          hasAccount: "0",
          address: {
            items: [address, ...(billingAddress && billingAddress !== address ? [billingAddress] : [])],
          },
        },
      });
      customerId = newCustomer.id;
    }
console.log("Creating order with data:", items)
    const order = await payload.create({
      collection: "orders",
      data: {
        orderedBy: customerId!,
        status: "pending",
        discountTotal: cart.discount,
        couponCode: typeof cart.appliedCoupon === "string" ? cart.appliedCoupon : cart.appliedCoupon?.code || "",
        subtotal: cart.subtotal,
        shippingTotal: shipping.total,
        isFreeShipping: shipping.isFree,
        tax: tax.taxAmount,
        total: total,
        paymentMethod: validationData.paymentMethodId,
        shippingMethod: validationData.deliveryMethodId,
        orderNote: validationData.orderNote || "",
        exchangeRate: exchangeRate,
        customerCurrency: currency,
        customerTotal: computedCartTotal,
        salesChannel,
        items,
        address: {
          firstName: address.firstName,
          lastName: address.lastName,
          country: address.country,
          city: address.city,
          address: address.address,
          street: address.street,
          apartment: address.apartment,
          building: address.building,
          floor: address.floor,
          state: address.state,
          postalCode: address.postalCode,
          phoneCountryCode: address.phoneCountryCode,
          phone: address.phone,
        },
        billingAddress,
      },
    });

    return NextResponse.json({ success: true, id: order.id });
  } catch (error) {
    console.error("Error in /orders/create endpoint:", error);
    return NextResponse.json({ error: "An unexpected error occurred." }, { status: 500 });
  }
};
