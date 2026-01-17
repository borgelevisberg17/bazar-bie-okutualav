import { useState, useEffect, useCallback, memo } from "react";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Button } from "./ui/button";
import { Heart, MessageCircle, Share2, Bookmark } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "./ui/carousel";
import { DescriptionWithMentions } from "./DescriptionWithMentions";
import { Skeleton } from "./ui/skeleton";

interface ProductCardProps {
  product: any;
  compact?: boolean;
}

// Lazy image component with shimmer
const LazyImage = memo(({ src, alt, className }: { src: string; alt: string; className?: string }) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error || !src) {
    return (
      <div className={cn("flex items-center justify-center bg-muted", className)}>
        <span className="text-4xl opacity-30">📦</span>
      </div>
    );
  }

  return (
    <div className={cn("relative", className)}>
      {!isLoaded && <Skeleton className="absolute inset-0" />}
      <img
        src={src}
        alt={alt}
        loading="lazy"
        className={cn(
          "w-full h-full object-cover transition-opacity duration-300",
          isLoaded ? "opacity-100" : "opacity-0"
        )}
        onLoad={() => setIsLoaded(true)}
        onError={() => setError(true)}
      />
    </div>
  );
});

LazyImage.displayName = "LazyImage";

export const ProductCard = memo(({ product, compact = false }: ProductCardProps) => {
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoriteId, setFavoriteId] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);

  useEffect(() => {
    checkUser();
    fetchCounts();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      checkFavorite(user.id);
    }
  };

  const fetchCounts = async () => {
    // Fetch favorites count
    const { count: favCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("product_id", product.id);
    setLikesCount(favCount || 0);

    // Fetch comments count
    const { count: commentCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("product_id", product.id);
    setCommentsCount(commentCount || 0);
  };

  const checkFavorite = async (userId: string) => {
    try {
      const { data } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", userId)
        .eq("product_id", product.id)
        .maybeSingle();

      if (data) {
        setIsFavorite(true);
        setFavoriteId(data.id);
      }
    } catch (error) {
      console.error("Error checking favorite:", error);
    }
  };

  const toggleFavorite = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error("Faça login para favoritar");
      navigate("/auth");
      return;
    }

    try {
      if (isFavorite && favoriteId) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("id", favoriteId);

        if (error) throw error;

        setIsFavorite(false);
        setFavoriteId(null);
        setLikesCount(prev => Math.max(0, prev - 1));
        toast.success("Removido dos favoritos");
      } else {
        const { data, error } = await supabase
          .from("favorites")
          .insert({
            user_id: user.id,
            product_id: product.id,
          })
          .select()
          .single();

        if (error) throw error;

        setIsFavorite(true);
        setFavoriteId(data.id);
        setLikesCount(prev => prev + 1);
        toast.success("Adicionado aos favoritos");
      }
    } catch (error: any) {
      toast.error("Erro ao atualizar favoritos");
      console.error("Error toggling favorite:", error);
    }
  }, [user, isFavorite, favoriteId, product.id, navigate]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const shareUrl = `${window.location.origin}/product/${product.id}`;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.title,
          text: `Confira: ${product.title} - ${product.price.toLocaleString("pt-AO")} Kz`,
          url: shareUrl,
        });
      } catch (error) {
        console.error("Error sharing:", error);
      }
    } else {
      navigator.clipboard.writeText(shareUrl);
      toast.success("Link copiado!");
    }
  }, [product.id, product.title, product.price]);

  const handleComment = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    navigate(`/product/${product.id}#comments`);
  }, [navigate, product.id]);

  const seller = product.profiles || {};
  const images = product.images && product.images.length > 0 
    ? product.images 
    : product.image_url 
    ? [product.image_url] 
    : [];

  // Compact view for grid
  if (compact) {
    return (
      <Link to={`/product/${product.id}`} className="block">
        <div className="relative group rounded-lg overflow-hidden">
          <div className="aspect-square overflow-hidden bg-muted">
            {images.length > 0 ? (
              <LazyImage
                src={images[0]}
                alt={product.title}
                className="w-full h-full group-hover:scale-105 transition-transform duration-300"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-4xl opacity-30">📦</span>
              </div>
            )}
          </div>
          
          {/* Overlay on hover - desktop only */}
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity hidden md:flex items-center justify-center gap-6">
            <div className="flex items-center gap-1 text-white">
              <Heart className="h-5 w-5 fill-white" />
              <span className="font-semibold">{likesCount}</span>
            </div>
            <div className="flex items-center gap-1 text-white">
              <MessageCircle className="h-5 w-5 fill-white" />
              <span className="font-semibold">{commentsCount}</span>
            </div>
          </div>

          {/* Multiple images indicator */}
          {images.length > 1 && (
            <div className="absolute top-2 right-2">
              <div className="bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded">
                1/{images.length}
              </div>
            </div>
          )}
          
          {/* Price tag on mobile */}
          <div className="md:hidden absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
            <p className="text-white text-sm font-bold">
              {product.price.toLocaleString("pt-AO")} Kz
            </p>
          </div>
        </div>
      </Link>
    );
  }

  // Full view for list/feed
  return (
    <Card className="overflow-hidden border-0 md:border md:border-border/50 bg-card rounded-none md:rounded-lg">
      {/* Post Header - Seller Info */}
      <Link to={`/user/${product.user_id}`} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-3 px-3 py-2.5 hover:bg-accent/30 transition-colors">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarImage src={seller.avatar_url} />
            <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xs font-semibold">
              {seller.full_name?.charAt(0) || "U"}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm truncate">{seller.full_name || "Vendedor"}</p>
            {product.location && (
              <p className="text-xs text-muted-foreground truncate">{product.location}</p>
            )}
          </div>
          <Badge
            variant={product.condition === "new" ? "default" : "secondary"}
            className={cn(
              "text-[10px] px-2 py-0.5",
              product.condition === "new" 
                ? "bg-success/90 text-success-foreground"
                : "bg-muted"
            )}
          >
            {product.condition === "new" ? "Novo" : "Usado"}
          </Badge>
        </div>
      </Link>

      {/* Product Images */}
      <Link to={`/product/${product.id}`}>
        <div className="relative aspect-square overflow-hidden bg-muted">
          {images.length > 0 ? (
            images.length === 1 ? (
              <img
                src={images[0]}
                alt={product.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <Carousel className="w-full h-full">
                <CarouselContent>
                  {images.map((img: string, index: number) => (
                    <CarouselItem key={index}>
                      <img
                        src={img}
                        alt={`${product.title} - ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="left-2 h-8 w-8" />
                <CarouselNext className="right-2 h-8 w-8" />
                <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
                  1/{images.length}
                </div>
              </Carousel>
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-6xl opacity-30">📦</span>
            </div>
          )}
        </div>
      </Link>

      {/* Social Actions */}
      <div className="flex items-center px-1 py-1">
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={toggleFavorite}
        >
          <Heart 
            className={cn(
              "h-6 w-6 transition-all",
              isFavorite ? "fill-red-500 text-red-500 scale-110" : "hover:scale-110"
            )}
          />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={handleComment}
        >
          <MessageCircle className="h-6 w-6" />
        </Button>
        
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={handleShare}
        >
          <Share2 className="h-6 w-6" />
        </Button>

        <div className="flex-1" />
        
        <Button
          size="icon"
          variant="ghost"
          className="h-10 w-10"
          onClick={toggleFavorite}
        >
          <Bookmark 
            className={cn(
              "h-6 w-6 transition-all",
              isFavorite ? "fill-foreground" : ""
            )}
          />
        </Button>
      </div>

      {/* Likes count */}
      {likesCount > 0 && (
        <div className="px-3 pb-1">
          <p className="text-sm font-semibold">{likesCount} curtida{likesCount !== 1 ? "s" : ""}</p>
        </div>
      )}

      {/* Post Content */}
      <div className="px-3 pb-3 space-y-1">
        <Link to={`/product/${product.id}`}>
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-primary">
              {product.price.toLocaleString("pt-AO")} Kz
            </span>
          </div>
          <h3 className="font-semibold text-sm line-clamp-1">
            {product.title}
          </h3>
        </Link>
        
        {product.description && (
          <div className="pt-0.5">
            <span className="font-semibold text-sm mr-1">{seller.full_name || "Vendedor"}</span>
            <DescriptionWithMentions description={product.description} maxLength={80} />
          </div>
        )}

        {commentsCount > 0 && (
          <button 
            onClick={handleComment}
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Ver todos os {commentsCount} comentários
          </button>
        )}
      </div>
    </Card>
  );
});

ProductCard.displayName = "ProductCard";
