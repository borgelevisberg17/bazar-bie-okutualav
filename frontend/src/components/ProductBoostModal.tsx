import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from "sonner";
import { Loader2, Sparkles, Clock, Image, Rocket, Upload } from "lucide-react";

interface ProductBoostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productId: string;
  productTitle: string;
  currentPlan?: string;
}

const BOOST_OPTIONS = [
  {
    id: "featured_24h",
    name: "Destaque 24h",
    description: "Seu produto aparece em Destaques por 24 horas",
    price: 500,
    icon: Clock,
    duration: "24 horas",
  },
  {
    id: "featured_7d",
    name: "Destaque 7 dias",
    description: "Seu produto aparece em Destaques por 7 dias",
    price: 2000,
    icon: Sparkles,
    duration: "7 dias",
  },
  {
    id: "top_boost",
    name: "Boost Imediato",
    description: "Seu produto aparece no topo para visitantes não logados",
    price: 1000,
    icon: Rocket,
    duration: "7 dias",
  },
  {
    id: "extra_photo",
    name: "Foto Extra",
    description: "Adicione mais 1 foto ao seu anúncio (plano básico)",
    price: 200,
    icon: Image,
    duration: "Permanente",
    planRestriction: "basic",
  },
];

export function ProductBoostModal({
  open,
  onOpenChange,
  productId,
  productTitle,
  currentPlan = "basic",
}: ProductBoostModalProps) {
  const [selectedBoost, setSelectedBoost] = useState<string>("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableBoosts = BOOST_OPTIONS.filter(
    (boost) => !boost.planRestriction || boost.planRestriction === currentPlan
  );

  const selectedOption = BOOST_OPTIONS.find((b) => b.id === selectedBoost);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type !== "application/pdf") {
        toast.error("Por favor, envie um arquivo PDF");
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Arquivo muito grande. Máximo 5MB");
        return;
      }
      setReceiptFile(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedBoost || !receiptFile) {
      toast.error("Selecione um boost e envie o comprovante");
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      // Upload receipt
      const fileName = `${user.id}/${productId}/${Date.now()}_boost_receipt.pdf`;
      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(fileName, receiptFile);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("payment-receipts")
        .getPublicUrl(fileName);

      // Calculate expiry
      let expiresAt = null;
      if (selectedBoost === "featured_24h") {
        expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
      } else if (selectedBoost === "featured_7d" || selectedBoost === "top_boost") {
        expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
      }

      // Create boost request
      const { error: boostError } = await supabase
        .from("product_boosts")
        .insert({
          product_id: productId,
          user_id: user.id,
          boost_type: selectedBoost,
          price_paid: selectedOption?.price || 0,
          expires_at: expiresAt,
          status: "pending",
          payment_receipt_url: publicUrl,
          payment_submitted_at: new Date().toISOString(),
        });

      if (boostError) throw boostError;

      toast.success("Solicitação de boost enviada! Aguarde aprovação.");
      onOpenChange(false);
      setSelectedBoost("");
      setReceiptFile(null);
    } catch (error: any) {
      console.error("Error submitting boost:", error);
      toast.error(error.message || "Erro ao solicitar boost");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            Impulsionar Produto
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">
            Produto: <strong>{productTitle}</strong>
          </p>

          <RadioGroup value={selectedBoost} onValueChange={setSelectedBoost}>
            <div className="grid gap-3">
              {availableBoosts.map((boost) => {
                const Icon = boost.icon;
                return (
                  <Label
                    key={boost.id}
                    htmlFor={boost.id}
                    className={`flex items-start gap-4 p-4 rounded-lg border cursor-pointer transition-all ${
                      selectedBoost === boost.id
                        ? "border-primary bg-primary/5"
                        : "hover:bg-muted/50"
                    }`}
                  >
                    <RadioGroupItem value={boost.id} id={boost.id} className="mt-1" />
                    <Icon className="h-5 w-5 text-amber-500 mt-0.5" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{boost.name}</span>
                        <span className="font-bold text-primary">
                          Kz {boost.price.toLocaleString("pt-AO")}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{boost.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Duração: {boost.duration}
                      </p>
                    </div>
                  </Label>
                );
              })}
            </div>
          </RadioGroup>

          {selectedBoost && (
            <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
              <h4 className="font-medium">Dados para Pagamento</h4>
              <div className="text-sm space-y-1">
                <p><strong>IBAN:</strong> AO06 0040 0000 0000 0000 0000 0</p>
                <p><strong>Multicaixa Express:</strong> 923 000 000</p>
                <p><strong>Titular:</strong> Bazar Angola LDA</p>
                <p className="text-primary font-medium mt-2">
                  Valor: Kz {selectedOption?.price.toLocaleString("pt-AO")}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="receipt">Comprovante (PDF)</Label>
                <div className="flex items-center gap-2">
                  <Input
                    id="receipt"
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="flex-1"
                  />
                  {receiptFile && (
                    <span className="text-sm text-green-600">✓</span>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={!selectedBoost || !receiptFile || isSubmitting}
            className="w-full bg-gradient-to-r from-amber-500 to-amber-600"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Enviando...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Enviar Solicitação
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
