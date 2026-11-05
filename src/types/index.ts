export type UserRole = 'citizen' | 'advocate' | 'admin';

export interface User {
  id: string;
  fullName: string;
  email: string;
  role: UserRole;
  phone?: string;
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  preferredLanguage?: string;
  preferredConsultationMode?: string;
  legalInterests?: string[];
  communicationPrefs?: string[];
}

export interface Advocate {
  _id: string;
  userId: string;
  fullName: string;
  email: string;
  phone?: string;
  barCouncilNumber: string;
  barCouncilNumberMasked: string;
  state: string;
  district: string;
  city: string;
  locality?: string;
  practiceAreas: string[];
  yearsOfExperience: number;
  languages: string[];
  courts: string[];
  consultationModes: string[];
  feeRange: string;
  availability: boolean;
  availabilityStatus: string;
  rating: number;
  reviewCount: number;
  bio: string;
  verificationStatus: 'VERIFIED' | 'PENDING' | 'REJECTED';
  isDemo: boolean;
  matchScore?: number;
  matchExplanation?: {
    practiceAreaMatch: string;
    locationMatch: string;
    languageMatch: string;
    modeMatch: string;
    experienceBonus: string;
    summary: string;
  };
}

export type CaseStatus = 'DRAFT' | 'SUBMITTED' | 'PROCEEDING' | 'REVIEW' | 'CLOSED';
export type CaseUrgency = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export interface CaseParty {
  name: string;
  role: string;
  contact?: string;
}

export interface CaseDate {
  label: string;
  date: string;
}

export interface CaseRecord {
  _id: string;
  caseId: string;
  citizenId: string;
  advocateId?: string;
  title: string;
  category: string;
  description: string;
  state: string;
  district: string;
  city: string;
  parties?: CaseParty[];
  courtOrAuthority?: string;
  relevantDates?: CaseDate[];
  status: CaseStatus;
  urgency: CaseUrgency;
  documents: string[];
  extractedFactsSummary?: string;
  referencedSections?: string[];
  potentialMissingInfo?: string[];
  documentDetails?: DocumentRecord[];
  createdAt: string;
  updatedAt: string;
}

export type DocumentStatus = 'uploaded' | 'extracting' | 'awaiting_review' | 'indexing' | 'indexed' | 'failed';

export interface ExtractedFacts {
  documentType?: string;
  parties?: { name: string; role: string }[];
  dates?: { label: string; date: string }[];
  courtOrAuthority?: string;
  subjectMatter?: string;
  claimsOrDemands?: string[];
  referencedSections?: string[];
  potentialMissingInfo?: string[];
}

export interface DocumentRecord {
  _id: string;
  ownerId: string;
  caseId: string;
  documentName: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: DocumentStatus;
  extractedText?: string;
  pageCount?: number;
  chunkCount?: number;
  extractedFacts?: ExtractedFacts;
  factsReviewed?: boolean;
  indexingError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GroundedSource {
  sourceId: string;
  documentId: string;
  caseId: string;
  title: string;
  pageNumber: number;
  chunkIndex: number;
  excerpt: string;
  score: number;
}

export interface AssistantAnswer {
  answer: string;
  sources: GroundedSource[];
  provider: 'gemini-3.8-flash' | 'external_llm' | 'deterministic_rag';
  providerConfigured: boolean;
  mode: 'general' | 'document_rag';
  hasSufficientEvidence: boolean;
  statutoryReferences?: string[];
}

export interface ConsultationRequest {
  _id: string;
  citizenId: string;
  advocateId: string;
  caseId?: string;
  caseTitle?: string;
  citizenName?: string;
  citizenEmail?: string;
  citizenPhone?: string;
  advocateName?: string;
  message: string;
  mode: 'IN_PERSON' | 'VIDEO' | 'PHONE';
  preferredDate?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  responseNote?: string;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}
