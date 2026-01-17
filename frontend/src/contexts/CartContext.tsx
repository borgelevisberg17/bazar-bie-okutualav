import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    title: string;
    price: number;
    image_url: string;
    images: string[];
    user_id: string;
    profiles: {
      full_name: string;
    };
  };
}

interface CartContextType {
  items: CartItem[];
  isLoading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeFromCart: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  fetchCart: () => Promise<void>;
  total: number;
  itemCount: number;
  userId: string | null;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  const fetchCart = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setItems([]);
        setIsLoading(false);
        setUserId(null);
        return;
      }
      
      setUserId(user.id);

      // First fetch cart items
      const { data: cartData, error: cartError } = await supabase
        .from("cart_items")
        .select("id, product_id, quantity")
        .eq("user_id", user.id);

      if (cartError) throw cartError;

      if (!cartData || cartData.length === 0) {
        setItems([]);
        setIsLoading(false);
        return;
      }

      // Then fetch products for those cart items
      const productIds = cartData.map(item => item.product_id);
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("id, title, price, image_url, images, user_id")
        .in("id", productIds);

      if (productsError) throw productsError;

      // Fetch seller profiles using secure public view
      const sellerIds = [...new Set(productsData?.map(p => p.user_id) || [])];
      const { data: profilesData } = await supabase
        .from("public_profiles")
        .select("id, full_name")
        .in("id", sellerIds);

      // Combine data
      const formattedItems = cartData.map(cartItem => {
        const product = productsData?.find(p => p.id === cartItem.product_id);
        const profile = profilesData?.find(p => p.id === product?.user_id);
        return {
          id: cartItem.id,
          product_id: cartItem.product_id,
          quantity: cartItem.quantity,
          product: product ? {
            ...product,
            profiles: { full_name: profile?.full_name || "Vendedor" }
          } : null
        };
      }).filter(item => item.product !== null);
      
      setItems(formattedItems as CartItem[]);
    } catch (error) {
      console.error("Error fetching cart:", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCart();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUserId(session.user.id);
        fetchCart();
      } else {
        setItems([]);
        setUserId(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchCart]);

  const addToCart = async (productId: string, quantity: number = 1): Promise<boolean> => {
    try {
      // Get fresh user data
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error("Você precisa estar logado para adicionar ao carrinho");
        return false;
      }

      // Check if item already exists
      const existingItem = items.find(item => item.product_id === productId);
      
      if (existingItem) {
        const { error } = await supabase
          .from("cart_items")
          .update({ quantity: existingItem.quantity + quantity })
          .eq("id", existingItem.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("cart_items")
          .insert({
            user_id: user.id,
            product_id: productId,
            quantity,
          });

        if (error) throw error;
      }

      await fetchCart();
      toast.success("Adicionado ao carrinho!");
      return true;
    } catch (error: any) {
      console.error("Error adding to cart:", error);
      toast.error("Erro ao adicionar ao carrinho");
      return false;
    }
  };

  const updateQuantity = async (itemId: string, quantity: number) => {
    if (quantity < 1) {
      return removeFromCart(itemId);
    }

    try {
      const { error } = await supabase
        .from("cart_items")
        .update({ quantity })
        .eq("id", itemId);

      if (error) throw error;
      await fetchCart();
    } catch (error) {
      console.error("Error updating quantity:", error);
      toast.error("Erro ao atualizar quantidade");
    }
  };

  const removeFromCart = async (itemId: string) => {
    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("id", itemId);

      if (error) throw error;
      await fetchCart();
      toast.success("Item removido do carrinho");
    } catch (error) {
      console.error("Error removing from cart:", error);
      toast.error("Erro ao remover do carrinho");
    }
  };

  const clearCart = async () => {
    if (!userId) return;

    try {
      const { error } = await supabase
        .from("cart_items")
        .delete()
        .eq("user_id", userId);

      if (error) throw error;
      setItems([]);
    } catch (error) {
      console.error("Error clearing cart:", error);
    }
  };

  const total = items.reduce(
    (sum, item) => sum + (item.product?.price || 0) * item.quantity,
    0
  );

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <CartContext.Provider value={{
      items,
      isLoading,
      addToCart,
      updateQuantity,
      removeFromCart,
      clearCart,
      fetchCart,
      total,
      itemCount,
      userId,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCartContext() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCartContext must be used within a CartProvider");
  }
  return context;
}
