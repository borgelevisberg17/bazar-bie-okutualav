import { useState } from "react";
import { Navigation } from "@/components/Navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  HelpCircle,
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  Star,
  Shield,
  MessageCircle,
  Package,
  RefreshCcw,
} from "lucide-react";

const faqCategories = [
  {
    id: "buying",
    title: "Comprando",
    icon: ShoppingBag,
    questions: [
      {
        q: "Como faço para comprar um produto?",
        a: "1. Navegue ou pesquise o produto desejado\n2. Clique no produto para ver detalhes\n3. Adicione ao carrinho\n4. Finalize a compra preenchendo os dados de entrega\n5. Faça o pagamento por transferência bancária\n6. Envie o comprovante\n7. Aguarde a confirmação e envio"
      },
      {
        q: "Quais formas de pagamento são aceitas?",
        a: "Atualmente aceitamos transferência bancária (Multicaixa Express, IBAN) para a conta da plataforma. O pagamento é liberado ao vendedor após você confirmar o recebimento do produto."
      },
      {
        q: "Como sei que minha compra é segura?",
        a: "Usamos um sistema de intermediação onde o pagamento fica retido até você confirmar o recebimento do produto. Se houver problemas, nosso suporte ajuda a resolver."
      },
    ]
  },
  {
    id: "selling",
    title: "Vendendo",
    icon: Package,
    questions: [
      {
        q: "Como começo a vender?",
        a: "1. Crie uma conta ou faça login\n2. Vá em 'Publicar' no menu\n3. Escolha um plano de vendedor (Básico é gratuito)\n4. Adicione fotos e informações do produto\n5. Publique e aguarde compradores!"
      },
      {
        q: "Quais são as taxas para vendedores?",
        a: "• Básico (Gratuito): 10% por venda\n• Pro (Kz 2.500/mês): 7% por venda\n• VIP (Kz 7.500/mês): 5% por venda\n\nPlanos pagos oferecem mais anúncios, fotos e destaque."
      },
      {
        q: "Quando recebo o pagamento das vendas?",
        a: "O pagamento é liberado após o comprador confirmar o recebimento do produto (ou automaticamente após 7 dias da entrega confirmada). O valor é transferido para sua conta bancária em até 3 dias úteis."
      },
    ]
  },
  {
    id: "payments",
    title: "Pagamentos",
    icon: CreditCard,
    questions: [
      {
        q: "Como funciona o pagamento intermediado?",
        a: "1. Você paga para a conta da Bié Okutuala\n2. Verificamos o comprovante\n3. O vendedor envia o produto\n4. Você confirma o recebimento\n5. Liberamos o pagamento ao vendedor\n\nIsso protege ambas as partes."
      },
      {
        q: "Meu pagamento foi rejeitado, o que faço?",
        a: "Verifique se o valor está correto e o comprovante está legível. Tente enviar novamente ou entre em contato com o suporte para assistência."
      },
      {
        q: "Como funciona a assinatura de vendedor?",
        a: "Assinaturas são pagas mensalmente ou anualmente por transferência bancária. Após confirmação do pagamento, seu plano é ativado imediatamente."
      },
    ]
  },
  {
    id: "shipping",
    title: "Entregas",
    icon: Truck,
    questions: [
      {
        q: "Como funciona a entrega?",
        a: "O vendedor é responsável por enviar o produto após confirmação do pagamento. O prazo e método de envio são acordados entre comprador e vendedor via WhatsApp."
      },
      {
        q: "Posso rastrear meu pedido?",
        a: "Se o vendedor fornecer um código de rastreio, você pode acompanhar na página do pedido. Nem todos os envios têm rastreio disponível."
      },
      {
        q: "O que faço se não recebi o produto?",
        a: "Entre em contato com o vendedor primeiro. Se não resolver, abra uma disputa através do suporte. Temos 14 dias para investigar e, se confirmado, você recebe reembolso."
      },
    ]
  },
  {
    id: "returns",
    title: "Devoluções",
    icon: RefreshCcw,
    questions: [
      {
        q: "Posso devolver um produto?",
        a: "Sim, em casos de: produto diferente do anunciado, defeito não declarado, ou danos durante transporte. Você tem 7 dias após receber para solicitar devolução."
      },
      {
        q: "Como solicito um reembolso?",
        a: "1. Vá em 'Meus Pedidos'\n2. Selecione o pedido\n3. Clique em 'Abrir Disputa'\n4. Descreva o problema com fotos\n5. Aguarde análise (até 14 dias)"
      },
      {
        q: "Quanto tempo leva o reembolso?",
        a: "Após aprovação, o reembolso é processado em até 14 dias úteis para sua conta bancária."
      },
    ]
  },
  {
    id: "account",
    title: "Conta e Segurança",
    icon: Shield,
    questions: [
      {
        q: "Como altero minha senha?",
        a: "Vá em Configurações > Segurança > Alterar Senha. Se esqueceu a senha, use 'Esqueci minha senha' na tela de login."
      },
      {
        q: "Como excluo minha conta?",
        a: "Vá em Configurações > Conta > Excluir Conta. Atenção: isso é irreversível e remove todos os seus dados, produtos e histórico."
      },
      {
        q: "Minha conta foi hackeada, o que faço?",
        a: "1. Altere sua senha imediatamente\n2. Entre em contato com o suporte\n3. Revise suas transações recentes\n4. Ative autenticação de dois fatores se disponível"
      },
    ]
  },
];

