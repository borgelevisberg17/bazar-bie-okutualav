import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { 
  Loader2, 
  Crown, 
  Star, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  AlertTriangle,
  Calendar,
  Package,
  Camera,
  Percent,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { SUBSCRIPTION_PLANS, getPlanById, formatPrice, getPlatformFee } from "@/lib/subscriptionPlans";

export default function SubscriptionManagement() {
  const [user, setUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showDowngradeDialog, setShowDowngradeDialog] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const navigate = useNavigate();

  const { subscription, isLoading: subLoading, refetch } = useSubscription(user?.id);

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUser(user);
    setIsLoading(false);
  };

  const handleUpgrade = (planId: string) => {
    navigate(`/subscription/checkout?plan=${planId}&billing=monthly`);
  };

  const handleDowngrade = (planId: string) => {
    setSelectedPlan(planId);
    setShowDowngradeDialog(true);
  };

  const confirmDowngrade = async () => {
    if (!selectedPlan || !user) return;
    
    const plan = getPlanById(selectedPlan);
    if (!plan) return;

    try {
      // For free plan, just update directly
      if (selectedPlan === "basic") {
        await (supabase as any)
          .from("seller_subscriptions")
          .update({
            plan: "basic",
            products_limit: plan.productsLimit,
            photos_limit: plan.photosLimit,
            badge: plan.badge || null,
          })
          .eq("user_id", user.id);
        
        toast.success("Plano alterado para Básico");
        refetch();
      } else {
        // For paid downgrades, redirect to checkout
        navigate(`/subscription/checkout?plan=${selectedPlan}&billing=monthly`);
      }
    } catch (error) {
      toast.error("Erro ao alterar plano");
    } finally {
      setShowDowngradeDialog(false);
      setSelectedPlan(null);
    }
  };

  const handleCancel = async () => {
    if (!user) return;
    setIsCancelling(true);
    
    try {
      await (supabase as any)
        .from("seller_subscriptions")
        .update({
          status: "cancelled",
          cancelled_at: new Date().toISOString(),
        })
        .eq("user_id", user.id);
      
      toast.success("Assinatura cancelada");
      refetch();
    } catch (error) {
      toast.error("Erro ao cancelar assinatura");
    } finally {
      setIsCancelling(false);
      setShowCancelDialog(false);
    }
  };

  const getPlanIcon = (plan: string) => {
    switch (plan) {
      case "enterprise": return <Crown className="h-6 w-6" />;
      case "pro": return <Star className="h-6 w-6" />;
      default: return <Zap className="h-6 w-6" />;
    }
  };

  const getPlanGradient = (plan: string) => {
    switch (plan) {
      case "enterprise": return "from-amber-500 to-amber-600";
      case "pro": return "from-purple-500 to-purple-600";
      default: return "from-blue-500 to-blue-600";
    }
  };

  if (isLoading || subLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  const currentPlan = subscription ? getPlanById(subscription.plan) : null;
  const currentPlanIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === subscription?.plan);
  const platformFee = subscription ? getPlatformFee(subscription.plan) : 10;

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-16 pb-24 md:pt-20 md:pb-8">
        <div className="max-w-4xl mx-auto px-4">
          {/* Current Plan Card */}
          {subscription && currentPlan && (
            <Card className="mb-6 overflow-hidden border-0 shadow-lg">
              <div className={`bg-gradient-to-r ${getPlanGradient(subscription.plan)} p-6 text-white`}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-white/20 rounded-xl">
                      {getPlanIcon(subscription.plan)}
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold">{currentPlan.name}</h1>
                      <p className="text-white/80 text-sm">{currentPlan.description}</p>
                    </div>
                  </div>
                  <Badge className="bg-white/20 text-white border-0">
                    {subscription.status === "active" ? "Ativo" : subscription.status}
                  </Badge>
                </div>
              </div>
              
              <CardContent className="p-6 space-y-6">
                {/* Usage Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Package className="h-4 w-4" />
                      <span className="text-xs">Anúncios</span>
                    </div>
                    <p className="text-2xl font-bold">
                      {subscription.products_used}/{subscription.products_limit}
                    </p>
                    <Progress 
                      value={(subscription.products_used / subscription.products_limit) * 100} 
                      className="mt-2 h-1.5"
                    />
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Camera className="h-4 w-4" />
                      <span className="text-xs">Fotos/Anúncio</span>
                    </div>
                    <p className="text-2xl font-bold">{subscription.photos_limit}</p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Percent className="h-4 w-4" />
                      <span className="text-xs">Taxa</span>
                    </div>
                    <p className="text-2xl font-bold">{platformFee}%</p>
                  </div>
                  
                  <div className="p-4 bg-muted/50 rounded-xl">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                      <Calendar className="h-4 w-4" />
                      <span className="text-xs">Expira em</span>
                    </div>
                    <p className="text-sm font-medium">
                      {subscription.expires_at 
                        ? new Date(subscription.expires_at).toLocaleDateString("pt-BR")
                        : "Sem expiração"
                      }
                    </p>
                  </div>
                </div>

                {/* Current Plan Features */}
                <div>
                  <h3 className="font-semibold mb-3">Benefícios do seu plano</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {currentPlan.features.map((feature, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {feature.included ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <XCircle className="h-4 w-4 text-muted-foreground" />
                        )}
                        <span className={feature.included ? "" : "text-muted-foreground"}>
                          {feature.text}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Plan Options */}
          <h2 className="text-xl font-bold mb-4">
            {subscription ? "Alterar Plano" : "Escolha um Plano"}
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SUBSCRIPTION_PLANS.filter(p => p.id !== "free").map((plan, index) => {
              const isCurrentPlan = subscription?.plan === plan.id;
              const planIndex = SUBSCRIPTION_PLANS.findIndex(p => p.id === plan.id);
              const isUpgrade = planIndex > currentPlanIndex;
              const isDowngrade = planIndex < currentPlanIndex && currentPlanIndex > 0;
              const fee = getPlatformFee(plan.id);

              return (
                <Card 
                  key={plan.id}
                  className={`relative overflow-hidden transition-all ${
                    isCurrentPlan ? "ring-2 ring-primary" : "hover:shadow-lg"
                  } ${plan.popular ? "border-primary" : ""}`}
                >
                  {plan.popular && (
                    <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs px-3 py-1 rounded-bl-lg font-medium">
                      Popular
                    </div>
                  )}
                  
                  <CardHeader className="pb-2">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-r ${plan.color} text-white`}>
                        <plan.icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{plan.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">{plan.description}</p>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="flex items-baseline gap-1">
                      <span className="text-3xl font-bold">
                        {plan.monthlyPrice === 0 ? "Grátis" : `${formatPrice(plan.monthlyPrice)} Kz`}
                      </span>
                      {plan.monthlyPrice > 0 && (
                        <span className="text-muted-foreground">/mês</span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <Package className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.productsLimit} anúncios</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Camera className="h-4 w-4 text-muted-foreground" />
                        <span>{plan.photosLimit} fotos</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Percent className="h-4 w-4 text-muted-foreground" />
                        <span>{fee}% taxa</span>
                      </div>
                    </div>

                    {isCurrentPlan ? (
                      <Button disabled className="w-full" variant="outline">
                        Plano Atual
                      </Button>
                    ) : isUpgrade ? (
                      <Button 
                        className="w-full bg-gradient-to-r from-primary to-primary/80"
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        <TrendingUp className="h-4 w-4 mr-2" />
                        Fazer Upgrade
                      </Button>
                    ) : isDowngrade ? (
                      <Button 
                        variant="outline"
                        className="w-full"
                        onClick={() => handleDowngrade(plan.id)}
                      >
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Fazer Downgrade
                      </Button>
                    ) : (
                      <Button 
                        className="w-full"
                        onClick={() => handleUpgrade(plan.id)}
                      >
                        Selecionar
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Cancel Subscription */}
          {subscription && subscription.status === "active" && subscription.plan !== "basic" && (
            <div className="mt-8 p-4 border border-destructive/20 rounded-xl bg-destructive/5">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <h3 className="font-semibold text-destructive">Cancelar Assinatura</h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Ao cancelar, você perderá acesso aos benefícios do plano {currentPlan?.name} 
                    ao final do período atual.
                  </p>
                  <Button 
                    variant="destructive" 
                    size="sm" 
                    className="mt-3"
                    onClick={() => setShowCancelDialog(true)}
                  >
                    Cancelar Assinatura
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancelar Assinatura</DialogTitle>
            <DialogDescription>
              Tem certeza que deseja cancelar sua assinatura? Você perderá:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Acesso ao selo de vendedor verificado
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Limite maior de anúncios e fotos
            </li>
            <li className="flex items-center gap-2">
              <XCircle className="h-4 w-4 text-destructive" />
              Taxa preferencial nas vendas
            </li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelDialog(false)}>
              Manter Assinatura
            </Button>
            <Button variant="destructive" onClick={handleCancel} disabled={isCancelling}>
              {isCancelling ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : null}
              Confirmar Cancelamento
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Downgrade Dialog */}
      <Dialog open={showDowngradeDialog} onOpenChange={setShowDowngradeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Fazer Downgrade</DialogTitle>
            <DialogDescription>
              Ao fazer downgrade para o plano {getPlanById(selectedPlan || "")?.name}, você terá:
            </DialogDescription>
          </DialogHeader>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Menos anúncios permitidos
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Menos fotos por anúncio
            </li>
            <li className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-warning" />
              Taxa maior nas vendas
            </li>
          </ul>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDowngradeDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={confirmDowngrade}>
              Confirmar Downgrade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
