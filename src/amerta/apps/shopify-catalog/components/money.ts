export type Money = { amount: number; currency: string };

// Catalog amounts are in minor units (cents, fils)
export const formatMoney = (m?: Money) => {
  if (!m || m.amount === undefined) return "";
  try {
    const f = new Intl.NumberFormat(undefined, { style: "currency", currency: m.currency });
    const digits = f.resolvedOptions().maximumFractionDigits ?? 2;
    return f.format(m.amount / Math.pow(10, digits));
  } catch {
    return `${(m.amount / 100).toFixed(2)} ${m.currency}`;
  }
};
