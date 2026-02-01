export const getErrorMessage = (error: any): string => {
  if (!error) return "An unknown error occurred";

  // 1. Handle Payload Validation Errors (The nested "Email exists" type)
  // Structure: { errors: [ { data: { errors: [ { message: "..." } ] } } ] }
  if (error.errors?.[0]?.data?.errors?.[0]?.message) {
    return error.errors[0].data.errors[0].message;
  }

  // 2. Handle Top-Level Payload Errors
  // Structure: { errors: [ { message: "Something went wrong" } ] }
  if (error.errors?.[0]?.message) {
    return error.errors[0].message;
  }

  // 3. Handle simple JSON messages (Custom APIs)
  if (error.message) {
    return error.message;
  }

  // 4. Fallback for strings or unknown objects
  return typeof error === "string" ? error : JSON.stringify(error);
};
