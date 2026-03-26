FROM node:20-slim

WORKDIR /app

COPY package*.json ./
# Usamos legacy-peer-deps para resolver el conflicto de tipos
RUN npm install --legacy-peer-deps

COPY . .

# Compilar TypeScript y copiar assets (templates)
RUN npm run build

EXPOSE 4000

# En produccin usamos el cdigo compilado
CMD ["npm", "run", "start"]
