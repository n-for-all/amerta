import { z } from "zod";
import type { CollectionBeforeChangeHook } from "payload";
import { APIError } from "payload";

const schema = z.object({
  email: z.string().min(1, "Email is required").email("Please enter a valid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const validateBeforeChange: CollectionBeforeChangeHook = async ({ data, req, operation }) => {
  if (operation !== "create") return data;

  // 1) Zod validation
  const parsed = schema.safeParse({
    email: data.email,
    password: data.password,
  });

  if (!parsed.success) {
    throw new APIError(z.prettifyError(parsed.error), 400);
  }

  const { email } = parsed.data;

  // 2) Check if email already exists
  const existing = await req.payload.find({
    collection: "users",
    where: { email: { equals: email } },
    limit: 1,
  });

  if (existing.totalDocs > 0) {
    throw new APIError("This email is already registered.", 400);
  }

  // optionally return parsed.data merged back
  return {
    ...data,
    ...parsed.data,
  };
};

export default validateBeforeChange;
