import { Customer } from "@/payload-types";
import { generateEmailTemplate } from "./generateEmailTemplate";

/**
 * Sends an email verification link to the customer.
 *
 * This function sends a customer verification email containing a link to verify
 * their email address. The verification URL is included in the email template.
 *
 * @async
 * @param {Customer} customer - The customer to send the verification email to
 * @param {string} verify_url - The complete verification URL for the customer to click
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * const customer: Customer = { id: '123', email: 'user@example.com', ... };
 * const verifyUrl = `https://example.com/verify?token=abc123`;
 * await sendVerificationEmail(customer, verifyUrl);
 * ```
 */
export const sendVerificationEmail = async (customer: Customer, verify_url: string) => {
  const { sendTemplate } = await generateEmailTemplate("customer_verify_email");
  return await sendTemplate({
    customer,
    props: {
      user: customer,
      verify_url,
    },
  });
};
