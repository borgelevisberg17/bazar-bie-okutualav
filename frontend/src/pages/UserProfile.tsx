import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { FollowButton } from "@/components/FollowButton";
import { FollowersModal } from "@/components/FollowersModal";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import SellerRatingBadge from "@/components/SellerRatingBadge";
import SellerReviews from "@/components/SellerReviews";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Loader2, MapPin, Globe, Grid3x3, MessageCircle, Star, ShoppingBag } from "lucide-react";

interface UserProfileData {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  location: string | null;
  website: string | null;
  followers_count: number;
  following_count: number;
  seller_rating: number | null;
  seller_reviews_count: number | null;
}

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<"followers" | "following" | null>(null);
  const [userSubscription, setUserSubscription] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<"products" | "reviews">("products");

  useEffect(() => {
    if (userId) {
      checkCurrentUser();
      fetchProfile();
      fetchUserProducts();
      fetchUserSubscription();
    }
  }, [userId]);

  const fetchUserSubscription = async () => {
    if (!userId) return;
    const { data } = await (supabase as any)
      .from("seller_subscriptions")
      .select("plan, status")
      .eq("user_id", userId)
      .eq("status", "active")
      .single();
    setUserSubscription(data);
  };

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUserId(user?.id || null);

    // If viewing own profile, redirect to /profile
    if (user?.id === userId) {
      navigate("/profile");
      return;
    }
  };

  const fetchProfile = async () => {
    try {
      // Use secure public view to prevent exposing sensitive data
      const { data, error } = await supabase
        .from("public_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      setProfile(data as UserProfileData);
    } catch (error) {
      console.error("Error fetching profile:", error);
      navigate("/");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUserProducts = async () => {
    try {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setProducts((data as any) || []);
    } catch (error) {
      console.error("Error fetching user products:", error);
    }
  };

  const handleFollowChange = (isFollowing: boolean) => {
    if (profile) {
      setProfile({
        ...profile,
        followers_count: profile.followers_count + (isFollowing ? 1 : -1),
      });
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

  if (!profile) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Perfil não encontrado</p>
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
          <div className="h-32 md:h-48 bg-gradient-to-br from-primary/80 via-primary/60 to-marketplace-orange/80" />
          
          {/* Profile Content */}
          <div className="max-w-2xl mx-auto px-4 md:px-6">
            {/* Avatar - Overlapping cover */}
            <div className="relative -mt-16 md:-mt-20 mb-4">
              <Avatar className="h-28 w-28 md:h-36 md:w-36 ring-4 ring-background shadow-xl">
                <AvatarImage src={profile.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-3xl md:text-4xl font-bold">
                  {profile.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* Name and Username */}
            <div className="space-y-1 mb-4">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl md:text-3xl font-bold">
                  {profile.full_name || "Usuário"}
                </h1>
                {userSubscription && userSubscription.status === "active" && (
                  <SubscriptionBadge plan={userSubscription.plan} />
                )}
                <SellerRatingBadge sellerId={profile.id} />
              </div>
              {profile.username && (
                <p className="text-muted-foreground">@{profile.username}</p>
              )}
            </div>

            {/* Bio */}
            {profile.bio && (
              <p className="text-foreground mb-4 leading-relaxed">{profile.bio}</p>
            )}

            {/* Location and Website */}
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
              {profile.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4" />
                  {profile.location}
                </span>
              )}
              {profile.website && (
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
            <div className="flex gap-6 py-4 border-y border-border mb-4">
              <div className="text-center">
                <p className="text-xl md:text-2xl font-bold">{products.length}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Produtos</p>
              </div>
              <button
                onClick={() => setModalOpen("followers")}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <p className="text-xl md:text-2xl font-bold">{profile.followers_count || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Seguidores</p>
              </button>
              <button
                onClick={() => setModalOpen("following")}
                className="text-center hover:opacity-70 transition-opacity"
              >
                <p className="text-xl md:text-2xl font-bold">{profile.following_count || 0}</p>
                <p className="text-xs md:text-sm text-muted-foreground">Seguindo</p>
              </button>
            </div>

            {/* Follow Button */}
            <div className="mb-6">
              <FollowButton
                targetUserId={profile.id}
                onFollowChange={handleFollowChange}
                className="w-full h-11"
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-2xl mx-auto px-4 md:px-6">
          <div className="flex border-b border-border mb-4">
            <button
              onClick={() => setActiveTab("products")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "products"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Grid3x3 className="h-4 w-4 mx-auto mb-1" />
              Produtos
            </button>
            <button
              onClick={() => setActiveTab("reviews")}
              className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "reviews"
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Star className="h-4 w-4 mx-auto mb-1" />
              Avaliações
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 md:px-6 pb-24 md:pb-8">
          {activeTab === "products" ? (
            <>
              {products.length === 0 ? (
                <div className="text-center py-12 bg-card rounded-xl border border-border">
                  <div className="mb-4 flex justify-center">
                    <div className="p-4 bg-muted rounded-full">
                      <ShoppingBag className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </div>
                  <h3 className="font-semibold mb-2">Nenhum produto ainda</h3>
                  <p className="text-sm text-muted-foreground">
                    Este usuário ainda não publicou produtos
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 md:gap-4">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </>
          ) : (
            <SellerReviews sellerId={profile.id} />
          )}
        </div>
      </div>

      {/* Followers/Following Modal */}
      <FollowersModal
        isOpen={modalOpen === "followers"}
        onClose={() => setModalOpen(null)}
        userId={profile.id}
        type="followers"
        title="Seguidores"
      />
      <FollowersModal
        isOpen={modalOpen === "following"}
        onClose={() => setModalOpen(null)}
        userId={profile.id}
        type="following"
        title="Seguindo"
      />
    </>
  );
}
