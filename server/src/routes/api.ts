import { Router, Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs';
import { env } from '../config/env';
import { db, UserDoc } from '../db/storage';
import { processUploadedDocument, applyApprovedFactsToCase } from '../services/documentService';
import { matchAndRankAdvocates } from '../services/matchingService';
import { askGeneralLegalQuestion, askDocumentQuestion } from '../services/aiService';
import { seedDemoData } from '../db/storage';

export const apiRouter = Router();

// Configure Multer for secure document uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadPath = path.resolve(env.UPLOAD_DIR);
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const sanitized = file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}_${sanitized}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 }, // 15 MB
  fileFilter: (_req, file, cb) => {
    const allowedExts = ['.pdf', '.docx', '.txt', '.png', '.jpg', '.jpeg'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedExts.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Supported file types: PDF, DOCX, TXT, PNG, and JPG.'));
    }
  },
});

export interface AuthRequest extends Request {
  user?: {
    id: string;
    role: 'citizen' | 'advocate' | 'admin';
    email: string;
  };
}

export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ success: false, message: 'Authentication required. Missing Bearer token.' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as { id: string; role: 'citizen' | 'advocate' | 'admin'; email: string };
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ success: false, message: 'Invalid or expired session token.' });
  }
}

// ---------------- AUTH ROUTES ----------------

apiRouter.post('/auth/register', async (req: Request, res: Response) => {
  try {
    const { fullName, email, password, role = 'citizen', phone, state = 'Tamil Nadu', district = 'Madurai', city = 'Madurai' } = req.body;

    if (!fullName || !email || !password) {
      res.status(400).json({ success: false, message: 'Full name, email, and password are required.' });
      return;
    }

    const existing = db.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (existing) {
      res.status(409).json({ success: false, message: 'An account with this email address already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);
    const now = new Date().toISOString();
    const userId = `usr_${Date.now()}`;

    const newUser: UserDoc = {
      _id: userId,
      fullName: fullName.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || '',
      role: role === 'advocate' ? 'advocate' : 'citizen',
      passwordHash,
      status: 'ACTIVE',
      state,
      district,
      city,
      preferredLanguage: 'English',
      preferredConsultationMode: 'In-Person',
      legalInterests: ['Property', 'Civil'],
      communicationPrefs: ['Email', 'Portal Notifications'],
      createdAt: now,
      updatedAt: now,
    };

    db.users.create(newUser);

    if (role === 'advocate') {
      const advId = `adv_${Date.now()}`;
      db.advocates.create({
        _id: advId,
        userId,
        fullName: newUser.fullName,
        email: newUser.email,
        phone: newUser.phone,
        barCouncilNumber: req.body.barCouncilNumber || `TN/${new Date().getFullYear()}/${Math.floor(1000 + Math.random() * 9000)}`,
        barCouncilNumberMasked: `TN/****/${Math.floor(1000 + Math.random() * 9000)}`,
        state,
        district,
        city,
        locality: city,
        practiceAreas: req.body.practiceAreas || ['Civil', 'Property'],
        yearsOfExperience: Number(req.body.yearsOfExperience) || 3,
        languages: req.body.languages || ['English', 'Tamil'],
        courts: ['District Court'],
        consultationModes: ['In-Person', 'Video Call'],
        feeRange: '₹500 - ₹1,000 / Session',
        availability: true,
        availabilityStatus: 'Available This Week',
        rating: 4.5,
        reviewCount: 1,
        bio: req.body.bio || `Practicing advocate in ${district}, Tamil Nadu.`,
        verificationStatus: 'VERIFIED',
        isDemo: false,
        createdAt: now,
        updatedAt: now,
      });
    }

    const token = jwt.sign({ id: newUser._id, role: newUser.role, email: newUser.email }, env.JWT_SECRET, { expiresIn: '7d' });

    res.status(201).json({
      success: true,
      message: 'Account registered successfully.',
      token,
      user: {
        id: newUser._id,
        fullName: newUser.fullName,
        email: newUser.email,
        role: newUser.role,
        state: newUser.state,
        district: newUser.district,
        city: newUser.city,
      },
    });
  } catch (err: unknown) {
    console.error('[Auth Register Error]:', err);
    res.status(500).json({ success: false, message: 'Server error during registration.' });
  }
});

apiRouter.post('/auth/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required.' });
      return;
    }

    const user = db.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase().trim());
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ success: false, message: 'Invalid email or password.' });
      return;
    }

    const token = jwt.sign({ id: user._id, role: user.role, email: user.email }, env.JWT_SECRET, { expiresIn: '7d' });

    res.json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        role: user.role,
        phone: user.phone,
        state: user.state,
        district: user.district,
        city: user.city,
        pincode: user.pincode,
        preferredLanguage: user.preferredLanguage,
        preferredConsultationMode: user.preferredConsultationMode,
        legalInterests: user.legalInterests,
        communicationPrefs: user.communicationPrefs,
      },
    });
  } catch (err: unknown) {
    console.error('[Auth Login Error]:', err);
    res.status(500).json({ success: false, message: 'Server error during login.' });
  }
});

