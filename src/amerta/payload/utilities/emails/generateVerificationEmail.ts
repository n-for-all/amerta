import { Customer } from "@/payload-types";
import { generateEmailTemplate } from "./generateEmailTemplate";

export const generateVerificationEmail = async (customer: Customer, verify_url: string) => {
  const { getTemplate } = await generateEmailTemplate("customer_verify_email");
  return await getTemplate({
    props: {
      user: customer,
      verify_url,
    },
  });
};
