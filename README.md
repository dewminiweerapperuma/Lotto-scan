# LottoScan - Premium Lottery Ticket Scanner App

LottoScan is a high-performance, premium full-stack lottery ticket scanner web application. It enables users to scan QR codes on physical or digital lottery tickets using their device's camera, parses ticket numbers automatically, and performs real-time verification against draw databases using custom, robust matching algorithms.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + HTML5 Camera Stream + `jsQR` (WASM processing) + Axios
- **Backend**: Node.js + Express.js + JWT Security + Multer (File Handling) + `pg` (PostgreSQL Client)
- **Database**: QuestDB (High-Performance Time-Series SQL Database with Postgres Wire Protocol)
- **Containerization**: Docker + Docker Compose

---

## 📁 Project Architecture & Directory Structure

```text
lotto-scan/
├── docker-compose.yml
├── package.json                   # Root package definitions
├── backend/
│   ├── .env                       # Local environment variables
│   ├── .env.template              # Env template
│   ├── Dockerfile                 # Backend image recipe
│   ├── server.js                  # App Entry and Database hook
│   ├── package.json               # Backend Node scripts & deps
│   ├── db/
│   │   └── questdb.js             # QuestDB connection pool and table initialization
│   ├── middleware/
│   │   └── auth.js                # JWT & role verification middlewares
│   ├── models/
│   │   ├── Draw.js                # Draw schema and prize definitions
│   │   └── User.js                # User schema, hooks, and password hashing
│   └── routes/
│       ├── auth.js                # /api/auth routes (Register, Login)
│       └── lottery.js             # /api/lottery routes (Upload, Verify, Query)
└── lottoscan-web-frontend/
    ├── .env.local                 # Next.js local environment variables
    ├── Dockerfile                 # Frontend image recipe
    ├── package.json               # Next.js scripts & frontend deps
    ├── tailwind.config.js         # Design Tokens and styling
    └── src/
        └── app/
            ├── page.tsx           # Hero and landing dashboard
            ├── scanner/           # QR code scanner component
            ├── results/           # Winner/No match page
            └── admin/             # Draw upload dashboard
```

---

## 🚀 Setup & Launch Instructions

### Option A: Running with Docker (Recommended)

To start the QuestDB database, backend server, and frontend web client under single-network container orchestration, run:

```bash
# From the root directory:
docker-compose up --build
```

- **Frontend Client**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **QuestDB Web Console**: `http://localhost:9000`
- **QuestDB Postgres Wire**: `localhost:8812`

---

### Option B: Running Locally (Without Docker)

#### Step 1: Start QuestDB
Ensure QuestDB is running locally or via Docker:
```bash
docker run -p 9000:9000 -p 8812:8812 questdb/questdb
```

#### Step 2: Start Backend
Navigate to the backend, install dependencies, and run in dev mode:
```bash
cd backend
npm install
npm run dev
```

#### Step 3: Start Frontend
Navigate to the frontend directory, install dependencies, and run in dev mode:
```bash
cd ../lottoscan-web-frontend
npm install
npm run dev
```

- Access the app in your browser at: `http://localhost:3000`

---

## 🧪 Testing & API Verification

You can easily test and verify the backend API endpoints using `curl` or Postman. Here are complete workflow examples:

### 1. Register Admin User
Create the initial admin account to access upload systems:
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lottoscan.com", "password": "secure_admin_password", "role": "admin"}'
```

### 2. Login to Get Authentication Token
Retrieve the JWT token for secure uploads:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lottoscan.com", "password": "secure_admin_password"}'
```

### 3. Upload a Draw Result (Admin Only)
Using the JWT token from the login response:
```bash
curl -X POST http://localhost:5000/api/lottery/upload-results \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT_TOKEN" \
  -d '{
    "drawDate": "2026-05-24",
    "drawName": "Mega Millions",
    "drawNumber": "MM-1002",
    "prizeDistribution": {
      "first": { "numbers": [5, 12, 25, 31, 50], "prize": 150000000 },
      "second": { "numbers": [10, 15, 20], "prize": 1000000 },
      "third": { "numbers": [1, 2], "prize": 50000 },
      "fourth": { "numbers": [9], "prize": 500 }
    }
  }'
```

### 4. Check Scanned Ticket Numbers (Public)
Verify a ticket containing specific numbers:
```bash
curl -X POST http://localhost:5000/api/lottery/check-ticket \
  -H "Content-Type: application/json" \
  -d '{
    "ticketNumbers": [5, 12, 25, 31, 50],
    "drawNumber": "MM-1002"
  }'
```

---

Play responsibly and good luck! 🍀
