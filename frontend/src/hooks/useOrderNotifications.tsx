import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

interface OrderNotification {
  id: string;
  order_number: string;
  status: string;
  old_status?: string;
  eventType: 'INSERT' | 'UPDATE';
}

export const useOrderNotifications = (enabled: boolean = true) => {
  const [notifications, setNotifications] = useState<OrderNotification[]>([]);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('orders-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('New order received:', payload);
          const newOrder = payload.new as any;
          
          toast.info(`🆕 Novo pedido: ${newOrder.order_number}`, {
            description: `Total: Kz ${Number(newOrder.total).toLocaleString('pt-AO')}`,
            duration: 10000,
          });

          setNotifications(prev => [...prev, {
            id: newOrder.id,
            order_number: newOrder.order_number,
            status: newOrder.status,
            eventType: 'INSERT',
          }]);

          // Invalidate queries to refresh data
          queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
          queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
        },
        (payload) => {
          console.log('Order updated:', payload);
          const updatedOrder = payload.new as any;
          const oldOrder = payload.old as any;

          // Only notify on status changes
          if (oldOrder.status !== updatedOrder.status) {
            const statusMessages: Record<string, string> = {
              payment_analysis: '💳 Comprovante enviado',
              payment_approved: '✅ Pagamento aprovado',
              payment_rejected: '❌ Pagamento rejeitado',
              processing: '📦 Em processamento',
              shipped: '🚚 Pedido enviado',
              delivered: '📬 Pedido entregue',
              confirmed_received: '✅ Recebimento confirmado',
              paid_to_seller: '💰 Vendedor pago',
              cancelled: '🚫 Pedido cancelado',
              refunded: '↩️ Reembolsado',
            };

            const message = statusMessages[updatedOrder.status] || 'Status atualizado';

            toast.info(`${message}: ${updatedOrder.order_number}`, {
              duration: 8000,
            });

            setNotifications(prev => [...prev, {
              id: updatedOrder.id,
              order_number: updatedOrder.order_number,
              status: updatedOrder.status,
              old_status: oldOrder.status,
              eventType: 'UPDATE',
            }]);

            // Invalidate queries to refresh data
            queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
            queryClient.invalidateQueries({ queryKey: ['admin-stats'] });
            queryClient.invalidateQueries({ queryKey: ['orders'] });
            queryClient.invalidateQueries({ queryKey: ['order'] });
          }
        }
      )
      .subscribe((status) => {
        console.log('Realtime subscription status:', status);
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, queryClient]);

  const clearNotifications = () => setNotifications([]);

  return { notifications, clearNotifications };
};
