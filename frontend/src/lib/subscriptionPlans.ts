import { Zap, Star, Crown, Users } from "lucide-react";

export interface PlanFeature {
  text: string;
  included: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  productsLimit: number;
  photosLimit: number;
  badge: string;
  icon: any;
  color: string;
  features: PlanFeature[];
  popular?: boolean;
  isFeatured?: boolean;
  hasStorefront?: boolean;
  platformFee: number; // Platform fee percentage
}

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "free",
    name: "Usuário",
    description: "Apenas visualizar e comprar",
    monthlyPrice: 0,
    yearlyPrice: 0,
    productsLimit: 0,
    photosLimit: 0,
    badge: "",
    icon: Users,
    color: "from-gray-400 to-gray-500",
    platformFee: 0,
    features: [
      { text: "Visualizar produtos", included: true },
      { text: "Comprar produtos", included: true },
      { text: "Favoritar produtos", included: true },
      { text: "Interagir com vendedores", included: true },
      { text: "Publicar produtos", included: false },
      { text: "Dashboard de vendas", included: false },
    ],
  },
  {
    id: "basic",
    name: "Básico",
    description: "Para começar a vender",
    monthlyPrice: 0,
    yearlyPrice: 0,
    productsLimit: 3,
    photosLimit: 1,
    badge: "",
    icon: Zap,
    color: "from-blue-500 to-blue-600",
    platformFee: 10, // 10% fee
    features: [
      { text: "Tudo do plano Usuário", included: true },
      { text: "Até 3 anúncios ativos", included: true },
      { text: "1 foto por anúncio", included: true },
      { text: "Dashboard básico", included: true },
      { text: "Taxa de 10% por venda", included: true },
      { text: "Selo de vendedor", included: false },
    ],
  },
  {
    id: "pro",
    name: "Pro",
    description: "Para vendedores profissionais",
    monthlyPrice: 2500,
    yearlyPrice: 24000,
    productsLimit: 20,
    photosLimit: 5,
    badge: "Vendedor Verificado",
    icon: Star,
    color: "from-purple-500 to-purple-600",
    popular: true,
    platformFee: 7, // 7% fee
    features: [
      { text: "Tudo do plano Básico", included: true },
      { text: "Até 20 anúncios ativos", included: true },
      { text: "Até 5 fotos por anúncio", included: true },
      { text: "Selo 'Vendedor Verificado'", included: true },
      { text: "Taxa de 7% por venda", included: true },
      { text: "Destaque nos resultados", included: true },
    ],
  },
  {
    id: "enterprise",
    name: "VIP",
    description: "Para grandes vendedores",
    monthlyPrice: 7500,
    yearlyPrice: 72000,
    productsLimit: 100,
    photosLimit: 10,
    badge: "Vendedor VIP",
    icon: Crown,
    color: "from-amber-500 to-amber-600",
    isFeatured: true,
    hasStorefront: true,
    platformFee: 5, // 5% fee
    features: [
      { text: "Tudo do plano Pro", included: true },
      { text: "Até 100 anúncios ativos", included: true },
      { text: "Até 10 fotos por anúncio", included: true },
      { text: "Selo 'Vendedor VIP'", included: true },
      { text: "Taxa de 5% por venda", included: true },
      { text: "Vitrine/Loja personalizada", included: true },
    ],
  },
];

export const getPlanById = (planId: string): SubscriptionPlan | undefined => {
  return SUBSCRIPTION_PLANS.find(plan => plan.id === planId);
};

export const formatPrice = (price: number): string => {
  return price.toLocaleString("pt-AO");
};

export const getYearlyDiscount = (): number => {
  return 20;
};

export const getPlatformFee = (planId: string): number => {
  const plan = getPlanById(planId);
  return plan?.platformFee ?? 10;
};

// Extra paid features pricing
export const BOOST_PRICES = {
  featured_24h: 500,      // 24h featured: 500 Kz
  featured_7d: 2000,      // 7 days featured: 2000 Kz
  extra_photo: 200,       // Extra photo for basic plan: 200 Kz
  top_boost: 1000,        // Top boost (always first for non-logged): 1000 Kz
};
