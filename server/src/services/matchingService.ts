import { db, AdvocateDoc } from '../db/storage.js';

export interface MatchingQuery {
  search?: string;
  practiceArea?: string;
  state?: string;
  district?: string;
  city?: string;
  language?: string;
  consultationMode?: string;
  availability?: string;
  minExperience?: number;
  broadenSearch?: boolean;
}

export interface MatchExplanation {
  practiceAreaMatch: string;
  locationMatch: string;
  languageMatch: string;
  modeMatch: string;
  experienceBonus: string;
  summary: string;
}

export interface RankedAdvocate extends AdvocateDoc {
  matchScore: number;
  matchExplanation: MatchExplanation;
}

const norm = (v: unknown): string => String(v ?? '').trim().toLowerCase();

export function matchAndRankAdvocates(query: MatchingQuery = {}): RankedAdvocate[] {
  const allAdvocates = db.advocates.find((a) => a.verificationStatus === 'VERIFIED' || a.isDemo === true);

  const search = norm(query.search);
  const practiceArea = norm(query.practiceArea);
  const state = norm(query.state);
  const district = norm(query.district);
  const city = norm(query.city);
  const language = norm(query.language);
  const mode = norm(query.consultationMode);
  const availability = norm(query.availability);
  const minExp = Number(query.minExperience) || 0;

  // Filter pass
  const filtered = allAdvocates.filter((a) => {
    // Text search (name, bio, practice areas, city)
    if (search) {
      const inName = norm(a.fullName).includes(search);
      const inBio = norm(a.bio).includes(search);
      const inCity = norm(a.city).includes(search);
      const inDistrict = norm(a.district).includes(search);
      const inPA = a.practiceAreas.some((p) => norm(p).includes(search));
      if (!inName && !inBio && !inCity && !inDistrict && !inPA) return false;
    }

    // Min experience
    if (minExp > 0 && a.yearsOfExperience < minExp) {
      return false;
    }

    // Language
    if (language && !a.languages.some((l) => norm(l) === language)) {
      return false;
    }

    // Consultation mode
    if (mode && !a.consultationModes.some((m) => norm(m).includes(mode))) {
      return false;
    }

    // Availability
    if (availability === 'today' && !norm(a.availabilityStatus).includes('today')) {
      return false;
    }

    // Location filtering: prioritize district, use city as high-relevance score boost
    if (!query.broadenSearch) {
      if (state && norm(a.state) !== state) return false;
      if (district && norm(a.district) !== district) return false;
      // Do not hard-reject on city if within same district; city provides high score (+30) in ranking pass
    }

    return true;
  });

  // Safe fallback: if filtering by district resulted in 0 candidates, auto-broaden to state advocates
  const candidates = filtered.length > 0 ? filtered : allAdvocates.filter((a) => {
    if (search) {
      const inName = norm(a.fullName).includes(search);
      const inBio = norm(a.bio).includes(search);
      const inPA = a.practiceAreas.some((p) => norm(p).includes(search));
      if (!inName && !inBio && !inPA) return false;
    }
    return true;
  });

  // Ranking pass with explainable scores
  const ranked: RankedAdvocate[] = candidates.map((adv) => {
    let score = 0;
    const explanationParts: string[] = [];

    // 1. Practice Area Match (35 pts)
    let paScore = 0;
    if (practiceArea) {
      if (adv.practiceAreas.some((p) => norm(p) === practiceArea)) {
        paScore = 35;
        explanationParts.push(`Exact practice match in ${query.practiceArea} (+35)`);
      } else if (adv.practiceAreas.some((p) => norm(p).includes(practiceArea) || practiceArea.includes(norm(p)))) {
        paScore = 20;
        explanationParts.push(`Related practice area match (+20)`);
      }
    } else {
      paScore = 15; // baseline when no filter applied
    }
    score += paScore;

    // 2. Location Match (up to 30 pts)
    let locScore = 0;
    if (city && norm(adv.city) === city) {
      locScore = 30;
      explanationParts.push(`Located directly in ${query.city} (+30)`);
    } else if (district && norm(adv.district) === district) {
      locScore = 20;
      explanationParts.push(`Practices in ${query.district} district (+20)`);
    } else if (state && norm(adv.state) === state) {
      locScore = 10;
      explanationParts.push(`State-level practitioner in ${adv.state} (+10)`);
    } else {
      locScore = 5;
    }
    score += locScore;

    // 3. Language Match (15 pts)
    let langScore = 0;
    if (language) {
      if (adv.languages.some((l) => norm(l) === language)) {
        langScore = 15;
        explanationParts.push(`Fluent in preferred language: ${query.language} (+15)`);
      }
    } else {
      langScore = 10;
    }
    score += langScore;

    // 4. Consultation Mode Match (10 pts)
    let modeScore = 0;
    if (mode) {
      if (adv.consultationModes.some((m) => norm(m).includes(mode))) {
        modeScore = 10;
        explanationParts.push(`Offers requested consultation mode: ${query.consultationMode} (+10)`);
      }
    } else {
      modeScore = 5;
    }
    score += modeScore;

    // 5. Experience & Rating Bonus (up to 10 pts)
    const expBonus = Math.min(6, Math.floor(adv.yearsOfExperience / 3));
    const ratingBonus = Math.min(4, Math.floor((adv.rating - 4.0) * 4));
    const totalBonus = expBonus + ratingBonus;
    score += totalBonus;

    const summary = explanationParts.length ? explanationParts.join(' · ') : `Demonstration verified advocate with ${adv.yearsOfExperience} years experience in ${adv.district}`;

    return {
      ...adv,
      matchScore: Math.min(100, Math.max(10, score)),
      matchExplanation: {
        practiceAreaMatch: `${paScore}/35`,
        locationMatch: `${locScore}/30`,
        languageMatch: `${langScore}/15`,
        modeMatch: `${modeScore}/10`,
        experienceBonus: `${totalBonus}/10`,
        summary,
      },
    };
  });

  return ranked.sort((a, b) => b.matchScore - a.matchScore);
}