export default function Help() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredCategories = faqCategories.map(cat => ({
    ...cat,
    questions: cat.questions.filter(
      q => q.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
           q.a.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.questions.length > 0 || searchQuery === "");

  return (
    <>
      <Navigation />
      <div className="min-h-screen pt-20 pb-24 md:pt-24 md:pb-8 px-4 bg-background">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-8">
            <div className="inline-flex p-3 bg-primary/10 rounded-full mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-bold mb-2">Central de Ajuda</h1>
            <p className="text-muted-foreground">
              Encontre respostas para suas dúvidas
            </p>
          </div>

          {/* Search */}
          <div className="relative mb-8">
            <Input
              placeholder="Buscar ajuda..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-12 text-base rounded-xl"
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          </div>

          {/* Category Pills */}
          <div className="flex flex-wrap gap-2 mb-6">
            {faqCategories.map((cat) => (
              <Button
                key={cat.id}
                variant={selectedCategory === cat.id ? "default" : "outline"}
                size="sm"
                className="gap-2"
                onClick={() => setSelectedCategory(
                  selectedCategory === cat.id ? null : cat.id
                )}
              >
                <cat.icon className="h-4 w-4" />
                {cat.title}
              </Button>
            ))}
          </div>

          {/* FAQ Accordion */}
          {filteredCategories
            .filter(cat => !selectedCategory || cat.id === selectedCategory)
            .map((category) => (
            <Card key={category.id} className="mb-4">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-4">
                  <category.icon className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold">{category.title}</h2>
                </div>
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, idx) => (
                    <AccordionItem key={idx} value={`${category.id}-${idx}`}>
                      <AccordionTrigger className="text-left">
                        {item.q}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground whitespace-pre-line">
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}

          {/* Contact Support */}
          <Card className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10">
            <CardContent className="p-6 text-center">
              <MessageCircle className="h-10 w-10 mx-auto text-primary mb-4" />
              <h3 className="text-lg font-semibold mb-2">Não encontrou sua resposta?</h3>
              <p className="text-muted-foreground mb-4">
                Nossa equipe de suporte está pronta para ajudar
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button asChild>
                  <a href="mailto:suporte@bieokutuala.ao">
                    Enviar E-mail
                  </a>
                </Button>
                <Button variant="outline" asChild>
                  <a href="https://wa.me/244XXXXXXXXX" target="_blank" rel="noopener noreferrer">
                    WhatsApp
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
}
