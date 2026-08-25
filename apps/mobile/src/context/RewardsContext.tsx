import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNotifications } from "./NotificationContext";

const REWARDS_STORAGE_KEY = "deen_mobile_rewards_v1";

export type LoyaltyTier = "INDIGO_MEMBER" | "SELVEDGE_CONNOISSEUR" | "VIP_ELITE";

export interface RewardTransaction {
  id: string;
  type: "EARNED" | "REDEEMED" | "DAILY_BONUS" | "GIFT_CARD";
  coins: number;
  description: string;
  timestamp: string;
}

export interface ClaimedVoucher {
  id: string;
  code: string;
  title: string;
  discountType: "fixed" | "percentage" | "free_shipping";
  discountValue: number;
  minOrder?: number;
  expiresAt: string;
  used: boolean;
}

interface RewardsContextType {
  coins: number;
  tier: LoyaltyTier;
  tierLabel: string;
  tierMultiplier: number;
  transactions: RewardTransaction[];
  vouchers: ClaimedVoucher[];
  dailyStreak: number;
  claimedDailyToday: boolean;
  earnCoins: (takaSpent: number, description?: string) => Promise<number>;
  redeemCoins: (coinsToRedeem: number) => Promise<number>;
  claimDailyReward: (rewardTitle: string, voucherCode?: string, coinBonus?: number) => Promise<void>;
  addVoucher: (voucher: Omit<ClaimedVoucher, "id" | "used">) => Promise<ClaimedVoucher>;
  useVoucher: (code: string) => Promise<ClaimedVoucher | null>;
  loading: boolean;
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined);

