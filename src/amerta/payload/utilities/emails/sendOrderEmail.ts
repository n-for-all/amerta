import { Customer, Order } from "@/payload-types";
import { generateAdminEmailTemplate } from "./generateAdminEmailTemplate";
import { generateEmailTemplate } from "./generateEmailTemplate";

/**
 * Sends a new order notification email to both admin and customer.
 *
 * This function sends two emails:
 * 1. An admin notification email to alert site administrators of a new order
 * 2. A customer confirmation email with order details
 *
 * Both emails are generated using templated email services and sent asynchronously.
 * Any errors during email sending are silently caught and ignored to prevent
 * order creation failures due to email delivery issues.
 *
 * @async
 * @param {Customer} customer - The customer who placed the order
 * @param {Order} order - The newly created order object containing order data
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * const customer: Customer = { id: '123', email: 'user@example.com', ... };
 * const order: Order = { id: 'order-123', total: 100, ... };
 * await sendNewOrderEmail(customer, order);
 * ```
 */
export const sendNewOrderEmail = async (customer: Customer, order: Order, withAdmin = true) => {
  try {
    if (withAdmin) {
      const { sendTemplate: sendAdminTemplate } = await generateAdminEmailTemplate("new_order");
      await sendAdminTemplate({
        props: {
          user: customer,
          order,
        },
      });
    }

    const { sendTemplate } = await generateEmailTemplate("customer_processing_order");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending order emails
  }
};

/**
 * Sends a cancelled order notification email to both admin and customer.
 *
 * This function sends two emails:
 * 1. An admin notification email to alert site administrators of the cancellation
 * 2. A customer notification email confirming the order cancellation
 *
 * @async
 * @param {Customer} customer - The customer whose order was cancelled
 * @param {Order} order - The cancelled order object
 * @returns {Promise<void>}
 */
export const sendCancelledOrderEmail = async (customer: Customer, order: Order) => {
  try {
    const { sendTemplate: sendAdminTemplate } = await generateAdminEmailTemplate("cancelled_order");
    await sendAdminTemplate({
      props: {
        user: customer,
        order,
      },
    });

    const { sendTemplate } = await generateEmailTemplate("customer_cancelled_order");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending cancelled order emails
  }
};

/**
 * Sends a failed order notification email to both admin and customer.
 *
 * This function sends two emails:
 * 1. An admin notification email to alert site administrators of the failed order
 * 2. A customer notification email informing them of the failure
 *
 * @async
 * @param {Customer} customer - The customer whose order failed
 * @param {Order} order - The failed order object
 * @returns {Promise<void>}
 */
export const sendFailedOrderEmail = async (customer: Customer, order: Order) => {
  try {
    const { sendTemplate: sendAdminTemplate } = await generateAdminEmailTemplate("failed_order");
    await sendAdminTemplate({
      props: {
        user: customer,
        order,
      },
    });

    const { sendTemplate } = await generateEmailTemplate("customer_failed_order");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending failed order emails
  }
};

/**
 * Sends an on-hold order notification email to the customer.
 *
 * Notifies the customer that their order is on-hold and pending review.
 *
 * @async
 * @param {Customer} customer - The customer whose order is on-hold
 * @param {Order} order - The on-hold order object
 * @returns {Promise<void>}
 */
export const sendOnHoldOrderEmail = async (customer: Customer, order: Order) => {
  try {
    const { sendTemplate } = await generateEmailTemplate("customer_on_hold_order");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending on-hold order emails
  }
};

/**
 * Sends a processing order notification email to the customer.
 *
 * Notifies the customer that their order is being processed and will be shipped soon.
 *
 * @async
 * @param {Customer} customer - The customer whose order is processing
 * @param {Order} order - The processing order object
 * @returns {Promise<void>}
 */
export const sendProcessingOrderEmail = async (customer: Customer, order: Order) => {
  try {
    const { sendTemplate } = await generateEmailTemplate("customer_processing_order");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending processing order emails
  }
};

/**
 * Sends a completed order notification email to the customer.
 *
 * Notifies the customer that their order has been completed and is ready.
 *
 * @async
 * @param {Customer} customer - The customer whose order is completed
 * @param {Order} order - The completed order object
 * @returns {Promise<void>}
 */
export const sendCompletedOrderEmail = async (customer: Customer, order: Order) => {
  try {
    const { sendTemplate } = await generateEmailTemplate("customer_completed_order");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending completed order emails
  }
};

/**
 * Sends a shipped order notification email to the customer.
 *
 * Notifies the customer that their order has been shipped with tracking information.
 *
 * @async
 * @param {Customer} customer - The customer whose order shipped
 * @param {Order} order - The shipped order object with tracking info
 * @returns {Promise<void>}
 */
export const sendShippedOrderEmail = async (customer: Customer, order: Order) => {
  try {
    const { sendTemplate } = await generateEmailTemplate("customer_shipped_order");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending shipped order emails
  }
};

/**
 * Sends a refunded order notification email to the customer.
 *
 * Notifies the customer that their order has been refunded with refund details.
 *
 * @async
 * @param {Customer} customer - The customer whose order was refunded
 * @param {Order} order - The refunded order object with refund details
 * @returns {Promise<void>}
 */
export const sendRefundedOrderEmail = async (customer: Customer, order: Order) => {
  try {
    const { sendTemplate } = await generateEmailTemplate("customer_refunded_order");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending refunded order emails
  }
};

/**
 * Sends an order invoice/details email to the customer.
 *
 * Sends a detailed invoice of the order with payment and shipping information.
 *
 * @async
 * @param {Customer} customer - The customer receiving the invoice
 * @param {Order} order - The order object with complete details
 * @returns {Promise<void>}
 */
export const sendInvoiceEmail = async (customer: Customer, order: Order) => {
  try {
    const { sendTemplate } = await generateEmailTemplate("customer_invoice");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        order,
      },
    });
  } catch {
    //! ignore any errors sending invoice emails
  }
};
