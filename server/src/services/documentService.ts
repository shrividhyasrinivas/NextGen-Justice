import fs from 'node:fs';
import path from 'node:path';
import mammoth from 'mammoth';
import { db, DocumentDoc, DocumentChunkDoc } from '../db/storage.js';

// Text extraction helpers
export async function extractTextFromFile(filePath: string, mimeType: string, originalName: string): Promise<{ text: string; pages: { page: number; text: string }[] }> {
  const ext = path.extname(originalName).toLowerCase();
  const buffer = fs.readFileSync(filePath);

  // Plain Text
  if (ext === '.txt' || mimeType.includes('text/plain')) {
    const text = buffer.toString('utf-8');
    return {
      text,
      pages: [{ page: 1, text }],
    };
  }

  // Word Document (.docx)
  if (ext === '.docx' || mimeType.includes('officedocument.wordprocessingml')) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      const text = result.value || '';
      return {
        text,
        pages: [{ page: 1, text }],
      };
    } catch (err) {
      console.warn('[Doc Extraction] Mammoth DOCX parsing error, falling back to text stream:', err);
      const text = buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      return { text, pages: [{ page: 1, text }] };
    }
  }

  // PDF Document (.pdf)
  if (ext === '.pdf' || mimeType.includes('pdf')) {
    try {
      // Try pdf-parse v2 class or function
      const pdfModule: any = await import('pdf-parse');
      let extracted = '';

      if (typeof pdfModule.default === 'function') {
        const data = await pdfModule.default(buffer);
        extracted = data.text || '';
      } else if (pdfModule.PDFParse) {
        const parser = new pdfModule.PDFParse({ data: buffer });
        const res = await parser.getText();
        extracted = res.text || '';
      }

      if (extracted.trim().length > 10) {
        const rawPages = extracted.split(/\f|\n(?=Page\s+\d+)/i);
        const pages = rawPages.map((p, idx) => ({ page: idx + 1, text: p.trim() })).filter((p) => p.text.length > 0);
        return { text: extracted, pages: pages.length ? pages : [{ page: 1, text: extracted }] };
      }
    } catch (err) {
      console.warn('[Doc Extraction] pdf-parse error, falling back to stream text recovery:', err);
    }

    // Direct text stream recovery from PDF
    const raw = buffer.toString('latin1');
    const matches: string[] = [];
    const textRegex = /\(([^)]+)\)\s*Tj|\[([^\]]+)\]\s*TJ/g;
    let m;
    while ((m = textRegex.exec(raw)) !== null) {
      const captured = m[1] || m[2] || '';
      const cleaned = captured.replace(/\\([()\\])/g, '$1').replace(/\\[0-9]{3}/g, ' ');
      if (cleaned.trim()) matches.push(cleaned.trim());
    }

    const recovered = matches.length > 0 ? matches.join(' ') : buffer.toString('utf-8').replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    return {
      text: recovered,
      pages: [{ page: 1, text: recovered }],
    };
  }

  // Fallback for other files
  const plainText = buffer.toString('utf-8');
  return {
    text: plainText,
    pages: [{ page: 1, text: plainText }],
  };
}

// Chunker
export function chunkDocumentText(text: string, chunkSize = 500, overlap = 100): string[] {
  const normalized = text.replace(/\r\n/g, '\n').replace(/\s+/g, ' ').trim();
  if (normalized.length <= chunkSize) {
    return [normalized];
  }

  const chunks: string[] = [];
  let startIndex = 0;

  while (startIndex < normalized.length) {
    let endIndex = startIndex + chunkSize;
    if (endIndex < normalized.length) {
      // Seek back to space or punctuation
      const nextSpace = normalized.lastIndexOf(' ', endIndex);
      if (nextSpace > startIndex + 150) {
        endIndex = nextSpace;
      }
    } else {
      endIndex = normalized.length;
    }

    const chunk = normalized.substring(startIndex, endIndex).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }

    startIndex = endIndex - overlap;
    if (startIndex >= normalized.length - overlap) {
      break;
    }
  }

  return chunks;
}

