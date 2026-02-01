import { Customer } from "@/payload-types";
import { generateEmailTemplate } from "./generateEmailTemplate";

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
