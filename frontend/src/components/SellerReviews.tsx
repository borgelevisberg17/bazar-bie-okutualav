import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface SellerReviewsProps {
  sellerId: string;
  showAddReview?: boolean;
  orderId?: string;
}

export default function SellerReviews({ sellerId, showAddReview = false, orderId }: SellerReviewsProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Fetch reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ["seller-reviews", sellerId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("seller_reviews")
        .select(`
          *,
          profiles:buyer_id (
            full_name,
            avatar_url,
            username
          )
        `)
        .eq("seller_id", sellerId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  // Check if user can review
  const { data: canReview } = useQuery({
    queryKey: ["can-review-seller", sellerId, orderId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !orderId) return false;

      // Check if already reviewed this order
      const { data: existingReview } = await (supabase as any)
        .from("seller_reviews")
        .select("id")
        .eq("order_id", orderId)
        .eq("buyer_id", user.id)
        .single();

      if (existingReview) return false;

      // Check if user is the buyer of this order
      const { data: order } = await supabase
        .from("orders")
        .select("buyer_id, status")
        .eq("id", orderId)
        .single();

      return order && order.buyer_id === user.id && order.status === "confirmed_received";
    },
    enabled: showAddReview && !!orderId,
  });

  // Submit review mutation
  const submitReview = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await (supabase as any)
        .from("seller_reviews")
        .insert({
          seller_id: sellerId,
          buyer_id: user.id,
          order_id: orderId,
          rating,
          title,
          content,
          is_verified_purchase: !!orderId,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-reviews", sellerId] });
      setShowForm(false);
      setRating(0);
      setTitle("");
      setContent("");
      toast.success("Avaliação enviada com sucesso!");
    },
    onError: () => {
      toast.error("Erro ao enviar avaliação");
    },
  });

  // Calculate average rating
  const averageRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : "0.0";

  const renderStars = (rating: number, interactive = false, size = "h-5 w-5") => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => interactive && setRating(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => interactive && setHoverRating(0)}
            className={interactive ? "cursor-pointer transition-transform hover:scale-110" : "cursor-default"}
          >
            <Star
              className={`${size} ${
                star <= (interactive ? hoverRating || rating : rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "text-muted-foreground/30"
              }`}
            />
          </button>
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl font-bold">{averageRating}</span>
          {renderStars(Math.round(parseFloat(averageRating)), false, "h-5 w-5")}
        </div>
        <span className="text-muted-foreground">
          ({reviews.length} {reviews.length === 1 ? "avaliação" : "avaliações"})
        </span>
      </div>

      {/* Add Review Button */}
      {showAddReview && canReview && !showForm && (
        <Button onClick={() => setShowForm(true)} variant="outline">
          <Star className="mr-2 h-4 w-4" />
          Avaliar Vendedor
        </Button>
      )}

      {/* Review Form */}
      {showForm && (
        <div className="p-4 border rounded-xl bg-muted/30 space-y-4">
          <h4 className="font-semibold">Avaliar Vendedor</h4>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">Sua avaliação</label>
            {renderStars(rating, true, "h-8 w-8")}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Título (opcional)</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Resuma sua experiência"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Comentário (opcional)</label>
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Conte mais sobre sua experiência com este vendedor..."
              rows={3}
            />
          </div>

          <div className="flex gap-2">
            <Button
              onClick={() => submitReview.mutate()}
              disabled={rating === 0 || submitReview.isPending}
            >
              {submitReview.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Enviar Avaliação
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
          </div>
        </div>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-muted-foreground text-center py-8">
          Nenhuma avaliação ainda
        </p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review: any) => (
            <div key={review.id} className="p-4 border rounded-xl bg-card">
              <div className="flex items-start gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={review.profiles?.avatar_url} />
                  <AvatarFallback>
                    {review.profiles?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-medium">
                      {review.profiles?.full_name || "Usuário"}
                    </span>
                    {review.is_verified_purchase && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full">
                        <Check className="h-3 w-3" />
                        Compra verificada
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(review.created_at), {
                        addSuffix: true,
                        locale: ptBR,
                      })}
                    </span>
                  </div>
                  
                  <div className="mt-1">
                    {renderStars(review.rating, false, "h-4 w-4")}
                  </div>

                  {review.title && (
                    <h5 className="font-medium mt-2">{review.title}</h5>
                  )}
                  
                  {review.content && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {review.content}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
