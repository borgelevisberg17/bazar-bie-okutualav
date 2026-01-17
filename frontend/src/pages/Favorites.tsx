import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ProductCard } from "@/components/ProductCard";
import { Loader2, Heart, ArrowLeft, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";

export default function Favorites() {
  const [user, setUser] = useState<any>(null);
  const [favorites, setFavorites] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para ver seus favoritos");
      navigate("/auth");
      return;
    }

    setUser(user);
    await fetchFavorites(user.id);
    setIsLoading(false);
  };

  const fetchFavorites = async (userId: string) => {
    try {
      const { data: favoritesData, error } = await supabase
        .from("favorites")
        .select(`
          id,
          product_id,
          products (*)
        `)
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch public profiles for all product sellers
      if (favoritesData && favoritesData.length > 0) {
        const products = favoritesData.map((f: any) => f.products).filter(Boolean);
        const userIds = [...new Set(products.map((p: any) => p.user_id))];
        
        const { data: profilesData } = await supabase
          .from("public_profiles" as any)
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        // Map profiles to favorites
        const favoritesWithProfiles = favoritesData.map((favorite: any) => ({
          ...favorite,
          products: favorite.products ? {
            ...favorite.products,
            profiles: (profilesData as any)?.find((p: any) => p.id === favorite.products.user_id) || {}
          } : null
        }));

        setFavorites(favoritesWithProfiles);
      } else {
        setFavorites([]);
      }
    } catch (error) {
      console.error("Error fetching favorites:", error);
      toast.error("Erro ao carregar favoritos");
    }
  };

  const handleRemoveFavorite = async (favoriteId: string) => {
    try {
      const { error } = await supabase
        .from("favorites")
        .delete()
        .eq("id", favoriteId);

      if (error) throw error;

      setFavorites(favorites.filter(f => f.id !== favoriteId));
      toast.success("Removido dos favoritos");
    } catch (error) {
      console.error("Error removing favorite:", error);
      toast.error("Erro ao remover favorito");
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
      <div className="min-h-screen bg-background">
        {/* Header - Edge to Edge */}
        <div className="sticky top-0 z-40 bg-background/95 backdrop-blur-md border-b border-border">
          <div className="max-w-2xl mx-auto px-4 md:px-6">
            <div className="flex items-center gap-3 h-14 md:h-16">
              <button 
                onClick={() => navigate(-1)}
                className="p-2 -ml-2 hover:bg-muted rounded-full transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-gradient-to-br from-red-500 to-pink-500 rounded-lg">
                  <Heart className="h-4 w-4 text-white" fill="white" />
                </div>
                <h1 className="text-lg font-semibold">Favoritos</h1>
              </div>
              <span className="ml-auto text-sm text-muted-foreground">
                {favorites.length} {favorites.length === 1 ? 'item' : 'itens'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="max-w-2xl mx-auto px-4 md:px-6 py-4 pb-24 md:pb-8">
          {favorites.length === 0 ? (
            <div className="text-center py-16">
              <div className="mb-6 flex justify-center">
                <div className="relative">
                  <div className="p-6 bg-gradient-to-br from-red-100 to-pink-100 dark:from-red-900/20 dark:to-pink-900/20 rounded-full">
                    <Heart className="h-12 w-12 text-red-400" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 p-2 bg-muted rounded-full">
                    <span className="text-lg">✨</span>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">Sua lista está vazia</h3>
              <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
                Explore produtos incríveis e salve seus favoritos para ver aqui
              </p>
              <Button
                onClick={() => navigate("/explore")}
                className="bg-gradient-to-r from-primary to-marketplace-orange"
              >
                Explorar Produtos
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {favorites.map((favorite) => (
                <div 
                  key={favorite.id} 
                  className="relative bg-card rounded-xl border border-border overflow-hidden group"
                >
                  <div className="flex gap-3 p-3">
                    {/* Product Image */}
                    <div 
                      className="w-24 h-24 md:w-28 md:h-28 rounded-lg overflow-hidden bg-muted flex-shrink-0 cursor-pointer"
                      onClick={() => navigate(`/product/${favorite.products?.id}`)}
                    >
                      <img 
                        src={favorite.products?.image_url || '/placeholder.svg'} 
                        alt={favorite.products?.title}
                        className="w-full h-full object-cover"
                      />
                    </div>

                    {/* Product Info */}
                    <div 
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => navigate(`/product/${favorite.products?.id}`)}
                    >
                      <h3 className="font-medium text-sm md:text-base line-clamp-2 mb-1">
                        {favorite.products?.title}
                      </h3>
                      <p className="text-lg md:text-xl font-bold text-primary">
                        {new Intl.NumberFormat('pt-AO', {
                          style: 'currency',
                          currency: 'AOA',
                          minimumFractionDigits: 0,
                        }).format(favorite.products?.price || 0)}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          favorite.products?.condition === 'novo' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {favorite.products?.condition === 'novo' ? 'Novo' : 'Usado'}
                        </span>
                        {favorite.products?.location && (
                          <span className="text-xs text-muted-foreground truncate">
                            {favorite.products.location}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => handleRemoveFavorite(favorite.id)}
                      className="p-2 h-fit hover:bg-red-100 dark:hover:bg-red-900/30 rounded-full transition-colors group/btn"
                    >
                      <Trash2 className="h-4 w-4 text-muted-foreground group-hover/btn:text-red-500" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
