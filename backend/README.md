# AgentHub Backend

Backend API dla platformy AgentHub.

## Instalacja

```bash
npm install
```

## Konfiguracja

Plik `.env` (już utworzony):
```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
PORT=5000
```

## Inicjalizacja bazy danych

```bash
npx prisma migrate dev --name init
```

## Uruchomienie

```bash
npm start
```

lub w trybie developerskim:

```bash
npm run dev
```

## API Endpoints

### Health Check
- **GET** `/api/health` - Sprawdza status API

### Authentication
- **POST** `/api/auth/register` - Rejestracja nowego użytkownika
- **POST** `/api/auth/login` - Logowanie użytkownika
- **GET** `/api/auth/me` - Pobierz dane zalogowanego użytkownika (wymaga tokenu)

## Struktura projektu

```
backend/
├── src/
│   ├── controllers/
│   │   └── authController.js
│   ├── middleware/
│   │   └── authMiddleware.js
│   ├── routes/
│   │   └── authRoutes.js
│   └── server.js
├── prisma/
│   └── schema.prisma
├── .env
└── package.json
```
