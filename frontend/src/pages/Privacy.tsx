import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Shield } from "lucide-react";

// Default content when database is empty
const DEFAULT_CONTENT = `
<p class="text-muted-foreground lead">
  A Bié Okutuala está comprometida com a proteção da sua privacidade. Esta política descreve como coletamos, usamos e protegemos suas informações pessoais.
</p>

<h2 class="text-xl font-bold text-foreground mt-8">1. Informações que Coletamos</h2>
<h3 class="font-semibold text-foreground">1.1 Informações fornecidas por você:</h3>
<ul class="text-muted-foreground list-disc pl-6 space-y-2">
  <li>Nome completo e nome de usuário</li>
  <li>Endereço de e-mail e número de telefone</li>
  <li>Foto de perfil e biografia</li>
  <li>Endereço de entrega</li>
  <li>Informações bancárias para vendedores</li>
</ul>

<h2 class="text-xl font-bold text-foreground mt-8">2. Como Usamos Suas Informações</h2>
<ul class="text-muted-foreground list-disc pl-6 space-y-2">
  <li>Processar transações e gerenciar sua conta</li>
  <li>Facilitar a comunicação entre compradores e vendedores</li>
  <li>Enviar notificações sobre pedidos e atualizações importantes</li>
  <li>Personalizar sua experiência na plataforma</li>
  <li>Prevenir fraudes e garantir a segurança</li>
</ul>

<h2 class="text-xl font-bold text-foreground mt-8">3. Segurança dos Dados</h2>
<p class="text-muted-foreground">
  Implementamos medidas de segurança rigorosas incluindo criptografia SSL/TLS, armazenamento seguro e monitoramento contínuo.
</p>

<h2 class="text-xl font-bold text-foreground mt-8">4. Contato</h2>
<p class="text-muted-foreground">
  Para questões sobre privacidade: privacidade@bieokutuala.ao
</p>
`;

export default function Privacy() {
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
        .eq("slug", "privacy")
        .single();

      if (error) throw error;
      setContent(data?.content || DEFAULT_CONTENT);
    } catch (error) {
      console.error("Error fetching privacy:", error);
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
              <Shield className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Política de Privacidade</h1>
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
