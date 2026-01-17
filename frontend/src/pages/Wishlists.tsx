import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, Plus, Heart, Share2, Globe, Lock, Trash2, ExternalLink, Copy, Edit } from "lucide-react";

interface Wishlist {
  id: string;
  name: string;
  description: string | null;
  is_public: boolean;
  share_code: string | null;
  created_at: string;
  items_count?: number;
}

export default function Wishlists() {
  const [user, setUser] = useState<any>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newWishlist, setNewWishlist] = useState({ name: "", description: "", is_public: false });
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchWishlists(user.id);
  };

  const fetchWishlists = async (userId: string) => {
    try {
      const { data: wishlistsData, error } = await supabase
        .from("wishlists")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get item counts
      if (wishlistsData && wishlistsData.length > 0) {
        const wishlistIds = wishlistsData.map(w => w.id);
        const { data: itemsData } = await supabase
          .from("wishlist_items")
          .select("wishlist_id")
          .in("wishlist_id", wishlistIds);

        const counts: Record<string, number> = {};
        itemsData?.forEach(item => {
          counts[item.wishlist_id] = (counts[item.wishlist_id] || 0) + 1;
        });

        const withCounts = wishlistsData.map(w => ({
          ...w,
          items_count: counts[w.id] || 0
        }));

        setWishlists(withCounts);
      } else {
        setWishlists([]);
      }
    } catch (error) {
      console.error("Error fetching wishlists:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!user || !newWishlist.name.trim()) return;

    setIsCreating(true);
    try {
      const { error } = await supabase
        .from("wishlists")
        .insert({
          user_id: user.id,
          name: newWishlist.name.trim(),
          description: newWishlist.description.trim() || null,
          is_public: newWishlist.is_public
        });

      if (error) throw error;

      toast.success("Lista de desejos criada!");
      setShowCreateDialog(false);
      setNewWishlist({ name: "", description: "", is_public: false });
      fetchWishlists(user.id);
    } catch (error: any) {
      toast.error("Erro ao criar lista");
    } finally {
      setIsCreating(false);
    }
  };

  const handleDelete = async (wishlistId: string) => {
    try {
      const { error } = await supabase
        .from("wishlists")
        .delete()
        .eq("id", wishlistId);

      if (error) throw error;

      toast.success("Lista removida");
      setWishlists(wishlists.filter(w => w.id !== wishlistId));
    } catch (error) {
      toast.error("Erro ao remover lista");
    }
  };

  const copyShareLink = (shareCode: string) => {
    const url = `${window.location.origin}/wishlist/${shareCode}`;
    navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
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

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-16 md:pt-20 pb-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold">Minhas Listas de Desejos</h1>
              <p className="text-sm text-muted-foreground">Organize e compartilhe seus produtos favoritos</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-primary to-secondary">
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Lista
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Lista de Desejos</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div>
                    <Label htmlFor="name">Nome da Lista</Label>
                    <Input
                      id="name"
                      value={newWishlist.name}
                      onChange={(e) => setNewWishlist({ ...newWishlist, name: e.target.value })}
                      placeholder="Ex: Meu Aniversário"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">Descrição (opcional)</Label>
                    <Textarea
                      id="description"
                      value={newWishlist.description}
                      onChange={(e) => setNewWishlist({ ...newWishlist, description: e.target.value })}
                      placeholder="Descreva sua lista..."
                      className="mt-1.5"
                      rows={3}
                    />
                  </div>
                  <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      {newWishlist.is_public ? <Globe className="h-5 w-5 text-primary" /> : <Lock className="h-5 w-5" />}
                      <div>
                        <p className="font-medium">{newWishlist.is_public ? "Lista Pública" : "Lista Privada"}</p>
                        <p className="text-xs text-muted-foreground">
                          {newWishlist.is_public ? "Qualquer pessoa com o link pode ver" : "Apenas você pode ver"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={newWishlist.is_public}
                      onCheckedChange={(checked) => setNewWishlist({ ...newWishlist, is_public: checked })}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                    Cancelar
                  </Button>
                  <Button onClick={handleCreate} disabled={isCreating || !newWishlist.name.trim()}>
                    {isCreating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Criar Lista
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {wishlists.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <Heart className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h3 className="text-xl font-semibold mb-2">Nenhuma lista de desejos</h3>
                <p className="text-muted-foreground mb-6">
                  Crie listas para organizar seus produtos favoritos e compartilhar com amigos
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeira Lista
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {wishlists.map((wishlist) => (
                <Card key={wishlist.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary/10 rounded-xl">
                        <Heart className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold truncate">{wishlist.name}</h3>
                          <Badge variant={wishlist.is_public ? "default" : "secondary"} className="shrink-0">
                            {wishlist.is_public ? <Globe className="h-3 w-3 mr-1" /> : <Lock className="h-3 w-3 mr-1" />}
                            {wishlist.is_public ? "Pública" : "Privada"}
                          </Badge>
                        </div>
                        {wishlist.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1 mb-2">{wishlist.description}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                          {wishlist.items_count} {wishlist.items_count === 1 ? "item" : "itens"}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {wishlist.is_public && wishlist.share_code && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => copyShareLink(wishlist.share_code!)}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                        <Link to={`/wishlist/${wishlist.id}`}>
                          <Button variant="ghost" size="icon">
                            <ExternalLink className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(wishlist.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
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
