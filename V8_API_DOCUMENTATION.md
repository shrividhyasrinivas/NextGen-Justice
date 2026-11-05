# NextGen Justice V8 — REST API Documentation

All API routes are served under the `/api` prefix. Standard response envelopes use `{ success: boolean, message?: string, data?: any }`. Protected endpoints require a Bearer token in the `Authorization` header (`Authorization: Bearer <JWT>`).

---

## 1. Authentication (`/api/auth`)

### `POST /api/auth/register`
Registers a new Citizen or Advocate account.
- **Request Body:**
  ```json
  {
    "fullName": "S. Ramanathan",
    "email": "ramanathan@example.com",
    "password": "Password@123",
    "role": "citizen", // "citizen" | "advocate"
    "phone": "+91 98420 12345",
    "state": "Tamil Nadu",
    "district": "Madurai",
    "city": "Madurai",
    "barCouncilNumber": "TN/2021/1042", // Required if advocate
    "practiceAreas": ["Property", "Civil"]
  }
  ```
- **Response (201):** `{ success: true, token: string, user: User }`

### `POST /api/auth/login`
Authenticates a user and issues a 7-day JWT.
- **Request Body:** `{ "email": "...", "password": "..." }`
- **Response (200):** `{ success: true, token: string, user: User }`

### `GET /api/auth/me` *(Protected)*
Returns the currently authenticated user session.
- **Response (200):** `{ success: true, user: User }`

---

## 2. Profile & Location Management (`/api/profile`)

### `GET /api/profile` *(Protected)*
Retrieves the authenticated citizen's full profile including dependent district, city, PIN code, and legal interests.

### `PUT /api/profile` *(Protected)*
Updates permitted profile fields (`state`, `district`, `city`, `pincode`, `preferredLanguage`, `preferredConsultationMode`, `legalInterests`, `communicationPrefs`, `phone`, `fullName`).

---

## 3. Advocate Directory & Matching (`/api/advocates`)

### `GET /api/advocates`
Searches, filters, and ranks advocates across Tamil Nadu.
- **Query Parameters:**
  - `search`: Full text keyword search against name, bio, and practice areas.
  - `practiceArea`: Filter by legal domain (e.g. `Property`, `Family`, `Civil`).
  - `state`: Default `Tamil Nadu`.
  - `district`: Filter by district (e.g. `Madurai`, `Chennai`, `Coimbatore`).
  - `city`: Specific town.
  - `language`: `tamil`, `english`, `hindi`.
  - `consultationMode`: `in-person`, `video call`, `phone`.
  - `availability`: `today` (Available Today).
  - `minExperience`: Number of years.
  - `broadenSearch`: `true` to expand search statewide when district has few matches.
- **Response (200):**
  ```json
  {
    "success": true,
    "total": 34,
    "data": [
      {
        "_id": "adv_01",
        "fullName": "Adv. S. Muthukrishnan",
        "district": "Madurai",
        "city": "Madurai",
        "practiceAreas": ["Property", "Civil", "Revenue Law"],
        "matchScore": 92,
        "matchExplanation": {
          "practiceAreaMatch": "35/35",
          "locationMatch": "20/30",
          "languageMatch": "15/15",
          "modeMatch": "10/10",
          "experienceBonus": "12/10",
          "summary": "Exact practice match in Property (+35) · Practices in Madurai district (+20) · Fluent in preferred language: Tamil (+15)"
        }
      }
    ]
  }
  ```

---

## 4. Cases & Dossier (`/api/cases`)

### `GET /api/cases` *(Protected)*
Lists cases belonging to the authenticated citizen or assigned to the advocate.

### `GET /api/cases/:id` *(Protected)*
Fetches a single case dossier including litigating parties, timeline dates, and attached document records.

### `POST /api/cases` *(Protected)*
Creates a new case matter.
- **Request Body:**
  ```json
  {
    "title": "Commercial Tenancy Eviction & Arrears",
    "category": "Property",
    "description": "Tenant defaulted on 5 months rent under lease agreement...",
    "state": "Tamil Nadu",
    "district": "Madurai",
    "city": "Madurai",
    "urgency": "NORMAL"
  }
  ```

---

## 5. Document AI Pipeline (`/api/documents`)

### `POST /api/cases/:id/documents` *(Protected, Multipart)*
Uploads a `.pdf`, `.docx`, or `.txt` file (up to 15 MB).
- Validates file extension, size, and MIME type.
- Extracts text content preserving page boundaries where available.
- Chunks text into overlapping windows and generates retrieval indexes.
- Runs structured fact extraction for parties, dates, court, and monetary claims.
- **Response (201):** `{ success: true, data: DocumentRecord }`

### `POST /api/documents/:id/approve-facts` *(Protected)*
Citizen reviews and approves extracted legal facts, merging them into the authoritative case dossier.

### `GET /api/documents/:id/download` *(Protected)*
Securely downloads an uploaded file with owner access control.

### `DELETE /api/documents/:id` *(Protected)*
Safely deletes the physical file, database record, and all vector retrieval chunks.

---

## 6. Grounded Legal AI Assistant (`/api/assistant`)

### `POST /api/assistant/general`
Mode A: Answers general Indian legal questions with statutory references.
- **Request:** `{ "question": "What is an FIR?", "language": "en" }`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "answer": "A First Information Report (FIR) is recorded under Section 154 CrPC...",
      "sources": [],
      "provider": "gemini-3.8-flash",
      "mode": "general",
      "statutoryReferences": ["Section 154, Code of Criminal Procedure, 1973"]
    }
  }
  ```

### `POST /api/assistant/case` *(Protected)*
Mode B: Grounded RAG answering strictly from the citizen's uploaded case files.
- **Request:** `{ "question": "What deadline is mentioned in the notice?", "caseId": "case_01" }`
- **Response:**
  ```json
  {
    "success": true,
    "data": {
      "answer": "The notice dated 15th January 2026 demands vacant possession on or before 5th February 2026 [Source 1].",
      "sources": [
        {
          "sourceId": "chk_03",
          "title": "sample_legal_notice.txt",
          "pageNumber": 1,
          "chunkIndex": 2,
          "excerpt": "Hand over peaceful vacant possession on or before 5th February 2026...",
          "score": 0.842
        }
      ],
      "provider": "gemini-3.8-flash",
      "hasSufficientEvidence": true
    }
  }
  ```

---

## 7. Consultations (`/api/consultations`)

### `POST /api/consultations` *(Protected)*
Submits a consultation request to a selected advocate.
- **Request:**
  ```json
  {
    "advocateId": "adv_01",
    "caseId": "case_01",
    "message": "Need advice on filing eviction petition before Madurai Rent Tribunal.",
    "mode": "IN_PERSON",
    "preferredDate": "2026-02-06"
  }
  ```

### `PUT /api/consultations/:id/status` *(Protected)*
Advocate accepts or rejects a request with an optional response note.

---

## 8. Health & Telemetry (`/api/health`)

### `GET /api/health`
Public health probe returning database engine status, advocate count, and AI provider status without exposing secrets.
