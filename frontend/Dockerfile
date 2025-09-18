# ===============================
# Dockerfile - Bié Okutuala Frontend (HTML/CSS/JS)
# ===============================

FROM nginx:alpine

# Copia os arquivos do frontend para o diretório padrão do Nginx
COPY public/ /usr/share/nginx/html/

# Remove a configuração default do Nginx (opcional)
RUN rm /etc/nginx/conf.d/default.conf

# Copia configuração customizada do Nginx (opcional)
# COPY nginx.conf /etc/nginx/conf.d/

# Expõe porta padrão do Nginx
EXPOSE 80

# Comando padrão para iniciar o Nginx
CMD ["nginx", "-g", "daemon off;"]