export const RewardsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [coins, setCoins] = useState<number>(0);
  const [dailyStreak, setDailyStreak] = useState<number>(0);
  const [lastClaimDate, setLastClaimDate] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<RewardTransaction[]>([]);
  const [vouchers, setVouchers] = useState<ClaimedVoucher[]>([]);
  const [loading, setLoading] = useState(true);
  const { addNotification } = useNotifications();

  useEffect(() => {
    (async () => {
      try {
        const json = await AsyncStorage.getItem(REWARDS_STORAGE_KEY);
        if (json) {
          const parsed = JSON.parse(json);
          // Only restore real persisted state — never fall back to demo defaults.
          setCoins(parsed.coins ?? 0);
          setDailyStreak(parsed.dailyStreak ?? 0);
          setLastClaimDate(parsed.lastClaimDate ?? null);
          setTransactions(parsed.transactions ?? []);
          setVouchers(parsed.vouchers ?? []);
        }
      } catch (e) {
        console.error("Failed to load rewards", e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const saveState = async (
    newCoins: number,
    newStreak: number,
    newDate: string | null,
    newTx: RewardTransaction[],
    newVouchers: ClaimedVoucher[]
  ) => {
    setCoins(newCoins);
    setDailyStreak(newStreak);
    setLastClaimDate(newDate);
    setTransactions(newTx);
    setVouchers(newVouchers);
    await AsyncStorage.setItem(
      REWARDS_STORAGE_KEY,
      JSON.stringify({
        coins: newCoins,
        dailyStreak: newStreak,
        lastClaimDate: newDate,
        transactions: newTx,
        vouchers: newVouchers,
      })
    ).catch(() => {});
  };

  // Tier calculation
  const tier: LoyaltyTier =
    coins >= 5000 ? "VIP_ELITE" : coins >= 1500 ? "SELVEDGE_CONNOISSEUR" : "INDIGO_MEMBER";

  const tierLabel =
    tier === "VIP_ELITE"
      ? "VIP Elite Member"
      : tier === "SELVEDGE_CONNOISSEUR"
      ? "Selvedge Connoisseur"
      : "Indigo Club Member";

  const tierMultiplier = tier === "VIP_ELITE" ? 2.0 : tier === "SELVEDGE_CONNOISSEUR" ? 1.5 : 1.0;

  const todayStr = new Date().toISOString().slice(0, 10);
  const claimedDailyToday = lastClaimDate === todayStr;

  const earnCoins = async (takaSpent: number, description = "Order Reward"): Promise<number> => {
    const earned = Math.round(takaSpent * tierMultiplier);
    const newCoins = coins + earned;
    const newTx: RewardTransaction = {
      id: `tx_${Date.now()}`,
      type: "EARNED",
      coins: earned,
      description: `${description} (${tierMultiplier}x Tier Rate)`,
      timestamp: new Date().toISOString(),
    };
    await saveState(newCoins, dailyStreak, lastClaimDate, [newTx, ...transactions], vouchers);
    return earned;
  };

  const redeemCoins = async (coinsToRedeem: number): Promise<number> => {
    const actualRedeem = Math.min(coins, coinsToRedeem);
    const discountBDT = Math.floor(actualRedeem / 2); // 2 Coins = 1 BDT
    const newCoins = coins - actualRedeem;
    const newTx: RewardTransaction = {
      id: `tx_${Date.now()}`,
      type: "REDEEMED",
      coins: -actualRedeem,
      description: `Redeemed for ৳${discountBDT} Checkout Discount`,
      timestamp: new Date().toISOString(),
    };
    await saveState(newCoins, dailyStreak, lastClaimDate, [newTx, ...transactions], vouchers);
    return discountBDT;
  };

  const claimDailyReward = async (rewardTitle: string, voucherCode?: string, coinBonus = 100) => {
    const newCoins = coins + coinBonus;
    // Streak logic: increment only if last claim was yesterday.
    // If the user missed a day (or never claimed), reset to Day 1.
    const yesterdayStr = new Date(Date.now() - 86_400_000).toISOString().slice(0, 10);
    const newStreak = lastClaimDate === yesterdayStr ? dailyStreak + 1 : 1;
    const newTx: RewardTransaction = {
      id: `tx_${Date.now()}`,
      type: "DAILY_BONUS",
      coins: coinBonus,
      description: `Daily Scratch Reward: ${rewardTitle}`,
      timestamp: new Date().toISOString(),
    };

    let updatedVouchers = vouchers;
    if (voucherCode) {
      const newV: ClaimedVoucher = {
        id: `v_${Date.now()}`,
        code: voucherCode,
        title: rewardTitle,
        discountType: "fixed",
        discountValue: 150,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString(),
        used: false,
      };
      updatedVouchers = [newV, ...vouchers];
    }

    await saveState(newCoins, newStreak, todayStr, [newTx, ...transactions], updatedVouchers);

    await addNotification({
      type: "PROMO",
      title: `🎉 Claimed Daily Reward: +${coinBonus} Coins!`,
      body: `Streak Day ${newStreak}! You unlocked ${rewardTitle}. Check your vouchers or redeem at checkout.`,
      actionUrl: "/checkout",
      actionLabel: "Use Rewards",
    });
  };

  const addVoucher = async (voucher: Omit<ClaimedVoucher, "id" | "used">): Promise<ClaimedVoucher> => {
    const newV: ClaimedVoucher = {
      ...voucher,
      id: `v_${Date.now()}`,
      used: false,
    };
    const updated = [newV, ...vouchers];
    await saveState(coins, dailyStreak, lastClaimDate, transactions, updated);
    return newV;
  };

  const useVoucher = async (code: string): Promise<ClaimedVoucher | null> => {
    const target = vouchers.find((v) => v.code.toUpperCase() === code.toUpperCase() && !v.used);
    if (!target) return null;
    const updated = vouchers.map((v) => (v.id === target.id ? { ...v, used: true } : v));
    await saveState(coins, dailyStreak, lastClaimDate, transactions, updated);
    return target;
  };

  return (
    <RewardsContext.Provider
      value={{
        coins,
        tier,
        tierLabel,
        tierMultiplier,
        transactions,
        vouchers,
        dailyStreak,
        claimedDailyToday,
        earnCoins,
        redeemCoins,
        claimDailyReward,
        addVoucher,
        useVoucher,
        loading,
      }}
    >
      {children}
    </RewardsContext.Provider>
  );
};

export const useRewards = () => {
  const ctx = useContext(RewardsContext);
  if (!ctx) throw new Error("useRewards must be used within RewardsProvider");
  return ctx;
};