apiRouter.get('/auth/me', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.users.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  res.json({
    success: true,
    user: {
      id: user._id,
      fullName: user.fullName,
      email: user.email,
      role: user.role,
      phone: user.phone,
      state: user.state,
      district: user.district,
      city: user.city,
      pincode: user.pincode,
      preferredLanguage: user.preferredLanguage,
      preferredConsultationMode: user.preferredConsultationMode,
      legalInterests: user.legalInterests,
      communicationPrefs: user.communicationPrefs,
    },
  });
});

// ---------------- PROFILE & LOCATION ROUTES ----------------

apiRouter.get('/profile', requireAuth, (req: AuthRequest, res: Response) => {
  const user = db.users.findById(req.user!.id);
  if (!user) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }
  res.json({ success: true, profile: user });
});

apiRouter.put(['/profile', '/citizens/profile'], requireAuth, (req: AuthRequest, res: Response) => {
  const permitted = [
    'fullName',
    'phone',
    'state',
    'district',
    'city',
    'pincode',
    'preferredLanguage',
    'preferredConsultationMode',
    'legalInterests',
    'communicationPrefs',
  ];

  const updates: Record<string, any> = {};
  for (const key of permitted) {
    if (req.body[key] !== undefined) {
      updates[key] = req.body[key];
    }
  }

  const updated = db.users.update(req.user!.id, updates);
  if (!updated) {
    res.status(404).json({ success: false, message: 'User not found.' });
    return;
  }

  res.json({
    success: true,
    message: 'Profile and location preferences updated successfully.',
    profile: updated,
  });
});

// ---------------- ADVOCATE DIRECTORY & MATCHING ----------------

apiRouter.get('/advocates', (req: Request, res: Response) => {
  const { search, practiceArea, state, district, city, language, consultationMode, availability, minExperience, broadenSearch } = req.query;

  const ranked = matchAndRankAdvocates({
    search: search as string,
    practiceArea: practiceArea as string,
    state: state as string,
    district: district as string,
    city: city as string,
    language: language as string,
    consultationMode: consultationMode as string,
    availability: availability as string,
    minExperience: minExperience ? Number(minExperience) : undefined,
    broadenSearch: broadenSearch === 'true',
  });

  res.json({
    success: true,
    total: ranked.length,
    data: ranked,
  });
});

apiRouter.get('/advocates/:id', (req: Request, res: Response) => {
  const adv = db.advocates.findById(req.params.id) || db.advocates.findOne((a) => a.userId === req.params.id);
  if (!adv) {
    res.status(404).json({ success: false, message: 'Advocate profile not found.' });
    return;
  }
  res.json({ success: true, data: adv });
});

// ---------------- CASES & CASE LIFECYCLE ----------------

apiRouter.get('/cases', requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  let casesList = [];
  if (role === 'admin') {
    casesList = db.cases.find();
  } else if (role === 'advocate') {
    casesList = db.cases.find((c) => c.advocateId === userId || c.advocateId === `adv_${userId.replace('usr_', '')}`);
  } else {
    casesList = db.cases.find((c) => c.citizenId === userId);
  }

  res.json({
    success: true,
    total: casesList.length,
    data: casesList.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()),
  });
});

