import { Badge } from "@/components/ui/badge";
import { Star, Crown, Shield } from "lucide-react";

interface SubscriptionBadgeProps {
  plan: "free" | "basic" | "pro" | "enterprise" | string;
  size?: "sm" | "md";
}

export function SubscriptionBadge({ plan, size = "sm" }: SubscriptionBadgeProps) {
  if (plan === "free" || plan === "basic" || !plan) {
    return null;
  }

  const config = {
    pro: {
      label: "Vendedor Verificado",
      icon: Shield,
      className: "bg-purple-500 text-white hover:bg-purple-600",
    },
    enterprise: {
      label: "Vendedor VIP",
      icon: Crown,
      className: "bg-gradient-to-r from-amber-500 to-amber-600 text-white hover:from-amber-600 hover:to-amber-700",
    },
  };

  const badgeConfig = config[plan as keyof typeof config];
  if (!badgeConfig) return null;

  const Icon = badgeConfig.icon;
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-xs" : "text-sm";

  return (
    <Badge className={`${badgeConfig.className} ${textSize} flex items-center gap-1`}>
      <Icon className={iconSize} />
      {badgeConfig.label}
    </Badge>
  );
}
