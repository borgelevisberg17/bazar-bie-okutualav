import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, StarHalf } from "lucide-react";
import { toast } from "sonner";

interface ProductReviewsProps {
  productId: string;
}

export default function ProductReviews({ productId }: ProductReviewsProps) {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");

  // Check if user can review
  const { data: canReview } = useQuery({
    queryKey: ['can-review', productId],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      // Check if user has confirmed order for this product
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          id,
          order_items!inner (product_id)
        `)
        .eq('buyer_id', user.id)
        .eq('status', 'confirmed_received')
        .eq('order_items.product_id', productId);

      if (!orders || orders.length === 0) return false;

      // Check if already reviewed
      const { data: existingReview } = await supabase
        .from('product_reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .single();

      return !existingReview;
    },
  });

  // Fetch reviews
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch profiles using secure public view
      const userIds = [...new Set(data.map(r => r.user_id))];
      const { data: profiles } = await supabase
        .from('public_profiles')
        .select('id, full_name, avatar_url')
        .in('id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      return data.map(review => ({
        ...review,
        profile: profileMap.get(review.user_id)
      }));
    },
  });

  // Calculate average rating
  const averageRating = reviews?.length 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  // Submit review mutation
  const submitReviewMutation = useMutation({
    mutationFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Não autenticado");

      const { error } = await supabase
        .from('product_reviews')
        .insert({
          product_id: productId,
          user_id: user.id,
          rating,
          title: title || null,
          content: content || null,
          is_verified_purchase: true,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-reviews', productId] });
      queryClient.invalidateQueries({ queryKey: ['can-review', productId] });
      setShowForm(false);
      setRating(5);
      setTitle("");
      setContent("");
      toast.success("Avaliação enviada com sucesso!");
    },
    onError: (error) => {
      toast.error("Erro ao enviar avaliação");
      console.error(error);
    },
  });

  const renderStars = (rating: number, interactive = false, size = "h-5 w-5") => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const filled = i <= rating;
      stars.push(
        <button
          key={i}
          type="button"
          disabled={!interactive}
          onClick={() => interactive && setRating(i)}
          className={interactive ? "cursor-pointer" : "cursor-default"}
        >
          <Star 
            className={`${size} ${filled ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`} 
          />
        </button>
      );
    }
    return stars;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold">Avaliações</h3>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex">{renderStars(Math.round(averageRating))}</div>
            <span className="text-muted-foreground">
              {averageRating.toFixed(1)} ({reviews?.length || 0} avaliações)
            </span>
          </div>
        </div>

        {canReview && !showForm && (
          <Button onClick={() => setShowForm(true)}>
            Avaliar Produto
          </Button>
        )}
      </div>

      {/* Review Form */}
      {showForm && (
        <Card>
          <CardHeader>
            <CardTitle>Sua Avaliação</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nota</label>
              <div className="flex gap-1 mt-1">
                {renderStars(rating, true, "h-8 w-8")}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium">Título (opcional)</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Resuma sua experiência"
                className="mt-1"
              />
            </div>

            <div>
              <label className="text-sm font-medium">Comentário (opcional)</label>
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Conte mais sobre sua experiência..."
                className="mt-1"
              />
            </div>

            <div className="flex gap-2">
              <Button 
                onClick={() => submitReviewMutation.mutate()}
                disabled={submitReviewMutation.isPending}
              >
                Enviar Avaliação
              </Button>
              <Button variant="outline" onClick={() => setShowForm(false)}>
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Reviews List */}
      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Carregando avaliações...
        </div>
      ) : reviews?.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          Ainda não há avaliações para este produto
        </div>
      ) : (
        <div className="space-y-4">
          {reviews?.map((review) => (
            <Card key={review.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={review.profile?.avatar_url || undefined} />
                    <AvatarFallback>
                      {review.profile?.full_name?.[0] || "U"}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">
                          {review.profile?.full_name || "Usuário"}
                        </span>
                        {review.is_verified_purchase && (
                          <span className="ml-2 text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            Compra verificada
                          </span>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {new Date(review.created_at).toLocaleDateString('pt-AO')}
                      </span>
                    </div>

                    <div className="flex mt-1">
                      {renderStars(review.rating, false, "h-4 w-4")}
                    </div>

                    {review.title && (
                      <p className="font-medium mt-2">{review.title}</p>
                    )}

                    {review.content && (
                      <p className="text-muted-foreground mt-1">{review.content}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