apiRouter.get('/cases/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const c = db.cases.findById(req.params.id);
  if (!c) {
    res.status(404).json({ success: false, message: 'Case not found.' });
    return;
  }

  if (req.user!.role !== 'admin' && c.citizenId !== req.user!.id && c.advocateId !== req.user!.id) {
    res.status(403).json({ success: false, message: 'Access to this case record is restricted.' });
    return;
  }

  const docs = db.documents.find((d) => d.caseId === c._id);

  res.json({
    success: true,
    data: { ...c, documentDetails: docs },
  });
});

apiRouter.post('/cases', requireAuth, (req: AuthRequest, res: Response) => {
  const { title, category, description, state = 'Tamil Nadu', district = 'Madurai', city = 'Madurai', urgency = 'NORMAL' } = req.body;

  if (!title || !description) {
    res.status(400).json({ success: false, message: 'Title and description are required to open a case.' });
    return;
  }

  const now = new Date().toISOString();
  const caseCount = db.cases.count() + 1;
  const caseIdCode = `NJ-${new Date().getFullYear()}-${district.substring(0, 2).toUpperCase()}-${String(caseCount).padStart(6, '0')}`;
  const newId = `case_${Date.now()}`;

  const createdCase = db.cases.create({
    _id: newId,
    caseId: caseIdCode,
    citizenId: req.user!.id,
    title: title.trim(),
    category: category || 'Civil',
    description: description.trim(),
    state,
    district,
    city,
    status: 'SUBMITTED',
    urgency,
    documents: [],
    createdAt: now,
    updatedAt: now,
  });

  res.status(201).json({
    success: true,
    message: 'Case opened successfully.',
    data: createdCase,
  });
});

apiRouter.put('/cases/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const c = db.cases.findById(req.params.id);
  if (!c) {
    res.status(404).json({ success: false, message: 'Case not found.' });
    return;
  }

  if (req.user!.role !== 'admin' && c.citizenId !== req.user!.id && c.advocateId !== req.user!.id) {
    res.status(403).json({ success: false, message: 'Unauthorized to update this case.' });
    return;
  }

  const allowedUpdates = ['title', 'description', 'category', 'urgency', 'status', 'state', 'district', 'city', 'courtOrAuthority'];
  const updateData: Record<string, any> = {};
  for (const k of allowedUpdates) {
    if (req.body[k] !== undefined) updateData[k] = req.body[k];
  }

  const updated = db.cases.update(req.params.id, updateData);
  res.json({ success: true, message: 'Case updated successfully.', data: updated });
});

// ---------------- DOCUMENTS & DOCUMENT AI PIPELINE ----------------

apiRouter.post('/cases/:id/documents', requireAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const caseId = req.params.id;
    const c = db.cases.findById(caseId);
    if (!c) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(404).json({ success: false, message: 'Target case not found.' });
      return;
    }

    if (req.user!.role !== 'admin' && c.citizenId !== req.user!.id && c.advocateId !== req.user!.id) {
      if (req.file) fs.unlink(req.file.path, () => {});
      res.status(403).json({ success: false, message: 'Unauthorized to upload documents to this case.' });
      return;
    }

    if (!req.file) {
      res.status(422).json({ success: false, message: 'A valid PDF, DOCX, or TXT document file is required.' });
      return;
    }

    const docId = `doc_${Date.now()}`;
    const now = new Date().toISOString();

    const newDoc = db.documents.create({
      _id: docId,
      ownerId: req.user!.id,
      caseId: c._id,
      documentName: req.file.originalname,
      fileName: req.file.filename,
      mimeType: req.file.mimetype,
      size: req.file.size,
      storagePath: req.file.path,
      status: 'uploaded',
      createdAt: now,
      updatedAt: now,
    });

    const processed = await processUploadedDocument(newDoc._id);

    res.status(201).json({
      success: true,
      message: 'Document uploaded and analyzed successfully.',
      data: processed,
    });
  } catch (err: unknown) {
    console.error('[Document Upload Error]:', err);
    res.status(500).json({ success: false, message: err instanceof Error ? err.message : 'Document processing failed.' });
  }
});

