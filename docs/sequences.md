
# Diagramas de Sequência - Bié Okutuala

## 1️⃣ Criação de Pedido
```mermaid
sequenceDiagram
    participant Cliente
    participant Frontend
    participant Backend
    participant DB
    Cliente->>Frontend: Seleciona produtos e finaliza pedido
    Frontend->>Backend: POST /orders {produtos, total, endereço}
    Backend->>DB: Inserir novo pedido
    DB-->>Backend: Confirmação
    Backend-->>Frontend: Pedido criado com sucesso
    Frontend-->>Cliente: Mostrar confirmação do pedido
```
2️⃣ Pagamento com Comprovante

```mermaid
sequenceDiagram
    participant Cliente
    participant Frontend
    participant Backend
    participant Cloudinary
    participant DB
    Cliente->>Frontend: Envia pagamento + comprovante
    Frontend->>Backend: POST /payments {orderId, amount, receipt}
    Backend->>Cloudinary: Upload do comprovante
    Cloudinary-->>Backend: URL do arquivo
    Backend->>DB: Registrar pagamento e atualizar status do pedido
    DB-->>Backend: Confirmação
    Backend-->>Frontend: Retorna status do pagamento
    Frontend-->>Cliente: Notificação do pagamento
```
3️⃣ Pagamentos Múltiplos

```mermaid
sequenceDiagram
    participant Cliente
    participant Frontend
    participant Backend
    participant DB
    Cliente->>Frontend: Paga parcialmente o pedido
    Frontend->>Backend: POST /payments {orderId, amount, receipt}
    Backend->>DB: Adiciona pagamento parcial
    DB-->>Backend: Confirmação
    Backend->>DB: Verifica total pago vs total do pedido
    DB-->>Backend: Total atualizado
    Backend-->>Frontend: Retorna status do pedido (parcial ou pago)
    Frontend-->>Cliente: Notificação
```
4️⃣ Aprovação de Pagamento (Admin)

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant DB
    participant Cliente
    Admin->>Backend: Aprovar pagamento
    Backend->>DB: Atualiza status do pagamento e pedido
    DB-->>Backend: Confirmação
    Backend->>Cliente: Notifica usuário do pagamento aprovado
```
5️⃣ Rejeição de Pagamento (Admin)

```mermaid
sequenceDiagram
    participant Admin
    participant Backend
    participant DB
    participant Cliente
    Admin->>Backend: Rejeitar pagamento + motivo
    Backend->>DB: Atualiza status do pagamento e pedido como rejeitado
    DB-->>Backend: Confirmação
    Backend->>Cliente: Notifica usuário do pagamento rejeitado
```
6️⃣ Upload de Avatar/Imagens/Documentos

```mermaid
sequenceDiagram
    participant Cliente
    participant Frontend
    participant Backend
    participant Cloudinary
    participant DB
    Cliente->>Frontend: Envia arquivo (avatar, produto ou doc)
    Frontend->>Backend: POST /uploads
    Backend->>Cloudinary: Upload do arquivo
    Cloudinary-->>Backend: URL do arquivo
    Backend->>DB: Atualiza usuário, produto ou loja com URL
    DB-->>Backend: Confirmação
    Backend-->>Frontend: Retorna URL do arquivo
    Frontend-->>Cliente: Mostra arquivo atualizado
```
7️⃣ Reviews de Produtos

```mermaid
sequenceDiagram
    participant Cliente
    participant Frontend
    participant Backend
    participant DB
    Cliente->>Frontend: Envia review {rating, comment}
    Frontend->>Backend: POST /reviews
    Backend->>DB: Inserir review
    DB-->>Backend: Confirmação
    Backend-->>Frontend: Retorna review criado
    Frontend-->>Cliente: Mostra review
    Cliente->>Frontend: Solicita reviews do produto
    Frontend->>Backend: GET /reviews/product/:id
    Backend->>DB: Buscar reviews do produto
    DB-->>Backend: Lista de reviews
    Backend-->>Frontend: Retorna lista de reviews
    Frontend-->>Cliente: Exibe reviews

