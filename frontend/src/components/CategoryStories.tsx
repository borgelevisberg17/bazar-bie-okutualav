import { useNavigate } from "react-router-dom";
import { 
  Smartphone, 
  Shirt, 
  Home, 
  Car, 
  Building2, 
  Dumbbell, 
  BookOpen, 
  MoreHorizontal,
  Sparkles
} from "lucide-react";
import { cn } from "@/lib/utils";

interface Category {
  name: string;
  icon: React.ReactNode;
  gradient: string;
}

const CATEGORIES: Category[] = [
  { name: "Todos", icon: <Sparkles className="h-5 w-5" />, gradient: "from-primary to-secondary" },
  { name: "Eletrônicos", icon: <Smartphone className="h-5 w-5" />, gradient: "from-blue-500 to-cyan-400" },
  { name: "Moda", icon: <Shirt className="h-5 w-5" />, gradient: "from-pink-500 to-rose-400" },
  { name: "Casa e Jardim", icon: <Home className="h-5 w-5" />, gradient: "from-green-500 to-emerald-400" },
  { name: "Veículos", icon: <Car className="h-5 w-5" />, gradient: "from-orange-500 to-amber-400" },
  { name: "Imóveis", icon: <Building2 className="h-5 w-5" />, gradient: "from-purple-500 to-violet-400" },
  { name: "Esportes", icon: <Dumbbell className="h-5 w-5" />, gradient: "from-red-500 to-rose-400" },
  { name: "Livros", icon: <BookOpen className="h-5 w-5" />, gradient: "from-amber-500 to-yellow-400" },
  { name: "Outros", icon: <MoreHorizontal className="h-5 w-5" />, gradient: "from-slate-500 to-gray-400" },
];

interface CategoryStoriesProps {
  selectedCategory?: string;
  onCategorySelect?: (category: string) => void;
  variant?: "stories" | "grid";
}

export function CategoryStories({ 
  selectedCategory = "Todos", 
  onCategorySelect,
  variant = "stories"
}: CategoryStoriesProps) {
  const navigate = useNavigate();

  const handleCategoryClick = (categoryName: string) => {
    if (onCategorySelect) {
      onCategorySelect(categoryName);
    } else {
      navigate(`/explore?category=${encodeURIComponent(categoryName)}`);
    }
  };

  if (variant === "grid") {
    return (
      <div className="grid grid-cols-3 md:grid-cols-5 lg:grid-cols-9 gap-2">
        {CATEGORIES.map((category) => (
          <button
            key={category.name}
            onClick={() => handleCategoryClick(category.name)}
            className={cn(
              "flex flex-col items-center gap-1.5 p-3 rounded-xl transition-all duration-200",
              "hover:scale-105",
              selectedCategory === category.name
                ? "bg-gradient-to-br shadow-md " + category.gradient + " text-white"
                : "bg-muted/50 hover:bg-muted"
            )}
          >
            <div className={cn(
              "p-2 rounded-lg",
              selectedCategory === category.name
                ? "bg-white/20"
                : "bg-gradient-to-br " + category.gradient + " text-white"
            )}>
              {category.icon}
            </div>
            <span className={cn(
              "text-[10px] font-medium text-center line-clamp-1",
              selectedCategory === category.name ? "text-white" : "text-foreground"
            )}>
              {category.name}
            </span>
          </button>
        ))}
      </div>
    );
  }

  // Stories variant - Instagram style
  return (
    <div className="flex gap-3 overflow-x-auto scrollbar-hide">
      {CATEGORIES.map((category) => (
        <button
          key={category.name}
          onClick={() => handleCategoryClick(category.name)}
          className="flex flex-col items-center gap-1 min-w-[64px] group"
        >
          <div className={cn(
            "p-[2px] rounded-full transition-all duration-200",
            selectedCategory === category.name
              ? "bg-gradient-to-br " + category.gradient
              : "bg-gradient-to-br from-muted-foreground/20 to-muted-foreground/10 group-hover:from-muted-foreground/40 group-hover:to-muted-foreground/20"
          )}>
            <div className={cn(
              "w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
              selectedCategory === category.name
                ? "bg-gradient-to-br " + category.gradient + " text-white"
                : "bg-background text-muted-foreground group-hover:text-foreground"
            )}>
              {category.icon}
            </div>
          </div>
          <span className={cn(
            "text-[11px] font-medium text-center transition-colors",
            selectedCategory === category.name
              ? "text-foreground"
              : "text-muted-foreground group-hover:text-foreground"
          )}>
            {category.name.length > 8 ? category.name.slice(0, 7) + "..." : category.name}
          </span>
        </button>
      ))}
    </div>
  );
}
