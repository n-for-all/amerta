"use server"
import { createTranslator } from "../../utilities/translation";

export const StockStatus = async ({ stockAvailable, locale }: { stockAvailable: boolean; locale: string }) => {
  const __ = await createTranslator(locale);
  return <p className={`text-xs text-sm/6 uppercase ${stockAvailable ? "text-green-500 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{stockAvailable ? __("In Stock") : __("Out of Stock")}</p>;
};
