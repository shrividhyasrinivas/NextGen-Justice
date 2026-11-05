import React, { useState } from 'react';
import { X, ShieldCheck, Scale, ArrowRight, UserCheck } from 'lucide-react';
import { api } from '../lib/api';
import { User } from '../types';
import { TAMIL_NADU_DISTRICTS } from '../data/locations';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  initialMode: 'login' | 'register';
  onSuccess: (user: User) => void;
}

export function AuthModal({ isOpen, onClose, initialMode, onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [role, setRole] = useState<'citizen' | 'advocate'>('citizen');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [district, setDistrict] = useState('Madurai');
  const [city, setCity] = useState('Madurai');
  const [barNumber, setBarNumber] = useState('');
  const [practiceAreas, setPracticeAreas] = useState('Civil, Property');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const currentDistrictData = TAMIL_NADU_DISTRICTS.find((d) => d.district === district) || TAMIL_NADU_DISTRICTS[0];

  const handleDistrictChange = (d: string) => {
    setDistrict(d);
    const data = TAMIL_NADU_DISTRICTS.find((item) => item.district === d);
    if (data && data.cities.length) {
      setCity(data.cities[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (mode === 'login') {
        const res = await api.auth.login(email, password);
        onSuccess(res.user);
        onClose();
      } else {
        const res = await api.auth.register({
          fullName,
          email,
          password,
          role,
          phone,
          state: 'Tamil Nadu',
          district,
          city,
          barCouncilNumber: role === 'advocate' ? barNumber : undefined,
          practiceAreas: role === 'advocate' ? practiceAreas.split(',').map((s) => s.trim()) : undefined,
        });
        onSuccess(res.user);
        onClose();
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillQuickDemo = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setMode('login');
    setError('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs">
      <div className="relative w-full max-w-md bg-white border border-slate-200 shadow-2xl rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale size={18} className="text-amber-400" />
            <h3 className="text-sm font-bold tracking-tight uppercase">
              {mode === 'login' ? 'Institutional Sign In' : 'Citizen / Advocate Registration'}
            </h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Quick Demo Logins strip */}
        <div className="px-6 py-2.5 bg-slate-50 border-b border-slate-200">
          <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5 font-semibold">
            <span>Fast Demo Sign-In:</span>
          </div>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => fillQuickDemo('citizen@example.com', 'Demo@2026')}
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:border-slate-400 transition-colors truncate"
            >
              Citizen (Madurai)
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('advocate.muthukrishnan1@example.com', 'Demo@2026')}
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:border-slate-400 transition-colors truncate"
            >
              Advocate
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('admin@nextgenjustice.org', 'Admin@2026')}
              className="px-2 py-1 text-[11px] font-semibold text-slate-700 bg-white border border-slate-200 rounded hover:border-slate-400 transition-colors truncate"
            >
              Admin
            </button>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-slate-200">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
              mode === 'login' ? 'border-slate-900 text-slate-950 bg-white' : 'border-transparent text-slate-500 bg-slate-50 hover:text-slate-900'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2.5 text-xs font-bold uppercase tracking-wider text-center border-b-2 transition-colors ${
              mode === 'register' ? 'border-slate-900 text-slate-950 bg-white' : 'border-transparent text-slate-500 bg-slate-50 hover:text-slate-900'
            }`}
          >
            Create Account
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-md">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <>
              {/* Role selector */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Account Role</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRole('citizen')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded border transition-colors ${
                      role === 'citizen'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Citizen (Legal Aid)
                  </button>
                  <button
                    type="button"
                    onClick={() => setRole('advocate')}
                    className={`py-1.5 px-3 text-xs font-semibold rounded border transition-colors ${
                      role === 'advocate'
                        ? 'bg-slate-900 text-white border-slate-900'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    Legal Advocate
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Legal Name</label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. S. Ramanathan"
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
                />
              </div>

              {/* Dependent Location */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">District (TN)</label>
                  <select
                    value={district}
                    onChange={(e) => handleDistrictChange(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    {TAMIL_NADU_DISTRICTS.map((d) => (
                      <option key={d.district} value={d.district}>
                        {d.district}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">City / Town</label>
                  <select
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-2.5 py-2 text-xs border border-slate-300 rounded bg-white focus:outline-none"
                  >
                    {currentDistrictData.cities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {role === 'advocate' && (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Bar Council Enrollment No.</label>
                  <input
                    type="text"
                    required
                    value={barNumber}
                    onChange={(e) => setBarNumber(e.target.value)}
                    placeholder="e.g. TN/1245/2018"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
                  />
                </div>
              )}
            </>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Official Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. name@example.com"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-slate-900 focus:outline-none"
            />
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 text-xs font-bold uppercase tracking-wider text-white bg-slate-900 hover:bg-slate-800 rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                'Processing...'
              ) : mode === 'login' ? (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={14} />
                </>
              ) : (
                <>
                  <span>Create Account & Continue</span>
                  <UserCheck size={14} />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="p-3 bg-slate-50 border-t border-slate-200 text-center text-[11px] text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck size={14} className="text-emerald-600" />
          <span>Encrypted JWT session · Zero Aadhaar collection</span>
        </div>
      </div>
    </div>
  );
}
