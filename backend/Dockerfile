# Usa uma imagem oficial do Node.js
FROM node:18-alpine

# Define o diretório de trabalho no container
WORKDIR /app

# Copia os arquivos de dependências
COPY package*.json ./

# Instala as dependências
RUN npm install

# Copia o código da aplicação
COPY . .

# Expõe a porta 3000
EXPOSE 3002

# Comando para rodar a aplicação
CMD ["node", "server.js"]