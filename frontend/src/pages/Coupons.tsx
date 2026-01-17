import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  Tag,
  Percent,
  DollarSign,
  Calendar,
  Users,
  Trash2,
  Edit,
  Copy,
  Crown,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useSubscription } from "@/hooks/useSubscription";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: string;
  discount_value: number;
  min_purchase: number;
  max_uses: number | null;
  uses_count: number;
  starts_at: string;
  expires_at: string | null;
  is_active: boolean;
  created_at: string;
}

export default function Coupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount_type: "percentage",
    discount_value: "",
    min_purchase: "",
    max_uses: "",
    expires_at: "",
    is_active: true,
  });

  const navigate = useNavigate();
  const { subscription, isLoading: subLoading } = useSubscription(userId || undefined);

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
    fetchCoupons(user.id);
  };

  const fetchCoupons = async (uid: string) => {
    const { data, error } = await supabase
      .from("coupons")
      .select("*")
      .eq("seller_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching coupons:", error);
    } else {
      setCoupons((data as Coupon[]) || []);
    }
    setIsLoading(false);
  };

  const handleSubmit = async () => {
    if (!userId || !formData.code || !formData.discount_value) {
      toast.error("Preencha os campos obrigatórios");
      return;
    }

    setIsSubmitting(true);
    try {
      const couponData = {
        seller_id: userId,
        code: formData.code.toUpperCase().replace(/\s/g, ""),
        description: formData.description || null,
        discount_type: formData.discount_type,
        discount_value: parseFloat(formData.discount_value),
        min_purchase: formData.min_purchase ? parseFloat(formData.min_purchase) : 0,
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at || null,
        is_active: formData.is_active,
      };

      if (editingCoupon) {
        const { error } = await supabase
          .from("coupons")
          .update(couponData)
          .eq("id", editingCoupon.id);

        if (error) throw error;
        toast.success("Cupom atualizado com sucesso!");
      } else {
        const { error } = await supabase
          .from("coupons")
          .insert(couponData);

        if (error) throw error;
        toast.success("Cupom criado com sucesso!");
      }

      setShowCreateDialog(false);
      setEditingCoupon(null);
      resetForm();
      fetchCoupons(userId);
    } catch (error: any) {
      console.error("Error saving coupon:", error);
      if (error.code === "23505") {
        toast.error("Já existe um cupom com este código");
      } else {
        toast.error("Erro ao salvar cupom");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (couponId: string) => {
    if (!confirm("Tem certeza que deseja excluir este cupom?")) return;

    const { error } = await supabase
      .from("coupons")
      .delete()
      .eq("id", couponId);

    if (error) {
      toast.error("Erro ao excluir cupom");
    } else {
      toast.success("Cupom excluído");
      setCoupons(prev => prev.filter(c => c.id !== couponId));
    }
  };

  const handleEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      description: coupon.description || "",
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value.toString(),
      min_purchase: coupon.min_purchase.toString(),
      max_uses: coupon.max_uses?.toString() || "",
      expires_at: coupon.expires_at ? coupon.expires_at.split("T")[0] : "",
      is_active: coupon.is_active,
    });
    setShowCreateDialog(true);
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Código copiado!");
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount_type: "percentage",
      discount_value: "",
      min_purchase: "",
      max_uses: "",
      expires_at: "",
      is_active: true,
    });
    setEditingCoupon(null);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let code = "";
    for (let i = 0; i < 8; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setFormData(prev => ({ ...prev, code }));
  };

  // Check subscription - Only Pro and VIP can create coupons
  const canCreateCoupons = subscription?.plan === "pro" || subscription?.plan === "enterprise";

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

  if (!canCreateCoupons) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardContent className="py-12 text-center">
                <Crown className="h-16 w-16 mx-auto text-amber-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Recurso Premium</h2>
                <p className="text-muted-foreground mb-6">
                  Cupons de desconto estão disponíveis apenas para vendedores Pro e VIP.
                </p>
                <Button 
                  onClick={() => navigate("/subscription")}
                  className="bg-gradient-to-r from-primary to-amber-500"
                >
                  Fazer Upgrade
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4 bg-background">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
            <div>
              <h1 className="text-2xl md:text-3xl font-bold">Cupons de Desconto</h1>
              <p className="text-muted-foreground">
                Crie promoções para seus clientes
              </p>
            </div>
            <Button
              onClick={() => {
                resetForm();
                setShowCreateDialog(true);
              }}
              className="bg-gradient-to-r from-primary to-amber-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Criar Cupom
            </Button>
          </div>

          {coupons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Tag className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Nenhum cupom criado</h3>
                <p className="text-muted-foreground mb-4">
                  Crie cupons de desconto para atrair mais clientes
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Primeiro Cupom
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {coupons.map((coupon) => (
                <Card key={coupon.id} className={!coupon.is_active ? "opacity-60" : ""}>
                  <CardContent className="p-4">
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="p-3 bg-primary/10 rounded-xl">
                          {coupon.discount_type === "percentage" ? (
                            <Percent className="h-6 w-6 text-primary" />
                          ) : (
                            <DollarSign className="h-6 w-6 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <code className="font-mono font-bold text-lg">
                              {coupon.code}
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleCopyCode(coupon.code)}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                            {!coupon.is_active && (
                              <Badge variant="secondary">Inativo</Badge>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground truncate">
                            {coupon.description || "Sem descrição"}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2 text-sm">
                        <Badge variant="outline" className="gap-1">
                          {coupon.discount_type === "percentage" ? (
                            <>{coupon.discount_value}% OFF</>
                          ) : (
                            <>Kz {coupon.discount_value.toLocaleString("pt-AO")} OFF</>
                          )}
                        </Badge>

                        {coupon.min_purchase > 0 && (
                          <Badge variant="secondary" className="gap-1">
                            Mín: Kz {coupon.min_purchase.toLocaleString("pt-AO")}
                          </Badge>
                        )}

                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" />
                          {coupon.uses_count}/{coupon.max_uses || "∞"}
                        </Badge>

                        {coupon.expires_at && (
                          <Badge variant="secondary" className="gap-1">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(coupon.expires_at), "dd/MM/yy", { locale: ptBR })}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(coupon)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive"
                          onClick={() => handleDelete(coupon.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={(open) => {
        if (!open) resetForm();
        setShowCreateDialog(open);
      }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag className="h-5 w-5 text-primary" />
              {editingCoupon ? "Editar Cupom" : "Criar Cupom"}
            </DialogTitle>
            <DialogDescription>
              Crie um código de desconto para seus clientes
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="code">Código do Cupom *</Label>
              <div className="flex gap-2">
                <Input
                  id="code"
                  placeholder="Ex: DESCONTO10"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ 
                    ...prev, 
                    code: e.target.value.toUpperCase().replace(/\s/g, "") 
                  }))}
                  className="font-mono uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={generateCode}
                >
                  Gerar
                </Button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Ex: Desconto de boas-vindas"
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Tipo de Desconto</Label>
                <Select
                  value={formData.discount_type}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, discount_type: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentual (%)</SelectItem>
                    <SelectItem value="fixed">Valor Fixo (Kz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discount_value">Valor *</Label>
                <Input
                  id="discount_value"
                  type="number"
                  placeholder={formData.discount_type === "percentage" ? "10" : "1000"}
                  value={formData.discount_value}
                  onChange={(e) => setFormData(prev => ({ ...prev, discount_value: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="min_purchase">Compra Mínima (Kz)</Label>
                <Input
                  id="min_purchase"
                  type="number"
                  placeholder="0"
                  value={formData.min_purchase}
                  onChange={(e) => setFormData(prev => ({ ...prev, min_purchase: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max_uses">Limite de Usos</Label>
                <Input
                  id="max_uses"
                  type="number"
                  placeholder="Ilimitado"
                  value={formData.max_uses}
                  onChange={(e) => setFormData(prev => ({ ...prev, max_uses: e.target.value }))}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="expires_at">Data de Expiração</Label>
              <Input
                id="expires_at"
                type="date"
                value={formData.expires_at}
                onChange={(e) => setFormData(prev => ({ ...prev, expires_at: e.target.value }))}
              />
            </div>

            <div className="flex items-center justify-between">
              <Label htmlFor="is_active">Cupom Ativo</Label>
              <Switch
                id="is_active"
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData(prev => ({ ...prev, is_active: checked }))}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editingCoupon ? "Salvar" : "Criar Cupom"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
