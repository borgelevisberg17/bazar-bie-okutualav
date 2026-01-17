import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
  Upload,
  FileText,
  MapPin,
  Phone,
  User,
  Copy,
  Check,
  AlertCircle,
  Building2
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

const statusConfig: Record<string, { label: string; color: string; icon: any; step: number }> = {
  pending_payment: { label: "Aguardando Pagamento", color: "bg-yellow-500", icon: Clock, step: 1 },
  payment_analysis: { label: "Pagamento em Análise", color: "bg-blue-500", icon: CreditCard, step: 2 },
  payment_approved: { label: "Pagamento Aprovado", color: "bg-green-500", icon: CheckCircle, step: 3 },
  payment_rejected: { label: "Pagamento Rejeitado", color: "bg-red-500", icon: XCircle, step: 0 },
  processing: { label: "Processando", color: "bg-purple-500", icon: Package, step: 4 },
  shipped: { label: "Enviado", color: "bg-indigo-500", icon: Truck, step: 5 },
  delivered: { label: "Entregue", color: "bg-teal-500", icon: Package, step: 6 },
  confirmed_received: { label: "Recebido", color: "bg-green-600", icon: CheckCircle, step: 7 },
  paid_to_seller: { label: "Concluído", color: "bg-green-700", icon: CheckCircle, step: 8 },
  cancelled: { label: "Cancelado", color: "bg-gray-500", icon: XCircle, step: 0 },
};

interface BankDetails {
  iban: string;
  multicaixa_express: string;
  account_holder: string;
  bank_name: string;
}

