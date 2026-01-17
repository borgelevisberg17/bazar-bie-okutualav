import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ChevronLeft, TrendingUp, Eye, ShoppingCart, DollarSign, Package, Users, ArrowUp, ArrowDown } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { format, subDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#10B981", "#F59E0B", "#8B5CF6"];

export default function SellerAnalytics() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [period, setPeriod] = useState("7");

  const [stats, setStats] = useState({
    totalViews: 0,
    totalOrders: 0,
    totalRevenue: 0,
    conversionRate: 0,
    viewsChange: 0,
    ordersChange: 0,
    revenueChange: 0,
  });

  const [viewsData, setViewsData] = useState<any[]>([]);
  const [ordersData, setOrdersData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<any[]>([]);
  const [categoryData, setCategoryData] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    if (userId) {
      fetchAnalytics();
    }
  }, [userId, period]);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
  };

  const fetchAnalytics = async () => {
    if (!userId) return;
    setIsLoading(true);

    const days = parseInt(period);
    const startDate = startOfDay(subDays(new Date(), days - 1));
    const endDate = endOfDay(new Date());
    const prevStartDate = subDays(startDate, days);

    try {
      // Fetch products
      const { data: products } = await supabase
        .from("products")
        .select("id, title, category, image_url, images")
        .eq("user_id", userId)
        .eq("status", "active");

      const productIds = products?.map(p => p.id) || [];

      // Fetch views for current period
      const { data: viewsRaw } = await supabase
        .from("product_views")
        .select("*")
        .in("product_id", productIds)
        .gte("viewed_at", startDate.toISOString())
        .lte("viewed_at", endDate.toISOString());

      // Fetch views for previous period (for comparison)
      const { data: prevViewsRaw } = await supabase
        .from("product_views")
        .select("*")
        .in("product_id", productIds)
        .gte("viewed_at", prevStartDate.toISOString())
        .lt("viewed_at", startDate.toISOString());

      // Fetch orders for current period
      const { data: ordersRaw } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", userId)
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString());

      // Fetch orders for previous period
      const { data: prevOrdersRaw } = await supabase
        .from("orders")
        .select("*")
        .eq("seller_id", userId)
        .gte("created_at", prevStartDate.toISOString())
        .lt("created_at", startDate.toISOString());

      const currentViews = viewsRaw?.length || 0;
      const prevViews = prevViewsRaw?.length || 0;
      const currentOrders = ordersRaw?.length || 0;
      const prevOrders = prevOrdersRaw?.length || 0;
      const currentRevenue = ordersRaw?.reduce((sum, o) => sum + Number(o.seller_amount), 0) || 0;
      const prevRevenue = prevOrdersRaw?.reduce((sum, o) => sum + Number(o.seller_amount), 0) || 0;

      // Calculate changes
      const viewsChange = prevViews > 0 ? ((currentViews - prevViews) / prevViews) * 100 : 0;
      const ordersChange = prevOrders > 0 ? ((currentOrders - prevOrders) / prevOrders) * 100 : 0;
      const revenueChange = prevRevenue > 0 ? ((currentRevenue - prevRevenue) / prevRevenue) * 100 : 0;

      setStats({
        totalViews: currentViews,
        totalOrders: currentOrders,
        totalRevenue: currentRevenue,
        conversionRate: currentViews > 0 ? (currentOrders / currentViews) * 100 : 0,
        viewsChange,
        ordersChange,
        revenueChange,
      });

      // Group views by day
      const viewsByDay: Record<string, number> = {};
      for (let i = 0; i < days; i++) {
        const day = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        viewsByDay[day] = 0;
      }
      viewsRaw?.forEach(v => {
        const day = format(new Date(v.viewed_at), "yyyy-MM-dd");
        if (viewsByDay[day] !== undefined) {
          viewsByDay[day]++;
        }
      });
      setViewsData(Object.entries(viewsByDay).map(([date, views]) => ({
        date: format(new Date(date), "dd/MM", { locale: ptBR }),
        views
      })));

      // Group orders by day
      const ordersByDay: Record<string, { orders: number; revenue: number }> = {};
      for (let i = 0; i < days; i++) {
        const day = format(subDays(new Date(), days - 1 - i), "yyyy-MM-dd");
        ordersByDay[day] = { orders: 0, revenue: 0 };
      }
      ordersRaw?.forEach(o => {
        const day = format(new Date(o.created_at), "yyyy-MM-dd");
        if (ordersByDay[day]) {
          ordersByDay[day].orders++;
          ordersByDay[day].revenue += Number(o.seller_amount);
        }
      });
      setOrdersData(Object.entries(ordersByDay).map(([date, data]) => ({
        date: format(new Date(date), "dd/MM", { locale: ptBR }),
        orders: data.orders,
        revenue: data.revenue
      })));

      // Top products by views
      const productViewCounts: Record<string, number> = {};
      viewsRaw?.forEach(v => {
        productViewCounts[v.product_id] = (productViewCounts[v.product_id] || 0) + 1;
      });
      const topProductsList = Object.entries(productViewCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([productId, views]) => {
          const product = products?.find(p => p.id === productId);
          return {
            id: productId,
            title: product?.title || "Produto",
            image: product?.images?.[0] || product?.image_url,
            views
          };
        });
      setTopProducts(topProductsList);

      // Category distribution
      const categoryCounts: Record<string, number> = {};
      products?.forEach(p => {
        categoryCounts[p.category] = (categoryCounts[p.category] || 0) + 1;
      });
      setCategoryData(Object.entries(categoryCounts).map(([name, value]) => ({ name, value })));

    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      minimumFractionDigits: 0,
    }).format(value);
  };

  const StatChange = ({ value }: { value: number }) => {
    if (value === 0) return null;
    const isPositive = value > 0;
    return (
      <span className={`text-xs flex items-center gap-0.5 ${isPositive ? "text-green-600" : "text-red-600"}`}>
        {isPositive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
        {Math.abs(value).toFixed(1)}%
      </span>
    );
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-16 md:pt-20 pb-20 md:pb-8">
        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/seller")}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold">Analytics</h1>
                <p className="text-sm text-muted-foreground">Acompanhe o desempenho das suas vendas</p>
              </div>
            </div>
            <Select value={period} onValueChange={setPeriod}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="14">Últimos 14 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <Eye className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <StatChange value={stats.viewsChange} />
                </div>
                <p className="text-2xl font-bold">{stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Visualizações</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <ShoppingCart className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                  <StatChange value={stats.ordersChange} />
                </div>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
                <p className="text-sm text-muted-foreground">Pedidos</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                    <DollarSign className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                  </div>
                  <StatChange value={stats.revenueChange} />
                </div>
                <p className="text-xl font-bold">{formatPrice(stats.totalRevenue)}</p>
                <p className="text-sm text-muted-foreground">Receita</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  </div>
                </div>
                <p className="text-2xl font-bold">{stats.conversionRate.toFixed(1)}%</p>
                <p className="text-sm text-muted-foreground">Conversão</p>
              </CardContent>
            </Card>
          </div>

          {/* Charts */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Visualizações</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={viewsData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--card))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="views"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.2}
                        name="Visualizações"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Vendas & Receita</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={ordersData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="date" className="text-xs" />
                      <YAxis yAxisId="left" className="text-xs" />
                      <YAxis yAxisId="right" orientation="right" className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value: number, name: string) => [
                          name === "revenue" ? formatPrice(value) : value,
                          name === "revenue" ? "Receita" : "Pedidos"
                        ]}
                      />
                      <Bar yAxisId="left" dataKey="orders" fill="hsl(var(--primary))" name="Pedidos" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {/* Top Products */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Produtos Mais Vistos</CardTitle>
              </CardHeader>
              <CardContent>
                {topProducts.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhuma visualização registrada</p>
                ) : (
                  <div className="space-y-4">
                    {topProducts.map((product, index) => (
                      <div key={product.id} className="flex items-center gap-3">
                        <span className="text-lg font-bold text-muted-foreground w-6">{index + 1}</span>
                        <img
                          src={product.image || "/placeholder.svg"}
                          alt={product.title}
                          className="w-12 h-12 object-cover rounded-lg"
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{product.title}</p>
                          <p className="text-sm text-muted-foreground">{product.views} visualizações</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Category Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Distribuição por Categoria</CardTitle>
              </CardHeader>
              <CardContent>
                {categoryData.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">Nenhum produto cadastrado</p>
                ) : (
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={categoryData}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        >
                          {categoryData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}
