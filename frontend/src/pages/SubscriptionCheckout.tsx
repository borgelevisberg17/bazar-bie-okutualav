import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Building2, 
  Copy, 
  Check, 
  Upload,
  FileText,
  AlertCircle
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPrice } from "@/lib/subscriptionPlans";

interface BankDetails {
  iban: string;
  multicaixa_express: string;
  account_holder: string;
  bank_name: string;
}

export default function SubscriptionCheckout() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const planId = searchParams.get("plan") || "pro";
  const cycle = (searchParams.get("cycle") || "monthly") as "monthly" | "yearly";

  const [bankDetails, setBankDetails] = useState<BankDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [paymentNotes, setPaymentNotes] = useState("");

  const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
  const price = cycle === "monthly" ? plan?.monthlyPrice : plan?.yearlyPrice;

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

    const { data } = await (supabase as any)
      .from("platform_settings")
      .select("value")
      .eq("key", "bank_details")
      .single();

    if (data) setBankDetails(data.value);
    setIsLoading(false);
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

  const handleSubmit = async () => {
    if (!userId || !plan) return;

    setIsSubmitting(true);

    try {
      let receiptUrl = null;

      // Upload receipt if selected
      if (selectedFile) {
        const fileName = `subscriptions/${userId}/${Date.now()}.pdf`;
        const { error: uploadError } = await supabase.storage
          .from("payment-receipts")
          .upload(fileName, selectedFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase.storage
          .from("payment-receipts")
          .getPublicUrl(fileName);

        receiptUrl = urlData.publicUrl;
      }

      // Create or update subscription with pending status
      await (supabase as any)
        .from("seller_subscriptions")
        .upsert({
          user_id: userId,
          plan: planId,
          status: "pending",
          billing_cycle: cycle,
          price_paid: price,
          products_limit: plan.productsLimit === -1 ? 999999 : plan.productsLimit,
          products_used: 0,
          photos_limit: plan.photosLimit,
          badge: plan.badge || null,
          payment_receipt_url: receiptUrl,
          payment_notes: paymentNotes,
          payment_submitted_at: new Date().toISOString(),
        });

      // Update profile as seller
      await supabase
        .from("profiles")
        .update({ is_seller: true })
        .eq("id", userId);

      toast.success("Solicitação de assinatura enviada! Aguarde aprovação do administrador.");
      navigate("/seller");
    } catch (error: any) {
      console.error("Error:", error);
      toast.error("Erro ao processar: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading || !plan) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const Icon = plan.icon;

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4 bg-muted/30">
        <div className="container mx-auto max-w-2xl">
          <h1 className="text-2xl font-bold mb-6">Assinar Plano {plan.name}</h1>

          {/* Plan Summary */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center`}>
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-lg">{plan.name}</p>
                  <p className="text-sm text-muted-foreground font-normal">
                    {cycle === "monthly" ? "Mensal" : "Anual (20% desconto)"}
                  </p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-2xl font-bold">{formatPrice(price || 0)} Kz</p>
                  <p className="text-sm text-muted-foreground">
                    {cycle === "monthly" ? "/mês" : "/ano"}
                  </p>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p>✓ Até {plan.productsLimit} anúncios ativos</p>
                <p>✓ Até {plan.photosLimit} fotos por anúncio</p>
                {plan.badge && <p>✓ Selo "{plan.badge}"</p>}
                <p>✓ Dashboard de vendas completo</p>
                {plan.isFeatured && <p>✓ Produtos em Destaque</p>}
                {plan.hasStorefront && <p>✓ Vitrine/Loja personalizada</p>}
              </div>
            </CardContent>
          </Card>

          {/* Payment Instructions */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Dados para Transferência
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Faça a transferência do valor <strong>{formatPrice(price || 0)} Kz</strong> e envie o comprovante para ativar sua assinatura.
                </AlertDescription>
              </Alert>

              {bankDetails ? (
                <div className="space-y-3 bg-muted/50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Titular</p>
                      <p className="font-medium">{bankDetails.account_holder}</p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm text-muted-foreground">Banco</p>
                      <p className="font-medium">{bankDetails.bank_name}</p>
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
                </div>
              ) : (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Dados bancários não configurados. Entre em contato com o suporte.
                  </AlertDescription>
                </Alert>
              )}

              <div className="pt-4 space-y-4">
                <div>
                  <Label htmlFor="receipt">Comprovante de Pagamento (PDF, máx 5MB) *</Label>
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
                  <Input
                    id="notes"
                    value={paymentNotes}
                    onChange={(e) => setPaymentNotes(e.target.value)}
                    placeholder="Informações adicionais..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            className="w-full bg-gradient-to-r from-primary to-primary/80"
            size="lg"
            onClick={handleSubmit}
            disabled={isSubmitting || !selectedFile}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Solicitação de Assinatura
              </>
            )}
          </Button>

          {!selectedFile && (
            <p className="text-xs text-center text-destructive mt-2">
              * Envie o comprovante de pagamento para continuar
            </p>
          )}

          <p className="text-xs text-center text-muted-foreground mt-4">
            Sua assinatura será ativada após a confirmação do pagamento pelo administrador.
          </p>
        </div>
      </div>
    </>
  );
}
