# PayoutIQ Backend API Service

PayoutIQ Backend is a high-performance REST API built using **FastAPI**. It handles bulk payout parsing, account validation, and secure disbursement operations by integrating with **Google Gemini 2.5 Flash** (for natural language parsing) and the **Monnify API** (for bank account verification and fund disbursement).

---

## Features

- **Google Social Authentication (with PKCE)**: Fully secure server-side Google OAuth 2.0 flow extended with Proof Key for Code Exchange (PKCE) to prevent code interception attacks.
- **AI-Powered Payout Parsing**: Converts unstructured textual instructions (e.g. WhatsApp logs, emails, notes) into structured JSON payees data utilizing Gemini.
- **Account Validation**: Validates account numbers and bank codes in bulk using Monnify's Name Enquiry API, automatically cross-checking recipient names to flag anomalies.
- **Bulk Payout Disbursement**: Initiates secure multi-account transfers via Monnify, supporting OTP authorization.
- **Dynamic Wallet Balance Checking**: Retrieves real-time merchant wallet balance from Monnify and alerts the workspace before execution if a batch exceeds the budget.
- **Background Worker Simulation**: Updates transaction logs dynamically to let the frontend track processing queue logs.

---

## Technical Stack

- **Framework**: FastAPI (Python 3.10+)
- **Database**: SQLite (SQLAlchemy ORM)
- **HTTP Client**: HTTPX (Async calls with exponential retry backoffs)
- **Auth Tokens**: PyJWT (JSON Web Tokens)
- **Hashing**: Bcrypt
- **Server**: Uvicorn

---

## Directory Structure

```
backend/
├── main.py                # FastAPI entry point & CORS middleware config
├── database.py            # SQLite database engine connection and session local helper
├── models.py              # SQLAlchemy database schemas (User, Batch, Payee)
├── routes/                # API Routers
│   ├── auth.py            # Signup, Login, Profile info, and Google OAuth (PKCE)
│   ├── payouts.py         # Batch creation, balance checking, parsing, and OTP confirmation
│   └── webhooks.py        # Webhook targets for payment provider update events
├── services/              # External Integrations
│   ├── gemini_service.py  # Gemini data extraction client with transient retries
│   └── monnify_service.py # Monnify API client (Name enquiry, transfers, wallet balance)
├── .env                   # Configuration settings (API Keys, URLs)
└── requirements.txt       # Python package dependencies
```

---

## Setup & Installation

### 1. Prerequisites
Ensure you have **Python 3.10+** installed on your system.

### 2. Create Virtual Environment
Create and activate a python virtual environment inside the `backend` folder:
```bash
python -m venv .venv

# On Windows:
.venv\Scripts\activate

# On macOS/Linux:
source .venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Configure Environment Variables
Create a `.env` file inside the `backend` folder based on `.env.example`:
```ini
# Gemini API Key (Leave blank to run in simulated parser mode)
GEMINI_API_KEY=your_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash

# Monnify Sandbox Credentials
MONNIFY_API_KEY=your_monnify_api_key
MONNIFY_CLIENT_SECRET=your_monnify_client_secret
MONNIFY_WALLET_ACCOUNT=your_monnify_merchant_wallet_account
MONNIFY_BASE_URL=https://sandbox.monnify.com

# Database
DATABASE_URL=sqlite:///./payoutiq.db

# Frontend Redirect Origin
FRONTEND_URL=http://localhost:5173
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:5174

# Google OAuth Credentials
GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=http://localhost:8000/api/auth/google/callback
```

### 5. Run the Server
Start the Uvicorn development server:
```bash
python main.py
# Or directly:
uvicorn main:app --reload --port 8000
```
- Interactive API Docs (Swagger): [http://localhost:8000/docs](http://localhost:8000/docs)
- Alternative Redoc Docs: [http://localhost:8000/redoc](http://localhost:8000/redoc)
