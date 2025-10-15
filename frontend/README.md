# AgentHub Frontend

Frontend React dla platformy AgentHub.

## Instalacja

```bash
npm install
```

## Uruchomienie

```bash
npm start
```

Aplikacja uruchomi się na `http://localhost:3000`

## Build produkcyjny

```bash
npm run build
```

## Routing

- `/` - Landing Page (publiczny)
- `/login` - Strona logowania
- `/register` - Strona rejestracji
- `/dashboard` - Dashboard (chroniony)

## Struktura projektu

```
frontend/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   └── ProtectedRoute.js
│   ├── context/
│   │   └── AuthContext.js
│   ├── pages/
│   │   ├── LandingPage.js
│   │   ├── LoginPage.js
│   │   ├── RegisterPage.js
│   │   └── Dashboard.js
│   ├── utils/
│   │   └── axios.js
│   ├── App.js
│   ├── index.js
│   └── index.css
├── tailwind.config.js
└── package.json
```

## Tailwind CSS

Projekt używa Tailwind CSS z custom konfiguracją zawierającą:
- Custom kolory z design system
- Custom czcionki (Inter, Space Grotesk, JetBrains Mono)
