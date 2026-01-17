import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { FollowersModal } from "@/components/FollowersModal";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import SellerRatingBadge from "@/components/SellerRatingBadge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { 
  Loader2, LogOut, Settings, MapPin, Globe, Grid3x3, Store, 
  CreditCard, Heart, Package, ShoppingBag, ChevronRight, Camera, Tag, HelpCircle, FileText, Shield, Crown
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useSubscription } from "@/hooks/useSubscription";

export default function Profile() {
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState<"followers" | "following" | null>(null);
  const navigate = useNavigate();
  const { subscription } = useSubscription(user?.id);

  useEffect(() => {
    checkUser();
  }, []);

  // Fetch products when profile is loaded
  useEffect(() => {
    if (user && profile) {
      fetchUserProducts(user.id);
    }
  }, [user, profile]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);
    await fetchProfile(user.id);
    setIsLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const fetchUserProducts = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Add profile info to products
      const productsWithProfile = (data || []).map((p: any) => ({
        ...p,
        profiles: profile
      }));
      
      setProducts(productsWithProfile);
    } catch (error) {
      console.error("Error fetching user products:", error);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Saiu com sucesso");
      navigate("/auth");
    } catch (error: any) {
      toast.error("Erro ao sair");
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background">
          {/* Skeleton loading */}
          <div className="h-32 md:h-48 bg-gradient-to-br from-muted to-muted/50 animate-pulse" />
          <div className="max-w-2xl mx-auto px-4 md:px-6">
            <div className="relative -mt-16 md:-mt-20 mb-4">
              <div className="h-28 w-28 md:h-36 md:w-36 rounded-full bg-muted animate-pulse ring-4 ring-background" />
            </div>
            <div className="space-y-2 mb-4">
              <div className="h-8 w-48 bg-muted rounded animate-pulse" />
              <div className="h-4 w-24 bg-muted rounded animate-pulse" />
            </div>
            <div className="flex gap-6 py-4 border-y border-border mb-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="text-center">
                  <div className="h-6 w-12 bg-muted rounded animate-pulse mx-auto mb-1" />
                  <div className="h-3 w-16 bg-muted rounded animate-pulse" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        {/* Profile Header - Edge to Edge */}
        <div className="relative">
          {/* Cover/Banner Area */}
          <div className="h-32 md:h-48 bg-gradient-to-br from-primary via-primary/80 to-marketplace-orange" />
          
          {/* Profile Content */}
          <div className="max-w-2xl mx-auto px-4 md:px-6">
            {/* Avatar - Overlapping cover */}
            <div className="relative -mt-16 md:-mt-20 mb-4">
              <div className="relative inline-block">
                <Avatar className="h-28 w-28 md:h-36 md:w-36 ring-4 ring-background shadow-xl">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-primary/10 text-primary text-3xl md:text-4xl font-bold">
                    {profile?.full_name?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <button 
                  onClick={() => navigate("/settings")}
                  className="absolute bottom-1 right-1 p-2 bg-primary rounded-full text-primary-foreground shadow-lg hover:scale-105 transition-transform"
                >
                  <Camera className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Name and Username */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile?.full_name || "Usuário"}
                </h1>
                {subscription && subscription.status === "active" && (
                  <SubscriptionBadge plan={subscription.plan} />
                )}
                <SellerRatingBadge sellerId={user?.id} />
              </div>
              {profile?.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>

            {/* Bio */}
            {profile?.bio && (
              <p className="text-foreground mb-4 leading-relaxed">{profile.bio}</p>
            )}

            {/* Location and Website */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-6">
              {profile?.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile?.website && (
                <a 
                  href={profile.website} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-primary transition-colors"
                >
                  <Globe className="h-4 w-4" />
                  {profile.website.replace(/^https?:\/\//, '')}
                </a>
              )}
            </div>

            {/* Stats Row */}
            <div className="flex gap-6 py-4 border-y border-border mb-6">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold">{products.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Produtos</p>
              </div>
              <button
                onClick={() => setModalOpen("followers")}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <p className="text-xl md:text-2xl font-bold">{profile?.followers_count || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Seguidores</p>
              </button>
              <button
                onClick={() => setModalOpen("following")}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <p className="text-xl md:text-2xl font-bold">{profile?.following_count || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Seguindo</p>
              </button>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <Button 
                onClick={() => navigate("/settings")}
                variant="outline"
                className="w-full h-11 font-medium"
              >
                <Settings className="h-4 w-4 mr-2" />
                Editar Perfil
              </Button>
              <Button 
                onClick={handleSignOut}
                variant="outline"
                className="w-full h-11 font-medium"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Actions Menu */}
        <div className="max-w-2xl mx-auto px-4 md:px-6 mb-6">
          <div className="bg-card rounded-xl border border-border divide-y divide-border overflow-hidden">
            {subscription && subscription.status === "active" && subscription.plan !== "free" && (
              <button 
                onClick={() => navigate("/seller")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium">Painel de Vendas</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            )}
            
            {subscription && subscription.plan === "enterprise" && profile?.username && (
              <button 
                onClick={() => navigate(`/loja/${profile.username}`)}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-500/10 rounded-lg">
                    <Store className="h-5 w-5 text-amber-600" />
                  </div>
                  <span className="font-medium">Minha Vitrine VIP</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            )}

              {/* VIP: Coupons */}
              {subscription && (subscription.plan === "pro" || subscription.plan === "enterprise") && (
                <button 
                  onClick={() => navigate("/coupons")}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-orange-500/10 rounded-lg">
                      <Tag className="h-5 w-5 text-orange-600" />
                    </div>
                    <span className="font-medium">Meus Cupons</span>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </button>
              )}

              <button 
                onClick={() => navigate("/subscription")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-500/10 rounded-lg">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <span className="font-medium block">
                      {subscription && subscription.status === "active" && subscription.plan !== "free" 
                        ? "Minha Assinatura" 
                        : "Seja um Vendedor"}
                    </span>
                    {(!subscription || subscription.plan === "free" || subscription.status !== "active") && (
                      <span className="text-xs text-muted-foreground">Comece a vender hoje</span>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Upgrade Plan - for non-enterprise users */}
              {subscription && subscription.status === "active" && subscription.plan !== "enterprise" && subscription.plan !== "free" && (
                <button 
                  onClick={() => navigate("/subscription")}
                  className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors bg-gradient-to-r from-amber-500/5 to-amber-600/5"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Crown className="h-5 w-5 text-amber-600" />
                    </div>
                    <div className="text-left">
                      <span className="font-medium block">Fazer Upgrade</span>
                      <span className="text-xs text-muted-foreground">Mais recursos e menos taxas</span>
                    </div>
                  </div>
                  <Badge variant="secondary" className="bg-amber-500/10 text-amber-600 border-0">
                    {subscription.plan === "basic" ? "Pro ou VIP" : "VIP"}
                  </Badge>
                </button>
              )}

              <button
              onClick={() => navigate("/orders")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Package className="h-5 w-5 text-blue-600" />
                </div>
                <span className="font-medium">Meus Pedidos</span>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </button>

            <button 
              onClick={() => navigate("/favorites")}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
            >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-red-500/10 rounded-lg">
                    <Heart className="h-5 w-5 text-red-500" />
                  </div>
                  <span className="font-medium">Favoritos</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              {/* Legal Section */}
              <div className="h-px bg-border my-2" />
              
              <button 
                onClick={() => navigate("/help")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-500/10 rounded-lg">
                    <HelpCircle className="h-5 w-5 text-purple-600" />
                  </div>
                  <span className="font-medium">Ajuda</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate("/terms")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-500/10 rounded-lg">
                    <FileText className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="font-medium">Termos de Uso</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>

              <button 
                onClick={() => navigate("/privacy")}
                className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-gray-500/10 rounded-lg">
                    <Shield className="h-5 w-5 text-gray-600" />
                  </div>
                  <span className="font-medium">Privacidade</span>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </button>
            </div>
          </div>

        {/* Products Section */}
        <div className="max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto px-4 md:px-6 pb-24 md:pb-8">
          <div className="flex items-center gap-2 mb-4">
            <Grid3x3 className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Minhas Publicações</h2>
          </div>

          {products.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-xl border border-border">
              <div className="mb-4 flex justify-center">
                <div className="p-4 bg-muted rounded-full">
                  <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                </div>
              </div>
              <h3 className="font-semibold mb-2">Nenhum produto ainda</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Comece a vender publicando seu primeiro produto
              </p>
              <Button
                onClick={() => navigate("/post")}
                className="bg-gradient-to-r from-primary to-marketplace-orange"
              >
                Publicar Produto
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  compact
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Followers/Following Modal */}
      {user && (
        <>
          <FollowersModal
            isOpen={modalOpen === "followers"}
            onClose={() => setModalOpen(null)}
            userId={user.id}
            type="followers"
            title="Seguidores"
          />
          <FollowersModal
            isOpen={modalOpen === "following"}
            onClose={() => setModalOpen(null)}
            userId={user.id}
            type="following"
            title="Seguindo"
          />
        </>
      )}
    </>
  );
}
