FROM node:20-slim

WORKDIR /app

COPY package*.json ./
# Usamos legacy-peer-deps para resolver el conflicto de tipos de express/http-proxy-middleware
RUN npm install --legacy-peer-deps

# Instalamos ts-node y typescript de forma global para asegurar que los comandos del package.json funcionen
RUN npm install -g ts-node ts-node-dev typescript

COPY . .

EXPOSE 4000

CMD ["npm", "run", "dev"]