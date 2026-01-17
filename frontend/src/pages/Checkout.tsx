import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useCart } from "@/hooks/useCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Building2, 
  Copy, 
  Check, 
  AlertCircle,
  MapPin,
  Phone,
  ShoppingBag,
  ChevronLeft,
  CreditCard,
  Truck,
  Shield,
  Tag,
  X
} from "lucide-react";

interface BankDetails {
  iban: string;
  multicaixa_express: string;
  account_holder: string;
  bank_name: string;
  swift_bic: string;
}

interface ShippingAddress {
  full_name: string;
  phone: string;
  address: string;
  city: string;
  province: string;
}

export default function Checkout() {
  const navigate = useNavigate();
  const { items, total, clearCart, isLoading: cartLoading, userId } = useCart();
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [platformFee, setPlatformFee] = useState({ percentage: 5, min_amount: 100 });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [step, setStep] = useState<"shipping" | "payment">("shipping");
  
  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<any>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);
  const [isApplyingCoupon, setIsApplyingCoupon] = useState(false);
  
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    full_name: "",
    phone: "",
    address: "",
    city: "",
    province: "",
  });
  const [buyerNotes, setBuyerNotes] = useState("");

  useEffect(() => {
    if (!userId && !cartLoading) {
      navigate("/auth");
      return;
    }
    fetchSettings();
  }, [userId, cartLoading]);

  const fetchSettings = async () => {
    try {
      const { data: settings } = await (supabase as any)
        .from("platform_settings")
        .select("key, value")
        .in("key", ["bank_details", "platform_fees"]);

      if (settings) {
        const bank = settings.find((s: any) => s.key === "bank_details");
        const fees = settings.find((s: any) => s.key === "platform_fees");
        
        if (bank) setBankDetails(bank.value);
        if (fees) setPlatformFee(fees.value);
      }

      if (userId) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, phone, location")
          .eq("id", userId)
          .single();

        if (profile) {
          setShippingAddress(prev => ({
            ...prev,
            full_name: profile.full_name || "",
            phone: profile.phone || "",
            city: profile.location || "",
          }));
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  // Group items by seller
  const itemsBySeller = items.reduce((acc, item) => {
    const sellerId = item.product?.user_id;
    if (!sellerId) return acc;
    
    if (!acc[sellerId]) {
      acc[sellerId] = {
        sellerName: item.product?.profiles?.full_name || "Vendedor",
        items: [],
        subtotal: 0,
      };
    }
    acc[sellerId].items.push(item);
    acc[sellerId].subtotal += (item.product?.price || 0) * item.quantity;
    return acc;
  }, {} as Record<string, { sellerName: string; items: typeof items; subtotal: number }>);

  // Apply coupon
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return;
    
    setIsApplyingCoupon(true);
    try {
      // Get seller IDs from cart
      const sellerIds = Object.keys(itemsBySeller);
      
      const { data: coupons, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", couponCode.toUpperCase().trim())
        .eq("is_active", true)
        .in("seller_id", sellerIds);

      if (error || !coupons || coupons.length === 0) {
        toast.error("Cupom inválido ou expirado");
        return;
      }

      const coupon = coupons[0];
      
      // Check if expired
      if (coupon.expires_at && new Date(coupon.expires_at) < new Date()) {
        toast.error("Este cupom expirou");
        return;
      }

      // Check usage limit
      if (coupon.max_uses && coupon.uses_count >= coupon.max_uses) {
        toast.error("Este cupom já atingiu o limite de usos");
        return;
      }

      // Check minimum purchase
      const sellerSubtotal = itemsBySeller[coupon.seller_id]?.subtotal || 0;
      if (coupon.min_purchase > 0 && sellerSubtotal < coupon.min_purchase) {
        toast.error(`Compra mínima de Kz ${coupon.min_purchase.toLocaleString("pt-AO")} necessária`);
        return;
      }

      // Calculate discount
      let discount = 0;
      if (coupon.discount_type === "percentage") {
        discount = sellerSubtotal * (coupon.discount_value / 100);
      } else {
        discount = Math.min(coupon.discount_value, sellerSubtotal);
      }

      setAppliedCoupon(coupon);
      setCouponDiscount(discount);
      toast.success(`Cupom aplicado! Desconto de Kz ${discount.toLocaleString("pt-AO")}`);
    } catch (error) {
      console.error("Error applying coupon:", error);
      toast.error("Erro ao aplicar cupom");
    } finally {
      setIsApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponDiscount(0);
    setCouponCode("");
    toast.info("Cupom removido");
  };

  const finalTotal = total - couponDiscount;

  const handleContinue = () => {
    if (!shippingAddress.full_name || !shippingAddress.phone || !shippingAddress.address) {
      toast.error("Preencha os dados de entrega");
      return;
    }
    setStep("payment");
  };

  const handleSubmitOrder = async () => {
    if (!userId) {
      toast.error("Você precisa estar logado");
      return;
    }

    setIsSubmitting(true);

    try {
      for (const [sellerId, sellerData] of Object.entries(itemsBySeller)) {
        const subtotal = sellerData.subtotal;
        
        // Apply coupon discount if coupon is from this seller
        let orderDiscount = 0;
        if (appliedCoupon && appliedCoupon.seller_id === sellerId) {
          orderDiscount = couponDiscount;
        }
        
        const discountedSubtotal = subtotal - orderDiscount;
        const fee = Math.max(discountedSubtotal * (platformFee.percentage / 100), platformFee.min_amount);
        const sellerAmount = discountedSubtotal - fee;
        
        const { data: orderNumber } = await supabase.rpc("generate_order_number");

        const { data: order, error: orderError } = await (supabase as any)
          .from("orders")
          .insert({
            order_number: orderNumber || `BO-${Date.now()}`,
            buyer_id: userId,
            seller_id: sellerId,
            status: "pending_payment",
            subtotal,
            platform_fee: fee,
            total: discountedSubtotal,
            seller_amount: sellerAmount,
            shipping_address: shippingAddress,
            buyer_notes: buyerNotes + (appliedCoupon ? ` [Cupom: ${appliedCoupon.code}]` : ""),
            payment_deadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
          })
          .select()
          .single();

        if (orderError) throw orderError;

        const orderItems = sellerData.items.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          product_title: item.product?.title || "",
          product_image: item.product?.images?.[0] || item.product?.image_url || "",
          quantity: item.quantity,
          unit_price: item.product?.price || 0,
          total_price: (item.product?.price || 0) * item.quantity,
        }));

        const { error: itemsError } = await (supabase as any)
          .from("order_items")
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Record coupon use
        if (appliedCoupon && appliedCoupon.seller_id === sellerId) {
          await supabase
            .from("coupon_uses")
            .insert({
              coupon_id: appliedCoupon.id,
              user_id: userId,
              order_id: order.id,
              discount_applied: orderDiscount,
            });

          // Increment coupon usage count
          await supabase
            .from("coupons")
            .update({ uses_count: appliedCoupon.uses_count + 1 })
            .eq("id", appliedCoupon.id);
        }

        await (supabase as any)
          .from("order_logs")
          .insert({
            order_id: order.id,
            user_id: userId,
            action: "Pedido criado",
            new_status: "pending_payment",
            details: { items: orderItems.length, total: discountedSubtotal, discount: orderDiscount },
          });
      }

      await clearCart();
      toast.success("Pedido criado com sucesso!");
      navigate("/orders");
    } catch (error: any) {
      console.error("Error creating order:", error);
      toast.error("Erro ao criar pedido: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || cartLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (items.length === 0) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen bg-background">
          <div className="max-w-2xl mx-auto px-4 py-24 md:py-32">
            <div className="text-center">
              <div className="h-24 w-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <ShoppingBag className="h-12 w-12 text-muted-foreground" />
              </div>
              <h2 className="text-2xl font-bold mb-2">Carrinho vazio</h2>
              <p className="text-muted-foreground mb-6">
                Adicione produtos ao carrinho para finalizar a compra
              </p>
              <Button onClick={() => navigate("/explore")} className="bg-gradient-to-r from-primary to-secondary">
                Explorar Produtos
              </Button>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-14 md:top-16 z-40 bg-background border-b">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => step === "payment" ? setStep("shipping") : navigate(-1)}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="font-bold text-lg">Checkout</h1>
                <p className="text-xs text-muted-foreground">
                  {step === "shipping" ? "Endereço de entrega" : "Pagamento"}
                </p>
              </div>
            </div>
            
            {/* Progress */}
            <div className="flex items-center gap-2 mt-4">
              <div className="flex-1 h-1 rounded-full bg-primary" />
              <div className={`flex-1 h-1 rounded-full ${step === "payment" ? "bg-primary" : "bg-muted"}`} />
            </div>
          </div>
        </div>

        <div className="max-w-2xl mx-auto px-4 pb-40 pt-4 overflow-y-auto">
          {step === "shipping" ? (
            <div className="space-y-6">
              {/* Order Summary Mini */}
              <div className="bg-muted/30 rounded-xl p-4 border">
                <div className="flex items-center gap-3 mb-3">
                  <ShoppingBag className="h-5 w-5 text-primary" />
                  <span className="font-semibold">{items.length} {items.length === 1 ? "produto" : "produtos"}</span>
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {items.slice(0, 4).map((item) => (
                    <img
                      key={item.id}
                      src={item.product?.images?.[0] || item.product?.image_url || "/placeholder.svg"}
                      alt={item.product?.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ))}
                  {items.length > 4 && (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center text-sm font-medium flex-shrink-0">
                      +{items.length - 4}
                    </div>
                  )}
                </div>
              </div>

              {/* Shipping Form */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Endereço de Entrega</h2>
                </div>

                <div className="space-y-4">
                  <div>
                    <Label htmlFor="full_name">Nome Completo *</Label>
                    <Input
                      id="full_name"
                      value={shippingAddress.full_name}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, full_name: e.target.value }))}
                      placeholder="Seu nome completo"
                      className="mt-1.5 h-12"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="phone" className="flex items-center gap-2">
                      <Phone className="h-4 w-4" />
                      Telefone *
                    </Label>
                    <Input
                      id="phone"
                      value={shippingAddress.phone}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+244 9XX XXX XXX"
                      className="mt-1.5 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="address">Endereço Completo *</Label>
                    <Textarea
                      id="address"
                      value={shippingAddress.address}
                      onChange={(e) => setShippingAddress(prev => ({ ...prev, address: e.target.value }))}
                      placeholder="Rua, número, bairro, referência..."
                      rows={3}
                      className="mt-1.5"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="city">Cidade</Label>
                      <Input
                        id="city"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, city: e.target.value }))}
                        placeholder="Luanda"
                        className="mt-1.5 h-12"
                      />
                    </div>
                    <div>
                      <Label htmlFor="province">Província</Label>
                      <Input
                        id="province"
                        value={shippingAddress.province}
                        onChange={(e) => setShippingAddress(prev => ({ ...prev, province: e.target.value }))}
                        placeholder="Luanda"
                        className="mt-1.5 h-12"
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="notes">Observações (opcional)</Label>
                    <Textarea
                      id="notes"
                      value={buyerNotes}
                      onChange={(e) => setBuyerNotes(e.target.value)}
                      placeholder="Instruções especiais para entrega..."
                      rows={2}
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Bank Transfer Info */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Transferência Bancária</h2>
                </div>

                <Alert className="bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertDescription className="text-amber-800 dark:text-amber-200">
                    Você terá <strong>48 horas</strong> para realizar a transferência e enviar o comprovante após criar o pedido.
                  </AlertDescription>
                </Alert>

                {bankDetails && (
                  <div className="space-y-3 bg-muted/30 p-4 rounded-xl border">
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Titular</p>
                        <p className="font-medium">{bankDetails.account_holder}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center py-2">
                      <div>
                        <p className="text-xs text-muted-foreground">Banco</p>
                        <p className="font-medium">{bankDetails.bank_name}</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center py-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">IBAN</p>
                        <p className="font-mono font-medium text-sm">{bankDetails.iban}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => copyToClipboard(bankDetails.iban, "iban")}
                      >
                        {copiedField === "iban" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    
                    <Separator />
                    
                    <div className="flex justify-between items-center py-2">
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground">Multicaixa Express</p>
                        <p className="font-mono font-bold text-lg text-primary">{bankDetails.multicaixa_express}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-9 w-9"
                        onClick={() => copyToClipboard(bankDetails.multicaixa_express, "multicaixa")}
                      >
                        {copiedField === "multicaixa" ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <CreditCard className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-lg">Resumo</h2>
                </div>

                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {items.map((item) => (
                    <div key={item.id} className="flex gap-3">
                      <img
                        src={item.product?.images?.[0] || item.product?.image_url || "/placeholder.svg"}
                        alt={item.product?.title}
                        className="w-14 h-14 object-cover rounded-lg"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium line-clamp-1">{item.product?.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {item.quantity}x {item.product?.price?.toLocaleString("pt-AO")} Kz
                        </p>
                      </div>
                      <p className="text-sm font-bold text-primary">
                        {((item.product?.price || 0) * item.quantity).toLocaleString("pt-AO")} Kz
                      </p>
                    </div>
                  ))}
                </div>

                {/* Coupon Section */}
                <div className="py-4 border-t border-b">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">Cupom de Desconto</span>
                  </div>
                  
                  {appliedCoupon ? (
                    <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 p-3 rounded-lg border border-green-200 dark:border-green-800">
                      <div>
                        <p className="font-mono font-bold text-green-700 dark:text-green-400">
                          {appliedCoupon.code}
                        </p>
                        <p className="text-xs text-green-600 dark:text-green-500">
                          -{couponDiscount.toLocaleString("pt-AO")} Kz
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-green-700 hover:text-red-600"
                        onClick={removeCoupon}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-2">
                      <Input
                        placeholder="Código do cupom"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                        className="font-mono uppercase"
                      />
                      <Button
                        variant="outline"
                        onClick={handleApplyCoupon}
                        disabled={isApplyingCoupon || !couponCode.trim()}
                      >
                        {isApplyingCoupon ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          "Aplicar"
                        )}
                      </Button>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{total.toLocaleString("pt-AO")} Kz</span>
                  </div>
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-green-600 flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        Desconto
                      </span>
                      <span className="text-green-600 font-medium">
                        -{couponDiscount.toLocaleString("pt-AO")} Kz
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground flex items-center gap-1">
                      <Truck className="h-3.5 w-3.5" />
                      Entrega
                    </span>
                    <span className="text-green-600 font-medium">A combinar</span>
                  </div>
                </div>

                <Separator />

                <div className="flex justify-between items-center font-bold text-xl">
                  <span>Total</span>
                  <span className="text-primary">{finalTotal.toLocaleString("pt-AO")} Kz</span>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="flex items-center justify-center gap-6 py-4 text-muted-foreground">
                <div className="flex items-center gap-1.5 text-xs">
                  <Shield className="h-4 w-4" />
                  <span>Compra Segura</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs">
                  <Truck className="h-4 w-4" />
                  <span>Entrega Garantida</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Fixed Bottom Action - Safe area padding */}
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t z-50">
          <div className="max-w-2xl mx-auto p-4 pb-6 md:pb-4">
            {step === "shipping" ? (
              <Button
                className="w-full h-12 md:h-14 text-base md:text-lg bg-gradient-to-r from-primary to-secondary"
                onClick={handleContinue}
              >
                Continuar para Pagamento
              </Button>
            ) : (
              <Button
                className="w-full h-12 md:h-14 text-base md:text-lg bg-gradient-to-r from-primary to-secondary"
                onClick={handleSubmitOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Criando Pedido...
                  </>
                ) : (
                  `Confirmar Pedido • ${finalTotal.toLocaleString("pt-AO")} Kz`
                )}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
