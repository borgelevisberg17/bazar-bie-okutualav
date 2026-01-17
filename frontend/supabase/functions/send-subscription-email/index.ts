import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resendApiKey = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SubscriptionEmailRequest {
  type: "subscription_approved" | "subscription_rejected";
  to: string;
  sellerName: string;
  planName: string;
  rejectionReason?: string;
  subject?: string;
  message?: string;
  subscriptionId?: string;
}

const getEmailContent = (request: SubscriptionEmailRequest) => {
  const { type, sellerName, planName, rejectionReason } = request;

  if (type === "subscription_approved") {
    return {
      subject: `🎉 Sua assinatura ${planName} foi aprovada!`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #10b981; }
              .badge { display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; margin: 10px 0; }
              .cta { display: inline-block; background: #e11d48; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
              strong { color: #111; }
              p { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Parabéns! 🎉</h1>
            <p>Olá <strong>${sellerName}</strong>,</p>
            <p>Sua assinatura do plano <span class="badge">${planName}</span> foi <strong>aprovada com sucesso</strong>!</p>
            <p>Agora você tem acesso a todos os benefícios do seu plano:</p>
            <ul>
              <li>✅ Publicar produtos no marketplace</li>
              <li>✅ Dashboard de vendas completo</li>
              <li>✅ Gestão de pedidos</li>
              ${planName === 'VIP' ? '<li>✅ Selo de Vendedor VIP</li><li>✅ Produtos em Destaque</li><li>✅ Vitrine Personalizada</li>' : ''}
              ${planName === 'Pro' ? '<li>✅ Selo de Vendedor Verificado</li>' : ''}
            </ul>
            <p>Comece a vender agora mesmo!</p>
            <a href="https://bazar.ao/post" class="cta">Publicar Meu Primeiro Produto</a>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              Este email foi enviado automaticamente pelo Bazar Angola.<br>
              Não responda diretamente a este email.
            </p>
          </body>
        </html>
      `,
    };
  } else {
    return {
      subject: `Assinatura ${planName} não aprovada`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
              h1 { color: #e11d48; }
              .reason { background: #fef2f2; border-left: 4px solid #e11d48; padding: 15px; margin: 15px 0; }
              .cta { display: inline-block; background: #e11d48; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: bold; margin-top: 20px; }
              strong { color: #111; }
              p { margin: 10px 0; }
            </style>
          </head>
          <body>
            <h1>Assinatura Não Aprovada</h1>
            <p>Olá <strong>${sellerName}</strong>,</p>
            <p>Infelizmente, sua solicitação de assinatura do plano <strong>${planName}</strong> não pôde ser aprovada.</p>
            <div class="reason">
              <strong>Motivo:</strong> ${rejectionReason || 'Comprovante de pagamento inválido ou ilegível'}
            </div>
            <p>Você pode tentar novamente enviando um novo comprovante de pagamento válido.</p>
            <a href="https://bazar.ao/subscription" class="cta">Tentar Novamente</a>
            <p style="margin-top: 20px;">Se precisar de ajuda, entre em contato com nosso suporte.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #eee;">
            <p style="color: #888; font-size: 12px;">
              Este email foi enviado automaticamente pelo Bazar Angola.<br>
              Não responda diretamente a este email.
            </p>
          </body>
        </html>
      `,
    };
  }
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

    // Use service role to check admin status
    const supabaseServiceRole = createClient(
      supabaseUrl,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Authorization check: only admins can send subscription emails
    const { data: isAdmin, error: roleError } = await supabaseServiceRole.rpc("has_role", {
      _user_id: user.id,
      _role: "admin"
    });

    if (roleError || !isAdmin) {
      console.error("❌ User is not an admin:", user.id);
      return new Response(
        JSON.stringify({ success: false, error: "Forbidden - Admin access required" }),
        { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const emailRequest: SubscriptionEmailRequest = await req.json();

    // Validate required fields
    if (!emailRequest.type || !emailRequest.to || !emailRequest.sellerName || !emailRequest.planName) {
      console.error("❌ Missing required fields");
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { subject, html } = getEmailContent(emailRequest);

    console.log("📧 Subscription email request from admin:", user.id, {
      type: emailRequest.type,
      to: emailRequest.to,
      planName: emailRequest.planName,
      subject,
    });

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

    const { Resend } = await import("https://esm.sh/resend@2.0.0");
    const resendClient = new Resend(resendApiKey);
    const emailResponse = await resendClient.emails.send({
      from: "Bazar Angola <noreply@bazar.ao>",
      to: [emailRequest.to],
      subject,
      html,
    });

    console.log("✅ Subscription email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("❌ Error sending subscription email:", error);
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