// Structured Fact Extraction for Case Analysis
export function extractStructuredFacts(text: string, originalName: string): NonNullable<DocumentDoc['extractedFacts']> {
  const lower = text.toLowerCase();

  // Document Type
  let documentType = 'General Legal Document';
  if (lower.includes('section 106') || (lower.includes('tenancy') && lower.includes('notice'))) {
    documentType = 'Statutory Notice under Section 106 Transfer of Property Act';
  } else if (lower.includes('section 138') || lower.includes('cheque') || lower.includes('negotiable instruments')) {
    documentType = 'Statutory Cheque Dishonour Notice (Sec 138 NI Act)';
  } else if (lower.includes('lease agreement') || lower.includes('rental agreement')) {
    documentType = 'Commercial Lease / Rental Agreement';
  } else if (lower.includes('partition deed') || lower.includes('family settlement')) {
    documentType = 'Family Property Partition / Settlement Deed';
  } else if (lower.includes('sale deed') || lower.includes('conveyance')) {
    documentType = 'Registered Sale Deed / Title Conveyance';
  } else if (lower.includes('complaint') && lower.includes('police')) {
    documentType = 'Police Complaint / Information of Offence';
  } else if (lower.includes('summons') || lower.includes('writ')) {
    documentType = 'Judicial Summons / Court Notice';
  }

  // Parties
  const parties: { name: string; role: string }[] = [];
  const toMatch = text.match(/TO:\s*([^\n\r]+)/i);
  if (toMatch && toMatch[1]) {
    parties.push({ name: toMatch[1].trim().replace(/^m\/s\s*/i, ''), role: 'Respondent / Recipient' });
  }

  const fromMatch = text.match(/FROM:\s*([^\n\r]+)/i);
  if (fromMatch && fromMatch[1]) {
    parties.push({ name: fromMatch[1].trim(), role: 'Sender / Complainant' });
  }

  const compMatch = text.match(/Complainant:\s*([^\n\r,]+)/i);
  if (compMatch && compMatch[1]) {
    parties.push({ name: compMatch[1].trim(), role: 'Complainant' });
  }

  const accMatch = text.match(/Accused:\s*([^\n\r,]+)/i);
  if (accMatch && accMatch[1]) {
    parties.push({ name: accMatch[1].trim(), role: 'Accused' });
  }

  // If no parties found yet, look for common patterns
  if (parties.length === 0) {
    const landlordMatch = text.match(/(?:landlord|owner)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (landlordMatch) parties.push({ name: landlordMatch[1], role: 'Landlord' });
    const tenantMatch = text.match(/(?:tenant|occupant)\s*[:\-]?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/);
    if (tenantMatch) parties.push({ name: tenantMatch[1], role: 'Tenant' });
  }

  // Dates
  const dates: { label: string; date: string }[] = [];
  const dateRegex = /\b(\d{1,2}(?:st|nd|rd|th)?\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}|\d{4}-\d{2}-\d{2}|\d{1,2}\/\d{1,2}\/\d{4})\b/gi;
  const foundDates = text.match(dateRegex);
  if (foundDates) {
    const uniqueDates = Array.from(new Set(foundDates));
    uniqueDates.slice(0, 4).forEach((d, idx) => {
      const label = idx === 0 ? 'Document / Notice Date' : idx === 1 ? 'Effective / Deadline Date' : `Relevant Milestone ${idx}`;
      dates.push({ label, date: d });
    });
  }

  // Court or Authority
  let courtOrAuthority = 'Competent Judicial Forum';
  if (text.includes('Madurai Bench') || text.includes('Madras High Court')) {
    courtOrAuthority = 'Madurai Bench of the Madras High Court';
  } else if (text.includes('High Court of Judicature at Madras') || text.includes('Madras High Court')) {
    courtOrAuthority = 'Madras High Court (Principal Seat, Chennai)';
  } else if (text.includes('Rent Tribunal') || text.includes('Rent Court')) {
    courtOrAuthority = 'Rent Tribunal / Rent Court';
  } else if (text.includes('Consumer') && (text.includes('Commission') || text.includes('Forum'))) {
    courtOrAuthority = 'District Consumer Disputes Redressal Commission';
  } else if (text.includes('Judicial Magistrate')) {
    courtOrAuthority = 'Court of the Judicial Magistrate';
  } else if (text.includes('Civil Court') || text.includes('District Court')) {
    courtOrAuthority = 'District & Sessions Court';
  }

  // Subject Matter
  let subjectMatter = `Document analysis for ${originalName}`;
  const subjMatch = text.match(/SUBJECT:\s*([^\n\r]+)/i);
  if (subjMatch && subjMatch[1]) {
    subjectMatter = subjMatch[1].trim();
  } else if (lower.includes('tenancy') || lower.includes('arrears')) {
    subjectMatter = 'Tenancy termination and recovery of rental arrears';
  } else if (lower.includes('cheque') && lower.includes('dishonour')) {
    subjectMatter = 'Statutory notice for dishonour of cheque for insufficient funds';
  }

  // Claims or Demands
  const claimsOrDemands: string[] = [];
  const amounts = text.match(/(?:Rs\.?|INR|₹)\s*[\d,]+(?:\/\-)?/gi);
  if (amounts) {
    Array.from(new Set(amounts)).slice(0, 3).forEach((amt) => {
      claimsOrDemands.push(`Monetary claim / arrears specified: ${amt}`);
    });
  }
  if (lower.includes('vacant possession')) {
    claimsOrDemands.push('Demand for handover of peaceful and vacant possession');
  }
  if (lower.includes('interest')) {
    claimsOrDemands.push('Demand for interest on defaulted amount (typically 12% to 18% p.a.)');
  }

  // Referenced Sections
  const referencedSections: string[] = [];
  const sectionMatches = text.match(/Section\s+\d+[A-Z]?(?:\s+of\s+the\s+[A-Za-z\s,]+(?:Act|Code)[\s\d]*)?/gi);
  if (sectionMatches) {
    Array.from(new Set(sectionMatches)).slice(0, 5).forEach((sec) => referencedSections.push(sec.trim()));
  }

  // Potential Missing Information
  const potentialMissingInfo: string[] = [];
  if (!text.includes('acknowledgement') && !text.includes('speed post')) {
    potentialMissingInfo.push('Postal acknowledgement card / delivery proof receipt is not attached in the record.');
  }
  if (parties.length < 2) {
    potentialMissingInfo.push('Counterparty full legal identity or representative designation is partially unspecified.');
  }
  if (dates.length < 2) {
    potentialMissingInfo.push('Specific compliance or expiry deadline date requires clarification.');
  }

  return {
    documentType,
    parties: parties.length ? parties : [{ name: 'Parties identified in record', role: 'Signatory' }],
    dates: dates.length ? dates : [{ label: 'Recorded Date', date: new Date().toISOString().split('T')[0] }],
    courtOrAuthority,
    subjectMatter,
    claimsOrDemands: claimsOrDemands.length ? claimsOrDemands : ['Statutory notice compliance demand'],
    referencedSections: referencedSections.length ? referencedSections : ['Relevant statutory provisions of Indian Law'],
    potentialMissingInfo: potentialMissingInfo.length ? potentialMissingInfo : ['Verify original signed copy and postal postal receipt.'],
  };
}

