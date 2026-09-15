"use client";

import React, { useEffect, useState } from "react";
import { useEcommerce } from "@/amerta/core/providers/EcommerceProvider";
import { Award, Sparkles, TrendingUp, History, ShieldAlert } from "lucide-react";

export const CustomerAccountLoyaltyCard: React.FC = () => {
  const { __ } = useEcommerce();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    fetch("/api/loyalty/customer-status")
      .then((res) => res.json())
      .then((res) => {
        if (isMounted) {
          setData(res);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Error fetching loyalty account:", err);
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="p-6 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 rounded-none animate-pulse">
        <div className="h-4 w-40 bg-zinc-200 dark:bg-zinc-800 mb-2"></div>
        <div className="h-8 w-24 bg-zinc-200 dark:bg-zinc-800"></div>
      </div>
    );
  }

  if (!data?.isLoggedIn) {
    return null;
  }

  const account = data.account || { points: 0, lifetimePoints: 0, history: [] };
  const currentTier = data.currentTier;
  const nextTier = data.nextTier;
  const pointsToNext = data.pointsToNextTier || 0;

  // Calculate progress percentage to next tier
  let progressPercent = 100;
  if (nextTier) {
    const prevThreshold = currentTier?.minPoints || 0;
    const nextThreshold = nextTier.minPoints;
    const span = nextThreshold - prevThreshold;
    const currentProgress = account.lifetimePoints - prevThreshold;
    progressPercent = Math.min(100, Math.max(0, Math.round((currentProgress / span) * 100)));
  }

  return (
    <div className="space-y-6">
      {/* Loyalty summary grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {/* Tier Card */}
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 rounded-none relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {__("VIP Tier")}
            </span>
            <Award
              className="size-5"
              style={{ color: currentTier?.color || "#b45309" }}
            />
          </div>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
              {currentTier?.name || "Member"}
            </p>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {currentTier?.multiplier}x {__("Points Multiplier")}
            {currentTier?.freeShipping ? ` · ${__("Free Shipping VIP")}` : ""}
          </p>
        </div>

        {/* Available Points */}
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 rounded-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {__("Available Points")}
            </span>
            <Sparkles className="size-5 text-amber-500" />
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {account.points.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {__("Ready to redeem at checkout")}
          </p>
        </div>

        {/* Lifetime Points */}
        <div className="p-6 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 rounded-none">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {__("Lifetime Points")}
            </span>
            <TrendingUp className="size-5 text-indigo-500" />
          </div>
          <p className="text-3xl font-bold text-zinc-900 dark:text-zinc-100">
            {account.lifetimePoints.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {nextTier
              ? `${pointsToNext.toLocaleString()} ${__("pts to")} ${nextTier.name}`
              : __("Top VIP Tier reached!")}
          </p>
        </div>
      </div>

      {/* Progress Bar to next tier */}
      {nextTier && (
        <div className="p-4 border border-zinc-200 dark:border-zinc-800 dark:bg-zinc-900 rounded-none space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-medium text-zinc-700 dark:text-zinc-300">
              {__("Next Milestone")}: <strong>{nextTier.name}</strong>
            </span>
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2 bg-zinc-100 dark:bg-zinc-800 rounded-none overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-amber-500 to-amber-600 transition-all duration-500 rounded-none"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-muted-foreground">
            {__("Earn")} {pointsToNext.toLocaleString()} {__("more points to unlock")} {nextTier.multiplier}x {__("points acceleration and exclusive perks.")}
          </p>
        </div>
      )}

      {/* Recent Points History */}
      {account.history && account.history.length > 0 && (
        <div className="border border-zinc-200 dark:border-zinc-800 rounded-none overflow-hidden">
          <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/60 flex items-center gap-2">
            <History className="size-4 text-zinc-500" />
            <h4 className="text-sm font-semibold uppercase tracking-wider text-zinc-900 dark:text-zinc-100">
              {__("Points Activity History")}
            </h4>
          </div>
          <div className="divide-y divide-zinc-200 dark:divide-zinc-800 max-h-64 overflow-y-auto">
            {account.history.slice(0, 10).map((tx: any) => (
              <div
                key={tx.id}
                className="px-5 py-3 flex items-center justify-between text-xs dark:bg-zinc-900"
              >
                <div className="space-y-0.5">
                  <p className="font-medium text-zinc-900 dark:text-zinc-100">
                    {tx.description}
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </p>
                </div>
                <span
                  className={`font-mono font-bold ${
                    tx.points >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-rose-600 dark:text-rose-400"
                  }`}
                >
                  {tx.points >= 0 ? `+${tx.points}` : tx.points} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