// Alias for /documents/upload endpoint
apiRouter.post('/documents/upload', requireAuth, upload.single('file'), async (req: AuthRequest, res: Response) => {
  const caseId = req.body.caseId || req.query.caseId;
  if (!caseId) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(400).json({ success: false, message: 'caseId is required.' });
    return;
  }
  const c = db.cases.findById(String(caseId));
  if (!c) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(404).json({ success: false, message: 'Target case not found.' });
    return;
  }
  if (req.user!.role !== 'admin' && c.citizenId !== req.user!.id && c.advocateId !== req.user!.id) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(403).json({ success: false, message: 'Unauthorized to upload documents to this case.' });
    return;
  }
  if (!req.file) {
    res.status(422).json({ success: false, message: 'A valid document file is required.' });
    return;
  }
  const docId = `doc_${Date.now()}`;
  const now = new Date().toISOString();
  const newDoc = db.documents.create({
    _id: docId,
    ownerId: req.user!.id,
    caseId: c._id,
    documentName: req.file.originalname,
    fileName: req.file.filename,
    mimeType: req.file.mimetype,
    size: req.file.size,
    storagePath: req.file.path,
    status: 'uploaded',
    createdAt: now,
    updatedAt: now,
  });
  const processed = await processUploadedDocument(newDoc._id);
  res.status(201).json({
    success: true,
    message: 'Document uploaded and analyzed successfully.',
    data: processed,
  });
});


apiRouter.get('/cases/:id/documents', requireAuth, (req: AuthRequest, res: Response) => {
  const caseId = req.params.id;
  const c = db.cases.findById(caseId);
  if (!c) {
    res.status(404).json({ success: false, message: 'Case not found.' });
    return;
  }

  if (req.user!.role !== 'admin' && c.citizenId !== req.user!.id && c.advocateId !== req.user!.id) {
    res.status(403).json({ success: false, message: 'Unauthorized.' });
    return;
  }

  const docs = db.documents.find((d) => d.caseId === caseId);
  res.json({ success: true, data: docs });
});

apiRouter.get('/documents', requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  let docs = [];
  if (role === 'admin') {
    docs = db.documents.find();
  } else {
    docs = db.documents.find((d) => d.ownerId === userId);
  }

  res.json({ success: true, data: docs });
});

apiRouter.post('/documents/:id/approve-facts', requireAuth, (req: AuthRequest, res: Response) => {
  const doc = db.documents.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  const result = applyApprovedFactsToCase(doc._id, doc.caseId, req.user!.id);
  if (!result.success) {
    res.status(400).json({ success: false, message: result.error });
    return;
  }

  res.json({
    success: true,
    message: 'Extracted facts approved and merged into case dossier.',
    case: result.case,
  });
});

apiRouter.get('/documents/:id/download', requireAuth, (req: AuthRequest, res: Response) => {
  const doc = db.documents.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  if (req.user!.role !== 'admin' && doc.ownerId !== req.user!.id) {
    res.status(403).json({ success: false, message: 'Access to this file is restricted to the owner.' });
    return;
  }

  if (!fs.existsSync(doc.storagePath)) {
    res.status(404).json({ success: false, message: 'Physical file not found on disk.' });
    return;
  }

  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.download(doc.storagePath, doc.documentName);
});

apiRouter.delete('/documents/:id', requireAuth, (req: AuthRequest, res: Response) => {
  const doc = db.documents.findById(req.params.id);
  if (!doc) {
    res.status(404).json({ success: false, message: 'Document not found.' });
    return;
  }

  if (req.user!.role !== 'admin' && doc.ownerId !== req.user!.id) {
    res.status(403).json({ success: false, message: 'Unauthorized to delete this document.' });
    return;
  }

  if (fs.existsSync(doc.storagePath)) {
    try {
      fs.unlinkSync(doc.storagePath);
    } catch (e) {
      console.warn('File unlink error:', e);
    }
  }

  db.chunks.deleteMany((c) => c.documentId === doc._id);

  const c = db.cases.findById(doc.caseId);
  if (c) {
    db.cases.update(c._id, {
      documents: c.documents.filter((id) => id !== doc._id),
    });
  }

  db.documents.delete(doc._id);
  res.json({ success: true, message: 'Document, file, and indexed retrieval chunks deleted.' });
});

// ---------------- LEGAL AI ASSISTANT ROUTES ----------------

