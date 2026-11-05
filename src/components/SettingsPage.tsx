import React, { useState } from 'react';
import { User } from '../types';
import { api } from '../lib/api';
import { Save, CheckCircle2, User as UserIcon, MapPin, Sliders, Bell } from 'lucide-react';
import { TAMIL_NADU_DISTRICTS, INDIAN_STATES, PRACTICE_AREAS } from '../data/locations';
import { Language, translations } from '../i18n/translations';

interface Props {
  user: User;
  currentLanguage: Language;
  onUserUpdated: (user: User) => void;
}

export function SettingsPage({ user, currentLanguage, onUserUpdated }: Props) {
  const [fullName, setFullName] = useState(user.fullName || '');
  const [phone, setPhone] = useState(user.phone || '');
  const [state, setState] = useState(user.state || 'Tamil Nadu');
  const [district, setDistrict] = useState(user.district || 'Madurai');
  const [city, setCity] = useState(user.city || 'Madurai');
  const [pincode, setPincode] = useState(user.pincode || '');
  const [prefLang, setPrefLang] = useState(user.preferredLanguage || 'English');
  const [consultationMode, setConsultationMode] = useState(user.preferredConsultationMode || 'In-Person');
  const [legalInterests, setLegalInterests] = useState<string[]>(user.legalInterests || ['Property', 'Civil']);
  const [commPrefs, setCommPrefs] = useState<string[]>(user.communicationPrefs || ['Email', 'Portal Notifications']);

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const t = (key: string) => translations[currentLanguage][key] || key;
  const currentDistrictData = TAMIL_NADU_DISTRICTS.find((d) => d.district === district) || TAMIL_NADU_DISTRICTS[0];

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    const data = TAMIL_NADU_DISTRICTS.find((item) => item.district === d);
    if (data && data.cities.length) {
      setCity(data.cities[0]);
    }
  };

  const handleToggleInterest = (area: string) => {
    setLegalInterests((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleToggleComm = (pref: string) => {
    setCommPrefs((prev) =>
      prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg('');
    setErrorMsg('');

    try {
      const res = await api.profile.update({
        fullName,
        phone,
        state,
        district,
        city,
        pincode,
        preferredLanguage: prefLang,
        preferredConsultationMode: consultationMode,
        legalInterests,
        communicationPrefs: commPrefs,
      });

      setSuccessMsg('Profile and location preferences updated successfully in database.');
      onUserUpdated(res.profile);
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl font-extrabold text-slate-950 font-['Outfit']">{t('profile.title')}</h1>
        <p className="text-xs text-slate-600">{t('profile.subtitle')}</p>
      </div>

      {successMsg && (
        <div className="p-3 text-xs text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-md flex items-center gap-2">
          <CheckCircle2 size={16} />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Basic Identity & Contact */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <UserIcon size={16} className="text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Personal Identity & Contact
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
              <input
                type="email"
                disabled
                value={user.email}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-500 cursor-not-allowed"
              />
              <span className="text-[10px] text-slate-400 mt-0.5 block">Email is locked for authenticated session security.</span>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Phone Number</label>
              <input
                type="text"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="+91 94440 12345"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
              <div className="px-3 py-2 text-xs border border-slate-200 rounded bg-slate-50 text-slate-700 uppercase font-bold">
                {user.role} Account
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Dependent Location Selectors */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <MapPin size={16} className="text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Jurisdiction & Residential Location
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('profile.state')}</label>
              <select
                value={state}
                onChange={(e) => setState(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
              >
                {INDIAN_STATES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('profile.district')}</label>
              <select
                value={district}
                onChange={(e) => handleDistrictChange(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
              >
                {TAMIL_NADU_DISTRICTS.map((d) => (
                  <option key={d.district} value={d.district}>
                    {d.district}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('profile.city')}</label>
              <select
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
              >
                {currentDistrictData.cities.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('profile.pincode')}</label>
              <input
                type="text"
                value={pincode}
                onChange={(e) => setPincode(e.target.value)}
                placeholder="e.g. 625001"
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Legal & Consultation Preferences */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 space-y-4 shadow-2xs">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Sliders size={16} className="text-slate-600" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-900">
              Legal Interests & Consultation Preferences
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('profile.language')}</label>
              <select
                value={prefLang}
                onChange={(e) => setPrefLang(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
              >
                <option value="English">English</option>
                <option value="Tamil">Tamil (தமிழ்)</option>
                <option value="Hindi">Hindi (हिन्दी)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">{t('profile.mode')}</label>
              <select
                value={consultationMode}
                onChange={(e) => setConsultationMode(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
              >
                <option value="In-Person">In-Person Chambers</option>
                <option value="Video Call">Video Consultation</option>
                <option value="Phone">Phone Call</option>
                <option value="Any">Any Mode</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">Legal Matter Categories of Interest</label>
            <div className="flex flex-wrap gap-2">
              {PRACTICE_AREAS.map((pa) => {
                const isSelected = legalInterests.includes(pa) || legalInterests.some((l) => pa.includes(l));
                return (
                  <button
                    key={pa}
                    type="button"
                    onClick={() => handleToggleInterest(pa)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded border transition-colors ${
                      isSelected
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    {pa}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-slate-950 hover:bg-slate-800 rounded-md transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <Save size={14} />
            <span>{saving ? 'Persisting Changes...' : 'Save Profile Preferences'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
