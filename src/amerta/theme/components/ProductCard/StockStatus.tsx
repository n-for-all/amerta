export const StockStatus = async ({ stockAvailable, inStockLabel, outOfStockLabel }: { stockAvailable: boolean; inStockLabel: string; outOfStockLabel: string }) => {
  return <p className={`text-xs text-sm/6 uppercase ${stockAvailable ? "text-green-500 dark:text-green-400" : "text-red-600 dark:text-red-400"}`}>{stockAvailable ? inStockLabel : outOfStockLabel}</p>;
};
