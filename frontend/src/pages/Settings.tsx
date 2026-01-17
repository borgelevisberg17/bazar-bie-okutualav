import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { ImageUpload } from "@/components/ImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Save, ChevronLeft, User, Mail, Phone, MapPin, Globe, AtSign, Crown, Store, Camera, Moon, Sun } from "lucide-react";
import { useSubscription } from "@/hooks/useSubscription";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";

export default function Settings() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { subscription } = useSubscription(user?.id);
  const { theme, setTheme } = useTheme();

  const [formData, setFormData] = useState({
    full_name: "",
    username: "",
    phone: "",
    bio: "",
    avatar_url: "",
    website: "",
    location: "",
    storefront_name: "",
    storefront_description: "",
    storefront_banner_url: "",
    storefront_theme: "default",
  });

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    setUser(user);
    await fetchProfile(user.id);
    setIsLoading(false);
  };

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;

      if (data) {
        setFormData({
          full_name: data.full_name || "",
          username: data.username || "",
          phone: data.phone || "",
          bio: data.bio || "",
          avatar_url: data.avatar_url || "",
          website: data.website || "",
          location: data.location || "",
          storefront_name: data.storefront_name || "",
          storefront_description: data.storefront_description || "",
          storefront_banner_url: data.storefront_banner_url || "",
          storefront_theme: data.storefront_theme || "default",
        });
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (formData.username && !/^[a-zA-Z0-9_]+$/.test(formData.username)) {
      toast.error("Nome de usuário pode conter apenas letras, números e _");
      return;
    }

    setIsSaving(true);

    try {
      const updateData: Record<string, any> = {
        full_name: formData.full_name || null,
        username: formData.username || null,
        phone: formData.phone || null,
        bio: formData.bio || null,
        avatar_url: formData.avatar_url || null,
        website: formData.website || null,
        location: formData.location || null,
        theme_preference: theme,
      };

      if (subscription?.plan === "enterprise") {
        updateData.storefront_name = formData.storefront_name || null;
        updateData.storefront_description = formData.storefront_description || null;
        updateData.storefront_banner_url = formData.storefront_banner_url || null;
        updateData.storefront_theme = formData.storefront_theme || "default";
      }

      const { error } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (error) {
        if (error.code === '23505') {
          toast.error("Este nome de usuário já está em uso");
        } else {
          console.error("Error saving profile:", error);
          throw error;
        }
        return;
      }

      toast.success("Perfil atualizado com sucesso!");
      navigate("/profile");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error(error.message || "Erro ao salvar perfil");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <Navigation />
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </>
    );
  }

  return (
    <>
      <Navigation />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <div className="sticky top-14 md:top-16 z-40 bg-background border-b">
          <div className="max-w-2xl mx-auto px-4 py-3">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="flex-1">
                <h1 className="font-bold text-lg">Editar Perfil</h1>
                <p className="text-xs text-muted-foreground">Personalize seu perfil</p>
              </div>
              <Button
                onClick={handleSave}
                disabled={isSaving}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>
        </div>

        <form onSubmit={handleSave} className="max-w-2xl mx-auto px-4 pb-24 pt-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative mb-4">
              <Avatar className="h-28 w-28 ring-4 ring-background shadow-xl">
                <AvatarImage src={formData.avatar_url} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold">
                  {formData.full_name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <button
                type="button"
                onClick={() => document.getElementById('avatar-upload')?.click()}
                className="absolute -bottom-1 -right-1 h-9 w-9 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:scale-105 transition-transform"
              >
                <Camera className="h-4 w-4" />
              </button>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (!file) return;
                  if (!file.type.startsWith("image/")) {
                    toast.error("Por favor, selecione uma imagem");
                    return;
                  }
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error("Imagem muito grande. Máximo 5MB");
                    return;
                  }
                  try {
                    const { data: { user: currentUser } } = await supabase.auth.getUser();
                    if (!currentUser) return;
                    const fileExt = file.name.split(".").pop();
                    const fileName = `${currentUser.id}/${Math.random()}.${fileExt}`;
                    const { error } = await supabase.storage.from("avatars").upload(fileName, file, { upsert: true });
                    if (error) throw error;
                    const { data } = supabase.storage.from("avatars").getPublicUrl(fileName);
                    setFormData(prev => ({ ...prev, avatar_url: data.publicUrl }));
                    toast.success("Foto atualizada!");
                  } catch (error: any) {
                    toast.error("Erro ao fazer upload");
                  }
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">Toque para alterar a foto</p>
          </div>

          {/* Basic Info */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold flex items-center gap-2">
              <User className="h-4 w-4 text-primary" />
              Informações Básicas
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  placeholder="Seu nome completo"
                  className="mt-1.5 h-12"
                />
              </div>

              <div>
                <Label htmlFor="username" className="flex items-center gap-1">
                  <AtSign className="h-3.5 w-3.5" />
                  Nome de Usuário
                </Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
                  placeholder="seunome"
                  className="mt-1.5 h-12"
                />
                <p className="text-xs text-muted-foreground mt-1">Seu identificador único</p>
              </div>

              <div>
                <Label htmlFor="email" className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  Email
                </Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="mt-1.5 h-12 bg-muted"
                />
              </div>

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  placeholder="Conte um pouco sobre você..."
                  rows={3}
                  className="mt-1.5 resize-none"
                  maxLength={150}
                />
                <p className="text-xs text-muted-foreground text-right mt-1">
                  {formData.bio.length}/150
                </p>
              </div>
            </div>
          </div>

          <Separator className="my-6" />

          {/* Appearance */}
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold flex items-center gap-2">
              {theme === "dark" ? <Moon className="h-4 w-4 text-primary" /> : <Sun className="h-4 w-4 text-primary" />}
              Aparência
            </h3>
            
            <div className="flex items-center justify-between p-4 bg-muted rounded-xl">
              <div className="flex items-center gap-3">
                {theme === "dark" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <div>
                  <p className="font-medium">Modo Escuro</p>
                  <p className="text-xs text-muted-foreground">
                    {theme === "dark" ? "Tema escuro ativado" : "Tema claro ativado"}
                  </p>
                </div>
              </div>
              <Switch
                checked={theme === "dark"}
                onCheckedChange={(checked) => setTheme(checked ? "dark" : "light")}
              />
            </div>
          </div>

          <Separator className="my-6" />
          <div className="space-y-4 mb-8">
            <h3 className="font-semibold flex items-center gap-2">
              <MapPin className="h-4 w-4 text-primary" />
              Contato & Localização
            </h3>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="phone" className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  Telefone/WhatsApp
                </Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+244 900 000 000"
                  className="mt-1.5 h-12"
                />
              </div>

              <div>
                <Label htmlFor="location">Localização</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Luanda, Angola"
                  className="mt-1.5 h-12"
                />
              </div>

              <div>
                <Label htmlFor="website" className="flex items-center gap-1">
                  <Globe className="h-3.5 w-3.5" />
                  Website
                </Label>
                <Input
                  id="website"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  placeholder="https://seusite.com"
                  className="mt-1.5 h-12"
                />
              </div>
            </div>
          </div>

          {/* VIP Storefront Settings */}
          {subscription?.plan === "enterprise" && (
            <>
              <Separator className="my-6" />
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-500" />
                  <h3 className="font-semibold">Vitrine VIP</h3>
                </div>
                <p className="text-sm text-muted-foreground">
                  Personalize sua loja exclusiva de vendedor VIP
                </p>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="storefront_name" className="flex items-center gap-1">
                      <Store className="h-3.5 w-3.5" />
                      Nome da Loja
                    </Label>
                    <Input
                      id="storefront_name"
                      value={formData.storefront_name}
                      onChange={(e) => setFormData({ ...formData, storefront_name: e.target.value })}
                      placeholder="Nome da sua loja"
                      className="mt-1.5 h-12"
                    />
                  </div>

                  <div>
                    <Label htmlFor="storefront_description">Descrição da Loja</Label>
                    <Textarea
                      id="storefront_description"
                      value={formData.storefront_description}
                      onChange={(e) => setFormData({ ...formData, storefront_description: e.target.value })}
                      placeholder="Descreva sua loja para os clientes..."
                      rows={3}
                      className="mt-1.5 resize-none"
                      maxLength={300}
                    />
                  </div>

                  <div>
                    <Label>Banner da Loja</Label>
                    <div className="mt-1.5">
                      <ImageUpload
                        bucket="avatars"
                        currentImage={formData.storefront_banner_url}
                        onUploadComplete={(url) => setFormData({ ...formData, storefront_banner_url: url })}
                      />
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">Recomendado: 1200x400 pixels</p>
                  </div>

                  <div>
                    <Label htmlFor="storefront_theme">Tema da Vitrine</Label>
                    <Select 
                      value={formData.storefront_theme} 
                      onValueChange={(value) => setFormData({ ...formData, storefront_theme: value })}
                    >
                      <SelectTrigger className="mt-1.5 h-12">
                        <SelectValue placeholder="Escolha um tema" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Padrão (Rosa)</SelectItem>
                        <SelectItem value="gold">Dourado</SelectItem>
                        <SelectItem value="ocean">Oceano</SelectItem>
                        <SelectItem value="forest">Floresta</SelectItem>
                        <SelectItem value="sunset">Pôr do Sol</SelectItem>
                        <SelectItem value="royal">Royal</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {formData.username && (
                    <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl">
                      <p className="text-sm">
                        <strong>URL da sua vitrine:</strong><br />
                        <code className="text-primary text-sm">bazar.ao/loja/{formData.username}</code>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </form>
      </div>
    </>
  );
}