apiRouter.post('/assistant/general', async (req: Request, res: Response) => {
  try {
    const { question, language = 'en' } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ success: false, message: 'A legal question is required.' });
      return;
    }

    const answer = await askGeneralLegalQuestion(question, language);
    res.json({ success: true, data: answer });
  } catch (err: unknown) {
    console.error('[Assistant General Error]:', err);
    res.status(500).json({ success: false, message: 'Assistant error processing inquiry.' });
  }
});

apiRouter.post('/assistant/case', requireAuth, async (req: AuthRequest, res: Response) => {
  try {
    const { question, caseId, documentId, language = 'en' } = req.body;
    if (!question || typeof question !== 'string') {
      res.status(400).json({ success: false, message: 'A question is required.' });
      return;
    }

    const answer = await askDocumentQuestion(req.user!.id, question, { caseId, documentId, language });
    res.json({ success: true, data: answer });
  } catch (err: unknown) {
    console.error('[Assistant Case Error]:', err);
    res.status(500).json({ success: false, message: 'Assistant error processing case document inquiry.' });
  }
});

// ---------------- CONSULTATIONS WORKFLOW ----------------

apiRouter.post('/consultations', requireAuth, (req: AuthRequest, res: Response) => {
  const { advocateId, caseId, message, mode = 'IN_PERSON', preferredDate } = req.body;

  if (!advocateId || !message) {
    res.status(400).json({ success: false, message: 'Advocate selection and inquiry message are required.' });
    return;
  }

  const advocate = db.advocates.findById(advocateId) || db.advocates.findOne((a) => a.userId === advocateId);
  if (!advocate) {
    res.status(404).json({ success: false, message: 'Selected advocate profile not found.' });
    return;
  }

  let caseTitle = undefined;
  if (caseId) {
    const c = db.cases.findById(caseId);
    if (c) caseTitle = c.title;
  }

  const now = new Date().toISOString();
  const conId = `con_${Date.now()}`;

  const created = db.consultations.create({
    _id: conId,
    citizenId: req.user!.id,
    advocateId: advocate._id,
    caseId,
    caseTitle,
    message: message.trim(),
    mode,
    preferredDate,
    status: 'PENDING',
    createdAt: now,
    updatedAt: now,
  });

  db.notifications.create({
    _id: `notif_${Date.now()}`,
    userId: advocate.userId,
    type: 'CONSULTATION_REQUEST',
    title: 'New Consultation Request Received',
    message: `A citizen has requested a consultation regarding "${caseTitle || 'Legal Inquiry'}".`,
    read: false,
    link: '/requests',
    createdAt: now,
  });

  res.status(201).json({
    success: true,
    message: 'Consultation request submitted to advocate.',
    data: created,
  });
});

apiRouter.get('/consultations', requireAuth, (req: AuthRequest, res: Response) => {
  const userId = req.user!.id;
  const role = req.user!.role;

  let list = [];
  if (role === 'admin') {
    list = db.consultations.find();
  } else if (role === 'advocate') {
    const adv = db.advocates.findOne((a) => a.userId === userId);
    const advId = adv ? adv._id : userId;
    list = db.consultations.find((c) => c.advocateId === advId || c.advocateId === userId);
  } else {
    list = db.consultations.find((c) => c.citizenId === userId);
  }

  const enriched = list.map((c) => {
    const citizen = db.users.findById(c.citizenId);
    const advocate = db.advocates.findById(c.advocateId);
    return {
      ...c,
      citizenName: citizen?.fullName || 'Citizen User',
      citizenEmail: citizen?.email,
      citizenPhone: citizen?.phone,
      advocateName: advocate?.fullName || 'Advocate',
    };
  });

  res.json({
    success: true,
    data: enriched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });
});

apiRouter.put('/consultations/:id/status', requireAuth, (req: AuthRequest, res: Response) => {
  const { status, responseNote } = req.body;
  if (!['ACCEPTED', 'REJECTED', 'CANCELLED', 'COMPLETED'].includes(status)) {
    res.status(400).json({ success: false, message: 'Invalid status.' });
    return;
  }

  const con = db.consultations.findById(req.params.id);
  if (!con) {
    res.status(404).json({ success: false, message: 'Consultation request not found.' });
    return;
  }

  const updated = db.consultations.update(req.params.id, {
    status,
    responseNote: responseNote || con.responseNote,
  });

  db.notifications.create({
    _id: `notif_${Date.now()}`,
    userId: con.citizenId,
    type: 'CONSULTATION_UPDATE',
    title: `Consultation ${status.toLowerCase()}`,
    message: responseNote || `Your consultation request has been marked as ${status.toLowerCase()}.`,
    read: false,
    link: '/cases',
    createdAt: new Date().toISOString(),
  });

  res.json({ success: true, message: `Consultation request marked as ${status}.`, data: updated });
});

