import { supabase } from "@/integrations/supabase/client";

type SubscriptionEmailType = 
  | "subscription_approved" 
  | "subscription_rejected";

interface SendSubscriptionEmailParams {
  type: SubscriptionEmailType;
  to: string;
  sellerName: string;
  planName: string;
  rejectionReason?: string;
}

export const sendSubscriptionEmail = async (params: SendSubscriptionEmailParams): Promise<boolean> => {
  try {
    // We'll use the existing edge function but with subscription-specific formatting
    const emailContent = getSubscriptionEmailContent(params);
    
    const { data, error } = await supabase.functions.invoke('send-subscription-email', {
      body: {
        ...params,
        ...emailContent,
      },
    });

    if (error) {
      console.error('Error sending subscription email:', error);
      return false;
    }

    console.log('Subscription email service response:', data);
    return data?.success ?? false;
  } catch (error) {
    console.error('Failed to send subscription email:', error);
    return false;
  }
};

const getSubscriptionEmailContent = (params: SendSubscriptionEmailParams) => {
  const { type, sellerName, planName, rejectionReason } = params;

  if (type === "subscription_approved") {
    return {
      subject: `🎉 Sua assinatura ${planName} foi aprovada!`,
      message: `Parabéns ${sellerName}! Sua assinatura do plano ${planName} foi aprovada com sucesso.`,
    };
  } else {
    return {
      subject: `Assinatura ${planName} não aprovada`,
      message: `Olá ${sellerName}, infelizmente sua assinatura do plano ${planName} não foi aprovada.`,
      rejectionReason,
    };
  }
};

export const notifySubscriptionApproved = async (
  sellerEmail: string,
  sellerName: string,
  planName: string
) => {
  return sendSubscriptionEmail({
    type: "subscription_approved",
    to: sellerEmail,
    sellerName,
    planName,
  });
};

export const notifySubscriptionRejected = async (
  sellerEmail: string,
  sellerName: string,
  planName: string,
  rejectionReason: string
) => {
  return sendSubscriptionEmail({
    type: "subscription_rejected",
    to: sellerEmail,
    sellerName,
    planName,
    rejectionReason,
  });
};
