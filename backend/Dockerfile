FROM node:20-slim

# Instalacja openssl wymagana przez Prisma oraz narzedzi do budowania modulow natywnych (np. bcrypt)
RUN apt-get update && apt-get install -y openssl ca-certificates python3 make g++ && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production --legacy-peer-deps

COPY . .
# Generowanie klienta Prisma
RUN npx prisma generate

# Budowanie zminifikowanego widget.js
RUN npm run build:widget

EXPOSE 5000

CMD ["node", "src/server.js"]
