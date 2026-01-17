import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

type EmailType = 
  | "order_created" 
  | "payment_submitted" 
  | "payment_approved" 
  | "payment_rejected"
  | "order_shipped"
  | "order_delivered"
  | "order_confirmed"
  | "seller_paid";

interface EmailRequest {
  type: EmailType;
  to: string;
  orderNumber: string;
  orderId?: string;
  buyerName?: string;
  sellerName?: string;
  total?: number;
  trackingCode?: string;
  rejectionReason?: string;
  paidAmount?: number;
}

const getEmailContent = (request: EmailRequest) => {
  const { type, orderNumber, buyerName, sellerName, total, trackingCode, rejectionReason, paidAmount } = request;

  const subjects: Record<EmailType, string> = {
    order_created: `Pedido ${orderNumber} criado com sucesso!`,
    payment_submitted: `Comprovante do pedido ${orderNumber} enviado`,
    payment_approved: `Pagamento do pedido ${orderNumber} aprovado! 🎉`,
    payment_rejected: `Pagamento do pedido ${orderNumber} rejeitado`,
    order_shipped: `Pedido ${orderNumber} foi enviado! 📦`,
    order_delivered: `Pedido ${orderNumber} foi entregue`,
    order_confirmed: `Recebimento do pedido ${orderNumber} confirmado`,
    seller_paid: `Pagamento recebido - Pedido ${orderNumber}`,
  };

  const htmlTemplates: Record<EmailType, string> = {
    order_created: `
      <h1>Pedido Criado!</h1>
      <p>Olá ${buyerName || 'Cliente'},</p>
      <p>Seu pedido <strong>${orderNumber}</strong> foi criado com sucesso!</p>
      <p>Total: <strong>Kz ${total?.toLocaleString('pt-AO')}</strong></p>
      <p>Por favor, efetue o pagamento em até 48 horas para garantir seu pedido.</p>
      <p>Após o pagamento, envie o comprovante através da plataforma.</p>
    `,
    payment_submitted: `
      <h1>Comprovante Recebido</h1>
      <p>Olá ${buyerName || 'Cliente'},</p>
      <p>Recebemos o comprovante de pagamento do pedido <strong>${orderNumber}</strong>.</p>
      <p>Nosso time irá analisar e você receberá uma confirmação em breve.</p>
    `,
    payment_approved: `
      <h1>Pagamento Aprovado! 🎉</h1>
      <p>Olá ${buyerName || 'Cliente'},</p>
      <p>O pagamento do pedido <strong>${orderNumber}</strong> foi aprovado!</p>
      <p>O vendedor já foi notificado e preparará seu pedido para envio.</p>
    `,
    payment_rejected: `
      <h1>Pagamento Não Aprovado</h1>
      <p>Olá ${buyerName || 'Cliente'},</p>
      <p>Infelizmente, o pagamento do pedido <strong>${orderNumber}</strong> não pôde ser aprovado.</p>
      <p><strong>Motivo:</strong> ${rejectionReason || 'Comprovante inválido ou ilegível'}</p>
      <p>Por favor, envie um novo comprovante ou entre em contato com nosso suporte.</p>
    `,
    order_shipped: `
      <h1>Seu Pedido Foi Enviado! 📦</h1>
      <p>Olá ${buyerName || 'Cliente'},</p>
      <p>Ótima notícia! O pedido <strong>${orderNumber}</strong> está a caminho!</p>
      ${trackingCode ? `<p><strong>Código de rastreio:</strong> ${trackingCode}</p>` : ''}
      <p>Assim que receber, confirme o recebimento na plataforma.</p>
    `,
    order_delivered: `
      <h1>Pedido Entregue</h1>
      <p>Olá ${buyerName || 'Cliente'},</p>
      <p>O pedido <strong>${orderNumber}</strong> foi marcado como entregue.</p>
      <p>Por favor, confirme o recebimento na plataforma em até 72 horas.</p>
    `,
    order_confirmed: `
      <h1>Recebimento Confirmado</h1>
      <p>Olá ${sellerName || 'Vendedor'},</p>
      <p>O comprador confirmou o recebimento do pedido <strong>${orderNumber}</strong>!</p>
      <p>O pagamento será processado e enviado para sua conta em breve.</p>
    `,
    seller_paid: `
      <h1>Pagamento Recebido! 💰</h1>
      <p>Olá ${sellerName || 'Vendedor'},</p>
      <p>O pagamento referente ao pedido <strong>${orderNumber}</strong> foi enviado!</p>
      <p><strong>Valor:</strong> Kz ${paidAmount?.toLocaleString('pt-AO')}</p>
      <p>O valor deve aparecer na sua conta em até 48 horas úteis.</p>
    `,
  };

  return {
    subject: subjects[type],
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            h1 { color: #e11d48; }
            strong { color: #111; }
            p { margin: 10px 0; }
          </style>
        </head>
        <body>
          ${htmlTemplates[type]}
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
          <p style="color: #888; font-size: 12px;">
            Este email foi enviado automaticamente pelo Bazar Angola.<br>
            Não responda diretamente a este email.
          </p>
        </body>
      </html>
    `,
  };
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("❌ Missing Authorization header");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Create Supabase client with the user's auth context
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    // Verify the user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.error("❌ Auth error:", authError?.message || "No user found");
      return new Response(
        JSON.stringify({ success: false, error: "Unauthorized" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRequest: EmailRequest = await req.json();

    // Validate required fields
    if (!emailRequest.type || !emailRequest.to || !emailRequest.orderNumber) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields: type, to, orderNumber" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Authorization check: verify user has access to this order
    // Use service role to check order ownership since RLS may restrict access
    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (emailRequest.orderId) {
      const { data: order, error: orderError } = await supabaseServiceRole
        .from("orders")
        .select("buyer_id, seller_id")
        .eq("id", emailRequest.orderId)
        .single();

      if (orderError || !order) {
        console.error("❌ Order not found:", orderError?.message);
        return new Response(
          JSON.stringify({ success: false, error: "Order not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Check if user is the buyer, seller, or admin
      const { data: isAdmin } = await supabaseServiceRole.rpc("has_role", {
        _user_id: user.id,
        _role: "admin"
      });

      const isAuthorized = 
        order.buyer_id === user.id || 
        order.seller_id === user.id || 
        isAdmin === true;

      if (!isAuthorized) {
        console.error("❌ User not authorized for this order");
        return new Response(
          JSON.stringify({ success: false, error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else {
      // If no orderId provided, check if user is admin (for manual emails)
      const { data: isAdmin } = await supabaseServiceRole.rpc("has_role", {
        _user_id: user.id,
        _role: "admin"
      });

      if (!isAdmin) {
        console.error("❌ orderId required for non-admin users");
        return new Response(
          JSON.stringify({ success: false, error: "orderId is required" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    }

    const { subject, html } = getEmailContent(emailRequest);

    // Log for debugging
    console.log("📧 Email request from user:", user.id, {
      type: emailRequest.type,
      to: emailRequest.to,
      orderNumber: emailRequest.orderNumber,
      subject,
    });

    // Se não tem API key, apenas logamos
    if (!resendApiKey) {
      console.log("⚠️ RESEND_API_KEY not configured - email logged only");
      console.log("📨 Email content preview:", { subject, to: emailRequest.to });
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: "Email logged (RESEND_API_KEY not configured)",
          preview: { subject, to: emailRequest.to }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Enviar email via Resend (dynamic import)
    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resendClient = new Resend(resendApiKey);
    const emailResponse = await resendClient.emails.send({
      from: "Bazar Angola <noreply@bazar.ao>",
      to: [emailRequest.to],
      subject,
      html,
    });

    console.log("✅ Email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error sending email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
