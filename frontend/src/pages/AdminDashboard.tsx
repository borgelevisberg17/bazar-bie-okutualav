import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { useOrderNotifications } from "@/hooks/useOrderNotifications";
import { Navigate, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { 
  Package, 
  DollarSign, 
  Users, 
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  Eye,
  Settings,
  CreditCard,
  Star,
  Crown,
  Zap,
  Sparkles
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { sendOrderEmail } from "@/lib/emailService";
import { notifySubscriptionApproved, notifySubscriptionRejected } from "@/lib/subscriptionEmailService";

const statusLabels: Record<string, { label: string; color: string }> = {
  pending_payment: { label: "Aguardando Pagamento", color: "bg-yellow-500" },
  payment_analysis: { label: "Em Análise", color: "bg-blue-500" },
  payment_approved: { label: "Pagamento Aprovado", color: "bg-green-500" },
  payment_rejected: { label: "Pagamento Rejeitado", color: "bg-red-500" },
  processing: { label: "Processando", color: "bg-purple-500" },
  shipped: { label: "Enviado", color: "bg-indigo-500" },
  delivered: { label: "Entregue", color: "bg-teal-500" },
  confirmed_received: { label: "Recebido", color: "bg-emerald-500" },
  paid_to_seller: { label: "Pago ao Vendedor", color: "bg-green-700" },
  cancelled: { label: "Cancelado", color: "bg-gray-500" },
  refunded: { label: "Reembolsado", color: "bg-orange-500" },
};

export default function AdminDashboard() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");
  const [selectedSubscription, setSelectedSubscription] = useState<any>(null);
  const [subscriptionRejectReason, setSubscriptionRejectReason] = useState("");

  // Enable realtime notifications for admin
  useOrderNotifications(isAdmin);

  // Fetch all orders
  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch pending subscriptions
  const { data: pendingSubscriptions, isLoading: subscriptionsLoading } = useQuery({
    queryKey: ['admin-subscriptions'],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('seller_subscriptions')
        .select(`
          *,
          profile:user_id (full_name, avatar_url, phone)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch pending boosts
  const { data: pendingBoosts } = useQuery({
    queryKey: ['admin-boosts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_boosts')
        .select(`
          *,
          product:product_id (title, image_url)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: isAdmin,
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => {
      const { data: ordersData } = await supabase
        .from('orders')
        .select('status, total, platform_fee');

      const { count: usersCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      const { count: productsCount } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });

      const totalRevenue = ordersData
        ?.filter(o => ['paid_to_seller', 'confirmed_received'].includes(o.status))
        .reduce((sum, o) => sum + Number(o.platform_fee || 0), 0) || 0;

      const pendingAnalysis = ordersData?.filter(o => o.status === 'payment_analysis').length || 0;
      const totalOrders = ordersData?.length || 0;

      return {
        totalRevenue,
        totalOrders,
        pendingAnalysis,
        usersCount: usersCount || 0,
        productsCount: productsCount || 0,
      };
    },
    enabled: isAdmin,
  });

  // Update order mutation
  const updateOrderMutation = useMutation({
    mutationFn: async ({ orderId, updates }: { orderId: string; updates: any }) => {
      const { error } = await supabase
        .from('orders')
        .update(updates)
        .eq('id', orderId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
      setSelectedOrder(null);
      setRejectReason("");
      setAdminNotes("");
    },
  });

  const handleApprovePayment = async (order: any) => {
    try {
      await updateOrderMutation.mutateAsync({
        orderId: order.id,
        updates: {
          status: 'payment_approved',
          payment_approved_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        }
      });

      // Send email notification
      const { data: buyerProfile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', order.buyer_id)
        .single();

      const { data: { user: buyerUser } } = await supabase.auth.admin?.getUserById?.(order.buyer_id) || { data: { user: null } };
      
      // Log for now since we might not have the email
      console.log('Payment approved for order:', order.order_number);
      
      toast.success("Pagamento aprovado com sucesso!");
    } catch (error) {
      toast.error("Erro ao aprovar pagamento");
    }
  };

  const handleRejectPayment = async (order: any) => {
    if (!rejectReason.trim()) {
      toast.error("Por favor, informe o motivo da rejeição");
      return;
    }

    try {
      await updateOrderMutation.mutateAsync({
        orderId: order.id,
        updates: {
          status: 'payment_rejected',
          payment_rejected_at: new Date().toISOString(),
          payment_rejection_reason: rejectReason,
          admin_notes: adminNotes || null,
        }
      });

      console.log('Payment rejected for order:', order.order_number, 'Reason:', rejectReason);
      toast.success("Pagamento rejeitado");
    } catch (error) {
      toast.error("Erro ao rejeitar pagamento");
    }
  };

  const handleMarkAsPaid = async (order: any) => {
    try {
      await updateOrderMutation.mutateAsync({
        orderId: order.id,
        updates: {
          status: 'paid_to_seller',
          seller_paid_at: new Date().toISOString(),
          seller_paid_amount: order.seller_amount,
          admin_notes: adminNotes || null,
        }
      });

      console.log('Seller paid for order:', order.order_number);
      toast.success("Pagamento ao vendedor registrado!");
    } catch (error) {
      toast.error("Erro ao registrar pagamento");
    }
  };

  const handleApproveSubscription = async (subscription: any) => {
    try {
      const planName = subscription.plan === 'enterprise' ? 'VIP' : subscription.plan === 'pro' ? 'Pro' : 'Básico';
      
      const { error } = await (supabase as any)
        .from('seller_subscriptions')
        .update({
          status: 'active',
          payment_approved_at: new Date().toISOString(),
          started_at: new Date().toISOString(),
          expires_at: subscription.billing_cycle === 'yearly' 
            ? new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
            : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Update profile seller_verified for pro/enterprise
      if (subscription.plan === 'pro' || subscription.plan === 'enterprise') {
        await supabase
          .from('profiles')
          .update({ seller_verified: true, is_seller: true })
          .eq('id', subscription.user_id);
      } else {
        await supabase
          .from('profiles')
          .update({ is_seller: true })
          .eq('id', subscription.user_id);
      }

      // Send email notification
      if (subscription.profile?.full_name) {
        const { data: userData } = await supabase.auth.admin?.getUserById?.(subscription.user_id) || { data: null };
        if (userData?.user?.email) {
          await notifySubscriptionApproved(userData.user.email, subscription.profile.full_name, planName);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      toast.success("Assinatura aprovada com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao aprovar assinatura");
    }
  };

  const handleRejectSubscription = async (subscription: any) => {
    if (!subscriptionRejectReason.trim()) {
      toast.error("Por favor, informe o motivo da rejeição");
      return;
    }

    try {
      const planName = subscription.plan === 'enterprise' ? 'VIP' : subscription.plan === 'pro' ? 'Pro' : 'Básico';
      
      const { error } = await (supabase as any)
        .from('seller_subscriptions')
        .update({
          status: 'cancelled',
          payment_rejected_at: new Date().toISOString(),
          payment_rejection_reason: subscriptionRejectReason,
        })
        .eq('id', subscription.id);

      if (error) throw error;

      // Send email notification
      if (subscription.profile?.full_name) {
        const { data: userData } = await supabase.auth.admin?.getUserById?.(subscription.user_id) || { data: null };
        if (userData?.user?.email) {
          await notifySubscriptionRejected(userData.user.email, subscription.profile.full_name, planName, subscriptionRejectReason);
        }
      }

      queryClient.invalidateQueries({ queryKey: ['admin-subscriptions'] });
      setSelectedSubscription(null);
      setSubscriptionRejectReason("");
      toast.success("Assinatura rejeitada");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao rejeitar assinatura");
    }
  };

  if (adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const pendingOrders = orders?.filter(o => o.status === 'payment_analysis') || [];
  const readyToPay = orders?.filter(o => o.status === 'confirmed_received') || [];

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">Dashboard Admin</h1>
            <Link to="/admin/settings">
              <Button variant="outline">
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </Button>
            </Link>
          </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita da Plataforma</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                Kz {stats?.totalRevenue.toLocaleString('pt-AO')}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.totalOrders}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Aguardando Análise</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats?.pendingAnalysis}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.usersCount}</div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="pending" className="space-y-4">
          <TabsList>
            <TabsTrigger value="pending" className="relative">
              Pagamentos Pendentes
              {pendingOrders.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingOrders.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="subscriptions" className="relative">
              Assinaturas
              {(pendingSubscriptions?.length || 0) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingSubscriptions?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="boosts" className="relative">
              Boosts
              {(pendingBoosts?.length || 0) > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {pendingBoosts?.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="ready-to-pay" className="relative">
              Pagar Vendedores
              {readyToPay.length > 0 && (
                <Badge variant="secondary" className="ml-2">
                  {readyToPay.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="all">Todos</TabsTrigger>
          </TabsList>

          <TabsContent value="pending" className="space-y-4">
            {pendingOrders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum pagamento pendente de análise
                </CardContent>
              </Card>
            ) : (
              pendingOrders.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onView={() => setSelectedOrder(order)}
                  showActions
                  onApprove={() => handleApprovePayment(order)}
                  onReject={() => setSelectedOrder({ ...order, action: 'reject' })}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="subscriptions" className="space-y-4">
            {(pendingSubscriptions?.length || 0) === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhuma assinatura pendente de aprovação
                </CardContent>
              </Card>
            ) : (
              pendingSubscriptions?.map((sub: any) => (
                <Card key={sub.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          {sub.plan === 'enterprise' ? (
                            <Crown className="h-5 w-5 text-amber-500" />
                          ) : sub.plan === 'pro' ? (
                            <Star className="h-5 w-5 text-purple-500" />
                          ) : (
                            <Zap className="h-5 w-5 text-blue-500" />
                          )}
                          <span className="font-bold capitalize">{sub.plan === 'enterprise' ? 'VIP' : sub.plan}</span>
                          <Badge variant="secondary">{sub.billing_cycle === 'yearly' ? 'Anual' : 'Mensal'}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {sub.profile?.full_name || 'Usuário'} • {sub.profile?.phone || 'Sem telefone'}
                        </p>
                        <p className="font-semibold">Kz {Number(sub.price_paid || 0).toLocaleString('pt-AO')}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(sub.created_at).toLocaleDateString('pt-AO')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {sub.payment_receipt_url && (
                          <a 
                            href={sub.payment_receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Comprovante
                            </Button>
                          </a>
                        )}
                        <Button 
                          size="sm" 
                          onClick={() => handleApproveSubscription(sub)}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={() => setSelectedSubscription(sub)}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="boosts" className="space-y-4">
            {(pendingBoosts?.length || 0) === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum boost pendente de aprovação
                </CardContent>
              </Card>
            ) : (
              pendingBoosts?.map((boost: any) => (
                <Card key={boost.id}>
                  <CardContent className="p-4">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex gap-4">
                        <img 
                          src={boost.product?.image_url || "/placeholder.svg"} 
                          alt={boost.product?.title}
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-amber-500" />
                            <span className="font-medium capitalize">
                              {boost.boost_type.replace(/_/g, ' ')}
                            </span>
                          </div>
                          <p className="text-sm">{boost.product?.title}</p>
                          <p className="font-semibold text-primary">
                            Kz {Number(boost.price_paid || 0).toLocaleString('pt-AO')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {boost.payment_receipt_url && (
                          <a 
                            href={boost.payment_receipt_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <Button variant="outline" size="sm">
                              <Eye className="h-4 w-4 mr-1" />
                              Comprovante
                            </Button>
                          </a>
                        )}
                        <Button 
                          size="sm" 
                          className="bg-green-600 hover:bg-green-700"
                          onClick={async () => {
                            await supabase
                              .from('product_boosts')
                              .update({
                                status: 'active',
                                payment_approved_at: new Date().toISOString(),
                              })
                              .eq('id', boost.id);
                            queryClient.invalidateQueries({ queryKey: ['admin-boosts'] });
                            toast.success("Boost aprovado!");
                          }}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button 
                          size="sm" 
                          variant="destructive"
                          onClick={async () => {
                            await supabase
                              .from('product_boosts')
                              .update({
                                status: 'cancelled',
                                payment_rejected_at: new Date().toISOString(),
                              })
                              .eq('id', boost.id);
                            queryClient.invalidateQueries({ queryKey: ['admin-boosts'] });
                            toast.success("Boost rejeitado");
                          }}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="ready-to-pay" className="space-y-4">
            {readyToPay.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  Nenhum pagamento pendente para vendedores
                </CardContent>
              </Card>
            ) : (
              readyToPay.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onView={() => setSelectedOrder(order)}
                  showPayButton
                  onPay={() => handleMarkAsPaid(order)}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="all" className="space-y-4">
            {ordersLoading ? (
              <div className="text-center py-8">Carregando...</div>
            ) : (
              orders?.map((order) => (
                <OrderCard 
                  key={order.id} 
                  order={order} 
                  onView={() => setSelectedOrder(order)}
                />
              ))
            )}
          </TabsContent>
        </Tabs>

        {/* Reject Dialog */}
        <Dialog 
          open={selectedOrder?.action === 'reject'} 
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Pagamento</DialogTitle>
              <DialogDescription>
                Pedido: {selectedOrder?.order_number}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Motivo da Rejeição *</label>
                <Textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Ex: Comprovante ilegível, valor não confere..."
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Notas Internas (opcional)</label>
                <Textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notas visíveis apenas para admins..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedOrder(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleRejectPayment(selectedOrder)}
                disabled={updateOrderMutation.isPending}
              >
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Reject Subscription Dialog */}
        <Dialog 
          open={!!selectedSubscription} 
          onOpenChange={(open) => !open && setSelectedSubscription(null)}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rejeitar Assinatura</DialogTitle>
              <DialogDescription>
                Plano: {selectedSubscription?.plan === 'enterprise' ? 'VIP' : selectedSubscription?.plan}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Motivo da Rejeição *</label>
                <Textarea
                  value={subscriptionRejectReason}
                  onChange={(e) => setSubscriptionRejectReason(e.target.value)}
                  placeholder="Ex: Comprovante inválido, valor não confere..."
                  className="mt-1"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedSubscription(null)}>
                Cancelar
              </Button>
              <Button 
                variant="destructive" 
                onClick={() => handleRejectSubscription(selectedSubscription)}
              >
                Confirmar Rejeição
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* View Order Dialog */}
        <Dialog 
          open={selectedOrder && !selectedOrder.action} 
          onOpenChange={(open) => !open && setSelectedOrder(null)}
        >
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Pedido</DialogTitle>
              <DialogDescription>
                {selectedOrder?.order_number}
              </DialogDescription>
            </DialogHeader>
            {selectedOrder && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="text-sm text-muted-foreground">Status</span>
                    <Badge className={statusLabels[selectedOrder.status]?.color}>
                      {statusLabels[selectedOrder.status]?.label}
                    </Badge>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Total</span>
                    <p className="font-bold">Kz {Number(selectedOrder.total).toLocaleString('pt-AO')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Taxa Plataforma</span>
                    <p>Kz {Number(selectedOrder.platform_fee || 0).toLocaleString('pt-AO')}</p>
                  </div>
                  <div>
                    <span className="text-sm text-muted-foreground">Valor Vendedor</span>
                    <p>Kz {Number(selectedOrder.seller_amount).toLocaleString('pt-AO')}</p>
                  </div>
                </div>

                {selectedOrder.payment_receipt_url && (
                  <div>
                    <span className="text-sm text-muted-foreground">Comprovante</span>
                    <a 
                      href={selectedOrder.payment_receipt_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block mt-1 text-primary hover:underline"
                    >
                      Ver Comprovante
                    </a>
                  </div>
                )}

                {selectedOrder.payment_notes && (
                  <div>
                    <span className="text-sm text-muted-foreground">Notas do Comprador</span>
                    <p className="text-sm">{selectedOrder.payment_notes}</p>
                  </div>
                )}

                <div>
                  <span className="text-sm text-muted-foreground">Itens</span>
                  <div className="mt-2 space-y-2">
                    {selectedOrder.order_items?.map((item: any) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span>{item.product_title} x{item.quantity}</span>
                        <span>Kz {Number(item.total_price).toLocaleString('pt-AO')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        </div>
      </div>
    </>
  );
}

function OrderCard({ 
  order, 
  onView, 
  showActions, 
  showPayButton,
  onApprove, 
  onReject,
  onPay 
}: { 
  order: any; 
  onView: () => void;
  showActions?: boolean;
  showPayButton?: boolean;
  onApprove?: () => void;
  onReject?: () => void;
  onPay?: () => void;
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex flex-col sm:flex-row justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold">{order.order_number}</span>
              <Badge className={statusLabels[order.status]?.color}>
                {statusLabels[order.status]?.label}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {new Date(order.created_at).toLocaleDateString('pt-AO')}
            </p>
            <p className="font-semibold">
              Kz {Number(order.total).toLocaleString('pt-AO')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={onView}>
              <Eye className="h-4 w-4 mr-1" />
              Ver
            </Button>

            {showActions && (
              <>
                <Button size="sm" onClick={onApprove} className="bg-green-600 hover:bg-green-700">
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Aprovar
                </Button>
                <Button size="sm" variant="destructive" onClick={onReject}>
                  <XCircle className="h-4 w-4 mr-1" />
                  Rejeitar
                </Button>
              </>
            )}

            {showPayButton && (
              <Button size="sm" onClick={onPay} className="bg-green-600 hover:bg-green-700">
                <DollarSign className="h-4 w-4 mr-1" />
                Marcar como Pago
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
