import { AfterErrorHook } from "payload";

export const afterError: AfterErrorHook = ({ error }) => {
  if (!(error as any).isPublic) {
    return;
  }
  return {
    response: {
      errors: [
        {
          message: error.message,
          code: error.name,
          data: (error as any).data || null,
        },
      ],
      code: error.name,
    },
    status: (error as any).status,
  };
};
