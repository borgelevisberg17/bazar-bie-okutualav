import { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { useSubscription } from "@/hooks/useSubscription";
import { SubscriptionBadge } from "@/components/SubscriptionBadge";
import {
  Loader2,
  Package,
  Truck,
  CheckCircle,
  Clock,
  DollarSign,
  TrendingUp,
  ShoppingBag,
  Eye,
  Send,
  AlertCircle,
  Crown,
  Star,
  Zap,
  Settings,
  Plus,
  Sparkles,
  Tag,
  BarChart3,
} from "lucide-react";
import { ProductBoostModal } from "@/components/ProductBoostModal";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  seller_amount: number;
  created_at: string;
  shipped_at?: string;
  tracking_code?: string;
  shipping_address: any;
  buyer_id: string;
  buyer_profile?: {
    full_name: string;
    avatar_url?: string;
  };
  items: {
    id: string;
    product_title: string;
    quantity: number;
    unit_price: number;
    product_image?: string;
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending_payment: { label: "Aguardando Pagamento", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-4 w-4" /> },
  payment_analysis: { label: "Pagamento em Análise", color: "bg-blue-100 text-blue-800", icon: <DollarSign className="h-4 w-4" /> },
  payment_approved: { label: "Pagamento Aprovado", color: "bg-green-100 text-green-800", icon: <CheckCircle className="h-4 w-4" /> },
  shipped: { label: "Enviado", color: "bg-purple-100 text-purple-800", icon: <Truck className="h-4 w-4" /> },
  delivered: { label: "Entregue", color: "bg-teal-100 text-teal-800", icon: <Package className="h-4 w-4" /> },
  confirmed_received: { label: "Recebido", color: "bg-emerald-100 text-emerald-800", icon: <CheckCircle className="h-4 w-4" /> },
  paid_to_seller: { label: "Pago", color: "bg-green-100 text-green-800", icon: <DollarSign className="h-4 w-4" /> },
  cancelled: { label: "Cancelado", color: "bg-red-100 text-red-800", icon: <AlertCircle className="h-4 w-4" /> },
};

export default function SellerDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [showShipDialog, setShowShipDialog] = useState(false);
  const [trackingCode, setTrackingCode] = useState("");
  const [sellerNotes, setSellerNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [boostModalOpen, setBoostModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingShipment: 0,
    shipped: 0,
    totalRevenue: 0,
  });

  const navigate = useNavigate();
  const { toast } = useToast();
  useOrderNotifications();
  
  const { subscription, isLoading: subLoading, getRemainingProducts, getPhotosLimit } = useSubscription(userId || undefined);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    fetchOrders(user.id);
    fetchProducts(user.id);
  };

  const fetchProducts = async (uid: string) => {
    const { data } = await supabase
      .from("products")
      .select("*")
      .eq("user_id", uid)
      .eq("status", "active")
      .order("created_at", { ascending: false });
    
    setProducts(data || []);
  };

  const fetchOrders = async (uid: string) => {
    try {
      const { data: ordersData, error } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", uid)
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (ordersData && ordersData.length > 0) {
        const orderIds = ordersData.map((o) => o.id);
        const { data: itemsData } = await supabase
          .from("order_items")
          .select("*")
          .in("order_id", orderIds);

        const buyerIds = [...new Set(ordersData.map((o) => o.buyer_id))];
        const { data: profilesData } = await supabase
          .from("public_profiles" as any)
          .select("id, full_name, avatar_url")
          .in("id", buyerIds);

        const ordersWithDetails = ordersData.map((order) => ({
          ...order,
          items: itemsData?.filter((item) => item.order_id === order.id) || [],
          buyer_profile: (profilesData as any)?.find((p: any) => p.id === order.buyer_id),
        }));

        setOrders(ordersWithDetails);

        const pending = ordersWithDetails.filter(
          (o) => o.status === "payment_approved"
        ).length;
        const shipped = ordersWithDetails.filter(
          (o) => ["shipped", "delivered", "confirmed_received", "paid_to_seller"].includes(o.status)
        ).length;
        const revenue = ordersWithDetails
          .filter((o) => ["confirmed_received", "paid_to_seller"].includes(o.status))
          .reduce((sum, o) => sum + Number(o.seller_amount), 0);

        setStats({
          totalOrders: ordersWithDetails.length,
          pendingShipment: pending,
          shipped,
          totalRevenue: revenue,
        });
      }
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os pedidos",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleShipOrder = async () => {
    if (!selectedOrder || !userId) return;

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("orders")
        .update({
          status: "shipped",
          shipped_at: new Date().toISOString(),
          tracking_code: trackingCode || null,
          seller_notes: sellerNotes || null,
        })
        .eq("id", selectedOrder.id);

      if (error) throw error;

      toast({
        title: "Pedido enviado!",
        description: "O comprador será notificado sobre o envio",
      });

      setShowShipDialog(false);
      setTrackingCode("");
      setSellerNotes("");
      fetchOrders(userId);
    } catch (error) {
      console.error("Error shipping order:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o pedido",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
    }).format(value);
  };

  const getOrdersByStatus = (statuses: string[]) => {
    return orders.filter((o) => statuses.includes(o.status));
  };

  const getPlanIcon = () => {
    switch (subscription?.plan) {
      case "enterprise": return <Crown className="h-5 w-5" />;
      case "pro": return <Star className="h-5 w-5" />;
      default: return <Zap className="h-5 w-5" />;
    }
  };

  const getPlanColor = () => {
    switch (subscription?.plan) {
      case "enterprise": return "from-amber-500 to-amber-600";
      case "pro": return "from-purple-500 to-purple-600";
      default: return "from-blue-500 to-blue-600";
    }
  };

  const getPlanName = () => {
    switch (subscription?.plan) {
      case "enterprise": return "VIP";
      case "pro": return "Pro";
      case "basic": return "Básico";
      default: return "Free";
    }
  };

  if (isLoading || subLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  // Check subscription status
  if (!subscription || subscription.status === "pending") {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4">
          <div className="container mx-auto max-w-2xl">
            <Card>
              <CardContent className="py-12 text-center">
                {subscription?.status === "pending" ? (
                  <>
                    <Clock className="h-16 w-16 mx-auto text-amber-500 mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Assinatura em Análise</h2>
                    <p className="text-muted-foreground mb-6">
                      Sua solicitação de assinatura está sendo analisada. Você receberá uma notificação quando for aprovada.
                    </p>
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                    <h2 className="text-2xl font-bold mb-2">Seja um Vendedor</h2>
                    <p className="text-muted-foreground mb-6">
                      Para acessar o painel de vendas, você precisa ter uma assinatura de vendedor ativa.
                    </p>
                  </>
                )}
                <Button 
                  onClick={() => navigate("/subscription")}
                  className="bg-gradient-to-r from-primary to-primary/80"
                >
                  Ver Planos de Assinatura
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  const productsUsed = subscription?.products_used || 0;
  const productsLimit = subscription?.products_limit || 0;
  const productsPercent = productsLimit > 0 ? (productsUsed / productsLimit) * 100 : 0;

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4">
        <div className="container mx-auto max-w-7xl">
          <div className="mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  Painel de Vendas
                </h1>
                <p className="text-muted-foreground">
                  Gerencie seus produtos, pedidos e assinatura
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button variant="outline" onClick={() => navigate("/seller/analytics")}>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Analytics
                </Button>
                {(subscription?.plan === "pro" || subscription?.plan === "enterprise") && (
                  <Button variant="outline" onClick={() => navigate("/coupons")}>
                    <Tag className="h-4 w-4 mr-2" />
                    Cupons
                  </Button>
                )}
                <Button variant="outline" onClick={() => navigate("/subscription")}>
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar Plano
                </Button>
                <Button onClick={() => navigate("/post")} className="bg-gradient-to-r from-primary to-primary/80">
                  <Plus className="h-4 w-4 mr-2" />
                  Novo Anúncio
                </Button>
              </div>
            </div>
          </div>

          {/* Subscription Card */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-r ${getPlanColor()} flex items-center justify-center shrink-0`}>
                  {getPlanIcon()}
                  <span className="text-white text-2xl font-bold sr-only">{getPlanName()}</span>
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold">Plano {getPlanName()}</h3>
                    <SubscriptionBadge plan={subscription?.plan || ""} />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Anúncios utilizados</span>
                      <span className="font-medium">{productsUsed} / {productsLimit}</span>
                    </div>
                    <Progress value={productsPercent} className="h-2" />
                    <p className="text-xs text-muted-foreground">
                      {getRemainingProducts()} anúncio(s) restante(s) • Máx {getPhotosLimit()} foto(s) por anúncio
                    </p>
                  </div>
                </div>
                {subscription?.plan !== "enterprise" && (
                  <Button variant="outline" onClick={() => navigate("/subscription")}>
                    Fazer Upgrade
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <ShoppingBag className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Pedidos</p>
                    <p className="text-2xl font-bold">{stats.totalOrders}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Package className="h-5 w-5 text-yellow-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Aguardando Envio</p>
                    <p className="text-2xl font-bold">{stats.pendingShipment}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Truck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Enviados</p>
                    <p className="text-2xl font-bold">{stats.shipped}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Receita</p>
                    <p className="text-lg font-bold">{formatPrice(stats.totalRevenue)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Orders Tabs */}
          <Tabs defaultValue="pending" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="pending" className="gap-2">
                <Package className="h-4 w-4" />
                <span className="hidden sm:inline">Pendentes</span>
                {stats.pendingShipment > 0 && (
                  <Badge variant="destructive" className="ml-1">
                    {stats.pendingShipment}
                  </Badge>
                )}
              </TabsTrigger>
              <TabsTrigger value="shipped" className="gap-2">
                <Truck className="h-4 w-4" />
                <span className="hidden sm:inline">Enviados</span>
              </TabsTrigger>
              <TabsTrigger value="products" className="gap-2">
                <Sparkles className="h-4 w-4" />
                <span className="hidden sm:inline">Produtos</span>
              </TabsTrigger>
              <TabsTrigger value="all" className="gap-2">
                <ShoppingBag className="h-4 w-4" />
                <span className="hidden sm:inline">Todos</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pending">
              <OrdersTable
                orders={getOrdersByStatus(["payment_approved"])}
                onViewOrder={(order) => navigate(`/order/${order.id}`)}
                onShipOrder={(order) => {
                  setSelectedOrder(order);
                  setShowShipDialog(true);
                }}
                showShipButton
                formatPrice={formatPrice}
              />
            </TabsContent>

            <TabsContent value="shipped">
              <OrdersTable
                orders={getOrdersByStatus(["shipped", "delivered", "confirmed_received", "paid_to_seller"])}
                onViewOrder={(order) => navigate(`/order/${order.id}`)}
                formatPrice={formatPrice}
              />
            </TabsContent>

            <TabsContent value="products">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-amber-500" />
                      Impulsionar Produtos
                    </CardTitle>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Destaque seus produtos para mais visibilidade
                  </p>
                </CardHeader>
                <CardContent>
                  {products.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      Você ainda não tem produtos publicados
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {products.map((product) => (
                        <div key={product.id} className="border rounded-lg p-4 space-y-3">
                          <div className="flex gap-3">
                            <img 
                              src={product.image_url || "/placeholder.svg"} 
                              alt={product.title}
                              className="w-16 h-16 rounded-lg object-cover"
                            />
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium truncate">{product.title}</h4>
                              <p className="text-sm text-primary font-bold">
                                Kz {product.price.toLocaleString("pt-AO")}
                              </p>
                            </div>
                          </div>
                          <Button 
                            size="sm" 
                            className="w-full bg-gradient-to-r from-amber-500 to-amber-600"
                            onClick={() => {
                              setSelectedProduct(product);
                              setBoostModalOpen(true);
                            }}
                          >
                            <Sparkles className="h-4 w-4 mr-2" />
                            Impulsionar
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="all">
              <OrdersTable
                orders={orders}
                onViewOrder={(order) => navigate(`/order/${order.id}`)}
                onShipOrder={(order) => {
                  if (order.status === "payment_approved") {
                    setSelectedOrder(order);
                    setShowShipDialog(true);
                  }
                }}
                showShipButton
                formatPrice={formatPrice}
              />
            </TabsContent>
          </Tabs>

          {orders.length === 0 && (
            <Card className="mt-8">
              <CardContent className="py-12 text-center">
                <ShoppingBag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum pedido ainda</h3>
                <p className="text-muted-foreground mb-4">
                  Quando você receber pedidos, eles aparecerão aqui
                </p>
                <Button onClick={() => navigate("/post")}>
                  Publicar Produto
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Ship Order Dialog */}
      <Dialog open={showShipDialog} onOpenChange={setShowShipDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Marcar como Enviado
            </DialogTitle>
            <DialogDescription>
              Pedido #{selectedOrder?.order_number}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="tracking">Código de Rastreio (opcional)</Label>
              <Input
                id="tracking"
                placeholder="Ex: AB123456789BR"
                value={trackingCode}
                onChange={(e) => setTrackingCode(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas para o comprador (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Informações adicionais sobre o envio..."
                value={sellerNotes}
                onChange={(e) => setSellerNotes(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowShipDialog(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button onClick={handleShipOrder} disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Send className="h-4 w-4 mr-2" />
              )}
              Confirmar Envio
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Product Boost Modal */}
      {selectedProduct && (
        <ProductBoostModal
          open={boostModalOpen}
          onOpenChange={setBoostModalOpen}
          productId={selectedProduct.id}
          productTitle={selectedProduct.title}
          currentPlan={subscription?.plan || "basic"}
        />
      )}
    </>
  );
}

interface OrdersTableProps {
  orders: Order[];
  onViewOrder: (order: Order) => void;
  onShipOrder?: (order: Order) => void;
  showShipButton?: boolean;
  formatPrice: (value: number) => string;
}

function OrdersTable({
  orders,
  onViewOrder,
  onShipOrder,
  showShipButton,
  formatPrice,
}: OrdersTableProps) {
  if (orders.length === 0) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          Nenhum pedido nesta categoria
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pedido</TableHead>
                <TableHead>Comprador</TableHead>
                <TableHead className="hidden md:table-cell">Itens</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Data</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.map((order) => {
                const statusConfig = STATUS_CONFIG[order.status] || STATUS_CONFIG.pending_payment;
                return (
                  <TableRow key={order.id}>
                    <TableCell className="font-medium">
                      #{order.order_number}
                    </TableCell>
                    <TableCell>
                      {order.buyer_profile?.full_name || "Comprador"}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {order.items.length} {order.items.length === 1 ? "item" : "itens"}
                    </TableCell>
                    <TableCell>{formatPrice(order.seller_amount)}</TableCell>
                    <TableCell>
                      <Badge className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
                        {statusConfig.icon}
                        <span className="hidden sm:inline">{statusConfig.label}</span>
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {format(new Date(order.created_at), "dd/MM/yy", { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onViewOrder(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        {showShipButton && order.status === "payment_approved" && onShipOrder && (
                          <Button
                            size="sm"
                            onClick={() => onShipOrder(order)}
                          >
                            <Truck className="h-4 w-4 mr-1" />
                            <span className="hidden sm:inline">Enviar</span>
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
