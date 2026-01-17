import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FollowButton } from "@/components/FollowButton";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  type: "followers" | "following";
  title: string;
}

interface UserProfile {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
}

export function FollowersModal({
  isOpen,
  onClose,
  userId,
  type,
  title,
}: FollowersModalProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen, userId, type]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      if (type === "followers") {
        // Get users who follow this user
        const { data, error } = await (supabase as any)
          .from("follows")
          .select(`
            follower_id,
            profiles!follows_follower_id_fkey (
              id,
              full_name,
              username,
              avatar_url
            )
          `)
          .eq("following_id", userId);

        if (error) throw error;
        const profiles = data
          ?.map((f: any) => f.profiles)
          .filter(Boolean) as UserProfile[];
        setUsers(profiles || []);
      } else {
        // Get users this user follows
        const { data, error } = await (supabase as any)
          .from("follows")
          .select(`
            following_id,
            profiles!follows_following_id_fkey (
              id,
              full_name,
              username,
              avatar_url
            )
          `)
          .eq("follower_id", userId);

        if (error) throw error;
        const profiles = data
          ?.map((f: any) => f.profiles)
          .filter(Boolean) as UserProfile[];
        setUsers(profiles || []);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUserClick = (clickedUserId: string) => {
    onClose();
    navigate(`/user/${clickedUserId}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="max-h-96">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {type === "followers"
                ? "Nenhum seguidor ainda"
                : "Não está seguindo ninguém"}
            </div>
          ) : (
            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div
                    className="flex items-center gap-3 flex-1 cursor-pointer"
                    onClick={() => handleUserClick(user.id)}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={user.avatar_url || undefined} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {user.full_name?.charAt(0).toUpperCase() || "U"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">
                        {user.full_name || "Usuário"}
                      </p>
                      {user.username && (
                        <p className="text-sm text-muted-foreground truncate">
                          @{user.username}
                        </p>
                      )}
                    </div>
                  </div>
                  <FollowButton
                    targetUserId={user.id}
                    size="sm"
                    onFollowChange={() => fetchUsers()}
                  />
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
