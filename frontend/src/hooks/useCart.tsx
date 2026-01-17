// This hook now uses the CartContext for global state management
import { useCartContext } from "@/contexts/CartContext";

export type { CartItem } from "@/contexts/CartContext";

export function useCart() {
  return useCartContext();
}
