# AgentHub - Platforma do Tworzenia AI Chatbotów

Platforma SaaS umożliwiająca firmom tworzenie inteligentnych chatbotów obsługi klienta bez kodu.

## 🚀 Stack Technologiczny

### Backend
- Node.js + Express
- PostgreSQL/SQLite (Prisma ORM)
- JWT Authentication
- bcrypt

### Frontend
- React 18
- React Router v6
- Axios
- Tailwind CSS
- Context API

## 📦 Instalacja i Uruchomienie

### 🚀 Szybki start (Automatyczny)

**macOS/Linux:**
```bash
./start.sh
```

**Windows:**
```bash
start.bat
```

Skrypt automatycznie:
- Zainstaluje wszystkie zależności (jeśli potrzebne)
- Zainicjalizuje bazę danych
- Uruchomi backend (http://localhost:5000)
- Uruchomi frontend (http://localhost:3000)

### Ręczne uruchomienie

**Backend:**
```bash
cd backend
npm install
npx prisma migrate dev --name init
npm start
```

Backend uruchomi się na `http://localhost:5000`

**Frontend:**
```bash
cd frontend
npm install
npm start
```

Frontend uruchomi się na `http://localhost:3000`

## 🔑 Funkcjonalności (Etap 1)

- ✅ Rejestracja użytkowników
- ✅ Logowanie
- ✅ JWT Authentication
- ✅ Protected Routes
- ✅ Landing Page
- ✅ Dashboard (podstawowy)

## 📋 API Endpoints

### Authentication

**POST** `/api/auth/register`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**POST** `/api/auth/login`
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**GET** `/api/auth/me` (Protected)
```
Headers: Authorization: Bearer <token>
```

## 🎨 Design System

### Kolory
- Primary Blue: `#2563EB`
- Accent Violet: `#7C3AED`
- Success Green: `#10B981`
- Error Red: `#EF4444`

### Czcionki
- Primary: Inter
- Display: Space Grotesk
- Monospace: JetBrains Mono

## 📄 Licencja

MIT


stripe listen --forward-to localhost:5000/api/payments/webhook