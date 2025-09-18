# ===============================
# Dockerfile - Bié Okutuala Server
# ===============================

# 1️⃣ Base image
FROM node:18-alpine

# 2️⃣ Diretório de trabalho
WORKDIR /app

# 3️⃣ Copiar package.json e package-lock.json
COPY package.json package-lock.json* ./

# 4️⃣ Instalar dependências
RUN npm install

# 5️⃣ Copiar restante da aplicação
COPY . .

# 6️⃣ Expõe a porta
EXPOSE 4000

# 7️⃣ Variáveis de ambiente
ENV NODE_ENV=development
ENV PORT=4000

# 8️⃣ Comando padrão
CMD ["npm", "start"]