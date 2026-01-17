import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigate, Link } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { ArrowLeft, Save, Building2, Percent, Clock, FileText } from "lucide-react";
import { Json } from "@/integrations/supabase/types";

interface PlatformSettings {
  platform_fee_percent: number;
  payment_deadline_hours: number;
  confirmation_deadline_hours: number;
  bank_name: string;
  bank_iban: string;
  bank_holder: string;
  multicaixa_ref: string;
  support_email: string;
  support_phone: string;
}

const defaultSettings: PlatformSettings = {
  platform_fee_percent: 5,
  payment_deadline_hours: 48,
  confirmation_deadline_hours: 72,
  bank_name: "",
  bank_iban: "",
  bank_holder: "",
  multicaixa_ref: "",
  support_email: "",
  support_phone: "",
};

export default function AdminSettings() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<PlatformSettings>(defaultSettings);

  // Fetch platform settings
  const { data: platformSettings, isLoading } = useQuery({
    queryKey: ['platform-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('platform_settings')
        .select('*');

      if (error) throw error;
      
      // Convert array to object
      const settingsObj: Record<string, Json> = {};
      data?.forEach(item => {
        settingsObj[item.key] = item.value;
      });
      
      return settingsObj;
    },
    enabled: isAdmin,
  });

  useEffect(() => {
    if (platformSettings) {
      setSettings({
        platform_fee_percent: Number(platformSettings.platform_fee_percent) || defaultSettings.platform_fee_percent,
        payment_deadline_hours: Number(platformSettings.payment_deadline_hours) || defaultSettings.payment_deadline_hours,
        confirmation_deadline_hours: Number(platformSettings.confirmation_deadline_hours) || defaultSettings.confirmation_deadline_hours,
        bank_name: String(platformSettings.bank_name || defaultSettings.bank_name),
        bank_iban: String(platformSettings.bank_iban || defaultSettings.bank_iban),
        bank_holder: String(platformSettings.bank_holder || defaultSettings.bank_holder),
        multicaixa_ref: String(platformSettings.multicaixa_ref || defaultSettings.multicaixa_ref),
        support_email: String(platformSettings.support_email || defaultSettings.support_email),
        support_phone: String(platformSettings.support_phone || defaultSettings.support_phone),
      });
    }
  }, [platformSettings]);

  // Save settings mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      const settingsToSave = Object.entries(settings).map(([key, value]) => ({
        key,
        value: value as Json,
        updated_by: user?.id,
        description: getSettingDescription(key),
      }));

      for (const setting of settingsToSave) {
        const { error } = await supabase
          .from('platform_settings')
          .upsert(
            { 
              key: setting.key, 
              value: setting.value,
              updated_by: setting.updated_by,
              description: setting.description,
            },
            { onConflict: 'key' }
          );

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['platform-settings'] });
      toast.success("Configurações salvas com sucesso!");
    },
    onError: (error) => {
      console.error('Error saving settings:', error);
      toast.error("Erro ao salvar configurações");
    },
  });

  const getSettingDescription = (key: string): string => {
    const descriptions: Record<string, string> = {
      platform_fee_percent: "Taxa cobrada pela plataforma em cada transação",
      payment_deadline_hours: "Prazo para o comprador enviar o comprovante de pagamento",
      confirmation_deadline_hours: "Prazo para o comprador confirmar o recebimento",
      bank_name: "Nome do banco da plataforma",
      bank_iban: "IBAN da conta da plataforma",
      bank_holder: "Nome do titular da conta",
      multicaixa_ref: "Referência Multicaixa para pagamentos",
      support_email: "Email de suporte da plataforma",
      support_phone: "Telefone de suporte da plataforma",
    };
    return descriptions[key] || "";
  };

  if (adminLoading || isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center pt-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-20 pb-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/admin">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold">Configurações da Plataforma</h1>
              <p className="text-muted-foreground">Gerencie taxas, prazos e dados bancários</p>
            </div>
          </div>

          <div className="space-y-6">
            {/* Taxas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Percent className="h-5 w-5" />
                  Taxas
                </CardTitle>
                <CardDescription>
                  Configure a taxa cobrada pela plataforma em cada transação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>Taxa da Plataforma (%)</Label>
                  <Input
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={settings.platform_fee_percent}
                    onChange={(e) => setSettings({ ...settings, platform_fee_percent: Number(e.target.value) })}
                    className="mt-1 max-w-xs"
                  />
                  <p className="text-sm text-muted-foreground mt-1">
                    Percentual cobrado sobre o valor total de cada pedido
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Prazos */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Prazos
                </CardTitle>
                <CardDescription>
                  Configure os prazos para pagamento e confirmação
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Prazo para Pagamento (horas)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.payment_deadline_hours}
                      onChange={(e) => setSettings({ ...settings, payment_deadline_hours: Number(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Tempo que o comprador tem para enviar o comprovante
                    </p>
                  </div>
                  <div>
                    <Label>Prazo para Confirmação (horas)</Label>
                    <Input
                      type="number"
                      min="1"
                      value={settings.confirmation_deadline_hours}
                      onChange={(e) => setSettings({ ...settings, confirmation_deadline_hours: Number(e.target.value) })}
                      className="mt-1"
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      Tempo que o comprador tem para confirmar o recebimento
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dados Bancários */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Dados Bancários
                </CardTitle>
                <CardDescription>
                  Informações da conta bancária da plataforma para recebimento de pagamentos
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Nome do Banco</Label>
                    <Input
                      value={settings.bank_name}
                      onChange={(e) => setSettings({ ...settings, bank_name: e.target.value })}
                      placeholder="Ex: BFA, BAI, BIC..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Titular da Conta</Label>
                    <Input
                      value={settings.bank_holder}
                      onChange={(e) => setSettings({ ...settings, bank_holder: e.target.value })}
                      placeholder="Nome completo do titular"
                      className="mt-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>IBAN</Label>
                  <Input
                    value={settings.bank_iban}
                    onChange={(e) => setSettings({ ...settings, bank_iban: e.target.value })}
                    placeholder="AO06 0000 0000 0000 0000 0000 0"
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label>Referência Multicaixa</Label>
                  <Input
                    value={settings.multicaixa_ref}
                    onChange={(e) => setSettings({ ...settings, multicaixa_ref: e.target.value })}
                    placeholder="Entidade e Referência Multicaixa"
                    className="mt-1"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Suporte */}
            <Card>
              <CardHeader>
                <CardTitle>Contato de Suporte</CardTitle>
                <CardDescription>
                  Informações de contato exibidas para os usuários
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Email de Suporte</Label>
                    <Input
                      type="email"
                      value={settings.support_email}
                      onChange={(e) => setSettings({ ...settings, support_email: e.target.value })}
                      placeholder="suporte@bazar.ao"
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label>Telefone de Suporte</Label>
                    <Input
                      value={settings.support_phone}
                      onChange={(e) => setSettings({ ...settings, support_phone: e.target.value })}
                      placeholder="+244 900 000 000"
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Legal Pages */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Páginas Legais
                </CardTitle>
                <CardDescription>
                  Editar conteúdo das páginas de Termos, Privacidade e Ajuda
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Link to="/admin/legal-pages">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    Editar Páginas Legais
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Save Button */}
            <div className="flex justify-end">
              <Button 
                size="lg"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
              >
                <Save className="mr-2 h-5 w-5" />
                {saveMutation.isPending ? "Salvando..." : "Salvar Configurações"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
