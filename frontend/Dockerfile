# Usa uma imagem oficial do Nginx para servir arquivos estáticos
FROM nginx:alpine

# Copia os arquivos estáticos para o diretório do Nginx
COPY . /usr/share/nginx/html

# Expõe a porta 80
EXPOSE 80

# Nginx já vem configurado para servir arquivos estáticos