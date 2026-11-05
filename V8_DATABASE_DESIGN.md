# NextGen Justice V8 — Database Architecture & Schema Design

NextGen Justice V8 is engineered with a relational-document data model supporting both MongoDB/Mongoose and a local zero-dependency persistent JSON store.

---

## 1. Entity-Relationship Architecture

```
                  ┌──────────────┐
                  │     User     │
                  └──────┬───────┘
                         │ 1:1 (if role == advocate)
                         ▼
        ┌───────────────────────────────────┐
        │          AdvocateProfile          │
        └─────────────────┬─────────────────┘
                          │ 1:N
                          ▼
┌──────────────┐ 1:N   ┌───────────────────────┐
│     Case     ├───────►│  ConsultationRequest  │
└───┬──────────┘       └───────────────────────┘
    │ 1:N
    ▼
┌──────────────┐ 1:N   ┌───────────────────────┐
│   Document   ├───────►│     DocumentChunk     │ (Vector / Text Retrieval)
└──────────────┘       └───────────────────────┘
```

---

## 2. Model Schemas

### `User` Collection
Stores authentication, role-based authorization, and location preferences:
- `_id`: String (UUID or deterministic ID)
- `fullName`: String (Required)
- `email`: String (Unique, Indexed)
- `phone`: String
- `role`: Enum (`'citizen'` | `'advocate'` | `'admin'`)
- `passwordHash`: String (Bcrypt salt rounds 10)
- `status`: Enum (`'ACTIVE'` | `'SUSPENDED'`)
- `state`: String (Default: `'Tamil Nadu'`)
- `district`: String (e.g. `'Madurai'`)
- `city`: String (e.g. `'Madurai'`)
- `pincode`: String
- `preferredLanguage`: Enum (`'English'` | `'Tamil'` | `'Hindi'`)
- `preferredConsultationMode`: Enum (`'In-Person'` | `'Video Call'` | `'Phone'`)
- `legalInterests`: Array of Strings
- `createdAt`, `updatedAt`: ISO Timestamps

### `AdvocateProfile` Collection
Stores professional profiles for advocate discovery and ranking:
- `_id`: String
- `userId`: String (References `User._id`)
- `fullName`: String
- `email`: String
- `phone`: String
- `barCouncilNumber`: String
- `barCouncilNumberMasked`: String (e.g. `'TN/****/1001'`)
- `state`: String
- `district`: String (Tamil Nadu district)
- `city`: String (Town within district)
- `practiceAreas`: Array of Strings (e.g. `['Property', 'Civil']`)
- `yearsOfExperience`: Number
- `languages`: Array of Strings
- `courts`: Array of Strings (e.g. `['Madurai Bench of Madras High Court']`)
- `consultationModes`: Array of Strings
- `feeRange`: String (e.g. `'₹1,000 / Session'` or `'Free Legal Aid / Pro Bono'`)
- `availability`: Boolean
- `availabilityStatus`: String (e.g. `'Available Today'`)
- `rating`: Number (Float 1.0 - 5.0)
- `reviewCount`: Number
- `bio`: String
- `verificationStatus`: Enum (`'VERIFIED'` | `'PENDING'` | `'REJECTED'`)
- `isDemo`: Boolean

### `Case` Collection
Represents a legal matter or dispute dossier:
- `_id`: String
- `caseId`: String (Unique formatted code e.g. `'NJ-2026-MD-001042'`)
- `citizenId`: String (References `User._id`, Indexed)
- `advocateId`: Optional String (References `AdvocateProfile._id`)
- `title`: String
- `category`: String (e.g. `'Property'`, `'Civil'`, `'Family'`)
- `description`: String
- `state`, `district`, `city`: Strings
- `parties`: Array of `{ name: string, role: string }`
- `courtOrAuthority`: String
- `relevantDates`: Array of `{ label: string, date: string }`
- `status`: Enum (`'DRAFT'` | `'SUBMITTED'` | `'PROCEEDING'` | `'REVIEW'` | `'CLOSED'`)
- `urgency`: Enum (`'LOW'` | `'NORMAL'` | `'HIGH'` | `'URGENT'`)
- `documents`: Array of Document IDs
- `extractedFactsSummary`: String (Populated when user reviews and approves extracted facts)
- `referencedSections`: Array of Strings
- `potentialMissingInfo`: Array of Strings

### `Document` Collection
Represents uploaded legal files and their extraction pipeline states:
- `_id`: String
- `ownerId`: String (Strict account scoping, Indexed)
- `caseId`: String (References `Case._id`, Indexed)
- `documentName`: String (Original filename)
- `fileName`: String (Sanitized server filename)
- `mimeType`: String (`'application/pdf'`, `'text/plain'`, etc.)
- `size`: Number (Bytes)
- `storagePath`: String (Local path in `uploads/`)
- `status`: Enum (`'uploaded'` | `'extracting'` | `'awaiting_review'` | `'indexing'` | `'indexed'` | `'failed'`)
- `extractedText`: String (Full recovered text)
- `pageCount`: Number
- `chunkCount`: Number
- `extractedFacts`: Structured object containing:
  - `documentType`: String
  - `parties`: Array of `{ name, role }`
  - `dates`: Array of `{ label, date }`
  - `courtOrAuthority`: String
  - `subjectMatter`: String
  - `claimsOrDemands`: Array of Strings
  - `referencedSections`: Array of Strings
  - `potentialMissingInfo`: Array of Strings
- `factsReviewed`: Boolean (Set to true when citizen applies facts to Case)

### `DocumentChunk` Collection
Fine-grained vector and text chunks for RAG retrieval:
- `_id`: String
- `ownerId`: String (Strict user isolation, never exposed cross-account)
- `caseId`: String
- `documentId`: String
- `title`: String
- `pageNumber`: Number (Preserved from source PDF/DOCX)
- `chunkIndex`: Number
- `text`: String (~500 characters)
- `embedding`: Optional Array of Numbers
- `keywords`: Array of Strings

### `ConsultationRequest` Collection
Manages citizen-to-advocate consultation workflow:
- `_id`: String
- `citizenId`: String (References `User._id`)
- `advocateId`: String (References `AdvocateProfile._id`)
- `caseId`: Optional String
- `caseTitle`: Optional String
- `message`: String
- `mode`: Enum (`'IN_PERSON'` | `'VIDEO'` | `'PHONE'`)
- `preferredDate`: String
- `status`: Enum (`'PENDING'` | `'ACCEPTED'` | `'REJECTED'` | `'CANCELLED'` | `'COMPLETED'`)
- `responseNote`: String (Advocate's chamber instructions)

### `Notification` Collection
Stores in-app alerts for consultation status updates and document indexing completion.
