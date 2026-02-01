import * as z from "zod";

const errorMessages: Record<string, string> = {
  "email": "Please enter a valid Email address",

  "address.id": "Please select a valid address",
  "address.firstName": "Please enter your First name",
  "address.lastName": "Please enter your Last name",
  "address.address": "Please enter your Address",
  "address.street": "Please enter your Street Name or Number",
  "address.apartment": "Please enter your Apartment/Villa No.",
  "address.city": "Please enter your shipping City",
  "address.country": "Please select your shipping Country",
  "address.phone": "Please enter a valid Phone number",
  "address.phoneCountryCode": "Please select your Phone Country Code", 
  "paymentMethodId": "Please select a Payment method",
  "deliveryMethodId": "Please select a Delivery method",
  "cartTotal": "Cart total must be a positive number",
}; 

export const GuestOrderSchema = z.object({
  email: z.email(),
  address: z.object({
    id: z.string().min(1),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    address: z.string().min(1),
    street: z.string().min(1),
    apartment: z.string().min(1),
    building: z.string().optional(),
    floor: z.string().optional(),
    city: z.string().min(1),
    cityName: z.string().optional(),
    country: z.string().min(1),
    countryName: z.string().optional(),
    state: z.string().optional(),
    postalCode: z.string().optional(),
    phone: z.union([z.number(), z.string()]).refine((val) => {
      const numVal = typeof val === "string" ? parseInt(val as any) : val;
      return !isNaN(numVal as any) && (numVal as number) > 0;
    }),
    phoneCountryCode: z.string().min(1),
  }),
  paymentMethodId: z.string().min(1),
  deliveryMethodId: z.string().min(1),
  cartTotal: z.number().positive(),
});

function mapZodIssues(issues: z.core.$ZodIssue[]) {
  const fieldErrors: { [x: string]: string } = {};

  for (const issue of issues) {
    const path = issue.path.join("."); 
    const key = `${path}.${issue.code}`;
    const fallbackKey = path; // in case you want a generic per-field message

    fieldErrors[path] = errorMessages[key] ?? errorMessages[fallbackKey] ?? "Invalid value provided for field " + key;
  }

  return fieldErrors;
}

export type GuestOrderType = z.infer<typeof GuestOrderSchema>;

export interface GuestOrderValidationResult {
  success: boolean;
  errors?: { [x: string]: string };
  message?: string;
  data?: GuestOrderType;
}

/**
 * Validates a guest order payload
 * @param data - The guest order data to validate
 * @returns Validation result with success status and any errors
 */
export function validateGuestOrder(data: unknown): GuestOrderValidationResult {
  try {
    const validatedData = GuestOrderSchema.parse(data);
    return {
      success: true,
      data: validatedData,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = mapZodIssues(error.issues);

      let messageSet = new Set<string>();
      Object.values(errors).forEach((msgs) => {
        messageSet.add(msgs);
      });
      return {
        success: false,
        errors,
        message: Array.from(messageSet).join("\n"),
      };
    }
    return {
      success: false,
      errors: { general: "An unknown error has occurred" },
      message: "An unknown error has occurred",
    };
  }
}

/**
 * Validates a guest order and throws an error if invalid
 * @param data - The guest order data to validate
 * @throws Error with validation details if invalid
 * @returns The validated guest order data
 */
export function validateGuestOrderOrThrow(data: unknown): GuestOrderType {
  return GuestOrderSchema.parse(data);
}
