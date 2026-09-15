export interface LoyaltyTier {
  id: string;
  name: string;
  slug: string;
  minPoints: number;
  multiplier: number;
  color?: string;
  badge?: string;
  freeShipping?: boolean;
}

export interface LoyaltyTransaction {
  id: string;
  type: "earn" | "redeem" | "bonus" | "adjustment" | "refund";
  points: number;
  orderId?: string | number;
  date: string;
  description: string;
}

export interface LoyaltyAccountMetafield {
  points: number;
  lifetimePoints: number;
  tierSlug: string;
  tierName: string;
  history: LoyaltyTransaction[];
}

export interface LoyaltySettings {
  enabled: boolean;
  earningRate: number; // Points earned per 1 unit of store currency (e.g. 1 point per $1)
  redemptionRate: number; // Store currency discount per 100 points (e.g. 100 points = $5 discount)
  minRedeemPoints: number; // Minimum points required to redeem (e.g. 100)
  maxRedeemPoints?: number; // Maximum points allowed per order (e.g. 2000)
  collectLimit?: number; // Maximum points that can be earned on a single order
  welcomeBonus: number; // Bonus points granted on account creation
  tierUpgradeBonus: number; // Bonus points granted when leveling up to a new tier
  tiers: LoyaltyTier[];
  vendorMultipliers?: {
    vendor: string;
    multiplier: number;
  }[];
  // Configurable storefront messages with %s points placeholder
  productPointsMessage?: string;
  checkoutPointsMessage?: string;
  checkoutEarnMessage?: string;
}
