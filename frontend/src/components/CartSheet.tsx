import { useState, ReactNode } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface CartSheetProps {
  trigger?: ReactNode;
}

export function CartSheet({ trigger }: CartSheetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const { items, itemCount, total, updateQuantity, removeFromCart, isLoading } = useCart();

  const handleCheckout = () => {
    setIsOpen(false);
    navigate("/checkout");
  };

  const defaultTrigger = (
    <Button variant="ghost" size="icon" className="h-10 w-10 relative">
      <ShoppingCart className="h-6 w-6" />
      {itemCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 h-5 w-5 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
          {itemCount > 9 ? "9+" : itemCount}
        </span>
      )}
    </Button>
  );

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        {trigger || defaultTrigger}
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md p-0 flex flex-col">
        <SheetHeader className="px-4 py-4 border-b">
          <SheetTitle className="flex items-center gap-2 text-xl">
            <ShoppingBag className="h-6 w-6" />
            Meu Carrinho
            {itemCount > 0 && (
              <span className="text-sm font-normal text-muted-foreground">
                ({itemCount} {itemCount === 1 ? "item" : "itens"})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 text-center">
            <div className="h-24 w-24 rounded-full bg-muted flex items-center justify-center mb-4">
              <Package className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Carrinho vazio</h3>
            <p className="text-muted-foreground mb-6 max-w-[200px]">
              Explore produtos incríveis e adicione ao seu carrinho
            </p>
            <Button onClick={() => { setIsOpen(false); navigate("/explore"); }} className="gap-2">
              Explorar Produtos
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-3">
                {items.map((item) => (
                  <div 
                    key={item.id} 
                    className="flex gap-3 p-3 bg-muted/30 rounded-xl border border-border/50"
                  >
                    <Link 
                      to={`/product/${item.product_id}`}
                      onClick={() => setIsOpen(false)}
                      className="shrink-0"
                    >
                      <img
                        src={item.product?.images?.[0] || item.product?.image_url || "/placeholder.svg"}
                        alt={item.product?.title}
                        className="w-20 h-20 object-cover rounded-lg"
                      />
                    </Link>
                    <div className="flex-1 min-w-0 flex flex-col">
                      <Link 
                        to={`/product/${item.product_id}`}
                        onClick={() => setIsOpen(false)}
                        className="hover:underline"
                      >
                        <h4 className="font-medium text-sm line-clamp-2">
                          {item.product?.title}
                        </h4>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        por {item.product?.profiles?.full_name || "Vendedor"}
                      </p>
                      <p className="text-primary font-bold mt-auto">
                        {item.product?.price?.toLocaleString("pt-AO")} Kz
                      </p>
                    </div>

                    <div className="flex flex-col items-end justify-between">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={() => removeFromCart(item.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      <div className="flex items-center gap-1 bg-muted rounded-lg p-0.5">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-sm font-medium w-6 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>

            <div className="border-t bg-background p-4 space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{total.toLocaleString("pt-AO")} Kz</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-lg">Total</span>
                  <span className="font-bold text-xl text-primary">
                    {total.toLocaleString("pt-AO")} Kz
                  </span>
                </div>
              </div>
              
              <Button 
                className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary"
                onClick={handleCheckout}
              >
                Finalizar Compra
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="ghost" 
                className="w-full"
                onClick={() => setIsOpen(false)}
              >
                Continuar Comprando
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
