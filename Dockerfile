# Build stage
FROM node:20-slim AS build

WORKDIR /app

COPY package*.json ./
RUN npm install --legacy-peer-deps

COPY . .
RUN npm run build

# Production stage
FROM nginx:stable-alpine

# Clean default nginx public files
RUN rm -rf /usr/share/nginx/html/*

# Copy build assets from build stage
COPY --from=build /app/dist /usr/share/nginx/html

# Remove ANY existing config files to avoid conflicts
RUN rm /etc/nginx/conf.d/*

# Copy custom nginx config
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]