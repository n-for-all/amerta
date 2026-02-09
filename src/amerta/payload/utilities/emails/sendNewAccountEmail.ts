import { Customer } from "@/payload-types";
import { generateAdminEmailTemplate } from "./generateAdminEmailTemplate";
import { generateEmailTemplate } from "./generateEmailTemplate";
import { getAdminURL } from "../getAdminURL";

/**
 * Sends welcome emails for a newly created customer account.
 *
 * This function sends two emails:
 * 1. An admin notification email to alert site administrators of the new account
 * 2. A customer welcome email to the new customer with account details
 *
 * Both emails are generated using templated email services and sent asynchronously.
 * Any errors during email sending are silently caught and ignored to prevent
 * account creation failures due to email delivery issues.
 *
 * @async
 * @param {Customer} customer - The newly created customer object containing user data
 * @returns {Promise<void>}
 *
 * @example
 * ```typescript
 * const newCustomer: Customer = { id: '123', email: 'user@example.com', ... };
 * await sendNewAccountEmail(newCustomer);
 * ```
 */
export const sendNewAccountEmail = async (customer: Customer) => {
  try {
    const { sendTemplate:sendAdminTemplate } = await generateAdminEmailTemplate("new_account");
    await sendAdminTemplate({
      props: {
        user: customer,
      },
    });

    const { sendTemplate } = await generateEmailTemplate("customer_new_account");
    await sendTemplate({
      customer,
      props: {
        user: customer,
        admin_user_url: getAdminURL(`/collections/users`),
      },
    });
  } catch {
    //! ignore any errors sending new account emails
  }
};
