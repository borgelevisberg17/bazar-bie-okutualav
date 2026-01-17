import { useEffect, useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ProductCard } from "@/components/ProductCard";
import { Navigation } from "@/components/Navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Search, Package, SlidersHorizontal, X, Grid3X3, LayoutList } from "lucide-react";
import { CategoryStories } from "@/components/CategoryStories";
import { AdvancedFilters } from "@/components/AdvancedFilters";
import { cn } from "@/lib/utils";
import { ProductGridSkeleton, CategoryStoriesSkeleton } from "@/components/ui/ProductCardSkeleton";

interface FilterValues {
  minPrice: number;
  maxPrice: number;
  location: string;
  condition: string;
  sortBy: string;
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState(searchParams.get("search") || "");
  const [selectedCategory, setSelectedCategory] = useState(
    searchParams.get("category") || "Todos"
  );
  const [locations, setLocations] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filters, setFilters] = useState<FilterValues>({
    minPrice: 0,
    maxPrice: 1000000,
    location: "all",
    condition: "all",
    sortBy: "recent",
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    if (category) {
      setSelectedCategory(category);
    }
    if (search) {
      setSearchTerm(search);
    }
  }, [searchParams]);

  const fetchProducts = async () => {
    try {
      const { data: productsData, error } = await supabase
        .from("products")
        .select("*")
        .eq("status", "active")
        .order("created_at", { ascending: false });

      if (error) throw error;

      if (productsData && productsData.length > 0) {
        const userIds = [...new Set(productsData.map((p: any) => p.user_id))];
        const { data: profilesData } = await supabase
          .from("public_profiles" as any)
          .select("id, full_name, avatar_url")
          .in("id", userIds);

        const productsWithProfiles = productsData.map((product: any) => ({
          ...product,
          profiles: (profilesData as any)?.find((p: any) => p.id === product.user_id) || {}
        }));

        setProducts(productsWithProfiles);

        const uniqueLocations = [...new Set(
          productsData
            .map((p: any) => p.location)
            .filter((l: string | null) => l && l.trim() !== "")
        )] as string[];
        setLocations(uniqueLocations);
      } else {
        setProducts([]);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCategorySelect = (category: string) => {
    setSelectedCategory(category);
    setSearchParams(category === "Todos" ? {} : { category });
  };

  const clearFilters = () => {
    setSelectedCategory("Todos");
    setSearchTerm("");
    setFilters({
      minPrice: 0,
      maxPrice: 1000000,
      location: "all",
      condition: "all",
      sortBy: "recent",
    });
    setSearchParams({});
  };

  const activeFiltersCount = [
    selectedCategory !== "Todos",
    filters.location !== "all",
    filters.condition !== "all",
    filters.minPrice > 0,
    filters.maxPrice < 1000000,
  ].filter(Boolean).length;

  const filteredProducts = products
    .filter((product) => {
      const matchesSearch = product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            product.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === "Todos" || product.category === selectedCategory;
      const matchesPrice = product.price >= filters.minPrice && product.price <= filters.maxPrice;
      const matchesLocation = filters.location === "all" || product.location === filters.location;
      const matchesCondition = filters.condition === "all" || product.condition === filters.condition;
      
      return matchesSearch && matchesCategory && matchesPrice && matchesLocation && matchesCondition;
    })
    .sort((a, b) => {
      switch (filters.sortBy) {
        case "price_asc":
          return a.price - b.price;
        case "price_desc":
          return b.price - a.price;
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-14 pb-20 md:pt-16 md:pb-4">
        {/* Search Header - Sticky */}
        <div className="sticky top-14 md:top-16 z-40 bg-background border-b border-border/50">
          <div className="p-3 space-y-3">
            {/* Search Bar */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Buscar produtos..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 h-10 bg-muted/50 border-0 focus-visible:ring-1"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
              <Button 
                variant="outline" 
                size="icon" 
                className="h-10 w-10 relative"
                onClick={() => setShowFilters(!showFilters)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {activeFiltersCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 bg-primary text-primary-foreground text-[10px] rounded-full flex items-center justify-center">
                    {activeFiltersCount}
                  </span>
                )}
              </Button>
            </div>

            {/* Quick Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {selectedCategory !== "Todos" && (
                <Badge 
                  variant="secondary" 
                  className="flex-shrink-0 gap-1 pr-1 cursor-pointer hover:bg-destructive/10"
                  onClick={() => handleCategorySelect("Todos")}
                >
                  {selectedCategory}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {filters.condition !== "all" && (
                <Badge 
                  variant="secondary" 
                  className="flex-shrink-0 gap-1 pr-1 cursor-pointer"
                  onClick={() => setFilters({...filters, condition: "all"})}
                >
                  {filters.condition === "new" ? "Novo" : "Usado"}
                  <X className="h-3 w-3" />
                </Badge>
              )}
              {activeFiltersCount > 0 && (
                <button 
                  onClick={clearFilters}
                  className="text-xs text-primary flex-shrink-0"
                >
                  Limpar filtros
                </button>
              )}
            </div>
          </div>

          {/* Category Scroll */}
          <div className="px-2 pb-3 overflow-x-auto">
            <CategoryStories
              selectedCategory={selectedCategory}
              onCategorySelect={handleCategorySelect}
              variant="stories"
            />
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="border-b border-border bg-muted/30 p-4 animate-fade-in">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={setFilters}
              locations={locations}
            />
          </div>
        )}

        {/* Results Header */}
        <div className="flex items-center justify-between px-4 py-3">
          <p className="text-sm text-muted-foreground">
            {filteredProducts.length} resultado{filteredProducts.length !== 1 ? "s" : ""}
          </p>
          <div className="flex items-center gap-1">
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", viewMode === "grid" && "bg-muted")}
              onClick={() => setViewMode("grid")}
            >
              <Grid3X3 className="h-4 w-4" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className={cn("h-8 w-8", viewMode === "list" && "bg-muted")}
              onClick={() => setViewMode("list")}
            >
              <LayoutList className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <ProductGridSkeleton count={8} compact={viewMode === "grid"} />
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-16 px-4 animate-fade-in">
            <div className="mb-4">
              <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                <Package className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <p className="text-base font-medium">Nenhum produto encontrado</p>
            <p className="text-sm text-muted-foreground mt-1">
              Tente ajustar os filtros
            </p>
            {activeFiltersCount > 0 && (
              <Button variant="link" onClick={clearFilters} className="mt-2">
                Limpar filtros
              </Button>
            )}
          </div>
        ) : viewMode === "grid" ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-1 md:gap-3 lg:gap-4 px-0 md:px-4 lg:px-6 max-w-screen-2xl mx-auto">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                compact
              />
            ))}
          </div>
        ) : (
          <div className="space-y-0 md:space-y-4 md:px-4 lg:px-6 md:max-w-[600px] lg:max-w-3xl xl:max-w-4xl md:mx-auto">
            {/* Desktop: 2 column grid for list view */}
            <div className="hidden md:grid md:grid-cols-2 gap-4">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
            {/* Mobile: single column */}
            <div className="md:hidden">
              {filteredProducts.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
