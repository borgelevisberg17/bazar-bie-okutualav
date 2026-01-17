import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Shield, Users, CreditCard, Package, AlertTriangle } from "lucide-react";

// Default content when database is empty
const DEFAULT_CONTENT = `
<h2 class="flex items-center gap-2 text-xl font-bold text-foreground">
  1. Aceitação dos Termos
</h2>
<p class="text-muted-foreground">
  Ao acessar e utilizar a plataforma Bié Okutuala ("Plataforma"), você concorda em cumprir e estar vinculado a estes Termos de Uso. Se você não concordar com qualquer parte destes termos, não poderá acessar ou utilizar nossos serviços.
</p>
<p class="text-muted-foreground">
  A Plataforma é um marketplace social que conecta compradores e vendedores em Angola, permitindo a comercialização de produtos diversos.
</p>

<h2 class="flex items-center gap-2 text-xl font-bold text-foreground mt-8">
  2. Elegibilidade e Conta
</h2>
<p class="text-muted-foreground">
  Para utilizar a Plataforma, você deve:
</p>
<ul class="text-muted-foreground list-disc pl-6 space-y-2">
  <li>Ter pelo menos 18 anos de idade ou ter autorização de um responsável legal</li>
  <li>Fornecer informações verdadeiras, precisas e atualizadas durante o cadastro</li>
  <li>Manter a confidencialidade de suas credenciais de acesso</li>
  <li>Notificar imediatamente sobre qualquer uso não autorizado da sua conta</li>
</ul>

<h2 class="flex items-center gap-2 text-xl font-bold text-foreground mt-8">
  3. Planos e Assinaturas
</h2>
<p class="text-muted-foreground">
  A Plataforma oferece diferentes tipos de contas:
</p>
<ul class="text-muted-foreground list-disc pl-6 space-y-2">
  <li><strong>Usuário (Gratuito):</strong> Pode visualizar e comprar produtos</li>
  <li><strong>Básico (Gratuito):</strong> Pode publicar até 3 anúncios com 1 foto cada, taxa de 10% por venda</li>
  <li><strong>Pro (Kz 2.500/mês):</strong> Até 20 anúncios, 5 fotos cada, selo "Vendedor Verificado", taxa de 7%</li>
  <li><strong>VIP (Kz 7.500/mês):</strong> Até 100 anúncios, 10 fotos cada, selo "Vendedor VIP", vitrine personalizada, taxa de 5%</li>
</ul>

<h2 class="flex items-center gap-2 text-xl font-bold text-foreground mt-8">
  4. Responsabilidades do Vendedor
</h2>
<p class="text-muted-foreground">
  Ao vender na Plataforma, você concorda em publicar apenas produtos legais, fornecer descrições precisas, cumprir prazos de envio e aceitar devoluções conforme as políticas.
</p>

<h2 class="flex items-center gap-2 text-xl font-bold text-foreground mt-8">
  5. Contato
</h2>
<p class="text-muted-foreground">
  Para dúvidas sobre estes Termos, entre em contato: suporte@bieokutuala.ao
</p>
`;

export default function Terms() {
  const [content, setContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    try {
      const { data, error } = await supabase
        .from("legal_pages")
        .select("content")
        .eq("slug", "terms")
        .single();

      if (error) throw error;
      setContent(data?.content || DEFAULT_CONTENT);
    } catch (error) {
      console.error("Error fetching terms:", error);
      setContent(DEFAULT_CONTENT);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-primary/10 rounded-full mb-4">
              <FileText className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Termos de Uso</h1>
            <p className="text-muted-foreground">
              Última atualização: Janeiro 2026
            </p>
          </div>

          <Card>
            <CardContent className="p-6 md:p-8 prose prose-sm dark:prose-invert max-w-none">
              {isLoading ? (
                <div className="space-y-4">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-48 mt-6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ) : content ? (
                <div dangerouslySetInnerHTML={{ __html: content }} />
              ) : (
                <div dangerouslySetInnerHTML={{ __html: DEFAULT_CONTENT }} />
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
