# NextGen Justice V8 — Engineering Changelog
## Enterprise-Grade Legal Aid, Case Intelligence, Document AI Analysis & Advocate Matching

**Version:** 8.0.0  
**Baseline:** NextGen Justice V7  
**Architecture:** React 19 + TypeScript + Vite Frontend · Node.js + Express + TypeScript Backend · MongoDB / Dual-Mode Mongoose Persistence · Modular Document AI & Grounded RAG

---

### 1. Visual & Institutional Redesign
- **Indian Institutional Legal Tech Aesthetic:** Replaced generic purple-tinted and pill-saturated layout with an authoritative palette of deep navy (`#0B1B3D`), muted slate blue, warm off-white canvas, and burnished bronze accents.
- **Top Bar Contract Adherence:** Implemented strict 3-zone header contract: single-line brand wordmark with scales of justice insignia, 4–5 single-line navigation links, and compact action controls (zero wrapping, zero two-line spills).
- **Accessible Multilingual Language Selector:** Resolved cramped combined English/Tamil/Hindi selector with an accessible, keyboard-operable dropdown displaying native script labels (`English`, `தமிழ்`, `हिन्दी`) with active indicators. Fully wired into all page labels.
- **Anti-Slop Discipline:** Eradicated pseudo-technical comment headers (`//`), pulsing status dots, and decorative tags. Enforced WCAG AA contrast and tabular figures (`tabular-nums`) for all numbers and dates.

### 2. Advocate Directory & Location Matching Engine
- **34 Seeded Demonstrable Advocates:** Expanded database from 12 mock entries to 34 realistic fictional advocates distributed across 38 districts of Tamil Nadu, including Madurai, Chennai, Coimbatore, Tiruchirappalli, Salem, Tirunelveli, Virudhunagar (Sivakasi), Thoothukudi, Dindigul, Sivaganga, Theni, Thanjavur, Erode, Tiruppur, Kanchipuram, Vellore, and Hosur.
- **Transparent Multi-Factor Matching Algorithm:** Built an explainable matching engine that scores advocates based on:
  - Practice Area Match (up to 35 pts)
  - District & City Proximity (up to 30 pts)
  - Language Fluency (up to 15 pts)
  - Consultation Mode Compatibility (up to 10 pts)
  - Experience & Rating Bonus (up to 10 pts)
- **Score Breakdown Visibility:** Every advocate profile renders a clear breakdown (e.g. `PA: 35/35 · Loc: 20/30 · Lang: 15/15`) with a plain-language matching summary.
- **Broaden Search Toggle:** Added state-wide search expansion when local district counts are narrow.

### 3. Citizen Profile & Dependent Location Editor
- **Comprehensive Profile Management:** Replaced bare settings view with a full Citizen Profile editor in `SettingsPage.tsx`.
- **Dependent Location Dropdowns:** Selecting Tamil Nadu dynamically populates all 38 districts; selecting a district populates verified constituent cities and taluks (e.g. Madurai -> Melur, Thirumangalam, Usilampatti, Vadipatti).
- **Preference Persistence:** Saves full name, phone, state, district, city, PIN code, preferred consultation mode, legal interest categories, and communication preferences directly to the database.

### 4. Document AI Pipeline & Fact Approval
- **End-to-End Extraction:** Repaired broken document upload. Supported formats: PDF (via `pdf-parse` v2 and stream text recovery), DOCX (via `mammoth`), and TXT.
- **Real-Time Upload Progress:** Replaced silent failures with live XHR upload progress indicators (`uploadProgress` %).
- **Status Progression:** Enforced multi-stage document lifecycle: `uploaded` → `extracting` → `awaiting_review` → `indexing` → `indexed`.
- **Structured Fact Extraction:** Automatically detects document type, litigant counterparty names, key statutory deadlines, competent court/authority, monetary claims/arrears, and referenced sections.
- **Fact Approval & Dossier Merging:** Citizens can review extracted intelligence and click **"Approve & Apply to Case"**, merging verified facts into authoritative case records without data loss.

### 5. Legal AI Assistant (Mode A & Mode B)
- **Mode A (General Indian Legal Knowledge):** Answering basic concepts (Civil vs Criminal law, FIR lodging under Sec 154 CrPC, Legal Services Authorities Act free legal aid, Lawyer vs Judge distinction, Summons under CPC Order V) using Gemini 3.8 Flash or verified Indian legal statutory knowledge.
- **Mode B (Private Document RAG):** Strictly scoped to user's owned case files. Chunks documents into 500-char windows with 100-char overlap, computes vector/hybrid similarity, and constructs grounded answers.
- **Expandable Citations:** Every document finding cites the source document name, page number, chunk ID, and provides an expandable verbatim quote.
- **Insufficient Evidence Honesty:** Explicitly acknowledges when a document does not support an inquiry rather than hallucinating facts.
- **Dual Provider Support:** Seamlessly runs with Google Gemini 3.8 Flash via `@google/genai` when `GEMINI_API_KEY` is present, or operates in high-precision deterministic RAG fallback mode.

### 6. Consultation Workflow & Case Lifecycle
- **Consultation Booking:** Citizens can request consultations with specific advocates, attach active case dossiers, select consultation mode (In-Person, Video, Phone), and pick proposed dates.
- **Advocate Response:** Advocates view incoming requests in their dashboard, accept/decline, and attach chamber response notes.
- **Case Progression:** Full tracking through `DRAFT`, `SUBMITTED`, `PROCEEDING`, `REVIEW`, and `CLOSED`.

### 7. Dual-Mode Database Resilience
- **Zero-Crash Data Layer:** Automatically connects to MongoDB via Mongoose when `MONGODB_URI` is configured. If MongoDB is offline, transparently uses an embedded multi-collection JSON storage engine in `data/db/` with identical CRUD query semantics.
- **Idempotent Bootstrapping:** Automatically initializes 34 advocates and demo cases on server startup without duplicate key collisions.
