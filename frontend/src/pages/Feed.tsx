import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { CategoryStories } from "@/components/CategoryStories";
import { FeaturedProducts } from "@/components/FeaturedProducts";
import { ProductGridSkeleton, FeaturedProductsSkeleton, CategoryStoriesSkeleton } from "@/components/ui/ProductCardSkeleton";

interface Product {
  id: string;
  title: string;
  price: number;
  condition: "new" | "used";
  image_url?: string;
  location?: string;
  profiles: {
    full_name: string;
    avatar_url?: string;
  };
}

export default function Feed() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFeaturedLoading, setIsFeaturedLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
    // Simulate featured products loading
    const timer = setTimeout(() => setIsFeaturedLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      const { data: productsData, error } = await supabase
        .from("products")
        .select("id, title, price, condition, image_url, images, location, user_id, description, category, created_at, status")
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;

      if (productsData && productsData.length > 0) {
        const userIds = [...new Set(productsData.map((p) => p.user_id))];
        const { data: profilesData } = await supabase
          .from("public_profiles" as any)
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        const productsWithProfiles = productsData.map((product) => ({
          ...product,
          profiles: (profilesData as any)?.find((p: any) => p.id === product.user_id) || {}
        }));

        setProducts(productsWithProfiles as Product[]);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const memoizedProducts = useMemo(() => products, [products]);

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-14 pb-20 md:pt-16 md:pb-4">
        {/* Categories - Edge to edge on mobile */}
        <div className="border-b border-border/50 bg-background sticky top-14 md:top-16 z-40">
          <div className="py-3 px-2 md:px-4 overflow-x-auto">
            {isLoading ? (
              <CategoryStoriesSkeleton />
            ) : (
              <CategoryStories variant="stories" />
            )}
          </div>
        </div>

        {/* Featured Products */}
        <div className="px-0 md:px-4">
          {isFeaturedLoading ? (
            <FeaturedProductsSkeleton />
          ) : (
            <FeaturedProducts />
          )}
        </div>

        {isLoading ? (
          <ProductGridSkeleton count={4} />
        ) : memoizedProducts.length === 0 ? (
          <div className="text-center py-20 px-4 animate-fade-in">
            <div className="mb-6">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full flex items-center justify-center">
                <span className="text-4xl">🛍️</span>
              </div>
            </div>
            <p className="text-lg font-medium text-foreground mb-2">
              Nenhum produto publicado
            </p>
            <p className="text-sm text-muted-foreground mb-4">
              Seja o primeiro a vender!
            </p>
            <Button
              onClick={() => window.location.href = "/post"}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              Publicar Agora
            </Button>
          </div>
        ) : (
          <div className="space-y-0 md:space-y-4 md:px-4 md:max-w-[600px] lg:max-w-4xl xl:max-w-6xl md:mx-auto">
            {/* Desktop: Grid layout, Mobile: List */}
            <div className="hidden md:grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {memoizedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  compact
                />
              ))}
            </div>
            <div className="md:hidden">
              {memoizedProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
