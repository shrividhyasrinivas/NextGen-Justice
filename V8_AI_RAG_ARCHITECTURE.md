# NextGen Justice V8 - AI & Grounded Document RAG Architecture

## 1. Executive Architectural Overview

NextGen Justice V8 incorporates a dual-mode, grounded legal intelligence architecture specifically tailored for the Indian judicial ecosystem. The platform enforces strict grounding, verifiable source citations, multi-tenant owner isolation, and dual-provider resiliency (Google Gemini 3.8 Flash when configured, and deterministic grounded synthesis when running offline or without credentials).

```
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                            CITIZEN / ADVOCATE CLIENT                             │
 └────────────────────────┬───────────────────────────────────┬─────────────────────┘
                          │ Mode A: General Legal             │ Mode B: Document RAG
                          ▼                                   ▼
 ┌───────────────────────────────────────────────────┐   ┌──────────────────────────┐
 │       Mode A: Statutory General Assistant         │   │   Mode B: Case RAG       │
 │   - Constitution, CPC, CrPC/BNSS, BNS, NALSA      │   │   - Owner Isolation      │
 │   - Institutional Legal Information (EN/TA/HI)    │   │   - Case & Doc Filtering │
 └────────────────────────┬──────────────────────────┘   └────────────┬─────────────┘
                          │                                           │
                          │   ┌───────────────────────────────────────┘
                          ▼   ▼
 ┌──────────────────────────────────────────────────────────────────────────────────┐
 │                           RETRIEVAL & AI INFERENCE LAYER                         │
 │                                                                                  │
 │   1. Token-level TF-IDF Cosine Retrieval + Exact Phrase Weighting                │
 │   2. Grounded Excerpt Extraction with Page & Chunk Provenance                   │
 │   3. Multi-turn Generative Synthesis (Gemini 3.8 Flash via @google/genai)        │
 │   4. Verified Deterministic Fallback with Direct Evidence Excerpts               │
 └──────────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Ingestion & Document Processing Pipeline

The ingestion pipeline handles heterogeneous Indian legal filings, affidavits, petitions, and notices across standard document formats:

```
[ Uploaded File (PDF, DOCX, TXT) ]
                │
                ▼
  [ Format-Specific Extraction ]
        ├── application/pdf: pdf-parse v2 + raw stream fallback
        ├── application/vnd.openxmlformats-officedocument.wordprocessingml.document: mammoth
        └── text/plain: utf-8 stream normalization
                │
                ▼
  [ Text Preprocessing & Cleaning ]
        ├── Excess whitespace & line break normalization
        ├── Page break detection and tagging
        └── Special legal character preservation (₹, Section symbols, etc.)
                │
                ▼
  [ Overlapping Chunking Engine ]
        ├── Chunk Size: 500 characters
        ├── Overlap: 100 characters
        └── Metadata: ownerId, caseId, documentId, title, pageNumber, chunkIndex
                │
                ▼
  [ Database Chunk Indexing ]
        └── Stored in persistent `chunks` collection (Mongoose / JSON Storage)
