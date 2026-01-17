import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MapPin, Loader2, ArrowLeft, Phone, Share2, ShoppingCart, Heart, MessageCircle, ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { CommentSection } from "@/components/CommentSection";
import { DescriptionWithMentions } from "@/components/DescriptionWithMentions";
import { useCart } from "@/hooks/useCart";
import ProductReviews from "@/components/ProductReviews";
import SellerRatingBadge from "@/components/SellerRatingBadge";
import { AddToWishlistButton } from "@/components/AddToWishlistButton";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [contactInfo, setContactInfo] = useState<{ whatsapp: string } | null>(null);
  const [isLoadingContact, setIsLoadingContact] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [likesCount, setLikesCount] = useState(0);
  const [commentsCount, setCommentsCount] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const { addToCart } = useCart();

  useEffect(() => {
    if (id) {
      fetchProduct();
      fetchInteractions();
      checkCurrentUser();
      trackProductView();
    }
  }, [id]);

  const trackProductView = async () => {
    if (!id) return;
    const { data: { user } } = await supabase.auth.getUser();
    try {
      await supabase.from("product_views").insert({
        product_id: id,
        viewer_id: user?.id || null,
        referrer: document.referrer || null
      });
    } catch (error) {
      // Silently fail - view tracking shouldn't break the page
    }
  };

  const checkCurrentUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);
  };

  const fetchProduct = async () => {
    try {
      const { data: productData, error: productError } = await supabase
        .from("products")
        .select("*")
        .eq("id", id)
        .single();

      if (productError) throw productError;

      const { data: profileData } = await supabase
        .from("public_profiles" as any)
        .select("full_name, avatar_url, username, location")
        .eq("id", productData.user_id)
        .single();

      setProduct({
        ...productData,
        profiles: profileData
      });
    } catch (error) {
      console.error("Error fetching product:", error);
      toast.error("Erro ao carregar produto");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInteractions = async () => {
    if (!id) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    
    // Check if favorited
    if (user) {
      const { data: favorite } = await supabase
        .from("favorites")
        .select("id")
        .eq("product_id", id)
        .eq("user_id", user.id)
        .single();
      
      setIsFavorited(!!favorite);
    }

    // Get favorites count
    const { count: favCount } = await supabase
      .from("favorites")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);
    
    setLikesCount(favCount || 0);

    // Get comments count
    const { count: commentCount } = await supabase
      .from("comments")
      .select("*", { count: "exact", head: true })
      .eq("product_id", id);
    
    setCommentsCount(commentCount || 0);
  };

  const handleLike = async () => {
    if (!currentUser) {
      toast.error("Faça login para curtir");
      navigate("/auth");
      return;
    }

    try {
      if (isFavorited) {
        await supabase
          .from("favorites")
          .delete()
          .eq("product_id", id)
          .eq("user_id", currentUser.id);
        setIsFavorited(false);
        setLikesCount(prev => prev - 1);
      } else {
        await supabase
          .from("favorites")
          .insert({ product_id: id, user_id: currentUser.id });
        setIsFavorited(true);
        setLikesCount(prev => prev + 1);
      }
    } catch (error) {
      console.error("Error toggling like:", error);
    }
  };

  const fetchContactInfo = async () => {
    if (!id) return;
    
    setIsLoadingContact(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Faça login para ver informações de contato");
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .rpc("get_product_contact", { product_uuid: id });

      if (error) throw error;
      
      if (data && data.length > 0) {
        setContactInfo(data[0]);
      }
    } catch (error) {
      console.error("Error fetching contact info:", error);
      toast.error("Erro ao carregar informações de contato");
    } finally {
      setIsLoadingContact(false);
    }
  };

  const handleWhatsAppClick = async () => {
    if (!contactInfo) {
      await fetchContactInfo();
      return;
    }
    
    if (!product || !contactInfo) return;
    
    const message = `Olá! Tenho interesse no produto: ${product.title} - ${product.price.toLocaleString("pt-AO")} Kz`;
    const whatsappUrl = `https://wa.me/${contactInfo.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, "_blank");
  };

  const handleShare = async () => {
    const shareData = {
      title: product.title,
      text: `Confira este produto: ${product.title} - ${product.price.toLocaleString("pt-AO")} Kz`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Link copiado!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const scrollToComments = () => {
    document.getElementById("comments")?.scrollIntoView({ behavior: "smooth" });
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

  if (!product) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold mb-4">Produto não encontrado</h2>
            <Button onClick={() => navigate("/")}>Voltar ao início</Button>
          </div>
        </div>
      </>
    );
  }

  const seller = product.profiles || {};
  const images = product.images && product.images.length > 0 
    ? product.images 
    : product.image_url 
    ? [product.image_url] 
    : [];

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-14 pb-20 md:pt-16 md:pb-8">
        {/* Mobile Header */}
        <div className="md:hidden sticky top-14 z-40 bg-background/95 backdrop-blur-sm border-b">
          <div className="flex items-center justify-between px-4 h-12">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={handleShare}>
                <Share2 className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>

        <div className="md:max-w-6xl md:mx-auto md:px-4 md:pt-8">
          <div className="md:grid md:grid-cols-2 md:gap-8">
            {/* Image Gallery */}
            <div className="relative">
              {/* Main Image - Full Width on Mobile */}
              <div className="relative aspect-square bg-muted">
                {images.length > 0 ? (
                  <img
                    src={images[selectedImage]}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-8xl opacity-50">📦</span>
                  </div>
                )}

                {/* Image Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      onClick={() => setSelectedImage(prev => prev > 0 ? prev - 1 : images.length - 1)}
                      className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={() => setSelectedImage(prev => prev < images.length - 1 ? prev + 1 : 0)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-black/50 flex items-center justify-center text-white"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                    
                    {/* Dots Indicator */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5">
                      {images.map((_, idx) => (
                        <button
                          key={idx}
                          onClick={() => setSelectedImage(idx)}
                          className={`h-2 w-2 rounded-full transition-all ${
                            idx === selectedImage 
                              ? "bg-white w-4" 
                              : "bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnail Grid - Desktop */}
              {images.length > 1 && (
                <div className="hidden md:grid grid-cols-5 gap-2 mt-3">
                  {images.map((img: string, index: number) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                        selectedImage === index
                          ? "border-primary ring-2 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      <img
                        src={img}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="px-4 md:px-0 mt-4 md:mt-0">
              {/* Social Actions - Instagram Style */}
              <div className="flex items-center justify-between py-3 border-b md:border-0">
                <div className="flex items-center gap-4">
                  <button onClick={handleLike} className="flex items-center gap-1.5">
                    <Heart className={`h-7 w-7 transition-all ${isFavorited ? "fill-red-500 text-red-500 scale-110" : ""}`} />
                    {likesCount > 0 && <span className="font-medium">{likesCount}</span>}
                  </button>
                  <button onClick={scrollToComments} className="flex items-center gap-1.5">
                    <MessageCircle className="h-7 w-7" />
                    {commentsCount > 0 && <span className="font-medium">{commentsCount}</span>}
                  </button>
                  <button onClick={handleShare}>
                    <Share2 className="h-7 w-7" />
                  </button>
                </div>
                <AddToWishlistButton productId={product.id} />
              </div>

              {/* Price & Title */}
              <div className="py-4">
                <p className="text-3xl md:text-4xl font-bold text-primary">
                  {product.price.toLocaleString("pt-AO")} Kz
                </p>
                <h1 className="text-xl md:text-2xl font-semibold mt-2">{product.title}</h1>
                
                <div className="flex flex-wrap gap-2 mt-3">
                  <Badge variant={product.condition === "new" ? "default" : "secondary"}>
                    {product.condition === "new" ? "Novo" : "Usado"}
                  </Badge>
                  <Badge variant="outline">{product.category}</Badge>
                  {product.location && (
                    <Badge variant="outline" className="gap-1">
                      <MapPin className="h-3 w-3" />
                      {product.location}
                    </Badge>
                  )}
                </div>

                <p className="text-xs text-muted-foreground mt-2">
                  Publicado {formatDistanceToNow(new Date(product.created_at), { addSuffix: true, locale: ptBR })}
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <div className="py-4 border-t">
                  <h3 className="font-semibold mb-2">Descrição</h3>
                  <DescriptionWithMentions description={product.description} maxLength={500} />
                </div>
              )}

              {/* Seller Card */}
              <div className="py-4 border-t">
                <div className="flex items-center gap-3">
                  <Link to={`/user/${product.user_id}`}>
                    <Avatar className="h-14 w-14 ring-2 ring-primary/20">
                      <AvatarImage src={seller.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
                        {seller.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/user/${product.user_id}`} className="hover:underline">
                      <p className="font-semibold text-lg">{seller.full_name || "Vendedor"}</p>
                    </Link>
                    {seller.username && (
                      <p className="text-sm text-muted-foreground">@{seller.username}</p>
                    )}
                    <SellerRatingBadge sellerId={product.user_id} size="sm" />
                  </div>
                  <Link to={`/user/${product.user_id}`}>
                    <Button variant="outline" size="sm">Ver Perfil</Button>
                  </Link>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="py-4 space-y-3 border-t">
                <Button
                  className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary"
                  onClick={async () => {
                    setIsAddingToCart(true);
                    await addToCart(product.id);
                    setIsAddingToCart(false);
                  }}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <ShoppingCart className="mr-2 h-5 w-5" />
                  )}
                  Adicionar ao Carrinho
                </Button>

                <Button
                  className="w-full h-12 text-lg bg-green-600 hover:bg-green-700"
                  onClick={handleWhatsAppClick}
                  disabled={isLoadingContact}
                >
                  {isLoadingContact ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <Phone className="mr-2 h-5 w-5" />
                  )}
                  Contactar via WhatsApp
                </Button>
              </div>
            </div>
          </div>

          {/* Reviews Section */}
          <div className="px-4 md:px-0 mt-8 border-t pt-8">
            <h2 className="text-xl font-bold mb-4">Avaliações do Produto</h2>
            <ProductReviews productId={id!} />
          </div>

          {/* Comments Section */}
          <div id="comments" className="px-4 md:px-0 mt-8 border-t pt-8 pb-8">
            <CommentSection productId={id!} />
          </div>
        </div>
      </div>
    </>
  );
}
