import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X, MapPin, DollarSign, Tag, Sparkles } from "lucide-react";

interface FilterValues {
  minPrice: number;
  maxPrice: number;
  location: string;
  condition: string;
  sortBy: string;
}

interface AdvancedFiltersProps {
  filters: FilterValues;
  onFiltersChange: (filters: FilterValues) => void;
  locations: string[];
}

const CONDITIONS = [
  { value: "all", label: "Todos" },
  { value: "new", label: "Novo" },
  { value: "used", label: "Usado" },
];

const SORT_OPTIONS = [
  { value: "recent", label: "Mais recentes" },
  { value: "price_asc", label: "Menor preço" },
  { value: "price_desc", label: "Maior preço" },
];

export function AdvancedFilters({ filters, onFiltersChange, locations }: AdvancedFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterValues>(filters);

  const activeFiltersCount = [
    filters.minPrice > 0,
    filters.maxPrice < 1000000,
    filters.location !== "all",
    filters.condition !== "all",
    filters.sortBy !== "recent",
  ].filter(Boolean).length;

  const handleApply = () => {
    onFiltersChange(localFilters);
    setIsOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterValues = {
      minPrice: 0,
      maxPrice: 1000000,
      location: "all",
      condition: "all",
      sortBy: "recent",
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const formatPrice = (value: number) => {
    if (value >= 1000000) return "Sem limite";
    return new Intl.NumberFormat("pt-AO", {
      style: "currency",
      currency: "AOA",
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="gap-2 relative">
          <SlidersHorizontal className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 && (
            <Badge className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Filtros Avançados
          </SheetTitle>
          <SheetDescription>
            Refine sua busca com filtros personalizados
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* Price Range */}
          <div className="space-y-4">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <DollarSign className="h-4 w-4 text-primary" />
              Faixa de Preço
            </Label>
            <div className="px-2">
              <Slider
                value={[localFilters.minPrice, Math.min(localFilters.maxPrice, 500000)]}
                min={0}
                max={500000}
                step={1000}
                onValueChange={([min, max]) => {
                  setLocalFilters({
                    ...localFilters,
                    minPrice: min,
                    maxPrice: max === 500000 ? 1000000 : max,
                  });
                }}
                className="mb-4"
              />
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{formatPrice(localFilters.minPrice)}</span>
                <span>{formatPrice(localFilters.maxPrice)}</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Mínimo</Label>
                <Input
                  type="number"
                  placeholder="0"
                  value={localFilters.minPrice || ""}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    minPrice: Number(e.target.value) || 0,
                  })}
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Máximo</Label>
                <Input
                  type="number"
                  placeholder="Sem limite"
                  value={localFilters.maxPrice < 1000000 ? localFilters.maxPrice : ""}
                  onChange={(e) => setLocalFilters({
                    ...localFilters,
                    maxPrice: Number(e.target.value) || 1000000,
                  })}
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <MapPin className="h-4 w-4 text-primary" />
              Localização
            </Label>
            <Select
              value={localFilters.location}
              onValueChange={(value) => setLocalFilters({ ...localFilters, location: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Todas as localizações" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas as localizações</SelectItem>
                {locations.map((location) => (
                  <SelectItem key={location} value={location}>
                    {location}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Condition */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-base font-semibold">
              <Tag className="h-4 w-4 text-primary" />
              Condição
            </Label>
            <div className="flex gap-2 flex-wrap">
              {CONDITIONS.map((condition) => (
                <Button
                  key={condition.value}
                  variant={localFilters.condition === condition.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setLocalFilters({ ...localFilters, condition: condition.value })}
                  className="rounded-full"
                >
                  {condition.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Ordenar por</Label>
            <Select
              value={localFilters.sortBy}
              onValueChange={(value) => setLocalFilters({ ...localFilters, sortBy: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SORT_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <SheetFooter className="flex gap-2 sm:flex-row">
          <Button variant="outline" onClick={handleReset} className="flex-1 gap-2">
            <X className="h-4 w-4" />
            Limpar
          </Button>
          <Button onClick={handleApply} className="flex-1">
            Aplicar Filtros
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
