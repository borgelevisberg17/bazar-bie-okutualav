import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Users } from "lucide-react";

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  image_url: string;
  images: string[];
  category: string;
  condition: string;
  location: string;
  user_id: string;
  created_at: string;
  profiles: {
    full_name: string;
    avatar_url: string;
  };
}

export default function Following() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [followingCount, setFollowingCount] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    fetchFollowingFeed();
  }, []);

  const fetchFollowingFeed = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      // Get list of users the current user follows
      const { data: followingData, error: followingError } = await (supabase as any)
        .from("follows")
        .select("following_id")
        .eq("follower_id", user.id);

      if (followingError) throw followingError;

      const followingIds = followingData?.map((f: any) => f.following_id) || [];
      setFollowingCount(followingIds.length);

      if (followingIds.length === 0) {
        setProducts([]);
        setIsLoading(false);
        return;
      }

      // Fetch products from followed users
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select(`
          *,
          profiles!products_user_id_fkey (
            full_name,
            avatar_url
          )
        `)
        .in("user_id", followingIds)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(50);

      if (productsError) throw productsError;
      setProducts((productsData as any) || []);
    } catch (error) {
      console.error("Error fetching following feed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">Seguindo</h1>
            <span className="text-muted-foreground">
              ({followingCount} {followingCount === 1 ? "pessoa" : "pessoas"})
            </span>
          </div>

          {/* Feed */}
          {products.length === 0 ? (
            <Card className="p-12 text-center">
              <div className="max-w-md mx-auto space-y-4">
                <div className="text-6xl opacity-50">👥</div>
                <h2 className="text-xl font-semibold">Nenhum produto ainda</h2>
                <p className="text-muted-foreground">
                  {followingCount === 0
                    ? "Você ainda não segue ninguém. Explore e encontre pessoas para seguir!"
                    : "As pessoas que você segue ainda não publicaram produtos."}
                </p>
                <Button onClick={() => navigate("/explore")}>
                  Explorar Produtos
                </Button>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