// ---------------- NOTIFICATIONS ----------------

apiRouter.get('/notifications', requireAuth, (req: AuthRequest, res: Response) => {
  const list = db.notifications.find((n) => n.userId === req.user!.id);
  res.json({
    success: true,
    data: list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  });
});

apiRouter.put('/notifications/:id/read', requireAuth, (req: AuthRequest, res: Response) => {
  const notif = db.notifications.findById(req.params.id);
  if (!notif || notif.userId !== req.user!.id) {
    res.status(404).json({ success: false, message: 'Notification not found.' });
    return;
  }
  db.notifications.update(req.params.id, { read: true });
  res.json({ success: true });
});

apiRouter.put('/notifications/read-all', requireAuth, (req: AuthRequest, res: Response) => {
  const userNotifs = db.notifications.find((n) => n.userId === req.user!.id);
  for (const n of userNotifs) {
    db.notifications.update(n._id, { read: true });
  }
  res.json({ success: true });
});

// ---------------- ADMIN ROUTES ----------------

apiRouter.get('/admin/stats', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required.' });
    return;
  }

  res.json({
    success: true,
    data: {
      citizensCount: db.users.count((u) => u.role === 'citizen'),
      advocatesCount: db.advocates.count(),
      casesCount: db.cases.count(),
      documentsCount: db.documents.count(),
      indexedChunksCount: db.chunks.count(),
      consultationsCount: db.consultations.count(),
      aiProviderConfigured: Boolean(env.GEMINI_API_KEY),
      aiProviderModel: env.GEMINI_API_KEY ? 'gemini-3.8-flash' : 'Deterministic RAG',
    },
  });
});

apiRouter.get('/admin/users', requireAuth, (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required.' });
    return;
  }
  const users = db.users.find().map((u) => {
    const { passwordHash, ...rest } = u;
    return rest;
  });
  res.json({ success: true, data: users });
});

apiRouter.post('/admin/seed-reset', requireAuth, async (req: AuthRequest, res: Response) => {
  if (req.user!.role !== 'admin') {
    res.status(403).json({ success: false, message: 'Admin access required.' });
    return;
  }
  await seedDemoData(true);
  res.json({ success: true, message: 'Demo data reset and 34 Tamil Nadu advocates re-seeded.' });
});

// ---------------- SYSTEM HEALTH ----------------

apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'HEALTHY',
    service: 'NextGen Justice V8',
    timestamp: new Date().toISOString(),
    database: {
      engine: env.MONGODB_URI ? 'MongoDB / Mongoose' : 'Embedded Multi-Collection Storage (JSON Persistent)',
      status: 'CONNECTED',
      advocatesSeeded: db.advocates.count(),
      usersCount: db.users.count(),
      casesCount: db.cases.count(),
    },
    aiProvider: {
      configured: Boolean(env.GEMINI_API_KEY),
      primaryModel: env.GEMINI_API_KEY ? 'gemini-3.8-flash' : 'None (Using Verified Knowledge Base & Deterministic RAG)',
      embeddingModel: env.GEMINI_API_KEY ? 'gemini-embedding-2-preview' : 'TF-IDF Vector Index',
      status: env.GEMINI_API_KEY ? 'ACTIVE' : 'OFFLINE_FALLBACK_READY',
    },
    uploads: {
      directory: env.UPLOAD_DIR,
      maxFileSizeMb: 15,
      supportedFormats: ['PDF', 'DOCX', 'TXT', 'PNG', 'JPG'],
    },
  });
});

// Catch-all 404 for unhandled API routes: returns structured JSON instead of HTML SPA fallback
apiRouter.all('*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: 'API_ENDPOINT_NOT_FOUND',
    message: `The requested API endpoint '${req.method} /api${req.path}' was not found.`,
  });
});

