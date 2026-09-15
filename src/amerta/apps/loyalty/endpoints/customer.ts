import { Endpoint, PayloadRequest } from "payload";
import {
  getLoyaltySettings,
  getCustomerLoyaltyAccount,
  calculateTier,
} from "../services/loyaltyEngine";

export const getCustomerLoyaltyStatusEndpoint: Endpoint = {
  path: "/loyalty/customer-status",
  method: "get",
  handler: async (req: PayloadRequest) => {
    try {
      const url = new URL(req.url || "", "http://localhost");
      let customerId = url.searchParams.get("customerId");

      if (!customerId && req.user && (req.user as any).collection === "customers") {
        customerId = String(req.user.id);
      }

      const settings = await getLoyaltySettings(req.payload);

      if (!customerId) {
        return Response.json({
          isLoggedIn: false,
          settings: {
            enabled: settings.enabled,
            earningRate: settings.earningRate,
            redemptionRate: settings.redemptionRate,
            minRedeemPoints: settings.minRedeemPoints,
            maxRedeemPoints: settings.maxRedeemPoints,
            welcomeBonus: settings.welcomeBonus,
            productPointsMessage: settings.productPointsMessage,
            checkoutPointsMessage: settings.checkoutPointsMessage,
            checkoutEarnMessage: settings.checkoutEarnMessage,
          },
          tiers: settings.tiers,
        });
      }

      const account = await getCustomerLoyaltyAccount(customerId, req.payload);
      const currentTier =
        settings.tiers.find((t) => t.slug === account.tierSlug) ||
        calculateTier(account.lifetimePoints, settings.tiers);

      // Determine next tier
      const sortedTiers = [...settings.tiers].sort((a, b) => a.minPoints - b.minPoints);
      const nextTier = sortedTiers.find((t) => t.minPoints > account.lifetimePoints) || null;
      const pointsToNextTier = nextTier ? nextTier.minPoints - account.lifetimePoints : 0;

      return Response.json({
        isLoggedIn: true,
        customerId,
        account,
        currentTier,
        nextTier,
        pointsToNextTier,
        settings: {
          enabled: settings.enabled,
          earningRate: settings.earningRate,
          redemptionRate: settings.redemptionRate,
          minRedeemPoints: settings.minRedeemPoints,
          maxRedeemPoints: settings.maxRedeemPoints,
          welcomeBonus: settings.welcomeBonus,
          productPointsMessage: settings.productPointsMessage,
          checkoutPointsMessage: settings.checkoutPointsMessage,
          checkoutEarnMessage: settings.checkoutEarnMessage,
        },
        tiers: settings.tiers,
      });
    } catch (err: any) {
      console.error("[CustomerLoyaltyStatus Error]:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  },
};
