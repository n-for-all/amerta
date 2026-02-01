import { format } from "date-fns";
export const formatDateTime = (timestamp: string | number | Date, dateFormat?: string): string => {
  const defaultDateFormat = dateFormat || "MMM dd, yyyy";
  return format(timestamp, defaultDateFormat);
};
