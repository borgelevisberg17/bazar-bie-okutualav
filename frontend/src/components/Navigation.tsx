import { Home, PlusCircle, Search, Heart, Menu, X, User, Users, Package, Shield, Store, ShoppingBag, ShoppingCart, Settings, LogOut, Crown, ChevronRight, Tag, HelpCircle, FileText, BarChart3 } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Input } from "./ui/input";
import { CartSheet } from "./CartSheet";
import { NotificationBell } from "./NotificationBell";
import { ThemeToggle } from "./ThemeToggle";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import bazarLogo from "@/assets/bazar-logo.png";
import { useAdmin } from "@/hooks/useAdmin";
import { useCart } from "@/hooks/useCart";
import { ScrollArea } from "./ui/scroll-area";
import { Separator } from "./ui/separator";
import { toast } from "sonner";
import { Badge } from "./ui/badge";

export const Navigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { isAdmin } = useAdmin();
  const { itemCount } = useCart();
  
  useEffect(() => {
    fetchUser();
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
        fetchFavoritesCount(session.user.id);
      } else {
        setProfile(null);
        setFavoritesCount(0);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Real-time profile updates
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('profile-stats')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
        },
        () => {
          fetchProfile(user.id);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'follows',
          filter: `following_id=eq.${user.id}`
        },
        () => {
          fetchProfile(user.id);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const fetchUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    setUser(user);
    if (user) {
      fetchProfile(user.id);
      fetchFavoritesCount(user.id);
    }
  };

  const fetchProfile = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    if (data) setProfile(data);
  }, []);

  const fetchFavoritesCount = async (userId: string) => {
    const { count } = await supabase
      .from("favorites")
      .select("*", { count: 'exact', head: true })
      .eq("user_id", userId);
    setFavoritesCount(count || 0);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`);
      setMobileMenuOpen(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("Sessão encerrada");
    setMobileMenuOpen(false);
    navigate("/");
  };

  // Menu items for mobile drawer (excluding items in bottom nav)
  const mobileMenuItems = [
    { icon: Users, label: "Seguindo", path: "/following" },
    { icon: Heart, label: "Listas de Desejos", path: "/wishlists" },
    { icon: ShoppingBag, label: "Meus Pedidos", path: "/orders" },
    { icon: Store, label: "Minhas Vendas", path: "/seller" },
    { icon: BarChart3, label: "Analytics", path: "/seller/analytics" },
    { icon: Tag, label: "Meus Cupons", path: "/coupons" },
    { icon: Crown, label: "Assinatura", path: "/subscription/manage" },
    { icon: Settings, label: "Configurações", path: "/settings" },
  ];

  const legalMenuItems = [
    { icon: HelpCircle, label: "Ajuda", path: "/help" },
    { icon: FileText, label: "Termos de Uso", path: "/terms" },
    { icon: Shield, label: "Privacidade", path: "/privacy" },
  ];

  return (
    <>
      {/* Desktop Header */}
      <nav className="hidden md:block fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="h-16 px-4 lg:px-8">
          <div className="flex items-center gap-4 lg:gap-6 h-full max-w-screen-2xl mx-auto">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2 flex-shrink-0">
              <img src={bazarLogo} alt="Bié Okutuala" className="w-9 h-9 rounded-lg" />
              <span className="font-bold text-lg gradient-text hidden lg:block">Bié Okutuala</span>
            </Link>

            {/* Search - Centered and responsive */}
            <form onSubmit={handleSearch} className="flex-1 max-w-md lg:max-w-lg xl:max-w-xl">
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar produtos, vendedores..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-10 pl-10 pr-4 rounded-full bg-muted border-0 focus-visible:ring-2 focus-visible:ring-primary/50"
                />
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
            </form>

            {/* Navigation Icons */}
            <div className="flex items-center gap-0.5 lg:gap-1">
              <Link to="/">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-10 w-10 rounded-full transition-colors",
                    location.pathname === "/" && "bg-primary/10 text-primary"
                  )}
                >
                  <Home className="h-5 w-5" />
                </Button>
              </Link>

              <Link to="/explore">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className={cn(
                    "h-10 w-10 rounded-full transition-colors",
                    location.pathname === "/explore" && "bg-primary/10 text-primary"
                  )}
                >
                  <Search className="h-5 w-5" />
                </Button>
              </Link>

              {user && (
                <Link to="/following">
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-10 w-10 rounded-full transition-colors",
                      location.pathname === "/following" && "bg-primary/10 text-primary"
                    )}
                  >
                    <Users className="h-5 w-5" />
                  </Button>
                </Link>
              )}

              <Link to="/post">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-10 w-10 rounded-full bg-primary/10 text-primary hover:bg-primary/20"
                >
                  <PlusCircle className="h-5 w-5" />
                </Button>
              </Link>

              <Link to="/favorites">
                <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full relative">
                  <Heart className={cn("h-5 w-5", favoritesCount > 0 && "text-red-500")} />
                  {favoritesCount > 0 && (
                    <span className="absolute top-0.5 right-0.5 h-4 w-4 bg-destructive text-destructive-foreground text-[10px] rounded-full flex items-center justify-center font-medium">
                      {favoritesCount > 9 ? "9+" : favoritesCount}
                    </span>
                  )}
                </Button>
              </Link>

              {user && <NotificationBell />}

              <ThemeToggle />

              <CartSheet />

              {user && (
                <>
                  <Link to="/orders">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "h-10 w-10 rounded-full transition-colors",
                        location.pathname === "/orders" && "bg-primary/10 text-primary"
                      )}
                    >
                      <ShoppingBag className="h-5 w-5" />
                    </Button>
                  </Link>

                  <Link to="/seller">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className={cn(
                        "h-10 w-10 rounded-full transition-colors",
                        location.pathname.startsWith("/seller") && "bg-primary/10 text-primary"
                      )}
                    >
                      <Store className="h-5 w-5" />
                    </Button>
                  </Link>
                </>
              )}

              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="icon" className="h-10 w-10 rounded-full">
                    <Shield className="h-5 w-5 text-primary" />
                  </Button>
                </Link>
              )}

              {/* User Avatar / Auth Button */}
              <div className="ml-2">
                {user ? (
                  <Link to="/profile">
                    <Avatar className="h-9 w-9 cursor-pointer ring-2 ring-transparent hover:ring-primary/50 transition-all">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-sm font-medium">
                        {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </Link>
                ) : (
                  <Link to="/auth">
                    <Button size="sm" className="h-9 px-4 rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90">
                      Entrar
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Header */}
      <nav className="md:hidden fixed top-0 left-0 right-0 z-50 bg-background border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          <Link to="/" className="flex items-center gap-2">
            <img src={bazarLogo} alt="Bié Okutuala" className="w-8 h-8 rounded-lg" />
            <span className="font-bold gradient-text">Bié Okutuala</span>
          </Link>
          
          <div className="flex items-center gap-1">
            <CartSheet 
              trigger={
                <Button variant="ghost" size="icon" className="h-9 w-9 relative">
                  <ShoppingCart className="h-5 w-5" />
                  {itemCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-primary text-primary-foreground text-[9px] rounded-full flex items-center justify-center">
                      {itemCount > 9 ? "9+" : itemCount}
                    </span>
                  )}
                </Button>
              }
            />
            
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 z-40 bg-black/50 animate-fade-in"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Mobile Menu Drawer - Fits between header and bottom nav */}
      <div className={cn(
        "md:hidden fixed right-0 z-50 w-[85%] max-w-sm bg-background transform transition-transform duration-300 ease-out shadow-2xl",
        "top-14 bottom-14",
        mobileMenuOpen ? "translate-x-0" : "translate-x-full"
      )}>
        <div className="flex flex-col h-full">
          {/* User Profile Header */}
          {user ? (
            <div className="p-4 bg-gradient-to-r from-primary/10 to-secondary/10 border-b">
              <Link 
                to="/profile" 
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center gap-3"
              >
                <Avatar className="h-14 w-14 ring-2 ring-primary/30">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-xl">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-lg truncate">
                    {profile?.full_name || "Usuário"}
                  </p>
                  <div className="flex items-center gap-2">
                    {profile?.username && (
                      <p className="text-sm text-muted-foreground">@{profile.username}</p>
                    )}
                    {profile?.is_seller && (
                      <Badge variant="secondary" className="text-[10px] h-5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                        <Crown className="h-3 w-3 mr-0.5" /> Vendedor
                      </Badge>
                    )}
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground" />
              </Link>
              
              {/* Quick Stats */}
              <div className="flex items-center gap-4 mt-3 text-sm">
                <div className="text-center">
                  <p className="font-bold">{profile?.followers_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Seguidores</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{profile?.following_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Seguindo</p>
                </div>
                <div className="text-center">
                  <p className="font-bold">{profile?.posts_count || 0}</p>
                  <p className="text-xs text-muted-foreground">Produtos</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-4 border-b">
              <Link to="/auth" onClick={() => setMobileMenuOpen(false)}>
                <Button className="w-full h-12 text-lg bg-gradient-to-r from-primary to-secondary">
                  Entrar ou Criar Conta
                </Button>
              </Link>
            </div>
          )}

          {/* Search */}
          <div className="p-4 border-b">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Input
                  type="text"
                  placeholder="Buscar produtos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-11 pl-10 text-base bg-muted border-0 rounded-xl"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              </div>
            </form>
          </div>

          {/* Menu Items - Only items not in bottom nav */}
          <ScrollArea className="flex-1">
            {user && (
              <div className="p-2">
                <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Minha Conta
                </p>
                {mobileMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={cn(
                      "flex items-center gap-4 px-4 py-3 rounded-xl transition-colors",
                      location.pathname === item.path 
                        ? "bg-primary/10 text-primary" 
                        : "hover:bg-muted"
                    )}
                  >
                    <item.icon className="h-5 w-5" />
                    <span className="flex-1 font-medium">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                ))}

                {isAdmin && (
                  <>
                    <Separator className="my-2" />
                    <Link
                      to="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-4 px-4 py-3 rounded-xl text-primary hover:bg-primary/10"
                    >
                      <Shield className="h-5 w-5" />
                      <span className="flex-1 font-medium">Administração</span>
                      <ChevronRight className="h-5 w-5" />
                    </Link>
                  </>
                )}

                {/* Legal Links */}
                <Separator className="my-2" />
                <p className="px-4 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                  Legal & Ajuda
                </p>
                {legalMenuItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-4 px-4 py-3 rounded-xl hover:bg-muted transition-colors"
                  >
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <span className="flex-1">{item.label}</span>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </Link>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Logout Button */}
          {user && (
            <div className="p-4 border-t bg-muted/30">
              <Button 
                variant="outline" 
                className="w-full h-11 text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={handleLogout}
              >
                <LogOut className="mr-2 h-5 w-5" />
                Sair da Conta
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-background border-t border-border safe-area-bottom">
        <div className="flex items-center justify-around h-14">
          <Link to="/" className="flex-1 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center gap-0.5 h-auto py-1.5 px-3",
                location.pathname === "/" && "text-primary"
              )}
            >
              <Home className={cn("h-6 w-6", location.pathname === "/" && "fill-primary")} />
              <span className="text-[10px]">Início</span>
            </Button>
          </Link>

          <Link to="/explore" className="flex-1 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center gap-0.5 h-auto py-1.5 px-3",
                location.pathname === "/explore" && "text-primary"
              )}
            >
              <Search className="h-6 w-6" />
              <span className="text-[10px]">Explorar</span>
            </Button>
          </Link>

          <Link to="/post" className="flex-1 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className="flex flex-col items-center gap-0.5 h-auto py-1.5 px-3"
            >
              <div className="p-1.5 rounded-lg bg-gradient-to-r from-primary to-secondary">
                <PlusCircle className="h-5 w-5 text-white" />
              </div>
              <span className="text-[10px]">Publicar</span>
            </Button>
          </Link>

          <Link to="/favorites" className="flex-1 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center gap-0.5 h-auto py-1.5 px-3 relative",
                location.pathname === "/favorites" && "text-primary"
              )}
            >
              <Heart className={cn("h-6 w-6", favoritesCount > 0 && "text-red-500 fill-red-500")} />
              <span className="text-[10px]">Favoritos</span>
              {favoritesCount > 0 && (
                <span className="absolute top-0 right-2 h-4 w-4 bg-destructive text-destructive-foreground text-[9px] rounded-full flex items-center justify-center">
                  {favoritesCount > 9 ? "9+" : favoritesCount}
                </span>
              )}
            </Button>
          </Link>

          <Link to={user ? "/profile" : "/auth"} className="flex-1 flex justify-center">
            <Button
              variant="ghost"
              size="sm"
              className={cn(
                "flex flex-col items-center gap-0.5 h-auto py-1.5 px-3",
                location.pathname === "/profile" && "text-primary"
              )}
            >
              {user ? (
                <Avatar className="h-6 w-6">
                  <AvatarImage src={profile?.avatar_url} />
                  <AvatarFallback className="text-[10px] bg-gradient-to-br from-primary to-secondary text-white">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              ) : (
                <User className="h-6 w-6" />
              )}
              <span className="text-[10px]">Perfil</span>
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};
