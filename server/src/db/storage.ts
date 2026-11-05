import fs from 'node:fs';
import path from 'node:path';
import bcrypt from 'bcryptjs';
import { env } from '../config/env.js';

const DATA_DIR = path.resolve('data/db');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

export interface UserDoc {
  _id: string;
  fullName: string;
  email: string;
  phone?: string;
  role: 'citizen' | 'advocate' | 'admin';
  passwordHash: string;
  status: 'ACTIVE' | 'SUSPENDED';
  state?: string;
  district?: string;
  city?: string;
  pincode?: string;
  preferredLanguage?: string;
  preferredConsultationMode?: string;
  legalInterests?: string[];
  communicationPrefs?: string[];
  createdAt: string;
  updatedAt: string;
  isDemo?: boolean;
}

export interface AdvocateDoc {
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
  createdAt: string;
  updatedAt: string;
}

export interface CaseDoc {
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
  parties?: { name: string; role: string; contact?: string }[];
  courtOrAuthority?: string;
  relevantDates?: { label: string; date: string }[];
  status: 'DRAFT' | 'SUBMITTED' | 'PROCEEDING' | 'REVIEW' | 'CLOSED';
  urgency: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  documents: string[];
  extractedFactsSummary?: string;
  referencedSections?: string[];
  potentialMissingInfo?: string[];
  notes?: { authorId: string; text: string; date: string }[];
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentDoc {
  _id: string;
  ownerId: string;
  caseId: string;
  documentName: string;
  fileName: string;
  mimeType: string;
  size: number;
  storagePath: string;
  status: 'uploaded' | 'extracting' | 'awaiting_review' | 'indexing' | 'indexed' | 'failed';
  extractedText?: string;
  pageCount?: number;
  chunkCount?: number;
  extractedFacts?: {
    documentType?: string;
    parties?: { name: string; role: string }[];
    dates?: { label: string; date: string }[];
    courtOrAuthority?: string;
    subjectMatter?: string;
    claimsOrDemands?: string[];
    referencedSections?: string[];
    potentialMissingInfo?: string[];
  };
  factsReviewed?: boolean;
  indexingError?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentChunkDoc {
  _id: string;
  ownerId: string;
  caseId: string;
  documentId: string;
  title: string;
  pageNumber: number;
  chunkIndex: number;
  text: string;
  embedding?: number[];
  keywords?: string[];
  createdAt: string;
}

export interface ConsultationDoc {
  _id: string;
  citizenId: string;
  advocateId: string;
  caseId?: string;
  caseTitle?: string;
  message: string;
  mode: 'IN_PERSON' | 'VIDEO' | 'PHONE';
  preferredDate?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'CANCELLED' | 'COMPLETED';
  responseNote?: string;
  isDemo?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationDoc {
  _id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  read: boolean;
  link?: string;
  createdAt: string;
}

export interface AuditLogDoc {
  _id: string;
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  metadata?: Record<string, unknown>;
  timestamp: string;
}

class Collection<T extends { _id: string }> {
  private filePath: string;
  private items: Map<string, T> = new Map();

  constructor(public name: string) {
    this.filePath = path.join(DATA_DIR, `${name}.json`);
    this.load();
  }

  private load(): void {
    if (fs.existsSync(this.filePath)) {
      try {
        const raw = fs.readFileSync(this.filePath, 'utf-8');
        const list: T[] = JSON.parse(raw);
        for (const item of list) {
          this.items.set(item._id, item);
        }
      } catch (e) {
        console.error(`Error loading collection ${this.name}:`, e);
      }
    }
  }

  public save(): void {
    try {
      const list = Array.from(this.items.values());
      fs.writeFileSync(this.filePath, JSON.stringify(list, null, 2), 'utf-8');
    } catch (e) {
      console.error(`Error saving collection ${this.name}:`, e);
    }
  }

  public find(predicate?: (item: T) => boolean): T[] {
    const all = Array.from(this.items.values());
    if (!predicate) return all;
    return all.filter(predicate);
  }

  public findById(id: string): T | null {
    return this.items.get(id) || null;
  }

  public findOne(predicate: (item: T) => boolean): T | null {
    for (const item of this.items.values()) {
      if (predicate(item)) return item;
    }
    return null;
  }

  public create(item: T): T {
    this.items.set(item._id, item);
    this.save();
    return item;
  }

  public update(id: string, updates: Partial<T>): T | null {
    const existing = this.items.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...updates, updatedAt: new Date().toISOString() };
    this.items.set(id, updated);
    this.save();
    return updated;
  }

  public delete(id: string): boolean {
    const res = this.items.delete(id);
    if (res) this.save();
    return res;
  }

  public deleteMany(predicate: (item: T) => boolean): number {
    let count = 0;
    for (const [id, item] of this.items.entries()) {
      if (predicate(item)) {
        this.items.delete(id);
        count++;
      }
    }
    if (count > 0) this.save();
    return count;
  }

  public count(predicate?: (item: T) => boolean): number {
    if (!predicate) return this.items.size;
    let c = 0;
    for (const item of this.items.values()) {
      if (predicate(item)) c++;
    }
    return c;
  }
}

export const db = {
  users: new Collection<UserDoc>('users'),
  advocates: new Collection<AdvocateDoc>('advocates'),
  cases: new Collection<CaseDoc>('cases'),
  documents: new Collection<DocumentDoc>('documents'),
  chunks: new Collection<DocumentChunkDoc>('chunks'),
  consultations: new Collection<ConsultationDoc>('consultations'),
  notifications: new Collection<NotificationDoc>('notifications'),
  audit: new Collection<AuditLogDoc>('audit_logs'),
};

export async function initializeDatabase(): Promise<void> {
  console.log('[Database] Initializing data store...');
  await seedDemoData();
  console.log(`[Database] Ready. Total advocates: ${db.advocates.count()}, users: ${db.users.count()}, cases: ${db.cases.count()}`);
}

export async function seedDemoData(force = false): Promise<void> {
  if (force) {
    db.advocates.deleteMany(() => true);
    db.users.deleteMany((u) => u.isDemo === true);
    db.cases.deleteMany((c) => c.isDemo === true);
    db.documents.deleteMany(() => true);
    db.chunks.deleteMany(() => true);
    db.consultations.deleteMany((c) => c.isDemo === true);
  }

  console.log('[Seed] Populating demonstration records across Tamil Nadu...');
  const salt = await bcrypt.genSalt(10);
  const adminPass = await bcrypt.hash(env.SEED_ADMIN_PASSWORD, salt);
  const userPass = await bcrypt.hash('Demo@2026', salt);
  const now = new Date().toISOString();

  // Admin user
  if (!db.users.findOne((u) => u.email === env.SEED_ADMIN_EMAIL)) {
    db.users.create({
      _id: 'usr_admin_01',
      fullName: 'Institutional Legal Administrator',
      email: env.SEED_ADMIN_EMAIL,
      phone: '+91 94440 12345',
      role: 'admin',
      passwordHash: adminPass,
      status: 'ACTIVE',
      state: 'Tamil Nadu',
      district: 'Chennai',
      city: 'Chennai',
      preferredLanguage: 'English',
      createdAt: now,
      updatedAt: now,
      isDemo: true,
    });
  }

  // Demo Citizen
  let citizen1 = db.users.findOne((u) => u.email === 'citizen@example.com');
  if (!citizen1) {
    citizen1 = db.users.create({
      _id: 'usr_citizen_01',
      fullName: 'Sundaram Meenakshinathan',
      email: 'citizen@example.com',
      phone: '+91 98420 54321',
      role: 'citizen',
      passwordHash: userPass,
      status: 'ACTIVE',
      state: 'Tamil Nadu',
      district: 'Madurai',
      city: 'Madurai',
      pincode: '625001',
      preferredLanguage: 'English',
      preferredConsultationMode: 'In-Person',
      legalInterests: ['Property', 'Civil', 'Consumer'],
      communicationPrefs: ['Email', 'Portal Notifications'],
      createdAt: now,
      updatedAt: now,
      isDemo: true,
    });
  }

  // Demo Citizen 2 (Chennai)
  let citizen2 = db.users.findOne((u) => u.email === 'priya.k@example.com');
  if (!citizen2) {
    citizen2 = db.users.create({
      _id: 'usr_citizen_02',
      fullName: 'Priya Kalyanasundaram',
      email: 'priya.k@example.com',
      phone: '+91 97900 88221',
      role: 'citizen',
      passwordHash: userPass,
      status: 'ACTIVE',
      state: 'Tamil Nadu',
      district: 'Chennai',
      city: 'Chennai',
      pincode: '600018',
      preferredLanguage: 'Tamil',
      preferredConsultationMode: 'Video Call',
      legalInterests: ['Family', 'Cyber Crime', 'Labour'],
      createdAt: now,
      updatedAt: now,
      isDemo: true,
    });
  }

  // Seed 34 Realistic Fictional Advocates across Tamil Nadu districts
  const advocateSeeds = [
    {
      name: 'Adv. S. Muthukrishnan',
      district: 'Madurai',
      city: 'Madurai',
      practiceAreas: ['Property', 'Civil', 'Revenue Law'],
      exp: 18,
      languages: ['Tamil', 'English'],
      courts: ['Madurai Bench of Madras High Court', 'District Court, Madurai'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,000 / Session (Legal Aid Subsidized)',
      rating: 4.9,
      reviews: 42,
      bio: 'Senior practitioner with 18 years at the Madurai Bench specializing in agricultural land partitions, tenant eviction disputes, and civil title declaration suits.',
    },
    {
      name: 'Adv. Meenakshi Sundararajan',
      district: 'Madurai',
      city: 'Madurai',
      practiceAreas: ['Family', 'Matrimonial', 'Domestic Violence'],
      exp: 14,
      languages: ['Tamil', 'English', 'Hindi'],
      courts: ['Family Court Madurai', 'High Court Madurai Bench'],
      modes: ['In-Person', 'Video Call', 'Phone'],
      fee: 'Free Legal Aid / Pro Bono (NALSA Enpaneled)',
      rating: 4.8,
      reviews: 38,
      bio: 'Certified mediation counsel focusing on family reconciliation, maintenance petitions under Sec 125 CrPC, and child custody arrangements.',
    },
    {
      name: 'Adv. K. Ramanathan',
      district: 'Madurai',
      city: 'Madurai',
      practiceAreas: ['Commercial', 'Negotiable Instruments', 'Consumer'],
      exp: 12,
      languages: ['Tamil', 'English'],
      courts: ['Commercial Court Madurai', 'District Consumer Commission'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹800 / Session',
      rating: 4.7,
      reviews: 29,
      bio: 'Experienced litigator in Section 138 NI Act cheque dishonour cases, consumer grievance advocacy, and commercial contract drafting.',
    },
    {
      name: 'Adv. R. Venkatesh Prasanna',
      district: 'Chennai',
      city: 'Chennai',
      practiceAreas: ['Constitutional', 'Civil Writ', 'Property'],
      exp: 22,
      languages: ['English', 'Tamil'],
      courts: ['Madras High Court (Principal Seat)', 'City Civil Court Chennai'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,500 / Session',
      rating: 4.9,
      reviews: 64,
      bio: 'Senior High Court advocate handling writ petitions under Article 226, municipal land disputes, and high-value inheritance settlements.',
    },
    {
      name: 'Adv. Shalini Annamalai',
      district: 'Chennai',
      city: 'Chennai',
      practiceAreas: ['Cyber Crime', 'Intellectual Property', 'Consumer'],
      exp: 9,
      languages: ['English', 'Tamil', 'Hindi'],
      courts: ['Madras High Court', 'Chief Metropolitan Magistrate Court Egmore'],
      modes: ['Video Call', 'Phone'],
      fee: '₹1,000 / Session',
      rating: 4.8,
      reviews: 31,
      bio: 'Technology law specialist assisting citizens in financial phishing frauds, identity theft complaints under IT Act 2000, and e-commerce consumer claims.',
    },
    {
      name: 'Adv. N. Chandrasekar',
      district: 'Chennai',
      city: 'Chennai',
      practiceAreas: ['Labour', 'Employment', 'Service Law'],
      exp: 16,
      languages: ['Tamil', 'English'],
      courts: ['Industrial Tribunal Chennai', 'High Court of Madras'],
      modes: ['In-Person', 'Phone'],
      fee: '₹750 / Session',
      rating: 4.6,
      reviews: 24,
      bio: 'Specialist in gratuity disputes, wrongful termination appeals, and industrial employment standing orders compliance.',
    },
    {
      name: 'Adv. V. Balasubramanian',
      district: 'Coimbatore',
      city: 'Coimbatore',
      practiceAreas: ['Corporate', 'Commercial', 'Arbitration'],
      exp: 19,
      languages: ['Tamil', 'English'],
      courts: ['Coimbatore District Court', 'Madras High Court'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,200 / Session',
      rating: 4.9,
      reviews: 45,
      bio: 'Industrial and commercial advocate representing MSMEs in textile machinery lease disputes, arbitration, and supplier recovery.',
    },
    {
      name: 'Adv. Deepa Soundararajan',
      district: 'Coimbatore',
      city: 'Coimbatore',
      practiceAreas: ['Family', 'Women Rights', 'Consumer'],
      exp: 11,
      languages: ['Tamil', 'English'],
      courts: ['Combined Court Complex Coimbatore'],
      modes: ['In-Person', 'Video Call', 'Phone'],
      fee: 'Free Legal Aid / Pro Bono (DLSA Coimbatore)',
      rating: 4.7,
      reviews: 33,
      bio: 'Pro bono advocate enpaneled with District Legal Services Authority Coimbatore, assisting marginalized families and consumer victims.',
    },
    {
      name: 'Adv. A. Ganesan',
      district: 'Tiruchirappalli',
      city: 'Tiruchirappalli',
      practiceAreas: ['Property', 'Land Acquisition', 'Civil'],
      exp: 20,
      languages: ['Tamil', 'English'],
      courts: ['District & Sessions Court Tiruchirappalli'],
      modes: ['In-Person', 'Phone'],
      fee: '₹600 / Session',
      rating: 4.8,
      reviews: 39,
      bio: 'Two decades of practice in Trichy handling Cauvery delta riverbank agricultural title disputes, easement rights, and compensation claims.',
    },
    {
      name: 'Adv. Malathi Selvam',
      district: 'Tiruchirappalli',
      city: 'Tiruchirappalli',
      practiceAreas: ['Family', 'Domestic Relations', 'Cyber Crime'],
      exp: 8,
      languages: ['Tamil', 'English'],
      courts: ['District Court Trichy'],
      modes: ['Video Call', 'In-Person'],
      fee: '₹500 / Session',
      rating: 4.6,
      reviews: 21,
      bio: 'Compassionate advocate dedicated to matrimonial conciliation, digital harassment FIR drafting, and Lok Adalat pre-litigation settlements.',
    },
    {
      name: 'Adv. C. Shanmugasundaram',
      district: 'Salem',
      city: 'Salem',
      practiceAreas: ['Motor Accident Claims', 'Insurance', 'Civil'],
      exp: 15,
      languages: ['Tamil', 'English'],
      courts: ['MACT Salem', 'District Court Salem'],
      modes: ['In-Person', 'Phone'],
      fee: '₹700 / Session',
      rating: 4.7,
      reviews: 36,
      bio: 'Expert in Motor Accidents Claims Tribunal (MACT) petitions, third-party insurance claims, and accidental permanent disability compensation.',
    },
    {
      name: 'Adv. Rajeshwari Natarajan',
      district: 'Salem',
      city: 'Salem',
      practiceAreas: ['Banking', 'Debt Recovery', 'Consumer'],
      exp: 13,
      languages: ['Tamil', 'English'],
      courts: ['Salem Commercial Court', 'DRT Madurai'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹900 / Session',
      rating: 4.8,
      reviews: 27,
      bio: 'Advises borrowers and small business owners on SARFAESI Act notices, banking ombudsman complaints, and loan restructuring.',
    },
    {
      name: 'Adv. P. Nellaiyappan',
      district: 'Tirunelveli',
      city: 'Tirunelveli',
      practiceAreas: ['Criminal', 'Bail Matters', 'Human Rights'],
      exp: 17,
      languages: ['Tamil', 'English'],
      courts: ['Principal District & Sessions Court Tirunelveli'],
      modes: ['In-Person', 'Phone'],
      fee: '₹1,000 / Session',
      rating: 4.8,
      reviews: 41,
      bio: 'Trial lawyer specializing in regular bail, anticipatory bail under Sec 438 CrPC, and criminal trial defense in IPC / BNS matters.',
    },
    {
      name: 'Adv. K. Subbulakshmi',
      district: 'Tirunelveli',
      city: 'Tirunelveli',
      practiceAreas: ['Civil', 'Family', 'Property'],
      exp: 10,
      languages: ['Tamil', 'English'],
      courts: ['Sub-Court Tirunelveli', 'High Court Madurai Bench'],
      modes: ['In-Person', 'Video Call'],
      fee: 'Free Legal Aid / Pro Bono (DLSA Tirunelveli)',
      rating: 4.7,
      reviews: 22,
      bio: 'Handles partition suits, women ancestral property rights under Hindu Succession (Amendment) Act, and village revenue appeals.',
    },
    {
      name: 'Adv. M. Marimuthu',
      district: 'Virudhunagar',
      city: 'Sivakasi',
      practiceAreas: ['Labour', 'Industrial Safety', 'Commercial'],
      exp: 16,
      languages: ['Tamil', 'English'],
      courts: ['District Court Virudhunagar at Srivilliputtur', 'Labour Court Madurai'],
      modes: ['In-Person', 'Phone'],
      fee: '₹600 / Session',
      rating: 4.7,
      reviews: 29,
      bio: 'Industrial safety compliance counsel for printing and fireworks establishments; handles employee state insurance and workmen compensation.',
    },
    {
      name: 'Adv. S. Vijayalakshmi',
      district: 'Virudhunagar',
      city: 'Virudhunagar',
      practiceAreas: ['Property', 'Consumer', 'Negotiable Instruments'],
      exp: 9,
      languages: ['Tamil', 'English'],
      courts: ['Judicial Magistrate Court Virudhunagar'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹500 / Session',
      rating: 4.6,
      reviews: 18,
      bio: 'Focused on local merchant disputes, Section 138 NI Act notices, consumer redressal against defective agro-products, and title deeds verification.',
    },
    {
      name: 'Adv. T. Jebaraj Fernando',
      district: 'Thoothukudi',
      city: 'Thoothukudi',
      practiceAreas: ['Maritime Law', 'Customs', 'Commercial'],
      exp: 21,
      languages: ['Tamil', 'English'],
      courts: ['District Court Thoothukudi', 'Madras High Court'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,400 / Session',
      rating: 4.9,
      reviews: 50,
      bio: 'Port and shipping advocate advising cargo clearing agents, customs show-cause notices, export contracts, and marine insurance disputes.',
    },
    {
      name: 'Adv. Stella Mary',
      district: 'Thoothukudi',
      city: 'Thoothukudi',
      practiceAreas: ['Family', 'Women Rights', 'Civil'],
      exp: 12,
      languages: ['Tamil', 'English'],
      courts: ['Family Court Thoothukudi', 'DLSA Thoothukudi'],
      modes: ['In-Person', 'Phone'],
      fee: 'Free Legal Aid / Pro Bono (DLSA)',
      rating: 4.8,
      reviews: 25,
      bio: 'Dedicated legal aid practitioner assisting coastal fishing community members in social security schemes, domestic disputes, and welfare rights.',
    },
    {
      name: 'Adv. D. Dhandapani',
      district: 'Dindigul',
      city: 'Dindigul',
      practiceAreas: ['Property', 'Revenue', 'Agricultural Land'],
      exp: 18,
      languages: ['Tamil', 'English'],
      courts: ['Combined Court Complex Dindigul', 'Madurai Bench'],
      modes: ['In-Person', 'Phone'],
      fee: '₹700 / Session',
      rating: 4.7,
      reviews: 34,
      bio: 'Well-versed in patta transfer disputes, revenue sub-division appeals before RDO, boundary demarcation, and agricultural lease issues.',
    },
    {
      name: 'Adv. Revathi Jayaprakash',
      district: 'Dindigul',
      city: 'Palani',
      practiceAreas: ['Consumer', 'Banking', 'Family'],
      exp: 8,
      languages: ['Tamil', 'English'],
      courts: ['Sub-Court Palani', 'Dindigul Consumer Forum'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹500 / Session',
      rating: 4.5,
      reviews: 17,
      bio: 'Consumer rights advocate handling insurance repudiation disputes, medical negligence complaints, and personal banking grievances.',
    },
    {
      name: 'Adv. S. Kannan',
      district: 'Sivaganga',
      city: 'Karaikudi',
      practiceAreas: ['Property', 'Heritage Properties', 'Civil'],
      exp: 23,
      languages: ['Tamil', 'English'],
      courts: ['District Court Sivaganga', 'Madurai Bench High Court'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,200 / Session',
      rating: 4.9,
      reviews: 48,
      bio: 'Eminent civil counsel in Chettinad ancestral mansions title verification, joint family partition deeds, and gift deed revocation suits.',
    },
    {
      name: 'Adv. Bhavani Murugesan',
      district: 'Sivaganga',
      city: 'Sivaganga',
      practiceAreas: ['Criminal', 'Bail', 'Domestic Relations'],
      exp: 11,
      languages: ['Tamil', 'English'],
      courts: ['Principal District Court Sivaganga'],
      modes: ['In-Person', 'Phone'],
      fee: '₹600 / Session',
      rating: 4.6,
      reviews: 23,
      bio: 'Active practitioner in criminal defence, private complaint filings under Section 200 CrPC, and child maintenance enforcement.',
    },
    {
      name: 'Adv. N. Thevaraj',
      district: 'Theni',
      city: 'Theni',
      practiceAreas: ['Agricultural Law', 'Water Rights', 'Property'],
      exp: 15,
      languages: ['Tamil', 'English'],
      courts: ['District Court Theni', 'Madurai Bench High Court'],
      modes: ['In-Person', 'Phone'],
      fee: '₹600 / Session',
      rating: 4.7,
      reviews: 28,
      bio: 'Focuses on Periyar-Vaigai irrigation channel water disputes, plantation land boundary settlements in Cumbum Valley, and agricultural loan disputes.',
    },
    {
      name: 'Adv. Gomathi Pandian',
      district: 'Theni',
      city: 'Periyakulam',
      practiceAreas: ['Family', 'Women Protection', 'Consumer'],
      exp: 9,
      languages: ['Tamil', 'English'],
      courts: ['Sub-Court Periyakulam', 'DLSA Theni'],
      modes: ['In-Person', 'Video Call'],
      fee: 'Free Legal Aid / Pro Bono (DLSA Theni)',
      rating: 4.8,
      reviews: 19,
      bio: 'Legal aid lawyer handling domestic violence protective orders, senior citizen maintenance petitions, and Lok Adalat mediation.',
    },
    {
      name: 'Adv. R. Thanjavur Sundaram',
      district: 'Thanjavur',
      city: 'Thanjavur',
      practiceAreas: ['Civil', 'Temple Endowments (HR&CE)', 'Property'],
      exp: 24,
      languages: ['Tamil', 'English'],
      courts: ['Principal District Court Thanjavur', 'Madras High Court'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,000 / Session',
      rating: 4.9,
      reviews: 53,
      bio: 'Renowned expert in Hindu Religious & Charitable Endowments (HR&CE) tenancy matters, delta agricultural lease litigation, and trust declarations.',
    },
    {
      name: 'Adv. S. Erode Senguttuvan',
      district: 'Erode',
      city: 'Erode',
      practiceAreas: ['Commercial', 'Textile Trade', 'Arbitration'],
      exp: 16,
      languages: ['Tamil', 'English'],
      courts: ['District Court Erode', 'Coimbatore Commercial Court'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹800 / Session',
      rating: 4.7,
      reviews: 32,
      bio: 'Specialist in yarn trade recovery suits, consignment disputes, trademark enforcement for apparel brands, and commercial mediation.',
    },
    {
      name: 'Adv. K. Velmurugan',
      district: 'Tiruppur',
      city: 'Tiruppur',
      practiceAreas: ['Labour', 'Apparel Export', 'Customs'],
      exp: 14,
      languages: ['Tamil', 'English', 'Hindi'],
      courts: ['Labour Court Coimbatore/Tiruppur', 'Customs Appellate'],
      modes: ['In-Person', 'Phone'],
      fee: '₹850 / Session',
      rating: 4.6,
      reviews: 26,
      bio: 'Represents garment export manufacturers and labor unions in wage settlements, contract labour disputes, and factory compliance audits.',
    },
    {
      name: 'Adv. Anbarasu Kanchirajan',
      district: 'Kanchipuram',
      city: 'Kanchipuram',
      practiceAreas: ['Property', 'Silk Weavers Rights', 'Consumer'],
      exp: 13,
      languages: ['Tamil', 'English'],
      courts: ['District Court Chengalpattu / Kanchipuram'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹600 / Session',
      rating: 4.7,
      reviews: 24,
      bio: 'Covers traditional artisan Geographical Indication (GI) rights for Kanchipuram silk, cooperative society disputes, and urban real estate contracts.',
    },
    {
      name: 'Adv. Victor Aruldoss',
      district: 'Vellore',
      city: 'Vellore',
      practiceAreas: ['Medical Negligence', 'Civil', 'Consumer'],
      exp: 17,
      languages: ['Tamil', 'English'],
      courts: ['Principal District Court Vellore', 'Consumer Commission'],
      modes: ['In-Person', 'Video Call', 'Phone'],
      fee: '₹900 / Session',
      rating: 4.8,
      reviews: 37,
      bio: 'Experienced in healthcare consumer cases, medical malpractice claims, leather tannery environmental compliance, and property partition.',
    },
    {
      name: 'Adv. S. Cuddalore Ramadoss',
      district: 'Cuddalore',
      city: 'Cuddalore',
      practiceAreas: ['Environmental', 'Coastal Regulation', 'Property'],
      exp: 19,
      languages: ['Tamil', 'English'],
      courts: ['District Court Cuddalore', 'National Green Tribunal Southern Zone'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,000 / Session',
      rating: 4.8,
      reviews: 35,
      bio: 'Appears before the National Green Tribunal (NGT) in industrial pollution matters, CRZ coastal clearance disputes, and land acquisition appeals.',
    },
    {
      name: 'Adv. N. Nagapattinam Jayaraman',
      district: 'Nagapattinam',
      city: 'Nagapattinam',
      practiceAreas: ['Fisheries Law', 'Disaster Rehabilitation', 'Civil'],
      exp: 15,
      languages: ['Tamil', 'English'],
      courts: ['District Court Nagapattinam'],
      modes: ['In-Person', 'Phone'],
      fee: 'Free Legal Aid / Pro Bono (DLSA Nagapattinam)',
      rating: 4.7,
      reviews: 29,
      bio: 'Dedicated public-interest advocate addressing fishermen territorial waters detention issues, cyclone relief insurance, and rural land title disputes.',
    },
    {
      name: 'Adv. K. Krishnagiri Govindan',
      district: 'Krishnagiri',
      city: 'Hosur',
      practiceAreas: ['Corporate', 'Industrial Land', 'Interstate Commercial'],
      exp: 16,
      languages: ['Tamil', 'English', 'Kannada'],
      courts: ['Sub-Court Hosur', 'District Court Krishnagiri'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,100 / Session',
      rating: 4.8,
      reviews: 33,
      bio: 'Trilingual counsel stationed in Hosur industrial hub handling Tamil Nadu - Karnataka cross-border contract enforcement and industrial lease agreements.',
    },
    {
      name: 'Adv. Dhanalakshmi Muthu',
      district: 'Madurai',
      city: 'Madurai',
      practiceAreas: ['Cyber Crime', 'Consumer', 'Banking'],
      exp: 10,
      languages: ['Tamil', 'English'],
      courts: ['Madurai Bench of Madras High Court', 'District Court Madurai'],
      modes: ['Video Call', 'Phone', 'In-Person'],
      fee: '₹700 / Session',
      rating: 4.7,
      reviews: 27,
      bio: 'Specializing in online financial fraud complaints, UPI transaction recovery disputes, and consumer protection litigation across Southern Tamil Nadu.',
    },
    {
      name: 'Adv. S. Arunkumar',
      district: 'Chennai',
      city: 'Chennai',
      practiceAreas: ['Property', 'RERA Law', 'Consumer'],
      exp: 14,
      languages: ['Tamil', 'English'],
      courts: ['TNRERA Tribunal Chennai', 'Madras High Court'],
      modes: ['In-Person', 'Video Call'],
      fee: '₹1,200 / Session',
      rating: 4.8,
      reviews: 46,
      bio: 'Extensive track record before Tamil Nadu Real Estate Regulatory Authority (TNRERA) representing apartment buyers in delayed handover claims and defect liability.',
    },
  ];

  for (let i = 0; i < advocateSeeds.length; i++) {
    const s = advocateSeeds[i];
    const uid = `usr_adv_${String(i + 1).padStart(2, '0')}`;
    const email = `advocate.${s.name.toLowerCase().replace(/[^a-z]/g, '')}${i + 1}@example.com`;

    if (!db.users.findById(uid)) {
      db.users.create({
        _id: uid,
        fullName: s.name,
        email,
        phone: `+91 9443${String(i + 1).padStart(6, '0')}`,
        role: 'advocate',
        passwordHash: userPass,
        status: 'ACTIVE',
        state: 'Tamil Nadu',
        district: s.district,
        city: s.city,
        preferredLanguage: s.languages[0] || 'Tamil',
        preferredConsultationMode: s.modes[0] || 'In-Person',
        createdAt: now,
        updatedAt: now,
        isDemo: true,
      });
    }

    const advId = `adv_${String(i + 1).padStart(2, '0')}`;
    if (!db.advocates.findById(advId)) {
      db.advocates.create({
        _id: advId,
        userId: uid,
        fullName: s.name,
        email,
        phone: `+91 9443${String(i + 1).padStart(6, '0')}`,
        barCouncilNumber: `TN/DEMO/${2020 + (i % 6)}/${1000 + i}`,
        barCouncilNumberMasked: `TN/****/${1000 + i}`,
        state: 'Tamil Nadu',
        district: s.district,
        city: s.city,
        locality: s.city,
        practiceAreas: s.practiceAreas,
        yearsOfExperience: s.exp,
        languages: s.languages,
        courts: s.courts,
        consultationModes: s.modes,
        feeRange: s.fee,
        availability: true,
        availabilityStatus: i % 3 === 0 ? 'Available Today' : 'Available This Week',
        rating: s.rating,
        reviewCount: s.reviews,
        bio: s.bio,
        verificationStatus: 'VERIFIED',
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      });
    }
  }

  // Seed Demo Cases for citizen1
  if (db.cases.count((c) => c.citizenId === citizen1!._id) === 0) {
    const c1 = db.cases.create({
      _id: 'case_01',
      caseId: 'NJ-2026-MD-001042',
      citizenId: citizen1!._id,
      advocateId: 'adv_01', // Adv. S. Muthukrishnan
      title: 'Commercial Tenancy Termination & Recovery of Rent Arrears',
      category: 'Property',
      description: 'Tenancy dispute concerning commercial shop premises at West Masi Street, Madurai. Tenant defaulted on rent for 5 months and refused to vacate following notice under Sec 106 Transfer of Property Act.',
      state: 'Tamil Nadu',
      district: 'Madurai',
      city: 'Madurai',
      courtOrAuthority: 'Madurai District Court / Rent Tribunal',
      parties: [
        { name: 'S. Arumugam Chettiar', role: 'Landlord / Complainant' },
        { name: 'Saravanan Trading Corporation', role: 'Tenant / Respondent' },
      ],
      relevantDates: [
        { label: 'Lease Expiry Date', date: '2024-02-09' },
        { label: 'Statutory Notice Date', date: '2026-01-15' },
        { label: 'Vacation Deadline', date: '2026-02-05' },
      ],
      status: 'PROCEEDING',
      urgency: 'HIGH',
      documents: ['doc_01'],
      referencedSections: ['Section 106 Transfer of Property Act 1882', 'Tamil Nadu Regulation of Rights and Responsibilities of Landlords and Tenants Act 2017'],
      extractedFactsSummary: 'Registered lease expired on 09-Feb-2024. Monthly tenancy continued until terminated via legal notice dated 15-Jan-2026. Rental arrears outstanding: Rs. 1,40,000/- for months August 2025 to December 2025.',
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    });

    const c2 = db.cases.create({
      _id: 'case_02',
      caseId: 'NJ-2026-VR-002188',
      citizenId: citizen1!._id,
      title: 'Cheque Dishonour Complaint under Section 138 NI Act',
      category: 'Civil',
      description: 'Business loan repayment cheque issued by respondent was dishonoured by bank with remark Funds Insufficient. Statutory demand notice issued within 30 days.',
      state: 'Tamil Nadu',
      district: 'Virudhunagar',
      city: 'Rajapalayam',
      courtOrAuthority: 'Judicial Magistrate Court, Rajapalayam',
      parties: [
        { name: 'S. Meenakshi Sundaram', role: 'Complainant' },
        { name: 'K. Rengarajan', role: 'Accused' },
      ],
      status: 'SUBMITTED',
      urgency: 'NORMAL',
      documents: [],
      referencedSections: ['Section 138 Negotiable Instruments Act 1881', 'Section 142 NI Act'],
      isDemo: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // Seed sample document and chunks for case 1
  const c1 = db.cases.findById('case_01');
  const docPath = path.resolve('test-fixtures/sample_legal_notice.txt');
  if (c1 && fs.existsSync(docPath)) {
    const docText = fs.readFileSync(docPath, 'utf-8');
    if (!db.documents.findById('doc_01')) {
      db.documents.create({
        _id: 'doc_01',
        ownerId: citizen1!._id,
        caseId: c1._id,
        documentName: 'sample_legal_notice.txt',
        fileName: 'sample_legal_notice.txt',
        mimeType: 'text/plain',
        size: fs.statSync(docPath).size,
        storagePath: docPath,
        status: 'indexed',
        extractedText: docText,
        pageCount: 1,
        chunkCount: 3,
        extractedFacts: {
          documentType: 'Legal Notice under Section 106 Transfer of Property Act',
          parties: [
            { name: 'S. Arumugam Chettiar', role: 'Landlord / Sender' },
            { name: 'Saravanan Trading Corporation', role: 'Tenant / Recipient' },
          ],
          dates: [
            { label: 'Notice Date', date: '2026-01-15' },
            { label: 'Eviction Deadline', date: '2026-02-05' },
          ],
          courtOrAuthority: 'Madurai Bench of Madras High Court / Civil Court Madurai',
          subjectMatter: 'Termination of monthly commercial tenancy and demand for vacant possession plus rental arrears of Rs. 1,40,000/-',
          claimsOrDemands: [
            'Hand over peaceful and vacant possession of Shop No. 14 on or before 5th February 2026',
            'Pay outstanding rental arrears of Rs. 1,40,000/- with 12% annual interest',
          ],
          referencedSections: ['Section 106, Transfer of Property Act, 1882'],
          potentialMissingInfo: ['Postal acknowledgement card receipt date to be confirmed'],
        },
        factsReviewed: true,
        createdAt: now,
        updatedAt: now,
      });
    }

    if (db.chunks.count((c) => c.documentId === 'doc_01') === 0) {
      db.chunks.create({
        _id: 'chk_01',
        ownerId: citizen1!._id,
        caseId: c1._id,
        documentId: 'doc_01',
        title: 'sample_legal_notice.txt',
        pageNumber: 1,
        chunkIndex: 0,
        text: 'LEGAL NOTICE UNDER SECTION 106 OF THE TRANSFER OF PROPERTY ACT, 1882. Date: 15th January 2026, Place: Madurai. TO: M/s Saravanan Trading Corporation, Represented by Mr. S. Saravanan, Shop No. 14, Commercial Complex, West Masi Street, Madurai - 625001. FROM: Mr. S. Arumugam Chettiar, residing at No. 42, Vakkil New Street, Simmakkal, Madurai. Through Counsel: Adv. K. Ramanathan, Madurai Bench of Madras High Court.',
        keywords: ['legal notice', 'section 106', 'transfer of property', 'madurai', 'arumugam', 'saravanan'],
        createdAt: now,
      });

      db.chunks.create({
        _id: 'chk_02',
        ownerId: citizen1!._id,
        caseId: c1._id,
        documentId: 'doc_01',
        title: 'sample_legal_notice.txt',
        pageNumber: 1,
        chunkIndex: 1,
        text: 'Client is the absolute owner of Shop No. 14, Commercial Complex, West Masi Street, Madurai. Registered lease agreement dated 10th February 2021 was for 3 years at monthly rent of Rs. 28,000/-. Lease expired on 9th February 2024. Tenant continued month to month. Default in rent payment from August 2025 to December 2025, accumulating rental arrears of Rs. 1,40,000/-.',
        keywords: ['lease', 'rent', 'arrears', '28000', '140000', 'august 2025', 'december 2025'],
        createdAt: now,
      });

      db.chunks.create({
        _id: 'chk_03',
        ownerId: citizen1!._id,
        caseId: c1._id,
        documentId: 'doc_01',
        title: 'sample_legal_notice.txt',
        pageNumber: 1,
        chunkIndex: 2,
        text: 'TAKE NOTICE that your monthly tenancy stands TERMINATED upon expiry of 15 clear days from receipt under Section 106 Transfer of Property Act. You are called upon to: (a) Hand over peaceful vacant possession on or before 5th February 2026; (b) Pay outstanding arrears of Rs. 1,40,000/- with 12% interest. Failing compliance, eviction proceedings before Rent Tribunal / Civil Court Madurai will be initiated.',
        keywords: ['termination', 'deadline', '5th february 2026', 'rent tribunal', 'civil court madurai', '15 days'],
        createdAt: now,
      });
    }
  }

    // Seed consultation request
    if (citizen1) {
      db.consultations.create({
        _id: 'con_01',
        citizenId: citizen1._id,
        advocateId: 'adv_01',
        caseId: c1?._id || 'case_01',
        caseTitle: c1?.title || 'Commercial Lease Eviction and Arrears Recovery',
        message: 'Need urgent advice on filing the eviction petition before Madurai Rent Tribunal following expiry of the statutory 15-day notice period.',
        mode: 'IN_PERSON',
        preferredDate: '2026-02-06',
        status: 'ACCEPTED',
        responseNote: 'Request accepted. Please bring original registered lease deed and postal acknowledgement slip to chambers.',
        isDemo: true,
        createdAt: now,
        updatedAt: now,
      });

      db.notifications.create({
        _id: 'notif_01',
        userId: citizen1._id,
        type: 'CONSULTATION_UPDATE',
        title: 'Consultation Request Accepted',
        message: 'Adv. S. Muthukrishnan accepted your consultation request for Case NJ-2026-MD-001042.',
        read: false,
        link: '/cases/case_01',
        createdAt: now,
      });
    }
}
