# PayoutIQ Frontend Portal

PayoutIQ Frontend is a single-page application (SPA) built using **React** and **Vite**. It provides a treasury workspace where users can upload unstructured payout instructions, verify recipient bank credentials inline, monitor active disbursements, and review cash flow metrics via an analytics dashboard.

---

## Features

- **Treasury Dashboard & Audit Logs**: Interactive analytics screen displaying metrics like Total Volume Disbursed, Success Rate (%), and processing statuses, along with real-time audit trails of historical batches.
- **Sleek Document Uploader**: Supports drag-and-drop or direct copy-paste of raw unstructured payment texts.
- **Inline Editing & Re-verification**: Review table flagging `NAME_MISMATCH` or `DUPLICATE_ACCOUNT` warnings. Users can correct bank codes, account numbers, or amounts directly within the table cells and trigger re-verification.
- **Monnify Wallet Balance Pill**: Displays live merchant wallet balance in the header, keeping developers informed.
- **Budget Safety Warning**: Alerts users directly in the review screen when the batch's cumulative cost exceeds the active wallet balance.
- **OTP Verification & Real-time Status Progress**: Displays real-time progress meters, success/failure counts, and detailed transaction logs.
- **Downloadable Audit Reports**: Client-side compiled CSV exporter to download complete batch transaction reports.
- **Premium Glassmorphism Design**: Curated color palettes (HSL), fluid animations, clean layouts, and desktop/mobile responsive nav menus.

---

## Technical Stack

- **Core**: React 19 (Functional Components & hooks)
- **Tooling**: Vite (Hot Module Replacement)
- **Styling**: Vanilla CSS (CSS variables, custom grid systems, and glassmorphic blobs)
- **Routing**: HTML5 History API (`pushState`/`replaceState` logic checking session state)
- **Linting**: Oxlint

---

## Directory Structure

```
frontend/
├── dist/                  # Compiled production assets
├── public/                # Static public assets (Favicon, logos)
├── src/
│   ├── assets/            # App specific assets
│   ├── screens/           # Modular SPA screens
│   │   ├── Header.jsx           # Global Nav Header (including wallet balance pill)
│   │   ├── Footer.jsx           # App copyright/info Footer
│   │   ├── LandingScreen.jsx    # Promo, features, and marketing screen
│   │   ├── LoginScreen.jsx      # Sign in via form or Google OAuth
│   │   ├── SignupScreen.jsx     # Registration forms for company profiles
│   │   ├── UploadScreen.jsx     # Drop-zone/text input for payout instructions
│   │   ├── ReviewScreen.jsx     # Editable payees table with warnings and budget alerts
│   │   ├── ConfirmationScreen.jsx# Summary review of batch before disbursement
│   │   ├── OtpScreen.jsx        # OTP code input field
│   │   ├── StatusScreen.jsx     # Real-time transaction progress bar and logs
│   │   └── HistoryScreen.jsx    # Combined Dashboard Analytics and Audit Logs table
│   ├── App.css            # Custom CSS animations & configurations
│   ├── index.css          # Design system CSS (tokens, variables, classes, scrollbars)
│   ├── App.jsx            # Main App logic, routing control, and state management
│   └── main.jsx           # React app mount bootstrap
├── index.html             # Entry HTML document
├── package.json           # npm configuration and scripts
└── vite.config.js         # Vite compiler configuration
```

---

## Setup & Installation

### 1. Prerequisites
Ensure you have **Node.js (v18+)** and **npm** installed on your machine.

### 2. Install Dependencies
Navigate to the `frontend` folder and run:
```bash
npm install
```

### 3. Configure Environment Variables
By default, the application falls back to `http://127.0.0.1:8000` for API connection. If your FastAPI backend is running on a different port, set it in `.env` or configuration:
```ini
VITE_API_URL=http://localhost:8000
```

### 4. Run Development Server
```bash
npm run dev
```
The server will start at `http://localhost:5173`

### 5. Build for Production
Compiles the static production bundle to `dist/`:
```bash
npm run build
```
You can preview the production bundle locally with:
```bash
npm run preview
```
