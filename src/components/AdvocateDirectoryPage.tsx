import { useState, useEffect } from 'react';
import { User, Advocate, CaseRecord } from '../types';
import { api } from '../lib/api';
import { Search, MapPin, Briefcase, Award, Languages, Video, CheckCircle2, RotateCcw } from 'lucide-react';
import { TAMIL_NADU_DISTRICTS, PRACTICE_AREAS } from '../data/locations';

interface Props {
  user: User | null;
  onOpenConsultationModal: (advocate: Advocate) => void;
}

export function AdvocateDirectoryPage({ user, onOpenConsultationModal }: Props) {
  const [advocates, setAdvocates] = useState<Advocate[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [practiceArea, setPracticeArea] = useState('');
  const [district, setDistrict] = useState('');
  const [city, setCity] = useState('');
  const [language, setLanguage] = useState('');
  const [consultationMode, setConsultationMode] = useState('');
  const [availability, setAvailability] = useState('');
  const [minExp, setMinExp] = useState<number>(0);
  const [broadenSearch, setBroadenSearch] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const currentDistrictData = TAMIL_NADU_DISTRICTS.find((d) => d.district === district);

  const fetchAdvocates = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.advocates.list({
        search,
        practiceArea,
        state: 'Tamil Nadu',
        district: district || undefined,
        city: city || undefined,
        language,
        consultationMode,
        availability,
        minExperience: minExp > 0 ? minExp : undefined,
        broadenSearch,
      });
      setAdvocates(res.data || []);
    } catch (err: unknown) {
      console.error('Advocate directory query error:', err);
      setErrorMsg(err instanceof Error ? err.message : 'Unable to query advocate directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdvocates();
  }, [practiceArea, district, city, language, consultationMode, availability, minExp, broadenSearch]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchAdvocates();
  };

  const handleResetFilters = () => {
    setSearch('');
    setPracticeArea('');
    setDistrict('');
    setCity('');
    setLanguage('');
    setConsultationMode('');
    setAvailability('');
    setMinExp(0);
    setBroadenSearch(false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">Advocate Directory</h1>
          <p className="text-xs text-slate-600">
            Transparent advocate matching across 38 districts of Tamil Nadu. Ranked by legal practice, geographic proximity, and availability.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleResetFilters}
            className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-300 rounded-md transition-colors flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset Filters</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-2xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search advocates by name, specialized field, or city..."
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
          >
            Search
          </button>
        </form>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {/* Practice Area */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Practice Area</label>
            <select
              value={practiceArea}
              onChange={(e) => setPracticeArea(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none"
            >
              <option value="">All Practices</option>
              {PRACTICE_AREAS.map((pa) => (
                <option key={pa} value={pa}>
                  {pa}
                </option>
              ))}
            </select>
          </div>

          {/* District */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">District (TN)</label>
            <select
              value={district}
              onChange={(e) => {
                setDistrict(e.target.value);
                setCity('');
              }}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none"
            >
              <option value="">All Districts</option>
              {TAMIL_NADU_DISTRICTS.map((d) => (
                <option key={d.district} value={d.district}>
                  {d.district}
                </option>
              ))}
            </select>
          </div>

          {/* City */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">City / Town</label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={!district}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
            >
              <option value="">All Cities</option>
              {currentDistrictData?.cities.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Language */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none"
            >
              <option value="">Any Language</option>
              <option value="tamil">Tamil (தமிழ்)</option>
              <option value="english">English</option>
              <option value="hindi">Hindi (हिन्दी)</option>
              <option value="kannada">Kannada</option>
            </select>
          </div>

          {/* Consultation Mode */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Consultation Mode</label>
            <select
              value={consultationMode}
              onChange={(e) => setConsultationMode(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none"
            >
              <option value="">Any Mode</option>
              <option value="in-person">In-Person Chambers</option>
              <option value="video call">Video Consultation</option>
              <option value="phone">Phone Advice</option>
            </select>
          </div>

          {/* Availability */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-500 mb-1">Availability</label>
            <select
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs border border-slate-300 rounded bg-white focus:outline-none"
            >
              <option value="">All Advocates</option>
              <option value="today">Available Today</option>
            </select>
          </div>
        </div>

        {/* Broaden Search Checkbox */}
        <div className="flex items-center gap-2 pt-1 text-xs text-slate-600">
          <input
            type="checkbox"
            id="broaden"
            checked={broadenSearch}
            onChange={(e) => setBroadenSearch(e.target.checked)}
            className="rounded border-slate-300 text-slate-900 focus:ring-0"
          />
          <label htmlFor="broaden" className="cursor-pointer">
            Broaden search across entire State of Tamil Nadu if local district has limited counsel.
          </label>
        </div>
      </div>

      {/* Directory Results */}
      <div className="space-y-4">
        <div className="flex items-center justify-between text-xs text-slate-500">
          <span>Showing <strong className="text-slate-900">{advocates.length}</strong> verified demonstration advocates</span>
          <span className="text-[11px] text-slate-400">All demonstration bar registrations clearly fictional</span>
        </div>

        {loading ? (
          <div className="py-16 text-center text-xs text-slate-500">Searching advocate directory...</div>
        ) : errorMsg ? (
          <div className="bg-rose-50 border border-rose-200 rounded-lg p-6 text-center space-y-2">
            <p className="text-xs text-rose-700 font-semibold">{errorMsg}</p>
            <button
              onClick={fetchAdvocates}
              className="px-3 py-1.5 text-xs font-bold text-white bg-rose-700 hover:bg-rose-800 rounded transition-colors"
            >
              Retry Connection
            </button>
          </div>
        ) : advocates.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-lg p-12 text-center space-y-3">
            <h3 className="text-sm font-bold text-slate-900">No Advocates Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No advocates match all current filters. Try clicking "Broaden Search across Tamil Nadu" or resetting your filters.
            </p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 text-xs font-bold uppercase text-white bg-slate-900 rounded-md"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {advocates.map((adv) => (
              <div
                key={adv._id}
                className="bg-white border border-slate-200 rounded-lg p-5 space-y-3 shadow-2xs hover:border-slate-300 transition-colors"
              >
                {/* Header row */}
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-950">{adv.fullName}</h3>
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded border border-emerald-200">
                        VERIFIED DEMO
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin size={11} className="text-slate-400" />
                        {adv.city}, {adv.district}
                      </span>
                      <span>·</span>
                      <span className="font-mono text-[11px] text-slate-400">{adv.barCouncilNumberMasked}</span>
                    </div>
                  </div>

                  {/* Transparent Match Score Badge */}
                  {adv.matchScore !== undefined && (
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-1 bg-slate-900 text-white px-2 py-0.5 rounded text-xs font-bold font-mono">
                        <span>{adv.matchScore}%</span>
                        <span className="text-[10px] text-amber-300 uppercase font-sans">Match</span>
                      </div>
                      <span className="text-[9px] text-slate-400 mt-0.5 font-medium">Ranked Score</span>
                    </div>
                  )}
                </div>

                {/* Practice areas (clean unboxed text per constitution) */}
                <div className="text-xs text-slate-700 font-medium">
                  {adv.practiceAreas.join(' · ')}
                </div>

                {/* Bio */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {adv.bio}
                </p>

                {/* Match explanation card */}
                {adv.matchExplanation && (
                  <div className="p-2 bg-slate-50 border border-slate-200 rounded text-[11px] text-slate-600 space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-semibold text-slate-500">
                      <span>Match Criteria Breakdown:</span>
                      <span className="font-mono text-slate-800">
                        PA: {adv.matchExplanation.practiceAreaMatch} · Loc: {adv.matchExplanation.locationMatch} · Lang: {adv.matchExplanation.languageMatch}
                      </span>
                    </div>
                    <p className="text-[10px] text-slate-500 italic">
                      {adv.matchExplanation.summary}
                    </p>
                  </div>
                )}

                {/* Details Strip */}
                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                  <div className="flex items-center gap-3">
                    <span>{adv.yearsOfExperience} yrs exp.</span>
                    <span>·</span>
                    <span>{adv.languages.join(', ')}</span>
                  </div>
                  <div className="font-semibold text-slate-800">
                    {adv.feeRange}
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-1 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-emerald-600">
                    {adv.availabilityStatus}
                  </span>
                  <button
                    onClick={() => onOpenConsultationModal(adv)}
                    className="px-3.5 py-1.5 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors"
                  >
                    Request Consultation
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
