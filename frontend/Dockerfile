# Etap 1: Budowanie aplikacji React
FROM node:20-alpine AS build

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Domyślnie zakładamy, że backend jest dostępny na porcie 5000 hosta
ARG REACT_APP_BACKEND_URL=http://localhost:5000
ENV REACT_APP_BACKEND_URL=$REACT_APP_BACKEND_URL

RUN npm run build

# Etap 2: Serwowanie przez Nginx
FROM nginx:alpine

# Skopiowanie zbudowanej aplikacji do katalogu domyślnego Nginx
COPY --from=build /app/build /usr/share/nginx/html

# Kopiowanie domyślnej konfiguracji Nginx aby wspierać React Router (SPA fallback)
RUN echo "server { \
    listen 80; \
    location / { \
        root /usr/share/nginx/html; \
        index index.html index.htm; \
        try_files \$uri \$uri/ /index.html; \
    } \
}" > /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
