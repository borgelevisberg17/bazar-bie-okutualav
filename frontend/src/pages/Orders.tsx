import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  CreditCard,
  AlertCircle
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";

interface Order {
  id: string;
  order_number: string;
  status: string;
  total: number;
  created_at: string;
  payment_deadline: string;
  seller_id: string;
  buyer_id: string;
  order_items: {
    id: string;
    product_title: string;
    product_image: string;
    quantity: number;
    unit_price: number;
  }[];
  seller_profile?: {
    full_name: string;
    avatar_url: string;
  };
  buyer_profile?: {
    full_name: string;
  };
}

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending_payment: { label: "Aguardando Pagamento", color: "bg-yellow-500", icon: Clock },
  payment_analysis: { label: "Pagamento em Análise", color: "bg-blue-500", icon: CreditCard },
  payment_approved: { label: "Pagamento Aprovado", color: "bg-green-500", icon: CheckCircle },
  payment_rejected: { label: "Pagamento Rejeitado", color: "bg-red-500", icon: XCircle },
  processing: { label: "Processando", color: "bg-purple-500", icon: Package },
  shipped: { label: "Enviado", color: "bg-indigo-500", icon: Truck },
  delivered: { label: "Entregue", color: "bg-teal-500", icon: Package },
  confirmed_received: { label: "Recebido", color: "bg-green-600", icon: CheckCircle },
  paid_to_seller: { label: "Concluído", color: "bg-green-700", icon: CheckCircle },
  cancelled: { label: "Cancelado", color: "bg-gray-500", icon: XCircle },
  refunded: { label: "Reembolsado", color: "bg-orange-500", icon: AlertCircle },
};

export default function Orders() {
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("buying");

  // Enable realtime notifications for orders
  useOrderNotifications(!!userId);

  useEffect(() => {
    checkUserAndFetch();
  }, []);

  const checkUserAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await fetchOrders(user.id);
  };

  const fetchOrders = async (uid: string) => {
    setIsLoading(true);
    try {
      // Fetch orders where user is buyer
      const { data: buyerOrders, error: buyerError } = await (supabase as any)
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_title,
            product_image,
            quantity,
            unit_price
          )
        `)
        .eq("buyer_id", uid)
        .order("created_at", { ascending: false });

      if (buyerError) throw buyerError;

      // Fetch seller profiles using secure public view
      const rawIds = (buyerOrders || []).map((o: any) => String(o.seller_id)).filter((id: string) => id && id !== 'undefined');
      const sellerIds = Array.from(new Set(rawIds)) as string[];
      let sellerProfiles: any[] = [];
      if (sellerIds.length > 0) {
        const { data } = await supabase
          .from("public_profiles")
          .select("id, full_name, avatar_url")
          .in("id", sellerIds);
        sellerProfiles = data || [];
      }

      // Merge profiles
      const ordersWithProfiles = buyerOrders?.map((order: any) => ({
        ...order,
        seller_profile: sellerProfiles.find((p: any) => p.id === order.seller_id),
      })) || [];

      setOrders(ordersWithProfiles);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast.error("Erro ao carregar pedidos");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || { label: status, color: "bg-gray-500", icon: Package };
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} text-white flex items-center gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const isPaymentDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
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

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
            <Package className="h-6 w-6" />
            Meus Pedidos
          </h1>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger value="buying">Minhas Compras</TabsTrigger>
              <TabsTrigger value="selling">Minhas Vendas</TabsTrigger>
            </TabsList>

            <TabsContent value="buying">
              {orders.length === 0 ? (
                <Card className="p-12 text-center">
                  <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                  <h2 className="text-xl font-semibold mb-2">Nenhum pedido ainda</h2>
                  <p className="text-muted-foreground mb-4">
                    Quando você fizer compras, elas aparecerão aqui
                  </p>
                  <Button onClick={() => navigate("/explore")}>
                    Explorar Produtos
                  </Button>
                </Card>
              ) : (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <Card 
                      key={order.id} 
                      className="cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => navigate(`/order/${order.id}`)}
                    >
                      <CardHeader className="pb-2">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div>
                            <CardTitle className="text-base">
                              Pedido #{order.order_number}
                            </CardTitle>
                            <p className="text-sm text-muted-foreground">
                              {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </p>
                          </div>
                          {getStatusBadge(order.status)}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-4">
                          {/* Product Images */}
                          <div className="flex -space-x-2">
                            {order.order_items.slice(0, 3).map((item, i) => (
                              <img
                                key={item.id}
                                src={item.product_image || "/placeholder.svg"}
                                alt={item.product_title}
                                className="w-12 h-12 object-cover rounded-lg border-2 border-background"
                                style={{ zIndex: 3 - i }}
                              />
                            ))}
                            {order.order_items.length > 3 && (
                              <div className="w-12 h-12 rounded-lg border-2 border-background bg-muted flex items-center justify-center text-xs font-medium">
                                +{order.order_items.length - 3}
                              </div>
                            )}
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="text-sm line-clamp-1">
                              {order.order_items.map(i => i.product_title).join(", ")}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Vendedor: {order.seller_profile?.full_name || "N/A"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p className="font-bold text-primary">
                              {order.total.toLocaleString("pt-AO")} Kz
                            </p>
                            {order.status === "pending_payment" && order.payment_deadline && (
                              <p className={`text-xs ${isPaymentDeadlinePassed(order.payment_deadline) ? "text-destructive" : "text-muted-foreground"}`}>
                                {isPaymentDeadlinePassed(order.payment_deadline) 
                                  ? "Prazo expirado" 
                                  : `Prazo: ${format(new Date(order.payment_deadline), "dd/MM HH:mm")}`}
                              </p>
                            )}
                          </div>
                        </div>

                        {order.status === "pending_payment" && !isPaymentDeadlinePassed(order.payment_deadline) && (
                          <Button 
                            className="mt-3 w-full"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate(`/order/${order.id}`);
                            }}
                          >
                            Enviar Comprovante
                          </Button>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="selling">
              <Card className="p-12 text-center">
                <Package className="h-16 w-16 mx-auto text-muted-foreground/50 mb-4" />
                <h2 className="text-xl font-semibold mb-2">Área do Vendedor</h2>
                <p className="text-muted-foreground mb-4">
                  Para vender produtos, você precisa de um plano de assinatura
                </p>
                <Button onClick={() => navigate("/subscription")}>
                  Ver Planos
                </Button>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  );
}
