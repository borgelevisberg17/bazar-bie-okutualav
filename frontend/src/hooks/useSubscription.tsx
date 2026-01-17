import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface UserSubscription {
  id: string;
  user_id: string;
  plan: "free" | "basic" | "pro" | "enterprise";
  status: "active" | "pending" | "cancelled" | "expired";
  products_limit: number;
  products_used: number;
  photos_limit: number;
  badge: string | null;
  billing_cycle: string | null;
  expires_at: string | null;
  started_at: string;
  created_at: string;
}

export function useSubscription(userId?: string) {
  const [subscription, setSubscription] = useState<UserSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      fetchSubscription(userId);
    }
  }, [userId]);

  const fetchSubscription = async (uid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from("seller_subscriptions")
        .select("*")
        .eq("user_id", uid)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error fetching subscription:", error);
      }

      setSubscription(data || null);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const canPublish = (): boolean => {
    if (!subscription) return false;
    if (subscription.status !== "active") return false;
    if (subscription.plan === "free") return false;
    return subscription.products_used < subscription.products_limit;
  };

  const getRemainingProducts = (): number => {
    if (!subscription) return 0;
    return Math.max(0, subscription.products_limit - subscription.products_used);
  };

  const getPhotosLimit = (): number => {
    if (!subscription) return 0;
    return subscription.photos_limit || 1;
  };

  const hasVerifiedBadge = (): boolean => {
    if (!subscription) return false;
    return subscription.plan === "pro" || subscription.plan === "enterprise";
  };

  const isVIP = (): boolean => {
    if (!subscription) return false;
    return subscription.plan === "enterprise" && subscription.status === "active";
  };

  const refetch = () => {
    if (userId) {
      fetchSubscription(userId);
    }
  };

  return {
    subscription,
    isLoading,
    canPublish,
    getRemainingProducts,
    getPhotosLimit,
    hasVerifiedBadge,
    isVIP,
    refetch,
  };
}