// Complete Process Pipeline
export async function processUploadedDocument(docId: string): Promise<DocumentDoc | null> {
  const doc = db.documents.findById(docId);
  if (!doc) return null;

  try {
    // 1. Update status to extracting
    db.documents.update(docId, { status: 'extracting' });

    // 2. Extract text
    const { text, pages } = await extractTextFromFile(doc.storagePath, doc.mimeType, doc.documentName);

    if (!text.trim()) {
      db.documents.update(docId, {
        status: 'failed',
        indexingError: 'No readable text could be extracted from this document. Scanned image PDFs require high-resolution OCR.',
      });
      return db.documents.findById(docId);
    }

    // 3. Extract structured facts for Case Analysis
    const extractedFacts = extractStructuredFacts(text, doc.documentName);

    // 4. Update status to awaiting_review
    db.documents.update(docId, {
      extractedText: text,
      pageCount: pages.length,
      extractedFacts,
      status: 'awaiting_review',
    });

    // 5. Chunk and index text
    const chunks: DocumentChunkDoc[] = [];
    let chunkIndex = 0;

    for (const page of pages) {
      const pageChunks = chunkDocumentText(page.text, 500, 100);
      for (const chunkText of pageChunks) {
        const chunkId = `chk_${Date.now()}_${chunkIndex}`;
        const chunkDoc: DocumentChunkDoc = {
          _id: chunkId,
          ownerId: doc.ownerId,
          caseId: doc.caseId,
          documentId: doc._id,
          title: doc.documentName,
          pageNumber: page.page,
          chunkIndex,
          text: chunkText,
          keywords: chunkText.toLowerCase().split(/\s+/).slice(0, 10),
          createdAt: new Date().toISOString(),
        };
        db.chunks.create(chunkDoc);
        chunks.push(chunkDoc);
        chunkIndex++;
      }
    }

    // 6. Update document with chunk count and marked as indexed
    const updated = db.documents.update(docId, {
      chunkCount: chunks.length,
      status: 'indexed',
    });

    // 7. Update parent case documents array
    const parentCase = db.cases.findById(doc.caseId);
    if (parentCase && !parentCase.documents.includes(docId)) {
      db.cases.update(doc.caseId, {
        documents: [...parentCase.documents, docId],
      });
    }

    return updated;
  } catch (err: unknown) {
    console.error(`[Doc Processing] Error processing document ${docId}:`, err);
    db.documents.update(docId, {
      status: 'failed',
      indexingError: err instanceof Error ? err.message : 'Unknown processing error',
    });
    return db.documents.findById(docId);
  }
}

// Approve facts and apply to authoritative Case record
export function applyApprovedFactsToCase(docId: string, caseId: string, ownerId: string): { success: boolean; case?: any; error?: string } {
  const doc = db.documents.findById(docId);
  if (!doc) return { success: false, error: 'Document not found' };
  if (doc.ownerId !== ownerId) return { success: false, error: 'Unauthorized' };

  const c = db.cases.findById(caseId);
  if (!c) return { success: false, error: 'Case not found' };
  if (c.citizenId !== ownerId) return { success: false, error: 'Unauthorized case access' };

  const facts = doc.extractedFacts;
  if (!facts) return { success: false, error: 'No extracted facts found to apply' };

  const updatedCase = db.cases.update(caseId, {
    courtOrAuthority: facts.courtOrAuthority || c.courtOrAuthority,
    parties: facts.parties || c.parties,
    relevantDates: facts.dates || c.relevantDates,
    referencedSections: facts.referencedSections || c.referencedSections,
    extractedFactsSummary: `${facts.documentType}: ${facts.subjectMatter}. Demands: ${(facts.claimsOrDemands || []).join('; ')}`,
    potentialMissingInfo: facts.potentialMissingInfo || c.potentialMissingInfo,
  });

  db.documents.update(docId, { factsReviewed: true });

  return { success: true, case: updatedCase };
}