export default function OrderDetail() {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  
  // Payment upload
  const [isUploading, setIsUploading] = useState(false);
  const [uploadDialogOpen, setUploadDialogOpen] = useState(false);
  const [paymentNotes, setPaymentNotes] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    checkUserAndFetch();
  }, [orderId]);

  const checkUserAndFetch = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await Promise.all([fetchOrder(), fetchBankDetails()]);
  };

  const fetchOrder = async () => {
    if (!orderId) return;
    
    try {
      const { data, error } = await (supabase as any)
        .from("orders")
        .select(`
          *,
          order_items (
            id,
            product_id,
            product_title,
            product_image,
            quantity,
            unit_price,
            total_price
          ),
          order_logs (
            id,
            action,
            old_status,
            new_status,
            details,
            created_at
          )
        `)
        .eq("id", orderId)
        .single();

      if (error) throw error;

      // Fetch seller profile using secure public view
      const { data: sellerProfile } = await supabase
        .from("public_profiles")
        .select("full_name, avatar_url")
        .eq("id", data.seller_id)
        .single();

      setOrder({ ...data, seller_profile: sellerProfile });
    } catch (error) {
      console.error("Error fetching order:", error);
      toast.error("Erro ao carregar pedido");
      navigate("/orders");
    } finally {
      setIsLoading(false);
    }
  };

  const fetchBankDetails = async () => {
    const { data } = await (supabase as any)
      .from("platform_settings")
      .select("value")
      .eq("key", "bank_details")
      .single();
    
    if (data) setBankDetails(data.value);
  };

  const copyToClipboard = (text: string, field: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    toast.success("Copiado!");
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error("Apenas arquivos PDF são aceitos");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Arquivo muito grande. Máximo 5MB");
      return;
    }

    setSelectedFile(file);
  };

  const handleUploadReceipt = async () => {
    if (!selectedFile || !userId || !orderId) return;

    setIsUploading(true);

    try {
      // Upload PDF to storage
      const fileName = `${userId}/${orderId}/${Date.now()}.pdf`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("payment-receipts")
        .getPublicUrl(fileName);

      // Update order
      const { error: updateError } = await (supabase as any)
        .from("orders")
        .update({
          status: "payment_analysis",
          payment_receipt_url: urlData.publicUrl,
          payment_notes: paymentNotes,
          payment_submitted_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (updateError) throw updateError;

      // Log action
      await (supabase as any)
        .from("order_logs")
        .insert({
          order_id: orderId,
          user_id: userId,
          action: "Comprovante enviado",
          old_status: "pending_payment",
          new_status: "payment_analysis",
          details: { notes: paymentNotes },
        });

      toast.success("Comprovante enviado com sucesso!");
      setUploadDialogOpen(false);
      fetchOrder();
    } catch (error: any) {
      console.error("Error uploading receipt:", error);
      toast.error("Erro ao enviar comprovante: " + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleConfirmReceived = async () => {
    if (!orderId || !userId) return;

    try {
      const { error } = await (supabase as any)
        .from("orders")
        .update({
          status: "confirmed_received",
          received_confirmed_at: new Date().toISOString(),
        })
        .eq("id", orderId);

      if (error) throw error;

      await (supabase as any)
        .from("order_logs")
        .insert({
          order_id: orderId,
          user_id: userId,
          action: "Recebimento confirmado pelo comprador",
          old_status: order.status,
          new_status: "confirmed_received",
        });

      toast.success("Recebimento confirmado!");
      fetchOrder();
    } catch (error: any) {
      console.error("Error confirming:", error);
      toast.error("Erro ao confirmar: " + error.message);
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

  if (!order) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <p>Pedido não encontrado</p>
        </div>
      </>
    );
  }

  const isBuyer = order.buyer_id === userId;
  const shippingAddress = order.shipping_address || {};

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-4xl">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl font-bold">Pedido #{order.order_number}</h1>
              <p className="text-muted-foreground">
                {format(new Date(order.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
              </p>
            </div>
            {getStatusBadge(order.status)}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Action Alerts */}
              {order.status === "pending_payment" && isBuyer && (
                <Alert className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
                  <Clock className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 dark:text-yellow-200">
                    <strong>Aguardando pagamento.</strong> Realize a transferência e envie o comprovante.
                    {order.payment_deadline && (
                      <span className="block mt-1">
                        Prazo: {format(new Date(order.payment_deadline), "dd/MM/yyyy 'às' HH:mm")}
                      </span>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {order.status === "delivered" && isBuyer && (
                <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                  <Package className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    <strong>Produto entregue!</strong> Confirme o recebimento para liberar o pagamento ao vendedor.
                    <Button 
                      className="mt-2 w-full"
                      onClick={handleConfirmReceived}
                    >
                      Confirmar Recebimento
                    </Button>
                  </AlertDescription>
                </Alert>
              )}

              {/* Order Items */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    Itens do Pedido
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {order.order_items?.map((item: any) => (
                    <div key={item.id} className="flex gap-4">
                      <img
                        src={item.product_image || "/placeholder.svg"}
                        alt={item.product_title}
                        className="w-20 h-20 object-cover rounded-lg cursor-pointer"
                        onClick={() => navigate(`/product/${item.product_id}`)}
                      />
                      <div className="flex-1">
                        <h4 className="font-medium">{item.product_title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {item.quantity}x {item.unit_price.toLocaleString("pt-AO")} Kz
                        </p>
                      </div>
                      <p className="font-bold">
                        {item.total_price.toLocaleString("pt-AO")} Kz
                      </p>
                    </div>
                  ))}

                  <Separator />

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Subtotal</span>
                      <span>{order.subtotal?.toLocaleString("pt-AO")} Kz</span>
                    </div>
                    {order.platform_fee > 0 && (
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>Taxa da plataforma</span>
                        <span>{order.platform_fee?.toLocaleString("pt-AO")} Kz</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-lg">
                      <span>Total</span>
                      <span className="text-primary">{order.total?.toLocaleString("pt-AO")} Kz</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipping Address */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5" />
                    Endereço de Entrega
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <p className="font-medium">{shippingAddress.full_name}</p>
                    <p className="text-muted-foreground">{shippingAddress.address}</p>
                    <p className="text-muted-foreground">
                      {shippingAddress.city}{shippingAddress.province && `, ${shippingAddress.province}`}
                    </p>
                    <p className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="h-4 w-4" />
                      {shippingAddress.phone}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Bank Details for Payment */}
              {order.status === "pending_payment" && bankDetails && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      Dados para Transferência
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Titular</p>
                        <p className="font-medium">{bankDetails.account_holder}</p>
                      </div>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">IBAN</p>
                        <p className="font-mono">{bankDetails.iban}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(bankDetails.iban, "iban")}
                      >
                        {copiedField === "iban" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-muted-foreground">Multicaixa Express</p>
                        <p className="font-mono text-lg font-bold">{bankDetails.multicaixa_express}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(bankDetails.multicaixa_express, "multicaixa")}
                      >
                        {copiedField === "multicaixa" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      </Button>
                    </div>

                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="w-full mt-4 bg-gradient-to-r from-marketplace-terracotta to-marketplace-orange">
                          <Upload className="mr-2 h-4 w-4" />
                          Já Paguei - Enviar Comprovante
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Enviar Comprovante de Pagamento</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <Label htmlFor="receipt">Comprovante (PDF, máx 5MB)</Label>
                            <Input
                              id="receipt"
                              type="file"
                              accept=".pdf"
                              onChange={handleFileSelect}
                              className="mt-1"
                            />
                            {selectedFile && (
                              <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                                <FileText className="h-4 w-4" />
                                {selectedFile.name}
                              </p>
                            )}
                          </div>
                          <div>
                            <Label htmlFor="notes">Observações (opcional)</Label>
                            <Textarea
                              id="notes"
                              value={paymentNotes}
                              onChange={(e) => setPaymentNotes(e.target.value)}
                              placeholder="Informações adicionais sobre o pagamento..."
                              rows={3}
                            />
                          </div>
                          <Button
                            className="w-full"
                            onClick={handleUploadReceipt}
                            disabled={!selectedFile || isUploading}
                          >
                            {isUploading ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Enviando...
                              </>
                            ) : (
                              "Confirmar Envio"
                            )}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Seller Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <User className="h-5 w-5" />
                    Vendedor
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      {order.seller_profile?.full_name?.charAt(0) || "V"}
                    </div>
                    <div>
                      <p className="font-medium">{order.seller_profile?.full_name || "Vendedor"}</p>
                      {order.seller_profile?.phone && (
                        <p className="text-sm text-muted-foreground">{order.seller_profile.phone}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Order Timeline */}
              <Card>
                <CardHeader>
                  <CardTitle>Histórico</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {order.order_logs?.sort((a: any, b: any) => 
                      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                    ).map((log: any) => (
                      <div key={log.id} className="flex gap-3 text-sm">
                        <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                        <div>
                          <p>{log.action}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(log.created_at), "dd/MM HH:mm")}
                          </p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-muted mt-2 shrink-0" />
                      <div>
                        <p>Pedido criado</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM HH:mm")}
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tracking */}
              {order.tracking_code && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Truck className="h-5 w-5" />
                      Rastreamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="font-mono">{order.tracking_code}</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
