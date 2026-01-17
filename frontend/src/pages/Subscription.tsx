import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { 
  Loader2, 
  Check, 
  Shield,
  TrendingUp,
  Building2
} from "lucide-react";
import { SUBSCRIPTION_PLANS, formatPrice, getYearlyDiscount } from "@/lib/subscriptionPlans";

export default function Subscription() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState<string>("free");
  const [currentStatus, setCurrentStatus] = useState<string>("active");
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [isProcessing, setIsProcessing] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkUserAndSubscription();
  }, []);

  const checkUserAndSubscription = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);

    // Fetch current subscription
    const { data: subscription } = await (supabase as any)
      .from("seller_subscriptions")
      .select("*")
      .eq("user_id", user.id)
      .single();

    if (subscription) {
      setCurrentPlan(subscription.plan);
      setCurrentStatus(subscription.status);
    }
    
    setIsLoading(false);
  };

  const handleSelectPlan = async (planId: string) => {
    if (!userId) return;
    if (planId === currentPlan && currentStatus === "active") {
      toast.info("Você já está neste plano");
      return;
    }

    const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId);
    if (!plan) return;

    // Free plan - just browse
    if (planId === "free") {
      toast.info("O plano Usuário é apenas para visualização e compras");
      return;
    }

    // Basic plan is free, activate immediately
    if (planId === "basic") {
      setIsProcessing(true);
      try {
        await (supabase as any)
          .from("seller_subscriptions")
          .upsert({
            user_id: userId,
            plan: "basic",
            status: "active",
            products_limit: 3,
            products_used: 0,
            photos_limit: 1,
            badge: null,
            billing_cycle: null,
            price_paid: 0,
            started_at: new Date().toISOString(),
          });

        await supabase
          .from("profiles")
          .update({ is_seller: true })
          .eq("id", userId);

        setCurrentPlan("basic");
        setCurrentStatus("active");
        toast.success("Plano Básico ativado! Agora você pode publicar até 3 anúncios.");
        navigate("/seller");
      } catch (error) {
        console.error("Error:", error);
        toast.error("Erro ao ativar plano");
      } finally {
        setIsProcessing(false);
      }
      return;
    }

    // For paid plans, redirect to payment flow
    navigate(`/subscription/checkout?plan=${planId}&cycle=${billingCycle}`);
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
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold mb-2">Planos de Assinatura</h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Escolha o plano ideal para começar a vender no Bié Okutuala
            </p>
          </div>

          {/* Billing Toggle - Only show for paid plans */}
          <div className="flex justify-center mb-8">
            <div className="inline-flex items-center gap-3 bg-muted rounded-full p-1">
              <button
                onClick={() => setBillingCycle("monthly")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === "monthly" 
                    ? "bg-background shadow text-foreground" 
                    : "text-muted-foreground"
                }`}
              >
                Mensal
              </button>
              <button
                onClick={() => setBillingCycle("yearly")}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  billingCycle === "yearly" 
                    ? "bg-background shadow text-foreground" 
                    : "text-muted-foreground"
                }`}
              >
                Anual
                <Badge className="ml-2 bg-green-500 text-white">-{getYearlyDiscount()}%</Badge>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {SUBSCRIPTION_PLANS.map((plan) => {
              const Icon = plan.icon;
              const price = billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
              const isCurrentPlan = plan.id === currentPlan && currentStatus === "active";
              const isPending = plan.id === currentPlan && currentStatus === "pending";
              
              return (
                <Card 
                  key={plan.id} 
                  className={`relative overflow-hidden ${
                    plan.popular ? "border-primary shadow-lg scale-105" : ""
                  } ${isCurrentPlan ? "ring-2 ring-primary" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg">
                      Mais Popular
                    </div>
                  )}
                  
                  <CardHeader className="text-center pb-2">
                    <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-r ${plan.color} flex items-center justify-center mb-3`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                    <CardTitle>{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>
                  
                  <CardContent className="text-center">
                    <div className="mb-6">
                      <span className="text-4xl font-bold">
                        {price === 0 ? "Grátis" : `${formatPrice(price)} Kz`}
                      </span>
                      {price > 0 && (
                        <span className="text-muted-foreground">
                          /{billingCycle === "monthly" ? "mês" : "ano"}
                        </span>
                      )}
                    </div>

                    {plan.badge && (
                      <Badge className={`mb-4 bg-gradient-to-r ${plan.color} text-white`}>
                        {plan.badge}
                      </Badge>
                    )}

                    <ul className="space-y-3 text-left mb-6">
                      {plan.features.map((feature, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm">
                          {feature.included ? (
                            <Check className="h-4 w-4 text-green-500 shrink-0" />
                          ) : (
                            <div className="h-4 w-4 rounded-full bg-muted shrink-0" />
                          )}
                          <span className={feature.included ? "" : "text-muted-foreground"}>
                            {feature.text}
                          </span>
                        </li>
                      ))}
                    </ul>

                    <Button
                      className={`w-full ${plan.popular ? "bg-gradient-to-r from-primary to-primary/80" : ""}`}
                      variant={plan.popular ? "default" : "outline"}
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={isProcessing || isCurrentPlan || isPending}
                    >
                      {isCurrentPlan 
                        ? "Plano Atual" 
                        : isPending 
                          ? "Aguardando Aprovação"
                          : plan.id === "free" 
                            ? "Plano Padrão" 
                            : plan.monthlyPrice === 0 
                              ? "Ativar Grátis" 
                              : "Assinar"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Features Comparison */}
          <Card className="mt-12">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Por que vender no Bié Okutuala?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Alcance milhares</h4>
                    <p className="text-sm text-muted-foreground">
                      Sua loja visível para compradores em todo Angola
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Shield className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Pagamento Seguro</h4>
                    <p className="text-sm text-muted-foreground">
                      Sistema de pagamento protegido com verificação
                    </p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Building2 className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <h4 className="font-semibold">Suporte Local</h4>
                    <p className="text-sm text-muted-foreground">
                      Equipe de suporte em Angola pronta para ajudar
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
