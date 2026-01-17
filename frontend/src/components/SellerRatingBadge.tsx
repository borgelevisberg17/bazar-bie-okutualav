import { Star } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface SellerRatingBadgeProps {
  sellerId: string;
  showCount?: boolean;
  size?: "sm" | "md" | "lg";
}

export default function SellerRatingBadge({ 
  sellerId, 
  showCount = true,
  size = "md" 
}: SellerRatingBadgeProps) {
  const { data } = useQuery({
    queryKey: ["seller-rating", sellerId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seller_reviews")
        .select("rating")
        .eq("seller_id", sellerId);

      if (error) throw error;
      
      if (!data || data.length === 0) {
        return { average: 0, count: 0 };
      }

      const average = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
      return { average: average.toFixed(1), count: data.length };
    },
  });

  if (!data || data.count === 0) return null;

  const sizeClasses = {
    sm: "text-xs gap-0.5",
    md: "text-sm gap-1",
    lg: "text-base gap-1",
  };

  const starSizes = {
    sm: "h-3 w-3",
    md: "h-4 w-4",
    lg: "h-5 w-5",
  };

  return (
    <div className={`inline-flex items-center ${sizeClasses[size]}`}>
      <Star className={`${starSizes[size]} fill-yellow-400 text-yellow-400`} />
      <span className="font-medium">{data.average}</span>
      {showCount && (
        <span className="text-muted-foreground">({data.count})</span>
      )}
    </div>
  );
}
