"use client";

import React, { useEffect, useState } from "react";
import { useCheckoutContext } from "@/amerta/theme/components/Checkout/hooks/useCheckout";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";
import { formatPrice } from "@/amerta/core/utilities/format-price";
import { Sparkles, Award, ShieldCheck, ArrowRight } from "lucide-react";
import Link from "next/link";
import { getURL } from "@/amerta/utilities/getURL";
import { printf } from "fast-printf";

export const LoyaltyCheckoutRedemption: React.FC = () => {
  const { customer, checkoutState } = useCheckoutContext();
  const { __, currency, exchangeRate, locale } = useEcommerce();

  const [loyaltyStatus, setLoyaltyStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [selectedPoints, setSelectedPoints] = useState<number>(0);
  const [appliedDiscount, setAppliedDiscount] = useState<number>(0);

  useEffect(() => {
    if (!customer?.id) return;

    let isMounted = true;
    setLoading(true);

    fetch(`/api/loyalty/customer-status?customerId=${customer.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setLoyaltyStatus(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error loading loyalty status:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [customer?.id]);

  const subtotal = checkoutState?.subtotal || 0;
  const points = loyaltyStatus?.account?.points || 0;
  const tier = loyaltyStatus?.currentTier;
  const multiplier = tier?.multiplier || 1.0;
  const earningRate = loyaltyStatus?.settings?.earningRate || 1;
  const estimatedEarnedPoints = Math.floor(subtotal * earningRate * multiplier);

  // Guest view
  if (!customer) {
    const defaultGuestTemplate =
      "Sign in or create an account to earn ~%s points and unlock VIP perks with Loyalty Circle.";
    const guestTemplate =
      loyaltyStatus?.settings?.checkoutPointsMessage || defaultGuestTemplate;
    const renderedGuestMessage = printf(
      __(guestTemplate),
      estimatedEarnedPoints.toLocaleString()
    );

    return (
      <div className="border border-zinc-200 bg-zinc-50 p-4 text-xs dark:border-zinc-800 dark:bg-zinc-950 rounded-none">
        <div className="flex items-start gap-2.5">
          <Sparkles className="size-4 shrink-0 text-amber-500 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold text-zinc-900 dark:text-zinc-100">
              {__("Earn Points on this Order")}
            </p>
            <p className="text-zinc-600 dark:text-zinc-400">
              {renderedGuestMessage}
            </p>
            <Link
              href={getURL("/login", locale)}
              className="inline-flex items-center gap-1 font-medium text-amber-600 hover:underline dark:text-amber-400 pt-1"
            >
              {__("Sign In to Claim")} <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="border border-zinc-200 p-3 text-xs text-zinc-500 animate-pulse dark:border-zinc-800 rounded-none">
        {__("Checking loyalty rewards balance...")}
      </div>
    );
  }

  const minRedeem = loyaltyStatus?.settings?.minRedeemPoints || 100;
  const redemptionRate = loyaltyStatus?.settings?.redemptionRate || 5; // e.g. 5 currency per 100 points
  const canRedeem = points >= minRedeem;

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    setSelectedPoints(val);
    const discountVal = (val / 100) * redemptionRate;
    setAppliedDiscount(discountVal);
  };

  return (
    <div className="border border-zinc-200 bg-zinc-50/70 p-4 dark:border-zinc-800 dark:bg-zinc-900/40 rounded-none space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Award className="size-4 text-amber-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
            {__("Loyalty Circle")}
          </span>
          {tier && (
            <span
              className="px-1.5 py-0.5 text-[10px] font-bold tracking-widest uppercase border rounded-none"
              style={{
                borderColor: tier.color || "#b45309",
                color: tier.color || "#b45309",
              }}
            >
              {tier.badge || tier.name}
            </span>
          )}
        </div>
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
          {points} {__("Points")}
        </span>
      </div>

      {/* Earning preview */}
      <div className="flex items-center justify-between text-xs text-zinc-600 dark:text-zinc-400 pt-1 border-t border-zinc-200 dark:border-zinc-800">
        <span>{__("Points you'll earn:")}</span>
        <span className="font-semibold text-emerald-600 dark:text-emerald-400">
          +{estimatedEarnedPoints} {__("pts")} ({multiplier}x {__("multiplier")})
        </span>
      </div>
      {loyaltyStatus?.settings?.checkoutEarnMessage && (
        <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
          {printf(
            __(loyaltyStatus.settings.checkoutEarnMessage),
            estimatedEarnedPoints.toLocaleString(),
            multiplier
          )}
        </p>
      )}

      {/* Redemption section */}
      {canRedeem ? (
        <div className="space-y-2 pt-2 border-t border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-between text-xs">
            <span className="text-zinc-600 dark:text-zinc-400">
              {__("Redeem points for discount:")}
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {selectedPoints} {__("pts")} (
              {formatPrice(appliedDiscount, currency, exchangeRate)})
            </span>
          </div>

          <input
            type="range"
            min={0}
            max={Math.min(points, loyaltyStatus?.settings?.maxRedeemPoints || 2000)}
            step={100}
            value={selectedPoints}
            onChange={handlePointsChange}
            className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-700 accent-amber-600 cursor-pointer rounded-none"
          />

          <div className="flex items-center justify-between text-[11px] text-zinc-500">
            <span>0 pts</span>
            <span>
              {Math.min(points, loyaltyStatus?.settings?.maxRedeemPoints || 2000)} pts max
            </span>
          </div>

          {selectedPoints > 0 && (
            <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 pt-1">
              <ShieldCheck className="size-3.5" />
              <span>
                {__("Points reward will apply:")}{" "}
                <strong>{formatPrice(appliedDiscount, currency, exchangeRate)}</strong>
              </span>
            </div>
          )}
        </div>
      ) : (
        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
          {__("Earn at least")} {minRedeem} {__("points to redeem discounts.")}
        </p>
      )}
    </div>
  );
};
