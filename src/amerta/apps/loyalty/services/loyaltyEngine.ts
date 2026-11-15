import { Payload } from "payload";
import {
  LoyaltyAccountMetafield,
  LoyaltySettings,
  LoyaltyTier,
  LoyaltyTransaction,
} from "../types";
import { getCustomerMetafield } from "@/amerta/core/utilities/get-customer-metafield";
import { setCustomerMetafield } from "@/amerta/core/utilities/set-customer-metafield";

export const DEFAULT_LOYALTY_TIERS: LoyaltyTier[] = [
  {
    id: "bronze",
    name: "Bronze Member",
    slug: "bronze",
    minPoints: 0,
    multiplier: 1.0,
    color: "#b45309",
    badge: "BRONZE",
    freeShipping: false,
  },
  {
    id: "silver",
    name: "Silver VIP",
    slug: "silver",
    minPoints: 500,
    multiplier: 1.25,
    color: "#64748b",
    badge: "SILVER",
    freeShipping: false,
  },
  {
    id: "gold",
    name: "Gold VIP",
    slug: "gold",
    minPoints: 1500,
    multiplier: 1.5,
    color: "#eab308",
    badge: "GOLD",
    freeShipping: true,
  },
  {
    id: "platinum",
    name: "Platinum Elite",
    slug: "platinum",
    minPoints: 3000,
    multiplier: 2.0,
    color: "#818cf8",
    badge: "PLATINUM",
    freeShipping: true,
  },
];

export const DEFAULT_LOYALTY_SETTINGS: LoyaltySettings = {
  enabled: true,
  earningRate: 1, // 1 point per 1 currency unit
  redemptionRate: 5, // 5 currency units off per 100 points
  minRedeemPoints: 100,
  maxRedeemPoints: 2000,
  collectLimit: 5000,
  welcomeBonus: 50,
  tierUpgradeBonus: 100,
  tiers: DEFAULT_LOYALTY_TIERS,
  vendorMultipliers: [],
  productPointsMessage: "Loyalty Circle: Earn %s reward points on this item and level up your VIP tier.",
  checkoutPointsMessage: "Sign in or create an account to earn ~%s points and unlock VIP perks with Loyalty Circle.",
  checkoutEarnMessage: "Complete your order to earn +%s points (%sx tier multiplier)",
};

export const LOYALTY_NAMESPACE = "LoyaltyCircle";
export const LOYALTY_ACCOUNT_KEY = "account";

/**
 * Fetch current loyalty settings from Apps global with fallback to defaults
 */
export async function getLoyaltySettings(payload: Payload): Promise<LoyaltySettings> {
  try {
    const appsGlobal = await payload.findGlobal({
      slug: "apps",
      depth: 0,
    });
    const settings = (appsGlobal?.appSettings as Record<string, any>)?.loyalty;
    if (settings) {
      return {
        ...DEFAULT_LOYALTY_SETTINGS,
        ...settings,
        tiers: settings.tiers && settings.tiers.length > 0 ? settings.tiers : DEFAULT_LOYALTY_TIERS,
      };
    }
  } catch (err) {
    console.error("[LoyaltyEngine] Error fetching loyalty settings:", err);
  }
  return DEFAULT_LOYALTY_SETTINGS;
}

/**
 * Retrieve a customer's loyalty account data from their metafields
 */
export async function getCustomerLoyaltyAccount(
  customerId: string,
  payload: Payload
): Promise<LoyaltyAccountMetafield> {
  const customer = await payload.findByID({
    collection: "customers",
    id: customerId,
    depth: 0,
  });

  if (!customer) {
    throw new Error(`Customer with ID ${customerId} not found`);
  }

  const existing = getCustomerMetafield(customer, LOYALTY_NAMESPACE, LOYALTY_ACCOUNT_KEY);
  if (existing && typeof existing === "object") {
    return {
      points: Number(existing.points) || 0,
      lifetimePoints: Number(existing.lifetimePoints) || 0,
      tierSlug: existing.tierSlug || "bronze",
      tierName: existing.tierName || "Bronze Member",
      history: Array.isArray(existing.history) ? existing.history : [],
    };
  }

  // Default initial account
  const defaultAccount: LoyaltyAccountMetafield = {
    points: 0,
    lifetimePoints: 0,
    tierSlug: "bronze",
    tierName: "Bronze Member",
    history: [],
  };

  return defaultAccount;
}