```

### Supported Formats & Extraction Mechanisms
1. **Portable Document Format (`.pdf`):** Processed via `pdf-parse` v2 class-based interface. In the event of malformed PDF trailers or non-standard encodings, a stream-level text extraction recovery engine parses `BT...ET` (Begin Text / End Text) blocks directly from the binary buffer to prevent upload rejection.
2. **Microsoft Word (`.docx`):** Extracted using `mammoth` raw text engine to extract structured paragraphs while eliminating proprietary Word metadata and binary styling.
3. **Plain Text (`.txt`):** Ingested via direct UTF-8 decoding with character normalization.

---

## 3. Sliding-Window Text Chunking

Documents are partitioned into continuous overlapping segments to preserve cross-sentence legal context (such as demand amounts occurring across paragraph boundaries):

* **Target Chunk Size:** 500 characters (~80–110 words).
* **Chunk Overlap:** 100 characters (~15–20 words).
* **Boundary Intelligence:** Chunker searches backward from the 500-character limit to the nearest sentence terminator (`.`, `?`, `!`, or newline `\n`) to avoid breaking legal citations or monetary figures mid-word.
* **Persistent Provenance:** Every chunk is assigned an immutable composite ID (`chk_[docId]_[index]`) and carries:
  * `ownerId`: Enforces strict tenant separation.
  * `caseId`: Scopes queries to specific legal disputes.
  * `documentId`: Associates text with the physical file.
  * `pageNumber`: Calculates physical page reference for legal briefs.

---

## 4. Structured Legal Fact Extraction

Beyond free-text chunking, uploaded documents undergo automated heuristic analysis to extract structured metadata before case synthesis:

```typescript
export interface ExtractedFacts {
  documentType?: string;       // e.g., "Statutory Legal Notice under Section 106 T.P. Act"
  parties?: string[];          // Extracted Petitioner/Plaintiff, Respondent/Defendant
  dates?: string[];            // Issuance dates, expiry dates, deadline dates
  courtOrAuthority?: string;   // e.g., "District Court, Madurai", "High Court of Madras"
  claimsOrDemands?: string[];  // e.g., "Arrears of rent ₹1,40,000", "Handover vacant possession"
  statutorySections?: string[];// e.g., "Section 106 Transfer of Property Act", "Section 138 NI Act"
  summary?: string;            // 2-3 sentence executive synopsis
  confidenceScore: number;     // 0.0 - 1.0 confidence rating
}
```

### Fact Review & Authoritative Merge
To prevent AI hallucinations from polluting official case dossiers, NextGen Justice V8 implements a **Citizen Fact Approval Workflow**:
1. Documents are uploaded and structured facts are extracted into draft staging.
2. The citizen or advocate inspects extracted facts in the Document Review Panel.
3. Upon clicking **"Approve & Merge into Case"**, the verified facts are committed to the case's authoritative dossier (`extractedFactsSummary`), making them immediately available for advocate consultation briefs.

---

## 5. Dual-Mode Assistant Architecture

### Mode A: Statutory General Legal Information
* **Objective:** Educate citizens on Indian procedural law, constitutional rights, and fundamental legal processes before court appearances.
* **Scope:**
  * Civil vs. Criminal legal distinctions (CPC vs. CrPC/BNS).
  * Filing First Information Reports (FIR) under Section 154 CrPC / 173 BNSS.
  * Free legal aid rights under Article 39A and NALSA Act, 1987.
  * Difference between Advocates, Lawyers, and Judicial Officers.
  * Adjournment rules under Order XVII Rule 1 CPC.
  * Purpose and responses to Court Summons under Order V CPC.
  * Checklist of documents required before consulting an advocate.
* **Language Support:** English, Tamil (தமிழ்), and Hindi (हिन्दी).
* **Safety Disclaimer:** Every Mode A response concludes with statutory institutional notices clarifying that information does not constitute formal advocate representation.

### Mode B: Grounded Private Document RAG
* **Objective:** Enable citizens and legal counsel to query case files, extract specific clauses, verify compliance dates, and cross-reference monetary claims.
* **Multi-Tenant Isolation:**
  Queries strictly filter by the authenticated user's `ownerId` and optionally by `caseId` and `documentId`. Citizens can never query or access chunks belonging to another user.
* **Retrieval Pipeline:**
  1. **Query Tokenization:** Terms filtered for legal stop words while preserving section numbers, dates, and currency values.
  2. **TF-IDF & Phrase Scoring:** Chunks scored based on term frequency normalized against document length, with a 2.0x boost for exact multi-word phrase matches.
  3. **Candidate Filtering:** Chunks with relevance score $< 0.05$ are pruned. Top 5 candidates selected.
  4. **Low-Evidence Gate:** If zero candidates meet the threshold, the system immediately returns an explicit negative response:
     > *"The indexed documents for this case do not provide sufficient relevant evidence to answer: '[Query]'. The documents do not contain information related to this inquiry."*
     This eliminates speculative hallucination.
  5. **Generative Synthesis:** When candidates exist, excerpts are assembled with `[Source X] (Filename, Page Y)` identifiers and dispatched to Gemini 3.8 Flash with temperature 0.1 and strict grounding instructions.
  6. **Expandable Evidence UI:** In the frontend, each cited source is rendered with an interactive inspector showing document title, page number, and exact text excerpt.

---

## 6. Provider Resiliency & Zero-Crash Fallbacks

To ensure high availability in production, offline field environments, and air-gapped court complexes:

| Operating State | Primary Engine | Fallback Behavior |
| :--- | :--- | :--- |
| **Google Gemini Key Configured** | Gemini 3.8 Flash (`@google/genai`) with 2500ms timeout race | If network times out or fails, gracefully drops to Deterministic Grounded Synthesis without error |
| **No API Key / Offline Mode** | Deterministic Grounded Synthesis Engine | Generates structured answers directly from top-ranked source excerpts, highlighting exact matches and citations |
| **Invalid / Expired Key** | Deterministic Knowledge Base | Catches API errors, logs actionable diagnostic messages to server console, and serves verified answers |

---

## 7. Security, Privacy & Compliance

1. **Local File Storage:** Uploaded files reside in the secure `/uploads/` directory on the server with sanitized filenames (`crypto.randomUUID() + extension`).
2. **Tokenized Authorization:** All document upload, deletion, extraction, and RAG endpoints require a valid JWT Bearer token in the `Authorization` header.
3. **Strict Owner Boundaries:** Storage query operators explicitly include `{ ownerId: req.user.id }` across all database lookups.
4. **Data Minimization:** Chunks store only normalized text segments necessary for vector/lexical retrieval; raw binary files are never passed to external third parties.
