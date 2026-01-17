import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAdmin } from "@/hooks/useAdmin";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { Loader2, FileText, Shield, HelpCircle, Save, ChevronLeft, Eye } from "lucide-react";

interface LegalPage {
  id: string;
  slug: string;
  title: string;
  content: string;
  updated_at: string;
}

export default function AdminLegalPages() {
  const { isAdmin, isLoading: adminLoading } = useAdmin();
  const navigate = useNavigate();
  const [pages, setPages] = useState<LegalPage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState<string | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, string>>({});
  const [editedTitles, setEditedTitles] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      navigate("/");
    }
  }, [isAdmin, adminLoading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchPages();
    }
  }, [isAdmin]);

  const fetchPages = async () => {
    try {
      const { data, error } = await supabase
        .from("legal_pages")
        .select("*")
        .order("slug");

      if (error) throw error;
      setPages(data || []);

      // Initialize edited content
      const contentMap: Record<string, string> = {};
      const titleMap: Record<string, string> = {};
      (data || []).forEach((page: LegalPage) => {
        contentMap[page.slug] = page.content;
        titleMap[page.slug] = page.title;
      });
      setEditedContent(contentMap);
      setEditedTitles(titleMap);
    } catch (error) {
      console.error("Error fetching pages:", error);
      toast.error("Erro ao carregar páginas");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (slug: string) => {
    setIsSaving(slug);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const { error } = await supabase
        .from("legal_pages")
        .update({
          title: editedTitles[slug],
          content: editedContent[slug],
          last_updated_by: user?.id,
        })
        .eq("slug", slug);

      if (error) throw error;
      
      toast.success("Página salva com sucesso!");
      fetchPages();
    } catch (error) {
      console.error("Error saving page:", error);
      toast.error("Erro ao salvar página");
    } finally {
      setIsSaving(null);
    }
  };

  const getPageIcon = (slug: string) => {
    switch (slug) {
      case "terms":
        return <FileText className="h-5 w-5" />;
      case "privacy":
        return <Shield className="h-5 w-5" />;
      case "help":
        return <HelpCircle className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  const getPageRoute = (slug: string) => {
    switch (slug) {
      case "terms":
        return "/terms";
      case "privacy":
        return "/privacy";
      case "help":
        return "/help";
      default:
        return "/";
    }
  };

  if (adminLoading || isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background pt-20 pb-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate("/admin/settings")}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">Páginas Legais</h1>
              <p className="text-muted-foreground text-sm">Editar conteúdo das páginas</p>
            </div>
          </div>

          <Tabs defaultValue={pages[0]?.slug || "terms"}>
            <TabsList className="mb-6">
              {pages.map((page) => (
                <TabsTrigger key={page.slug} value={page.slug} className="flex items-center gap-2">
                  {getPageIcon(page.slug)}
                  {page.title}
                </TabsTrigger>
              ))}
            </TabsList>

            {pages.map((page) => (
              <TabsContent key={page.slug} value={page.slug}>
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span className="flex items-center gap-2">
                        {getPageIcon(page.slug)}
                        Editar {page.title}
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(getPageRoute(page.slug), "_blank")}
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Visualizar
                      </Button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor={`title-${page.slug}`}>Título da Página</Label>
                      <Input
                        id={`title-${page.slug}`}
                        value={editedTitles[page.slug] || ""}
                        onChange={(e) =>
                          setEditedTitles((prev) => ({ ...prev, [page.slug]: e.target.value }))
                        }
                        placeholder="Título"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor={`content-${page.slug}`}>
                        Conteúdo (HTML/Markdown permitido)
                      </Label>
                      <Textarea
                        id={`content-${page.slug}`}
                        value={editedContent[page.slug] || ""}
                        onChange={(e) =>
                          setEditedContent((prev) => ({ ...prev, [page.slug]: e.target.value }))
                        }
                        placeholder="Conteúdo da página..."
                        rows={20}
                        className="font-mono text-sm"
                      />
                      <p className="text-xs text-muted-foreground">
                        Você pode usar HTML básico para formatação. Exemplo: &lt;h2&gt;Título&lt;/h2&gt;, &lt;p&gt;Parágrafo&lt;/p&gt;, &lt;ul&gt;&lt;li&gt;Item&lt;/li&gt;&lt;/ul&gt;
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-4 border-t">
                      <p className="text-xs text-muted-foreground">
                        Última atualização: {new Date(page.updated_at).toLocaleString("pt-AO")}
                      </p>
                      <Button
                        onClick={() => handleSave(page.slug)}
                        disabled={isSaving === page.slug}
                      >
                        {isSaving === page.slug ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                          <Save className="h-4 w-4 mr-2" />
                        )}
                        Salvar Alterações
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </>
  );
}