/**
 * Persist loyalty account back into customer metafields
 */
export async function saveCustomerLoyaltyAccount(
  customerId: string,
  account: LoyaltyAccountMetafield,
  payload: Payload
): Promise<any> {
  return await setCustomerMetafield(
    payload,
    customerId,
    LOYALTY_NAMESPACE,
    LOYALTY_ACCOUNT_KEY,
    account
  );
}

/**
 * Calculate appropriate tier given lifetime earned points
 */
export function calculateTier(lifetimePoints: number, tiers: LoyaltyTier[]): LoyaltyTier {
  const sorted = [...tiers].sort((a, b) => b.minPoints - a.minPoints);
  for (const tier of sorted) {
    if (lifetimePoints >= tier.minPoints) {
      return tier;
    }
  }
  return tiers[0] || DEFAULT_LOYALTY_TIERS[0]!;
}

/**
 * Process points earning on order payment
 */
export async function awardOrderPoints(order: any, payload: Payload) {
  const settings = await getLoyaltySettings(payload);
  if (!settings.enabled) return;

  const customerId =
    typeof order.orderedBy === "string" ? order.orderedBy : order.orderedBy?.id;
  if (!customerId) return;

  const customer = await payload.findByID({
    collection: "customers",
    id: customerId,
    depth: 0,
  });

  // Skip guest checkouts (hasAccount === "0")
  if (!customer || customer.hasAccount === "0") return;

  const account = await getCustomerLoyaltyAccount(customerId, payload);

  // Check if points for this order have already been awarded
  const alreadyAwarded = account.history.some(
    (tx) => tx.type === "earn" && String(tx.orderId) === String(order.id)
  );
  if (alreadyAwarded) return;

  const currentTier =
    settings.tiers.find((t) => t.slug === account.tierSlug) ||
    calculateTier(account.lifetimePoints, settings.tiers);

  const multiplier = currentTier.multiplier || 1.0;
  const subtotal = Number(order.subtotal) || 0;
  let earnedPoints = Math.floor(subtotal * settings.earningRate * multiplier);

  if (settings.collectLimit && earnedPoints > settings.collectLimit) {
    earnedPoints = settings.collectLimit;
  }

  if (earnedPoints <= 0) return;

  const newLifetimePoints = account.lifetimePoints + earnedPoints;
  const newBalance = account.points + earnedPoints;

  // Check for tier upgrade
  const newTier = calculateTier(newLifetimePoints, settings.tiers);
  const upgraded = newTier.slug !== currentTier.slug && newTier.minPoints > currentTier.minPoints;

  const newHistory: LoyaltyTransaction[] = [...account.history];

  newHistory.unshift({
    id: `earn_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    type: "earn",
    points: earnedPoints,
    orderId: order.id,
    date: new Date().toISOString(),
    description: `Earned from Order #${order.id} (${multiplier}x Tier Multiplier)`,
  });

  let finalBalance = newBalance;
  if (upgraded && settings.tierUpgradeBonus > 0) {
    finalBalance += settings.tierUpgradeBonus;
    newHistory.unshift({
      id: `upgrade_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "bonus",
      points: settings.tierUpgradeBonus,
      date: new Date().toISOString(),
      description: `Tier Upgrade Bonus: Promoted to ${newTier.name}!`,
    });
  }

  const updatedAccount: LoyaltyAccountMetafield = {
    points: finalBalance,
    lifetimePoints: newLifetimePoints,
    tierSlug: newTier.slug,
    tierName: newTier.name,
    history: newHistory,
  };

  await saveCustomerLoyaltyAccount(customerId, updatedAccount, payload);
  console.log(
    `[LoyaltyEngine] Successfully awarded ${earnedPoints} points to customer ${customerId} for order #${order.id}`
  );
}

/**
 * Revert awarded points if an order is cancelled or refunded
 */
export async function clawbackOrderPoints(order: any, payload: Payload) {
  const customerId =
    typeof order.orderedBy === "string" ? order.orderedBy : order.orderedBy?.id;
  if (!customerId) return;

  const account = await getCustomerLoyaltyAccount(customerId, payload);
  const earnTx = account.history.find(
    (tx) => tx.type === "earn" && String(tx.orderId) === String(order.id)
  );

  if (!earnTx) return;

  // Already reversed (e.g. cancelled, then deleted) — don't take the points twice
  const alreadyReversed = account.history.some((tx) => tx.type === "refund" && String(tx.orderId) === String(order.id));
  if (alreadyReversed) return;

  const pointsToClawback = earnTx.points;
  const newBalance = Math.max(0, account.points - pointsToClawback);
  const newLifetime = Math.max(0, account.lifetimePoints - pointsToClawback);

  const settings = await getLoyaltySettings(payload);
  const newTier = calculateTier(newLifetime, settings.tiers);

  const newHistory: LoyaltyTransaction[] = [
    {
      id: `refund_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type: "refund",
      points: -pointsToClawback,
      orderId: order.id,
      date: new Date().toISOString(),
      description: `Reversal for Cancelled/Refunded Order #${order.id}`,
    },
    ...account.history,
  ];

  await saveCustomerLoyaltyAccount(
    customerId,
    {
      points: newBalance,
      lifetimePoints: newLifetime,
      tierSlug: newTier.slug,
      tierName: newTier.name,
      history: newHistory,
    },
    payload
  );

  console.log(
    `[LoyaltyEngine] Reversed ${pointsToClawback} points from customer ${customerId} for order #${order.id}`
  );
}

/**
 * Award welcome bonus on customer account creation
 */
export async function awardWelcomeBonus(customerId: string, payload: Payload) {
  const settings = await getLoyaltySettings(payload);
  if (!settings.enabled || settings.welcomeBonus <= 0) return;

  const customer = await payload.findByID({
    collection: "customers",
    id: customerId,
    depth: 0,
  });
  if (!customer || customer.hasAccount === "0") return;

  const account = await getCustomerLoyaltyAccount(customerId, payload);
  if (account.history.some((tx) => tx.type === "bonus" && tx.description.includes("Welcome"))) {
    return;
  }

  const newBalance = account.points + settings.welcomeBonus;
  const newLifetime = account.lifetimePoints + settings.welcomeBonus;
  const tier = calculateTier(newLifetime, settings.tiers);

  const updatedAccount: LoyaltyAccountMetafield = {
    points: newBalance,
    lifetimePoints: newLifetime,
    tierSlug: tier.slug,
    tierName: tier.name,
    history: [
      {
        id: `welcome_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: "bonus",
        points: settings.welcomeBonus,
        date: new Date().toISOString(),
        description: "Welcome to Loyalty Circle bonus!",
      },
      ...account.history,
    ],
  };

  await saveCustomerLoyaltyAccount(customerId, updatedAccount, payload);
  console.log(`[LoyaltyEngine] Granted welcome bonus (${settings.welcomeBonus} pts) to customer ${customerId}`);
}

/**
 * Manual adjustment of customer points by admin
 */
export async function adjustCustomerPoints(
  customerId: string,
  pointsDelta: number,
  reason: string,
  payload: Payload
): Promise<LoyaltyAccountMetafield> {
  const settings = await getLoyaltySettings(payload);
  const account = await getCustomerLoyaltyAccount(customerId, payload);

  const newBalance = Math.max(0, account.points + pointsDelta);
  const newLifetime = Math.max(0, account.lifetimePoints + (pointsDelta > 0 ? pointsDelta : 0));
  const newTier = calculateTier(newLifetime, settings.tiers);

  const updatedAccount: LoyaltyAccountMetafield = {
    points: newBalance,
    lifetimePoints: newLifetime,
    tierSlug: newTier.slug,
    tierName: newTier.name,
    history: [
      {
        id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
        type: "adjustment",
        points: pointsDelta,
        date: new Date().toISOString(),
        description: reason || "Manual Admin Adjustment",
      },
      ...account.history,
    ],
  };

  await saveCustomerLoyaltyAccount(customerId, updatedAccount, payload);
  return updatedAccount;
}
