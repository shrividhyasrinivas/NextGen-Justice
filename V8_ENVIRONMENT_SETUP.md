# NextGen Justice V8 — Environment & Configuration Guide

This document details all configuration parameters, database connection options, and AI provider integrations supported by NextGen Justice V8.

---

## 1. Environment Variable Reference

Create a `.env` file in the root directory. NextGen Justice V8 reads environment variables using `dotenv`.

| Variable | Required | Default | Description |
| :--- | :--- | :--- | :--- |
| `PORT` | Optional | `3000` | Port for the unified Express server and Vite application. |
| `NODE_ENV` | Optional | `development` | Set to `production` when serving compiled dist assets. |
| `MONGODB_URI` | Optional | `""` | MongoDB connection URI (e.g. `mongodb+srv://...` or `mongodb://localhost:27017/nextgen`). If omitted, uses embedded resilient JSON storage in `data/db/`. |
| `JWT_SECRET` | Required | `nextgen-justice-v8-enterprise-secret-key-2026` | Cryptographic secret used to sign and verify JSON Web Tokens. |
| `UPLOAD_DIR` | Optional | `uploads` | Relative directory path where uploaded files are stored safely with sanitized filenames. |
| `GEMINI_API_KEY` | Optional | `""` | Google Gemini API key for live generation with `gemini-3.8-flash` and `gemini-embedding-2-preview`. |
| `LLM_API_KEY` | Optional | `""` | Third-party OpenAI-compatible API key if using an alternative provider. |
| `LLM_API_URL` | Optional | `""` | Third-party base URL (e.g. `https://api.openai.com/v1`). |
| `LLM_MODEL` | Optional | `gemini-3.8-flash` | Name of the chat completion model. |
| `SEED_ADMIN_EMAIL` | Optional | `admin@nextgenjustice.org` | Initial administrator login email. |
| `SEED_ADMIN_PASSWORD` | Optional | `Admin@2026` | Initial administrator password. |

---

## 2. Database Modes

### Mode A: Embedded Resilient Store (Default / Zero-Config)
If `MONGODB_URI` is left blank or cannot be reached:
- Storage persists to `data/db/users.json`, `data/db/advocates.json`, `data/db/cases.json`, `data/db/documents.json`, `data/db/chunks.json`, `data/db/consultations.json`, `data/db/notifications.json`.
- Automatic schema validation and CRUD query compatibility with MongoDB models.
- Idempotently bootstraps on first run with 34 realistic Tamil Nadu advocates across Madurai, Chennai, Coimbatore, Salem, Tirunelveli, Virudhunagar, etc.
- Guarantees zero crashing when operating in offline or air-gapped test environments.

### Mode B: MongoDB Atlas / Local MongoDB Service
When `MONGODB_URI` is provided:
- Connects through Mongoose client with pooled socket connections.
- Automatically creates indexes on `email`, `caseId`, `ownerId`, and `advocateId`.

---

## 3. AI Provider Configuration

### Google Gemini via `@google/genai` (Recommended)
NextGen Justice V8 natively integrates the official `@google/genai` SDK:
1. Provide your key: `GEMINI_API_KEY="AIzaSy..."`
2. NextGen Justice V8 automatically connects server-side:
   - **Chat & Grounded Synthesis:** `gemini-3.8-flash`
   - **Embeddings:** `gemini-embedding-2-preview`
   - **User-Agent:** Telemetry tagged as `aistudio-build`
3. Never exposes keys to browser or client code. All inference runs on server endpoints (`/api/assistant/*`).

### Provider-Independent Fallback (Offline RAG)
If no AI provider key is configured or if an upstream network error occurs:
- NextGen Justice V8 **never crashes** and never outputs hallucinated content.
- **Mode A (General Inquiry):** Answers from a curated institutional Indian Legal Knowledge Base covering CPC, CrPC, IPC/BNS, and Legal Services Authorities Act with statutory citations.
- **Mode B (Private Document RAG):** Evaluates term-frequency cosine similarity, extracts top-ranking evidence passages from the user's uploaded case files, and renders exact source excerpts with page numbers and chunk IDs.
