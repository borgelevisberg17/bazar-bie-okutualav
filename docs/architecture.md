# Arquitetura do Sistema - Bié Okutuala

O **Bazar Bié Okutuala** foi projetado com uma arquitetura **modular e escalável**, garantindo segurança, desempenho e facilidade de manutenção.

---

## 🏗️ Camadas Principais

### 1. Frontend
- Interface responsiva, otimizada para **desktop e mobile**.
- Tecnologias: **HTML, CSS, JavaScript**.
- Funcionalidades:
  - Navegação por categorias e produtos.
  - Carrinho de compras.
  - Avaliações e comentários.
  - Formulários de cadastro e login.
  - Upload de imagens e documentos.

### 2. Backend
- Servidor construído com **Node.js** e **Express**.
- Responsável por:
  - Autenticação de usuários (Firebase).
  - Processamento de pedidos e pagamentos.
  - Gestão de produtos, lojas e usuários.
  - Envio de notificações (email via SMTP).
  - Controle de permissões e funções (cliente, vendedor, admin).

### 3. Banco de Dados
- Suporta **MySQL** ou **Supabase**.
- Estrutura organizada em tabelas principais:
  - **Users:** Dados do usuário, papel e avatar.
  - **Products:** Informações dos produtos, imagens e estoque.
  - **Orders:** Pedidos dos clientes, status e histórico.
  - **Payments:** Pagamentos, comprovantes e status.
  - **Stores:** Dados das lojas e documentos.
  - **Reviews:** Avaliações e comentários de produtos.

### 4. Armazenamento de Arquivos
- **Cloudinary** para:
  - Upload de imagens (produtos, avatares).
  - Upload de documentos de lojas.
  - Comprovantes de pagamento.
- Garante **acesso seguro, escalável e rápido**.

### 5. Notificações
- Sistema de envio de **emails automáticos**:
  - Confirmação de pedidos.
  - Status de pagamentos (aprovados ou rejeitados).
  - Atualizações para administradores.

---

## 🔄 Fluxo de Dados Simplificado
# Arquitetura Visual - Bié Okutuala

```mermaid
flowchart LR
    A[Cliente] -->|Interação UI| B[Frontend]
    B -->|Requisições API| C[Backend - Node.js/Express]
    C --> D[(Banco de Dados - MySQL / Supabase)]
    C --> E[Cloudinary - Imagens e Documentos]
    C --> F[SMTP - Emails de Notificação]

    subgraph Backend
        C1[Pedidos]
        C2[Pagamentos]
        C3[Uploads (Avatares, Produtos, Documentos)]
        C4[Reviews]
        C5[Autenticação & Roles]
        C1 --> C2
        C2 --> C5
        C3 --> D
        C4 --> D
    end

    B --> Backend
```
  ---

## ⚙️ Considerações Técnicas
- **Modularidade:** Cada funcionalidade (Pedidos, Pagamentos, Uploads, Reviews) possui **controllers e rotas separados**, facilitando manutenção.
- **Transações:** Pagamentos e atualizações de pedidos são feitas de forma **transacional**, garantindo consistência.
- **Multi-ambiente:** Suporte para **PostgreSQL ou Supabase**, adaptável a diferentes necessidades.
- **Segurança:** Autenticação Firebase, validação de uploads, e roles (cliente, vendedor, admin).

