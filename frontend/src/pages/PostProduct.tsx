import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { MultiImageUpload } from "@/components/MultiImageUpload";
import { ProductBoostModal } from "@/components/ProductBoostModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Loader2, Camera, AlertCircle, Crown, Star, Zap, ChevronRight, Image, Percent, Sparkles, Rocket, TrendingUp } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { getPlatformFee } from "@/lib/subscriptionPlans";
import { Link } from "react-router-dom";

const CATEGORIES = [
  "Eletrônicos",
  "Moda",
  "Casa e Jardim",
  "Veículos",
  "Imóveis",
  "Esportes",
  "Livros",
  "Outros",
];

export default function PostProduct() {
  const [isLoading, setIsLoading] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  
  const { subscription, isLoading: subLoading, canPublish, getRemainingProducts, getPhotosLimit } = useSubscription(user?.id);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    price: "",
    condition: "used",
    category: "",
    whatsapp: "",
    location: "",
    images: [] as string[],
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast.error("Você precisa estar logado para publicar");
      navigate("/auth");
      return;
    }
    setUser(user);
    setIsCheckingAuth(false);
  };

  const photosLimit = getPhotosLimit();
  const remainingProducts = getRemainingProducts();
  const platformFee = subscription ? getPlatformFee(subscription.plan) : 10;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (!canPublish()) {
      toast.error("Você não pode publicar mais produtos. Faça upgrade do seu plano.");
      navigate("/subscription");
      return;
    }

    if (formData.images.length > photosLimit) {
      toast.error(`Seu plano permite apenas ${photosLimit} foto(s) por anúncio`);
      return;
    }

    setIsLoading(true);

    try {
      if (!formData.images || formData.images.length === 0) {
        toast.error("Por favor, adicione pelo menos uma imagem do produto");
        setIsLoading(false);
        return;
      }

      const isFeatured = subscription?.plan === "enterprise";

      const { error } = await supabase.from("products").insert({
        user_id: user.id,
        title: formData.title,
        description: formData.description,
        price: parseFloat(formData.price),
        condition: formData.condition,
        category: formData.category,
        whatsapp: formData.whatsapp,
        location: formData.location,
        images: formData.images,
        image_url: formData.images[0] || null,
        is_featured: isFeatured,
      });

      if (error) throw error;

      if (subscription) {
        await (supabase as any)
          .from("seller_subscriptions")
          .update({ products_used: (subscription.products_used || 0) + 1 })
          .eq("user_id", user.id);
      }

      toast.success("Produto publicado com sucesso!");
      navigate("/");
    } catch (error: any) {
      toast.error(error.message || "Erro ao publicar produto");
    } finally {
      setIsLoading(false);
    }
  };

  if (isCheckingAuth || subLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  // No subscription or free plan
  if (!subscription || subscription.status !== "active" || subscription.plan === "free") {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-14 pb-20 md:pt-16 md:pb-4 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-muted-foreground" />
              </div>
              <h2 className="text-xl font-bold mb-2">Seja um Vendedor</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Para publicar produtos, você precisa ter uma assinatura de vendedor.
              </p>
              <Button 
                onClick={() => navigate("/subscription")}
                className="w-full bg-gradient-to-r from-primary to-primary/80"
              >
                Ver Planos
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  // Limit reached
  if (!canPublish()) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-14 pb-20 md:pt-16 md:pb-4 flex items-center justify-center px-4">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-6 text-center">
              <div className="w-16 h-16 mx-auto bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="h-8 w-8 text-amber-600" />
              </div>
              <h2 className="text-xl font-bold mb-2">Limite Atingido</h2>
              <p className="text-muted-foreground text-sm mb-6">
                Você atingiu o limite de {subscription.products_limit} anúncios do plano {subscription.plan.toUpperCase()}.
              </p>
              <Button 
                onClick={() => navigate("/subscription/manage")}
                className="w-full"
              >
                Fazer Upgrade
                <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  const getPlanIcon = () => {
    switch (subscription?.plan) {
      case "enterprise": return <Crown className="h-4 w-4" />;
      case "pro": return <Star className="h-4 w-4" />;
      default: return <Zap className="h-4 w-4" />;
    }
  };

  const getPlanGradient = () => {
    switch (subscription?.plan) {
      case "enterprise": return "from-amber-500 to-amber-600";
      case "pro": return "from-purple-500 to-purple-600";
      default: return "from-blue-500 to-blue-600";
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-14 pb-20 md:pt-16 md:pb-4">
        {/* Plan Info Header */}
        <div className="bg-muted/50 border-b border-border px-4 py-3">
          <div className="flex items-center justify-between max-w-lg mx-auto">
            <div className="flex items-center gap-2">
              <div className={`p-1.5 rounded-lg bg-gradient-to-r ${getPlanGradient()} text-white`}>
                {getPlanIcon()}
              </div>
              <div>
                <p className="text-sm font-medium">{subscription?.plan?.toUpperCase()}</p>
                <p className="text-xs text-muted-foreground">{platformFee}% taxa por venda</p>
              </div>
            </div>
            <Link to="/subscription/manage" className="text-xs text-primary">
              Gerenciar
            </Link>
          </div>
        </div>

        {/* Usage Stats */}
        <div className="px-4 py-3 border-b border-border">
          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="flex-1">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">Anúncios</span>
                <span className="font-medium">{subscription?.products_used || 0}/{subscription?.products_limit}</span>
              </div>
              <Progress 
                value={((subscription?.products_used || 0) / (subscription?.products_limit || 1)) * 100} 
                className="h-1.5"
              />
            </div>
            <div className="flex items-center gap-1.5 text-sm">
              <Image className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">{photosLimit}</span>
              <span className="text-xs text-muted-foreground">fotos</span>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="px-4 py-4 max-w-lg mx-auto">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Images */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Camera className="h-4 w-4" />
                  Fotos do Produto
                </Label>
                <span className="text-xs text-muted-foreground">
                  {formData.images.length}/{photosLimit}
                </span>
              </div>
              <MultiImageUpload
                bucket="product-images"
                currentImages={formData.images}
                onUploadComplete={(urls) => setFormData({ ...formData, images: urls })}
                maxImages={photosLimit}
              />
              {formData.images.length === 0 && (
                <p className="text-xs text-muted-foreground">
                  Adicione pelo menos uma foto
                </p>
              )}
            </div>

            {/* Title */}
            <div className="space-y-1.5">
              <Label htmlFor="title">Título</Label>
              <Input
                id="title"
                placeholder="Ex: iPhone 14 Pro Max 256GB"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                required
                className="h-11"
              />
            </div>

            {/* Price & Condition */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="price">Preço (Kz)</Label>
                <Input
                  id="price"
                  type="number"
                  placeholder="0"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Condição</Label>
                <Select
                  value={formData.condition}
                  onValueChange={(value) => setFormData({ ...formData, condition: value })}
                >
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">Novo</SelectItem>
                    <SelectItem value="used">Usado</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label>Categoria</Label>
              <Select
                value={formData.category}
                onValueChange={(value) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                placeholder="Descreva seu produto..."
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* WhatsApp */}
            <div className="space-y-1.5">
              <Label htmlFor="whatsapp">WhatsApp</Label>
              <Input
                id="whatsapp"
                type="tel"
                placeholder="+244 900 000 000"
                value={formData.whatsapp}
                onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                required
                className="h-11"
              />
            </div>

            {/* Location */}
            <div className="space-y-1.5">
              <Label htmlFor="location">Localização</Label>
              <Input
                id="location"
                placeholder="Cidade, Bairro"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                className="h-11"
              />
            </div>

            {/* Fee Info */}
            <div className="flex items-center gap-2 p-3 bg-muted/50 rounded-lg text-sm">
              <Percent className="h-4 w-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                Taxa de <span className="font-medium text-foreground">{platformFee}%</span> sobre vendas
              </span>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full h-12 text-base bg-gradient-to-r from-primary to-primary/80"
              disabled={isLoading || formData.images.length === 0 || formData.images.length > photosLimit}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Publicando...
                </>
              ) : (
                "Publicar"
              )}
            </Button>
          </form>

          {/* Extras Section */}
          <div className="mt-8 space-y-4">
            <h3 className="font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-500" />
              Impulsione seu Anúncio
            </h3>
            
            <div className="grid gap-3">
              {/* Photo Upgrade for Basic */}
              {subscription?.plan === "basic" && (
                <Link to="/subscription/manage" className="block">
                  <div className="p-4 rounded-xl border border-border bg-gradient-to-r from-blue-500/5 to-blue-600/5 hover:border-blue-500/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-500/10 rounded-lg">
                        <Image className="h-5 w-5 text-blue-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Mais Fotos</p>
                        <p className="text-xs text-muted-foreground">Upgrade para mais fotos por anúncio</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              )}

              {/* Boost */}
              <Link to="/subscription/manage" className="block">
                <div className="p-4 rounded-xl border border-border bg-gradient-to-r from-amber-500/5 to-amber-600/5 hover:border-amber-500/50 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-amber-500/10 rounded-lg">
                      <Rocket className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">Destaque e Boost</p>
                      <p className="text-xs text-muted-foreground">Apareça no topo e em destaques</p>
                    </div>
                    <Badge variant="secondary" className="text-xs">Extras</Badge>
                  </div>
                </div>
              </Link>

              {/* Upgrade Plan */}
              {subscription?.plan !== "enterprise" && (
                <Link to="/subscription" className="block">
                  <div className="p-4 rounded-xl border border-border bg-gradient-to-r from-purple-500/5 to-purple-600/5 hover:border-purple-500/50 transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <TrendingUp className="h-5 w-5 text-purple-500" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">Upgrade de Plano</p>
                        <p className="text-xs text-muted-foreground">Mais anúncios, fotos e menos taxas</p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </div>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
