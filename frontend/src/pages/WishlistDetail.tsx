import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { Loader2, Heart, Globe, Lock, Trash2, ChevronLeft, Share2, Copy, ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface WishlistItem {
  id: string;
  product_id: string;
  priority: number;
  notes: string | null;
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string | null;
    images: string[];
    status: string;
  };
}

interface Wishlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  share_code: string | null;
  user_id: string;
  owner?: {
    full_name: string | null;
    avatar_url: string | null;
    username: string | null;
  };
}

export default function WishlistDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { addToCart } = useCart();
  const [wishlist, setWishlist] = useState<Wishlist | null>(null);
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user);

    // Try to fetch as owner first, then as public
    let wishlistData: any = null;

    // Check if ID is a share code or UUID
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");

    if (isUUID) {
      const { data } = await supabase
        .from("wishlists")
        .select("*")
        .eq("id", id)
        .single();
      wishlistData = data;
    } else {
      // Try share code
      const { data } = await supabase
        .from("wishlists")
        .select("*")
        .eq("share_code", id)
        .eq("is_public", true)
        .single();
      wishlistData = data;
    }

    if (!wishlistData) {
      toast.error("Lista não encontrada");
      navigate("/wishlists");
      return;
    }

    // Fetch owner info using secure public view
    const { data: ownerData } = await supabase
      .from("public_profiles")
      .select("full_name, avatar_url, username")
      .eq("id", wishlistData.user_id)
      .single();

    setWishlist({ ...wishlistData, owner: ownerData });
    setIsOwner(user?.id === wishlistData.user_id);

    // Fetch items
    const { data: itemsData } = await supabase
      .from("wishlist_items")
      .select(`
        id,
        product_id,
        priority,
        notes,
        products (
          id,
          title,
          price,
          image_url,
          images,
          status
        )
      `)
      .eq("wishlist_id", wishlistData.id)
      .order("priority", { ascending: false });

    const formattedItems = (itemsData || []).map((item: any) => ({
      ...item,
      product: item.products
    })).filter((item: any) => item.product?.status === "active");

    setItems(formattedItems);
    setIsLoading(false);
  };

  const handleRemoveItem = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("wishlist_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;

      toast.success("Item removido");
      setItems(items.filter(i => i.id !== itemId));
    } catch (error) {
      toast.error("Erro ao remover item");
    }
  };

  const handleAddToCart = async (productId: string) => {
    const success = await addToCart(productId);
    if (success) {
      toast.success("Adicionado ao carrinho!");
    }
  };

  const copyShareLink = () => {
    if (wishlist?.share_code) {
      const url = `${window.location.origin}/wishlist/${wishlist.share_code}`;
      navigator.clipboard.writeText(url);
      toast.success("Link copiado!");
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(value);
  };

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

  if (!wishlist) return null;

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-16 md:pt-20 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-start gap-4 mb-6">
            <Button variant="ghost" size="icon" onClick={() => navigate(isOwner ? "/wishlists" : -1 as any)}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold">{wishlist.name}</h1>
                <Badge variant={wishlist.is_public ? "default" : "secondary"}>
                  {wishlist.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                  {wishlist.is_public ? "Pública" : "Privada"}
                </Badge>
              </div>
              {wishlist.description && (
                <p className="text-muted-foreground">{wishlist.description}</p>
              )}
              {!isOwner && wishlist.owner && (
                <div className="flex items-center gap-2 mt-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={wishlist.owner.avatar_url || undefined} />
                    <AvatarFallback>{wishlist.owner.full_name?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                  <span className="text-sm text-muted-foreground">
                    Lista de {wishlist.owner.full_name || wishlist.owner.username || "Usuário"}
                  </span>
                </div>
              )}
            </div>
            {wishlist.is_public && wishlist.share_code && (
              <Button variant="outline" size="sm" onClick={copyShareLink}>
                <Share2 className="h-4 w-4 mr-2" />
                Compartilhar
              </Button>
            )}
          </div>

          {/* Items */}
          {items.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Lista vazia</h3>
                <p className="text-muted-foreground">
                  {isOwner ? "Adicione produtos à sua lista navegando pelo catálogo" : "Esta lista ainda não tem itens"}
                </p>
                {isOwner && (
                  <Button className="mt-4" onClick={() => navigate("/explore")}>
                    Explorar Produtos
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex gap-4 p-4">
                      <Link to={`/product/${item.product.id}`} className="shrink-0">
                        <img
                          src={item.product.images?.[0] || item.product.image_url || "/placeholder.svg"}
                          alt={item.product.title}
                          className="w-24 h-24 object-cover rounded-lg"
                        />
                      </Link>
                      <div className="flex-1 min-w-0">
                        <Link to={`/product/${item.product.id}`}>
                          <h3 className="font-semibold hover:text-primary transition-colors line-clamp-2">
                            {item.product.title}
                          </h3>
                        </Link>
                        <p className="text-lg font-bold text-primary mt-1">
                          {formatPrice(item.product.price)}
                        </p>
                        {item.notes && (
                          <p className="text-sm text-muted-foreground mt-1">{item.notes}</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-2">
                        <Button size="sm" onClick={() => handleAddToCart(item.product.id)}>
                          <ShoppingCart className="h-4 w-4 mr-1" />
                          Comprar
                        </Button>
                        {isOwner && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                            onClick={() => handleRemoveItem(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Remover
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
