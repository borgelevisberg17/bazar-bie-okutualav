import { useEffect, useState, memo, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Crown, ChevronRight, Sparkles } from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface Product {
  id: string;
  title: string;
  price: number;
  image_url?: string;
  images?: string[];
  is_boosted?: boolean;
  is_vip?: boolean;
}

// Lazy image with shimmer
const ProductImage = memo(({ src, alt }: { src?: string; alt: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-muted">
        <span className="text-3xl opacity-30">📦</span>
      </div>
    );
  }

  return (
    <>
      {!isLoaded && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={`w-full h-full object-cover group-hover:scale-105 transition-all duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
      />
    </>
  );
});

ProductImage.displayName = "ProductImage";

export const FeaturedProducts = memo(function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      // Fetch VIP featured products (Pro and Enterprise)
      const { data: premiumSubs } = await supabase
        .from("seller_subscriptions")
        .select("user_id, plan")
        .in("plan", ["pro", "enterprise"])
        .eq("status", "active");

      const premiumUserIds = premiumSubs?.map(s => s.user_id) || [];
      const vipUserIds = premiumSubs?.filter(s => s.plan === "enterprise").map(s => s.user_id) || [];

      // Fetch active boosts
      const { data: activeBoosts } = await supabase
        .from("product_boosts")
        .select("product_id")
        .eq("status", "active")
        .in("boost_type", ["featured_24h", "featured_7d", "top_boost"])
        .gte("expires_at", new Date().toISOString());

      const boostedProductIds = activeBoosts?.map(b => b.product_id) || [];

      if (premiumUserIds.length > 0 || boostedProductIds.length > 0) {
        const orConditions = [];
        if (premiumUserIds.length > 0) {
          orConditions.push(`user_id.in.(${premiumUserIds.join(',')})`);
        }
        if (boostedProductIds.length > 0) {
          orConditions.push(`id.in.(${boostedProductIds.join(',')})`);
        }

        const { data: productsData, error } = await supabase
          .from("products")
          .select("id, title, price, image_url, images, user_id")
          .eq("status", "active")
          .or(orConditions.join(','))
          .order("created_at", { ascending: false })
          .limit(12);

        if (error) throw error;

        // Mark VIP and boosted products
        const enrichedProducts = (productsData || []).map(p => ({
          ...p,
          is_vip: vipUserIds.includes(p.user_id),
          is_boosted: boostedProductIds.includes(p.id)
        }));

        setProducts(enrichedProducts);
      }
    } catch (error) {
      console.error("Error fetching featured products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  if (isLoading || products.length === 0) return null;

  return (
    <div className="py-4 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-amber-600">
            <Crown className="h-4 w-4 text-white" />
          </div>
          <h2 className="font-bold text-base">Em Destaque</h2>
        </div>
        <Link to="/explore" className="flex items-center gap-1 text-sm text-primary hover:underline">
          Ver mais
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Horizontal scroll */}
      <div className="flex gap-2 overflow-x-auto px-4 pb-2 scrollbar-hide">
        {products.map((product) => {
          const image = product.images?.[0] || product.image_url;
          return (
            <Link 
              key={product.id} 
              to={`/product/${product.id}`}
              className="flex-shrink-0 w-32 group"
            >
              <div className={`relative aspect-square rounded-lg overflow-hidden bg-muted mb-1.5 ${
                product.is_vip ? 'ring-2 ring-amber-500/50' : product.is_boosted ? 'ring-2 ring-primary/30' : ''
              }`}>
                <ProductImage src={image} alt={product.title} />
                {(product.is_vip || product.is_boosted) && (
                  <div className="absolute top-1 left-1">
                    <div className={`p-1 rounded-full ${product.is_vip ? 'bg-amber-500' : 'bg-primary'}`}>
                      {product.is_vip ? (
                        <Crown className="h-2.5 w-2.5 text-white" />
                      ) : (
                        <Sparkles className="h-2.5 w-2.5 text-white" />
                      )}
                    </div>
                  </div>
                )}
              </div>
              <p className="text-xs font-semibold text-primary">
                {product.price.toLocaleString("pt-AO")} Kz
              </p>
              <p className="text-xs text-muted-foreground line-clamp-1">
                {product.title}
              </p>
            </Link>
          );
        })}
      </div>
    </div>
  );
});
