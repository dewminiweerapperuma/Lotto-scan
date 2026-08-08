# LottoScan - Premium Lottery Ticket Scanner App

LottoScan is a high-performance, premium full-stack lottery ticket scanner web application. It enables users to scan QR codes on physical or digital lottery tickets using their device's camera, parses ticket numbers automatically, and performs real-time verification against draw databases using custom, robust matching algorithms.

---

## 🛠️ Technology Stack

- **Frontend**: Next.js 14 (App Router) + TypeScript + Tailwind CSS + HTML5 Camera Stream + `jsQR` (WASM processing) + Axios
- **Backend**: Node.js + Express.js + JWT Security + Multer (File Handling) + Mongoose ODM
- **Database**: MongoDB (draw records, user authentication tables, active nodes)
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
│   ├── middleware/
│   │   └── auth.js                # JWT & role verification middlewares
│   ├── models/
│   │   ├── Draw.js                # Draw schema and prize definitions
│   │   └── User.js                # User schema, hooks, and password hashing
│   └── routes/
│       ├── auth.js                # /api/auth routes (Register, Login)
│       └── lottery.js             # /api/lottery routes (Upload, Verify, Query)
└── frontend/
    ├── .env.local                 # Next.js local environment variables
    ├── Dockerfile                 # Frontend image recipe
    ├── package.json               # Next.js scripts & frontend deps
    ├── tailwind.config.ts         # Design Tokens and styling
    ├── lib/
    │   └── api.ts                 # Typed Axios Client + Token Interceptor
    └── app/
        ├── layout.tsx             # HTML skeleton, SEO keywords, & Header injection
        ├── page.tsx               # Hero and landing dashboard
        ├── globals.css            # Stylesheets
        ├── components/
        │   ├── Header.tsx         # Navigation, dynamic auth status and back buttons
        │   └── Button.tsx         # Reusable interactive buttons
        ├── scanner/
        │   └── page.tsx           # Camera stream, canvas grabber, & jsQR parser
        ├── results/
        │   ├── page.tsx           # Dynamic Suspense Winner/No Match screen
        │   └── latest/
        │       └── page.tsx       # Recent drawings list and details dashboard
        └── admin/
            ├── page.tsx           # Security access gates and dashboard controls
            └── upload/
                └── page.tsx       # Manual fields panel & drag-drop CSV uploader
```

---

## 🚀 Setup & Launch Instructions

### Option A: Running with Docker (Recommended)

To start the entire database, backend server, and frontend web client under single-network container orchestration, run:

```bash
# From the root directory:
docker-compose up --build
```

- **Frontend Client**: `http://localhost:3000`
- **Backend API**: `http://localhost:5000`
- **MongoDB Instance**: `mongodb://localhost:27017`

---

### Option B: Running Locally (Without Docker)

#### Step 1: Start MongoDB
Ensure MongoDB is installed and running on your local machine:
```bash
# In an open terminal:
mongod
```

#### Step 2: Start Backend
Navigate to the backend, install dependencies, and run in dev mode:
```bash
cd backend
npm install
npm run dev
```

#### Step 3: Start Frontend
Navigate to the frontend, install dependencies, and run in dev mode:
```bash
cd ../frontend
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

*Expected response:*
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "64bfec...",
    "email": "admin@lottoscan.com",
    "role": "admin"
  }
}
```

### 2. Login to Get Authentication Token
Retrieve the JWT token for secure uploads:
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@lottoscan.com", "password": "secure_admin_password"}'
```

### 3. Upload a Draw Result (Admin Only)
Using the JWT token from the login response (replace `YOUR_ADMIN_JWT_TOKEN` below):
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

*Expected Winner Response:*
```json
{
  "status": "WINNER",
  "matchedPrize": "first",
  "prizeAmount": 150000000,
  "reason": "Exact match for first prize!",
  "draw": {
    "drawName": "Mega Millions",
    "drawNumber": "MM-1002",
    "drawDate": "2026-05-24T00:00:00.000Z"
  },
  "ticketNumbers": [5, 12, 25, 31, 50]
}
```

---

## 📷 QR Code Generation & Testing

To test the camera QR scanner, generate a QR code with any of the following contents:

1. **Raw Comma List**: `5,12,25,31,50` (Matches closest active drawing)
2. **JSON Object**: `{"numbers":[5,12,25,31,50],"drawNumber":"MM-1002"}`
3. **Hyperlink URL**: `https://lottoscan.com/check?numbers=5,12,25,31,50&draw=MM-1002`

Hold the generated QR code up to your webcam on `/scanner` to verify instant match results!

---

## 🛠️ Troubleshooting

- **Database Connection Retries**: The backend includes automated retries. If MongoDB is initializing, wait 5 seconds and it will automatically establish a connection.
- **Camera Stream Blocks**: Ensure you serve the application over `localhost` or `HTTPS`. Modern browsers enforce camera security restrictions and block WebRTC/getUserMedia calls on non-secure connections (`HTTP`).
- **Multer CSV Parsing**: CSV files must include headers (`drawDate`, `drawName`, `drawNumber`, etc.) and winning numbers must be separated by the `|` pipe symbol.

Play responsibly and good luck! 🍀
