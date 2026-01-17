import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Heart, Plus, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface AddToWishlistButtonProps {
  productId: string;
  variant?: "icon" | "full";
}

export function AddToWishlistButton({ productId, variant = "icon" }: AddToWishlistButtonProps) {
  const [wishlists, setWishlists] = useState<{ id: string; name: string }[]>([]);
  const [selectedWishlist, setSelectedWishlist] = useState<string>("");
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      checkUser();
    }
  }, [isOpen]);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      setIsOpen(false);
      navigate("/auth");
      return;
    }
    setUser(user);
    fetchWishlists(user.id);
  };

  const fetchWishlists = async (userId: string) => {
    setIsLoading(true);
    const { data } = await supabase
      .from("wishlists")
      .select("id, name")
      .eq("user_id", userId)
      .order("name");
    
    setWishlists(data || []);
    setIsLoading(false);
  };

  const handleAdd = async () => {
    if (!selectedWishlist || !user) return;

    setIsAdding(true);
    try {
      const { error } = await supabase
        .from("wishlist_items")
        .insert({
          wishlist_id: selectedWishlist,
          product_id: productId
        });

      if (error) {
        if (error.code === "23505") {
          toast.error("Este produto já está na lista");
        } else {
          throw error;
        }
      } else {
        toast.success("Adicionado à lista!");
        setIsOpen(false);
      }
    } catch (error) {
      toast.error("Erro ao adicionar à lista");
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {variant === "icon" ? (
          <Button variant="ghost" size="icon" className="h-9 w-9">
            <Heart className="h-5 w-5" />
          </Button>
        ) : (
          <Button variant="outline" className="w-full">
            <Heart className="h-4 w-4 mr-2" />
            Adicionar à Lista
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Adicionar à Lista de Desejos</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : wishlists.length === 0 ? (
            <div className="text-center py-6">
              <Heart className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground mb-4">Você ainda não tem listas de desejos</p>
              <Button onClick={() => { setIsOpen(false); navigate("/wishlists"); }}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Lista
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <Select value={selectedWishlist} onValueChange={setSelectedWishlist}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma lista" />
                </SelectTrigger>
                <SelectContent>
                  {wishlists.map((wishlist) => (
                    <SelectItem key={wishlist.id} value={wishlist.id}>
                      {wishlist.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => { setIsOpen(false); navigate("/wishlists"); }}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Lista
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAdd}
                  disabled={!selectedWishlist || isAdding}
                >
                  {isAdding ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Adicionar
                </Button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
