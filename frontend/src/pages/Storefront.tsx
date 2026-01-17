import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import { FollowButton } from "@/components/FollowButton";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Crown, 
  MapPin, 
  Store, 
  Package, 
  Grid3X3, 
  List,
  Loader2,
  ShieldCheck
} from "lucide-react";

interface Profile {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
  bio: string;
  location: string;
  storefront_name: string;
  storefront_description: string;
  storefront_banner_url: string;
  storefront_theme: string;
  followers_count: number;
  following_count: number;
}

interface Product {
  id: string;
  title: string;
  price: number;
  condition: string;
  image_url?: string;
  location?: string;
  category: string;
}

interface Subscription {
  plan: string;
  badge: string;
}

export default function Storefront() {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  useEffect(() => {
    fetchStorefront();
    getCurrentUser();
  }, [username]);

  const getCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);
  };

  const fetchStorefront = async () => {
    if (!username) return;

    try {
      // Find profile by username (using secure public view)
      const { data: profileData, error: profileError } = await supabase
        .from("public_profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);

      // Check if user is VIP
      const { data: subData } = await supabase
        .from("seller_subscriptions")
        .select("plan, badge")
        .eq("user_id", profileData.id)
        .eq("status", "active")
        .single();

      if (subData?.plan !== "enterprise") {
        // Not a VIP seller, redirect or show error
        setIsLoading(false);
        return;
      }

      setSubscription(subData);

      // Fetch products
      const { data: productsData } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", profileData.id)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (productsData) {
        setProducts(productsData);
        const uniqueCategories = [...new Set(productsData.map(p => p.category))];
        setCategories(uniqueCategories);
      }
    } catch (error) {
      console.error("Error fetching storefront:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredProducts = selectedCategory === "all" 
    ? products 
    : products.filter(p => p.category === selectedCategory);

  const themeStyles = {
    default: "from-primary to-secondary",
    gold: "from-amber-500 to-yellow-400",
    ocean: "from-blue-500 to-cyan-400",
    forest: "from-green-500 to-emerald-400",
    sunset: "from-orange-500 to-red-400",
    royal: "from-purple-500 to-pink-400",
  };

  const currentTheme = profile?.storefront_theme || "default";
  const gradientClass = themeStyles[currentTheme as keyof typeof themeStyles] || themeStyles.default;

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!profile || !subscription || subscription.plan !== "enterprise") {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 flex flex-col items-center justify-center px-4">
          <Store className="h-16 w-16 text-muted-foreground mb-4" />
          <h1 className="text-2xl font-bold mb-2">Loja não encontrada</h1>
          <p className="text-muted-foreground text-center">
            Esta vitrine não existe ou o vendedor não possui plano VIP.
          </p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-16">
        {/* Banner */}
        <div 
          className={`relative h-48 md:h-64 bg-gradient-to-r ${gradientClass}`}
          style={profile.storefront_banner_url ? {
            backgroundImage: `url(${profile.storefront_banner_url})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          } : undefined}
        >
          <div className="absolute inset-0 bg-black/30" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="flex items-end gap-4">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={profile.avatar_url} />
                <AvatarFallback className="text-2xl bg-background">
                  {profile.full_name?.charAt(0) || "V"}
                </AvatarFallback>
              </Avatar>
              <div className="mb-2">
                <div className="flex items-center gap-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-white drop-shadow-lg">
                    {profile.storefront_name || profile.full_name}
                  </h1>
                  <Crown className="h-6 w-6 text-amber-400" />
                </div>
                <p className="text-white/90 text-sm drop-shadow">@{profile.username}</p>
              </div>
            </div>
            {currentUserId && currentUserId !== profile.id && (
              <FollowButton targetUserId={profile.id} />
            )}
          </div>
        </div>

        {/* Store Info */}
        <div className="container mx-auto max-w-7xl px-4 py-6">
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <SubscriptionBadge plan="enterprise" />
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <ShieldCheck className="h-4 w-4 text-green-500" />
              Vendedor Verificado
            </div>
            {profile.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                {profile.location}
              </div>
            )}
            <div className="flex items-center gap-1 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              {products.length} produtos
            </div>
          </div>

          {profile.storefront_description && (
            <p className="text-muted-foreground mb-6 max-w-2xl">
              {profile.storefront_description}
            </p>
          )}

          {/* Category Tabs */}
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <TabsList className="h-auto flex-wrap">
                <TabsTrigger value="all">Todos</TabsTrigger>
                {categories.map(cat => (
                  <TabsTrigger key={cat} value={cat} className="capitalize">
                    {cat}
                  </TabsTrigger>
                ))}
              </TabsList>
              <div className="flex items-center gap-2">
                <Button
                  variant={viewMode === "grid" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("grid")}
                >
                  <Grid3X3 className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="icon"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            </div>

            <TabsContent value={selectedCategory} className="mt-6">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">Nenhum produto nesta categoria</p>
                </div>
              ) : viewMode === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={{
                        ...product,
                        profiles: {
                          full_name: profile.full_name,
                          avatar_url: profile.avatar_url
                        }
                      }}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {filteredProducts.map((product) => (
                    <div 
                      key={product.id} 
                      className="flex gap-4 p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => window.location.href = `/product/${product.id}`}
                    >
                      <img 
                        src={product.image_url || "/placeholder.svg"} 
                        alt={product.title}
                        className="w-24 h-24 object-cover rounded-lg"
                      />
                      <div className="flex-1">
                        <h3 className="font-medium">{product.title}</h3>
                        <p className="text-sm text-muted-foreground capitalize">{product.category}</p>
                        <p className="text-lg font-bold text-primary mt-2">
                          Kz {product.price.toLocaleString("pt-AO")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
