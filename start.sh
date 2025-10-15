#!/bin/bash

echo "🚀 AgentHub - Uruchamianie aplikacji..."
echo ""

# Kolory
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Funkcja sprawdzająca czy node_modules istnieje
check_dependencies() {
    if [ ! -d "$1/node_modules" ]; then
        echo -e "${BLUE}📦 Instalowanie zależności w $1...${NC}"
        cd "$1"
        npm install
        cd ..
    else
        echo -e "${GREEN}✓ Zależności w $1 już zainstalowane${NC}"
    fi
}

# Sprawdź i zainstaluj zależności backendu
check_dependencies "backend"

# Sprawdź i zainstaluj zależności frontendu
check_dependencies "frontend"

# Inicjalizacja bazy danych
echo ""
echo -e "${BLUE}🗄️  Inicjalizacja bazy danych...${NC}"
cd backend
if [ ! -f "prisma/dev.db" ]; then
    npx prisma migrate dev --name init
else
    echo -e "${GREEN}✓ Baza danych już istnieje${NC}"
fi
cd ..

echo ""
echo -e "${GREEN}✓ Przygotowania zakończone!${NC}"
echo ""
echo -e "${BLUE}🚀 Uruchamianie serwerów...${NC}"
echo ""
echo "Backend:      http://localhost:5000"
echo "Frontend:     http://localhost:3000"
echo "Prisma Studio: http://localhost:5555"
echo ""
echo -e "${RED}Aby zatrzymać serwery, naciśnij Ctrl+C${NC}"
echo ""

# Uruchom Prisma Studio w tle
cd backend
npx prisma studio > /dev/null 2>&1 &
PRISMA_PID=$!
cd ..

# Uruchom backend w tle
cd backend
npm start &
BACKEND_PID=$!
cd ..

# Poczekaj 3 sekundy na uruchomienie backendu
sleep 3

# Uruchom frontend
cd frontend
npm start &
FRONTEND_PID=$!
cd .

# Funkcja do czyszczenia przy wyjściu
cleanup() {
    echo ""
    echo -e "${RED}🛑 Zatrzymywanie serwerów...${NC}"
    kill $PRISMA_PID 2>/dev/null
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    # Zatrzymaj Prisma Studio na porcie 5555
    lsof -ti:5555 | xargs kill -9 2>/dev/null
    exit 0
}

# Przechwytuj Ctrl+C
trap cleanup INT TERM

# Czekaj na zakończenie
wait
