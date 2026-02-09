import { Customer } from "@/payload-types";
import { generateEmailTemplate } from "./generateEmailTemplate";

export const generatePasswordResetEmail = async (customer: Customer, reset_url: string) => {
  const { getTemplate } = await generateEmailTemplate("customer_reset_password");
  return await getTemplate({
    props: {
      user: customer,
      reset_password_url: reset_url,
    },
  });
};
