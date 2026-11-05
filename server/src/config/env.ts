import dotenv from 'dotenv';
dotenv.config();

export const env = {
  PORT: Number(process.env.PORT) || 3000,
  NODE_ENV: process.env.NODE_ENV || 'development',
  MONGODB_URI: process.env.MONGODB_URI || process.env.MONGO_URI || '',
  JWT_SECRET: process.env.JWT_SECRET || 'nextgen-justice-v8-enterprise-secret-key-2026',
  UPLOAD_DIR: process.env.UPLOAD_DIR || 'uploads',
  GEMINI_API_KEY: process.env.GEMINI_API_KEY || '',
  LLM_API_KEY: process.env.LLM_API_KEY || '',
  LLM_API_URL: process.env.LLM_API_URL || '',
  LLM_MODEL: process.env.LLM_MODEL || 'gemini-3.8-flash',
  EMBEDDING_MODEL: process.env.EMBEDDING_MODEL || 'gemini-embedding-2-preview',
  SEED_ADMIN_EMAIL: process.env.SEED_ADMIN_EMAIL || 'admin@nextgenjustice.org',
  SEED_ADMIN_PASSWORD: process.env.SEED_ADMIN_PASSWORD || 'Admin@2026',
};
