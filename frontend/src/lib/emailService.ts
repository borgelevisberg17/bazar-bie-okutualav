import { supabase } from "@/integrations/supabase/client";

type EmailType = 
  | "order_created" 
  | "payment_submitted" 
  | "payment_approved" 
  | "payment_rejected"
  | "order_shipped"
  | "order_delivered"
  | "order_confirmed"
  | "seller_paid";

interface SendEmailParams {
  type: EmailType;
  to: string;
  orderNumber: string;
  buyerName?: string;
  sellerName?: string;
  total?: number;
  trackingCode?: string;
  rejectionReason?: string;
  paidAmount?: number;
}

export const sendOrderEmail = async (params: SendEmailParams): Promise<boolean> => {
  try {
    const { data, error } = await supabase.functions.invoke('send-order-email', {
      body: params,
    });

    if (error) {
      console.error('Error sending email:', error);
      return false;
    }

    console.log('Email service response:', data);
    return data?.success ?? false;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
};

// Helper functions for common email scenarios
export const notifyOrderCreated = async (
  buyerEmail: string,
  orderNumber: string,
  buyerName: string,
  total: number
) => {
  return sendOrderEmail({
    type: "order_created",
    to: buyerEmail,
    orderNumber,
    buyerName,
    total,
  });
};

export const notifyPaymentSubmitted = async (
  buyerEmail: string,
  orderNumber: string,
  buyerName: string
) => {
  return sendOrderEmail({
    type: "payment_submitted",
    to: buyerEmail,
    orderNumber,
    buyerName,
  });
};

export const notifyPaymentApproved = async (
  buyerEmail: string,
  orderNumber: string,
  buyerName: string
) => {
  return sendOrderEmail({
    type: "payment_approved",
    to: buyerEmail,
    orderNumber,
    buyerName,
  });
};

export const notifyPaymentRejected = async (
  buyerEmail: string,
  orderNumber: string,
  buyerName: string,
  rejectionReason: string
) => {
  return sendOrderEmail({
    type: "payment_rejected",
    to: buyerEmail,
    orderNumber,
    buyerName,
    rejectionReason,
  });
};

export const notifyOrderShipped = async (
  buyerEmail: string,
  orderNumber: string,
  buyerName: string,
  trackingCode?: string
) => {
  return sendOrderEmail({
    type: "order_shipped",
    to: buyerEmail,
    orderNumber,
    buyerName,
    trackingCode,
  });
};

export const notifyOrderDelivered = async (
  buyerEmail: string,
  orderNumber: string,
  buyerName: string
) => {
  return sendOrderEmail({
    type: "order_delivered",
    to: buyerEmail,
    orderNumber,
    buyerName,
  });
};

export const notifyOrderConfirmed = async (
  sellerEmail: string,
  orderNumber: string,
  sellerName: string
) => {
  return sendOrderEmail({
    type: "order_confirmed",
    to: sellerEmail,
    orderNumber,
    sellerName,
  });
};

export const notifySellerPaid = async (
  sellerEmail: string,
  orderNumber: string,
  sellerName: string,
  paidAmount: number
) => {
  return sendOrderEmail({
    type: "seller_paid",
    to: sellerEmail,
    orderNumber,
    sellerName,
    paidAmount,
  });
};
