import { Customer } from "@/payload-types";
import { generateAdminEmailTemplate } from "./generateAdminEmailTemplate";
import { generateEmailTemplate } from "./generateEmailTemplate";
import { getAdminURL } from "./getAdminURL";

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
