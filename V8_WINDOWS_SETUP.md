# NextGen Justice V8 — Windows Setup & Execution Guide
## Complete PowerShell Step-by-Step Instructions

This guide provides copy-pasteable PowerShell commands to clone, configure, build, seed, test, and run **NextGen Justice V8** on Windows 10/11.

---

### 1. Prerequisites Check

Open **PowerShell** as Administrator or a standard terminal:

```powershell
# 1. Verify Node.js (v18, v20, or v22 recommended)
node -v

# 2. Verify npm
npm -v

# 3. Verify Git
git --version
```

If Node.js is not installed, install it via `winget`:
```powershell
winget install OpenJS.NodeJS.LTS
```

---

### 2. Project Directory & Dependency Installation

Navigate to the extracted `NextGen_Justice_V8` directory:

```powershell
# Navigate to project root
cd C:\Path\To\NextGen_Justice_V8

# Clean install all dependencies
npm install
```

---

### 3. Environment Configuration (`.env`)

Copy `.env.example` to `.env`:

```powershell
# Copy environment file
Copy-Item .env.example .env

# Verify file created
Get-Content .env
```

Your `.env` file contains:
```env
# Server Port (Default: 3000)
PORT=3000

# Optional MongoDB Connection String (Atlas or Local)
# If left empty, NextGen Justice V8 automatically uses the built-in resilient JSON persistent store in data/db/
MONGODB_URI=

# JWT Authentication Secret
JWT_SECRET=nextgen-justice-v8-enterprise-secret-key-2026

# Document Upload Storage Directory
UPLOAD_DIR=uploads

# Google Gemini API Key (Optional but recommended for live LLM generation)
# Obtain from https://aistudio.google.com/
GEMINI_API_KEY=

# Generic OpenAI-Compatible LLM (Optional alternative)
LLM_API_KEY=
LLM_API_URL=
LLM_MODEL=gemini-3.8-flash

# Seed Administrator Credentials
SEED_ADMIN_EMAIL=admin@nextgenjustice.org
SEED_ADMIN_PASSWORD=Admin@2026
```

---

### 4. Database Setup & Checking MongoDB (Optional)

NextGen Justice V8 includes a **dual-mode database**:
- If you have MongoDB installed locally or on MongoDB Atlas:
  ```powershell
  # Check if local MongoDB service is running
  Get-Service -Name MongoDB -ErrorAction SilentlyContinue

  # If installed, start service:
  Start-Service -Name MongoDB
  ```
  Set `MONGODB_URI=mongodb://localhost:27017/nextgen_justice` in your `.env`.

- **If you do NOT have MongoDB installed**:
  No setup required! NextGen Justice V8 automatically activates its embedded JSON persistent engine in `data/db/` with zero configuration. All records, users, 34 advocates, cases, and document chunks persist to disk immediately.

---

### 5. Running Automated Verification Tests

Execute the automated test suite verifying all 10 acceptance criteria (database seeding, advocate matching, document extraction, fact approval, Mode A statutory Q&A, and Mode B grounded RAG):

```powershell
npm test
```

Expected output:
```
--- NEXTGEN JUSTICE V8 AUTOMATED TEST SUITE ---
[Database] Initializing data store...
[Seed] Populating demonstration records across Tamil Nadu...
[Database] Ready. Total advocates: 34, users: 37, cases: 2
✓ [PASS] Database initializes and seeds at least 30 Tamil Nadu advocates
✓ [PASS] Advocate matching produces transparent scores and explanations for Madurai
✓ [PASS] Text extraction parses plain text notices correctly
✓ [PASS] Chunker creates overlapping retrieval chunks retaining metadata
✓ [PASS] Structured Fact Extraction detects document type, parties, and statutory sections
✓ [PASS] Extracted facts merge into authoritative case record without loss
✓ [PASS] Legal Assistant Mode A answers basic Indian legal concepts with citations
✓ [PASS] Legal Assistant Mode B retrieves relevant chunks and cites sources from case documents
✓ [PASS] Legal Assistant Mode B reports insufficient evidence when document does not mention topic
✓ [PASS] Consultation request is stored with PENDING status and can be updated
========================================
TEST RUN COMPLETED: 10 PASSED, 0 FAILED
========================================
```

---

### 6. Building the Application

Run TypeScript type check and production Vite build:

```powershell
# Type check without emitting
npm run lint

# Production build
npm run build
```

---

### 7. Starting NextGen Justice V8

NextGen Justice V8 runs as a unified full-stack server where Express serves the API and mounts Vite middleware in development:

```powershell
npm run dev
```

Open your browser at:
👉 **`http://localhost:3000`**

To test API health:
👉 **`http://localhost:3000/api/health`**

---

### 8. Quick Academic Evaluation Accounts

You can immediately sign in using the pre-seeded demonstration accounts:

| Role | Email Address | Password | Jurisdiction / Focus |
| :--- | :--- | :--- | :--- |
| **Citizen (Madurai)** | `citizen@example.com` | `Demo@2026` | Madurai District, Property / Tenancy |
| **Advocate (Madurai)** | `advocate.muthukrishnan1@example.com` | `Demo@2026` | Madurai Bench High Court, 18 yrs exp |
| **Administrator** | `admin@nextgenjustice.org` | `Admin@2026` | Tamil Nadu State-wide Administration |

Or register a **new citizen account** at any time. The 34 seeded advocates across Tamil Nadu will appear immediately!

---

### 9. Common Windows Troubleshooting & Diagnostics

#### Issue: `npm run dev` fails with `Port 3000 already in use`
```powershell
# Find process using port 3000
netstat -ano | findstr :3000

# Stop the process (replace <PID> with the process ID number from netstat)
taskkill /PID <PID> /F
```
Or edit `PORT=3001` in `.env`.

#### Issue: Execution Policy error running npm
```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
```

#### Issue: Resetting demonstration seed data
To restore the demonstration database and reset all test cases:
1. Log in as `admin@nextgenjustice.org`
2. Navigate to **Administration** tab
3. Click **"Reset Demo Seed (34 Advocates)"**
Or delete the contents of `data/db/` and run `npm test`.
