import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Feed from "./pages/Feed";
import Auth from "./pages/Auth";
import PostProduct from "./pages/PostProduct";
import ProductDetail from "./pages/ProductDetail";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Following from "./pages/Following";
import Explore from "./pages/Explore";
import Settings from "./pages/Settings";
import Favorites from "./pages/Favorites";
import Checkout from "./pages/Checkout";
import Orders from "./pages/Orders";
import OrderDetail from "./pages/OrderDetail";
import Subscription from "./pages/Subscription";
import SubscriptionCheckout from "./pages/SubscriptionCheckout";
import SubscriptionManagement from "./pages/SubscriptionManagement";
import AdminDashboard from "./pages/AdminDashboard";
import AdminSettings from "./pages/AdminSettings";
import AdminLegalPages from "./pages/AdminLegalPages";
import SellerDashboard from "./pages/SellerDashboard";
import SellerAnalytics from "./pages/SellerAnalytics";
import Storefront from "./pages/Storefront";
import Coupons from "./pages/Coupons";
import Wishlists from "./pages/Wishlists";
import WishlistDetail from "./pages/WishlistDetail";
import Terms from "./pages/Terms";
import Privacy from "./pages/Privacy";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <CartProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Feed />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/explore" element={<Explore />} />
              <Route path="/post" element={<PostProduct />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/following" element={<Following />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/favorites" element={<Favorites />} />
              <Route path="/wishlists" element={<Wishlists />} />
              <Route path="/wishlist/:id" element={<WishlistDetail />} />
              <Route path="/checkout" element={<Checkout />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="/order/:orderId" element={<OrderDetail />} />
              <Route path="/subscription" element={<Subscription />} />
              <Route path="/subscription/checkout" element={<SubscriptionCheckout />} />
              <Route path="/subscription/manage" element={<SubscriptionManagement />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/settings" element={<AdminSettings />} />
              <Route path="/admin/legal-pages" element={<AdminLegalPages />} />
              <Route path="/seller" element={<SellerDashboard />} />
              <Route path="/seller/analytics" element={<SellerAnalytics />} />
              <Route path="/loja/:username" element={<Storefront />} />
              <Route path="/coupons" element={<Coupons />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/help" element={<Help />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </CartProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
