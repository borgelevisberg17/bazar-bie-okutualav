import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { UserPlus, UserMinus, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface FollowButtonProps {
  targetUserId: string;
  onFollowChange?: (isFollowing: boolean) => void;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function FollowButton({
  targetUserId,
  onFollowChange,
  variant = "default",
  size = "default",
  className,
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  useEffect(() => {
    checkFollowStatus();
  }, [targetUserId]);

  const checkFollowStatus = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setIsLoading(false);
        return;
      }

      setCurrentUserId(user.id);

      // Don't show follow button for own profile
      if (user.id === targetUserId) {
        setIsLoading(false);
        return;
      }

      const { data, error } = await (supabase as any)
        .from("follows")
        .select("id")
        .eq("follower_id", user.id)
        .eq("following_id", targetUserId)
        .maybeSingle();

      if (error) throw error;
      setIsFollowing(!!data);
    } catch (error) {
      console.error("Error checking follow status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFollow = async () => {
    if (!currentUserId) {
      toast.error("Você precisa estar logado para seguir");
      return;
    }

    if (currentUserId === targetUserId) {
      toast.error("Você não pode seguir a si mesmo");
      return;
    }

    setIsLoading(true);

    try {
      if (isFollowing) {
        const { error } = await (supabase as any)
          .from("follows")
          .delete()
          .eq("follower_id", currentUserId)
          .eq("following_id", targetUserId);

        if (error) throw error;
        setIsFollowing(false);
        onFollowChange?.(false);
        toast.success("Deixou de seguir");
      } else {
        const { error } = await (supabase as any)
          .from("follows")
          .insert({
            follower_id: currentUserId,
            following_id: targetUserId,
          });

        if (error) throw error;
        setIsFollowing(true);
        onFollowChange?.(true);
        toast.success("Seguindo!");
      }
    } catch (error: any) {
      console.error("Error toggling follow:", error);
      toast.error("Erro ao processar solicitação");
    } finally {
      setIsLoading(false);
    }
  };

  // Don't render if it's the user's own profile or not logged in
  if (currentUserId === targetUserId || (!isLoading && !currentUserId)) {
    return null;
  }

  return (
    <Button
      variant={isFollowing ? "outline" : variant}
      size={size}
      onClick={handleFollow}
      disabled={isLoading}
      className={className}
    >
      {isLoading ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : isFollowing ? (
        <>
          <UserMinus className="h-4 w-4 mr-2" />
          Seguindo
        </>
      ) : (
        <>
          <UserPlus className="h-4 w-4 mr-2" />
          Seguir
        </>
      )}
    </Button>
  );
}
