import { FormEvent, Fragment, useEffect, useMemo, useState, useCallback } from 'react';
import multiavatar from '@multiavatar/multiavatar/esm';
import './styles.css';

// Toast notification system
type ToastType = 'success' | 'error' | 'warning' | 'info';
type Toast = { id: string; type: ToastType; message: string };

const useToast = () => {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return { toasts, addToast, removeToast };
};

const ToastContainer = ({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: string) => void }) => {
  if (!toasts.length) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px',
    }}>
      {toasts.map(toast => (
        <div
          key={toast.id}
          style={{
            padding: '14px 18px',
            borderRadius: '8px',
            background: 'white',
            borderLeft: `4px solid ${
              toast.type === 'success' ? 'var(--green)' :
              toast.type === 'error' ? 'var(--red)' :
              toast.type === 'warning' ? 'var(--amber)' :
              'var(--brown-mid)'
            }`,
            boxShadow: '0 4px 20px rgba(62, 45, 30, 0.15)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            animation: 'slideIn 0.3s ease-out',
          }}
        >
          <span style={{ 
            fontSize: '14px', 
            fontWeight: 600,
            color: toast.type === 'success' ? 'var(--green)' :
                   toast.type === 'error' ? 'var(--red)' :
                   toast.type === 'warning' ? '#8b6914' :
                   'var(--text)'
          }}>
            {toast.type === 'success' ? '✓ ' :
             toast.type === 'error' ? '✗ ' :
             toast.type === 'warning' ? '⚠ ' : 'ℹ '}
            {toast.message}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '18px',
              cursor: 'pointer',
              color: 'var(--muted)',
              padding: '0 4px',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
      ))}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100%); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  );
};

// Confirmation Dialog Component
type ConfirmDialogProps = {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  type?: 'danger' | 'warning' | 'info';
  onConfirm: () => void;
  onCancel: () => void;
};

const ConfirmDialog = ({
  isOpen,
  title,
  message,
  confirmLabel = 'Konfirmasi',
  cancelLabel = 'Batal',
  type = 'warning',
  onConfirm,
  onCancel,
}: ConfirmDialogProps) => {
  if (!isOpen) return null;

  const borderColor = type === 'danger' ? 'var(--red)' : type === 'warning' ? 'var(--amber)' : 'var(--brown-mid)';

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" type="button" onClick={onCancel} aria-label="Tutup">✕</button>
        </div>
        <div className="modal-body">
          <div style={{ 
            padding: '16px', 
            borderRadius: '8px', 
            background: type === 'danger' ? '#fef2f2' : type === 'warning' ? '#fffbeb' : '#f0f9ff',
            borderLeft: `4px solid ${borderColor}`,
            marginBottom: '16px',
          }}>
            <p style={{ margin: 0, fontSize: '14px', color: 'var(--text)', lineHeight: 1.5 }}>{message}</p>
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onCancel}>{cancelLabel}</button>
          <button 
            className="primary-link" 
            type="button" 
            onClick={onConfirm}
            style={{ 
              background: type === 'danger' ? '#dc2626' : type === 'warning' ? '#d97706' : 'var(--btn-primary)',
            }}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
};

// Loading Spinner Component
const LoadingSpinner = ({ size = 'md', fullScreen = false }: { size?: 'sm' | 'md' | 'lg'; fullScreen?: boolean }) => {
  const sizes = { sm: 16, md: 24, lg: 32 };
  const spinnerSize = sizes[size];

  if (fullScreen) {
    return (
      <div style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(250, 246, 240, 0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}>
        <div
          style={{
            width: 40,
            height: 40,
            border: `3px solid var(--cream-deep)`,
            borderTopColor: 'var(--brown-mid)',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
          }}
        />
        <style>{`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      style={{
        width: spinnerSize,
        height: spinnerSize,
        border: `2px solid var(--cream-deep)`,
        borderTopColor: 'var(--brown-mid)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
        display: 'inline-block',
      }}
    >
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

// Skeleton Loader Component
const Skeleton = ({ width, height, borderRadius = 4 }: { width?: string | number; height?: string | number; borderRadius?: number }) => (
  <div
    style={{
      width: width || '100%',
      height: height || '20px',
      background: 'linear-gradient(90deg, var(--cream-deep) 25%, var(--cream) 50%, var(--cream-deep) 75%)',
      backgroundSize: '200% 100%',
      animation: 'shimmer 1.5s infinite',
      borderRadius: borderRadius || 0,
    }}
  >
    <style>{`
      @keyframes shimmer {
        0% { background-position: 200% 0; }
        100% { background-position: -200% 0; }
      }
    `}</style>
  </div>
);

type RouteKey =
  | 'dashboard'
  | 'shift'
  | 'operator-status'
  | 'rit'
  | 'delay'
  | 'maintenance'
  | 'bbm'
  | 'approval'
  | 'reports'
  | 'analytic'
  | 'daily-report'
  | 'master'
  | 'settings';

type SessionUser = {
  id: string;
  username: string;
  nama: string;
  role: string;
  branchId: string;
  token: string;
  avatarUrl?: string | null;
};

type HealthState = 'checking' | 'online' | 'offline';

type ApiEnvelope<T> = {
  data: T;
  meta?: Record<string, unknown>;
};

type Branch = {
  id: string;
  kode: string;
  nama: string;
  skemaTimbangan?: string;
  aktif?: boolean;
};

type Unit = {
  id: string;
  kode: string;
  tipe?: { nama: string; kapasitasTon?: number };
  budgetBreakdownJam?: number | null;
  status: 'ready' | 'breakdown' | 'pm';
};

type MaterialOption = { id: string; kode: string; nama: string };
type LokasiOption = { id: string; nama: string };

type ShiftUnitRow = {
  id: string;
  unitId: string;
  operatorId?: string | null;
  material?: string | null;
  statusAwal?: string | null;
  unit?: { kode: string };
  operator?: { nama: string };
};

type ShiftStatus = 'open' | 'pending' | 'approved' | 'rejected';

type Shift = {
  id: string;
  tanggal: string;
  branchId: string;
  tipe: string;
  jamMulai: string;
  jamSelesai: string;
  status: ShiftStatus;
  ritase: number;
  tonase: number;
  unitAktif: number;
  branch?: Branch;
  kpi: {
    ritase: number;
    tonase: number;
    pa: number;
    ua: number;
  };
};

type Operator = {
  id: string;
  nama: string;
  branchId: string;
  aktif: boolean;
};

type Rit = {
  id: string;
  noRit: string;
  shiftId: string;
  unitId: string;
  operatorId?: string;
  material: string;
  jumlahRit: number;
  jarakKm?: number | null;
  grossKg?: number;
  tareKg?: number;
  nettoTon?: number;
  estimasiTon?: number | null;
  statusTimbangan: 'manual' | 'imported';
  catatan?: string;
  createdAt: string;
  updatedAt: string;
  unit?: Unit;
  operator?: Operator;
  pit?: { nama: string } | null;
  stockpile?: { nama: string } | null;
};

type EditRequest = {
  id: string;
  tipe: string;
  recordId: string;
  field: string;
  nilaiLama: string;
  nilaiBaru: string;
  alasan: string;
  dibuatById: string;
  status: 'pending' | 'approved' | 'rejected';
  reviewedById?: string | null;
  catatanReview?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
};

const routeLabels: Record<RouteKey, string> = {
  dashboard: 'Dashboard',
  shift: 'Shift',
  'operator-status': 'Status Operator',
  rit: 'Rit Operation',
  delay: 'Delay',
  maintenance: 'Maintenance',
  bbm: 'BBM',
  approval: 'Approval',
  reports: 'Laporan',
  analytic: 'Analytic',
  'daily-report': 'Daily Report',
  master: 'Master Data',
  settings: 'Settings',
};

// Icon SVG components for sidebar navigation
const NavIcons = {
  dashboard: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1" />
      <rect x="14" y="3" width="7" height="7" rx="1" />
      <rect x="3" y="14" width="7" height="7" rx="1" />
      <rect x="14" y="14" width="7" height="7" rx="1" />
    </svg>
  ),
  reports: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14,2 14,8 20,8" />
      <line x1="16" y1="13" x2="8" y2="13" />
      <line x1="16" y1="17" x2="8" y2="17" />
      <polyline points="10,9 9,9 8,9" />
    </svg>
  ),
  analytic: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" />
      <line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" />
      <line x1="3" y1="20" x2="21" y2="20" />
    </svg>
  ),
  'daily-report': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <line x1="3" y1="10" x2="21" y2="10" />
      <line x1="9" y1="10" x2="9" y2="22" />
      <line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" />
    </svg>
  ),
  shift: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12,6 12,12 16,14" />
    </svg>
  ),
  'operator-status': (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <polyline points="17,11 19,13 23,9" />
    </svg>
  ),
  rit: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="22" height="18" rx="2" />
      <line x1="12" y1="8" x2="12" y2="16" />
      <line x1="8" y1="12" x2="16" y2="12" />
    </svg>
  ),
  delay: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="8" x2="12" y2="12" />
      <line x1="12" y1="16" x2="12.01" y2="16" />
    </svg>
  ),
  maintenance: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z" />
    </svg>
  ),
  bbm: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 22h18" />
      <path d="M6 18v4" />
      <path d="M18 18v4" />
      <path d="M6 10a4 4 0 0 1 4-4h4a4 4 0 0 1 4 4v8H6V10z" />
      <path d="M14 6V4a2 2 0 0 0-2-2h0a2 2 0 0 0-2 2v2" />
      <line x1="10" y1="14" x2="14" y2="14" />
    </svg>
  ),
  approval: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  ),
  master: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
  settings: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" />
    </svg>
  ),
};

const navGroups: Array<{ label: string; items: Array<{ key: RouteKey; icon: JSX.Element; badge?: string }> }> = [
  {
    label: 'Monitoring',
    items: [
      { key: 'dashboard', icon: NavIcons.dashboard },
      { key: 'daily-report', icon: NavIcons['daily-report'] },
      { key: 'analytic', icon: NavIcons.analytic },
      { key: 'reports', icon: NavIcons.reports },
    ],
  },
  {
    label: 'Operasi',
    items: [
      { key: 'shift', icon: NavIcons.shift, badge: '1' },
      { key: 'operator-status', icon: NavIcons['operator-status'] },
      { key: 'rit', icon: NavIcons.rit },
      { key: 'delay', icon: NavIcons.delay },
      { key: 'maintenance', icon: NavIcons.maintenance },
      { key: 'bbm', icon: NavIcons.bbm },
    ],
  },
  {
    label: 'Kontrol',
    items: [
      { key: 'approval', icon: NavIcons.approval, badge: '3' },
      { key: 'master', icon: NavIcons.master },
      { key: 'settings', icon: NavIcons.settings },
    ],
  },
];

// Tema terang/gelap. Disetel lebih dulu oleh inline script di index.html (sebelum
// React mount) agar tidak ada kedipan; helper ini hanya menyinkronkan state React
// + localStorage saat pengguna menekan toggle.
type Theme = 'light' | 'dark';
const THEME_KEY = 'haulops-theme';

const getCurrentTheme = (): Theme => {
  const attr = document.documentElement.getAttribute('data-theme');
  if (attr === 'dark' || attr === 'light') return attr;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
};

const applyTheme = (theme: Theme) => {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
};

const SESSION_KEY = 'haulops.session';

const getSession = (): SessionUser | null => {
  const raw = localStorage.getItem(SESSION_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as SessionUser;
    // Session lama/rusak (tanpa token) → anggap tidak login agar tidak crash.
    if (!parsed || !parsed.token || !parsed.id) {
      localStorage.removeItem(SESSION_KEY);
      return null;
    }
    return parsed;
  } catch {
    localStorage.removeItem(SESSION_KEY);
    return null;
  }
};

// Bearer token dipakai otomatis oleh apiGet/apiPost. Base path relatif ('/api/v1/...')
// agar request lewat proxy Vite ke backend, menghindari masalah CORS dan port.
let authToken: string | null = getSession()?.token ?? null;
const setAuthToken = (token: string | null) => {
  authToken = token;
};

let onUnauthorized: (() => void) | null = null;
const setUnauthorizedHandler = (handler: (() => void) | null) => {
  onUnauthorized = handler;
};

// Base URL API. Di dev kosong → path relatif `/api/...` lewat proxy Vite
// (vite.config.ts). Di production diisi VITE_API_URL = origin backend
// (mis. https://haulops-server.onrender.com), di-inject saat build.
const API_BASE = (import.meta.env.VITE_API_URL ?? '').replace(/\/$/, '');
const apiUrl = (path: string) => `${API_BASE}${path}`;

const buildHeaders = (extra?: Record<string, string>): Record<string, string> => {
  const headers: Record<string, string> = { ...extra };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  return headers;
};

const handleResponse = async <T,>(response: Response): Promise<T> => {
  if (response.status === 401) {
    onUnauthorized?.();
    throw new Error('Sesi berakhir. Silakan login kembali.');
  }
  const body = (await response.json()) as ApiEnvelope<T>;
  if (!response.ok) throw new Error('API request gagal.');
  return body.data;
};

const apiGet = async <T,>(path: string): Promise<T> => {
  const response = await fetch(apiUrl(path), { headers: buildHeaders() });
  return handleResponse<T>(response);
};

const apiPost = async <T,>(path: string, payload: unknown): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    method: 'POST',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse<T>(response);
};

const apiPut = async <T,>(path: string, payload: unknown): Promise<T> => {
  const response = await fetch(apiUrl(path), {
    method: 'PUT',
    headers: buildHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(payload),
  });
  return handleResponse<T>(response);
};

const apiDelete = async <T,>(path: string): Promise<T> => {
  const response = await fetch(apiUrl(path), { method: 'DELETE', headers: buildHeaders() });
  return handleResponse<T>(response);
};

const useHashRoute = () => {
  const readRoute = () => {
    const key = window.location.hash.replace('#/', '') as RouteKey;
    return routeLabels[key] ? key : 'dashboard';
  };
  const [route, setRoute] = useState<RouteKey>(readRoute);

  useEffect(() => {
    const onHashChange = () => setRoute(readRoute());
    window.addEventListener('hashchange', onHashChange);
    if (!window.location.hash) window.location.hash = '/dashboard';
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  return route;
};

const App = () => {
  const [user, setUser] = useState<SessionUser | null>(() => getSession());

  const clearSession = () => {
    localStorage.removeItem(SESSION_KEY);
    setAuthToken(null);
    setUser(null);
  };

  const signIn = (nextUser: SessionUser) => {
    localStorage.setItem(SESSION_KEY, JSON.stringify(nextUser));
    setAuthToken(nextUser.token);
    setUser(nextUser);
    window.location.hash = '/dashboard';
  };

  const signOut = () => {
    // Best-effort revoke token di backend, lalu bersihkan sesi lokal apa pun hasilnya.
    if (authToken) {
      fetch(apiUrl('/api/v1/auth/logout'), {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      }).catch(() => {});
    }
    clearSession();
  };

  useEffect(() => {
    // Saat ada respons 401 dari API, paksa keluar agar user login ulang.
    setUnauthorizedHandler(() => clearSession());
    return () => setUnauthorizedHandler(null);
  }, []);

  if (!user) return <LoginPage onLogin={signIn} />;

  return <Shell user={user} onLogout={signOut} />;
};

type LoginResult = {
  token: string;
  user: { id: string; username: string; nama: string; role: string; branchId: string; avatarUrl?: string | null };
};

const demoAccounts: Array<{ role: string; username: string; password: string }> = [
  { role: 'Admin Mining', username: 'admin', password: 'password' },
  { role: 'Supervisor', username: 'supervisor', password: 'password' },
];

const LoginPage = ({ onLogin }: { onLogin: (user: SessionUser) => void }) => {
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('password');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const result = await apiPost<LoginResult>('/api/v1/auth/login', { username, password });
      onLogin({ ...result.user, token: result.token });
    } catch {
      setError('Username atau password salah.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-hero">
        <div className="brand-mark">
          <span>H</span>
          <div>
            <strong>HAULOPS</strong>
            <small>Mining Operations</small>
          </div>
        </div>
        <div>
          <p className="eyebrow">Smart Mining Transaction System</p>
          <h1>Operasi hauling, shift, dan approval dalam satu cockpit.</h1>
          <p className="hero-copy">
            MVP awal ini menyiapkan fondasi UI, route modul utama, mock auth, dan koneksi API health check
            untuk mulai membangun workflow operasional sesuai PRD.
          </p>
        </div>
        <div className="feature-row">
          <span>Real-time dashboard</span>
          <span>Multi branch</span>
          <span>Approval workflow</span>
          <span>Audit-ready data</span>
        </div>
      </section>

      <section className="login-panel">
        <form className="login-box" onSubmit={submit}>
          <div>
            <h2>Selamat Datang</h2>
            <p>Masuk ke akun operasional Anda.</p>
          </div>
          <label>
            Username
            <input value={username} onChange={(event) => setUsername(event.target.value)} />
          </label>
          <label>
            Password
            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
          </label>
          {error ? <div className="form-error">{error}</div> : null}
          <button className="primary-action" type="submit" disabled={isSubmitting}>
            {isSubmitting ? 'Memproses...' : 'Masuk ke Sistem'}
          </button>
          <div className="demo-list">
            {demoAccounts.map((account) => (
              <button
                type="button"
                key={account.username}
                onClick={() => {
                  setUsername(account.username);
                  setPassword(account.password);
                  setError('');
                }}
              >
                <strong>{account.role}</strong>
                <span>{account.username} / {account.password}</span>
              </button>
            ))}
          </div>
        </form>
      </section>
    </main>
  );
};

const Shell = ({ user, onLogout }: { user: SessionUser; onLogout: () => void }) => {
  const route = useHashRoute();
  const { toasts, addToast, removeToast } = useToast();
  const [health, setHealth] = useState<HealthState>('checking');
  const [pendingApprovalCount, setPendingApprovalCount] = useState(0);
  const [branchName, setBranchName] = useState(user.branchId);
  const [avatarSeed, setAvatarSeed] = useState(user.avatarUrl || user.username);
  const [theme, setThemeState] = useState<Theme>(() => getCurrentTheme());

  const toggleTheme = () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setThemeState(next);
  };

  const loadPendingApprovalCount = () => {
    apiGet<EditRequest[]>('/api/v1/approvals/edit-requests?status=pending')
      .then((requests) => setPendingApprovalCount(requests.length))
      .catch(() => setPendingApprovalCount(0));
  };

  useEffect(() => {
    fetch(apiUrl('/api/health'))
      .then((response) => response.ok ? setHealth('online') : setHealth('offline'))
      .catch(() => setHealth('offline'));

    apiGet<Branch[]>('/api/v1/master/branches')
      .then((branches) => {
        const current = branches.find((branch) => branch.id === user.branchId);
        if (current) setBranchName(current.nama);
      })
      .catch(() => {});

    loadPendingApprovalCount();
    const handleRefresh = () => loadPendingApprovalCount();
    window.addEventListener('haulops:refresh-approval-count', handleRefresh);
    const handleAvatarUpdate = (event: Event) => {
      const seed = (event as CustomEvent<{ avatarUrl: string }>).detail?.avatarUrl;
      if (seed) setAvatarSeed(seed);
    };
    window.addEventListener('haulops:avatar-updated', handleAvatarUpdate);
    return () => {
      window.removeEventListener('haulops:refresh-approval-count', handleRefresh);
      window.removeEventListener('haulops:avatar-updated', handleAvatarUpdate);
    };
  }, []);

  const renderedNavGroups = useMemo(
    () => navGroups.map((group) => ({
      ...group,
      items: group.items.map((item) =>
        item.key === 'approval'
          ? { ...item, badge: pendingApprovalCount > 0 ? String(pendingApprovalCount) : undefined }
          : item,
      ),
    })),
    [pendingApprovalCount],
  );

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="logo-box">H</div>
          <div>
            <strong>HAULOPS</strong>
            <span>v2.0 MVP</span>
          </div>
        </div>
        <div className="branch-card">
          <span>Branch aktif</span>
          <strong>{branchName}</strong>
        </div>
        <nav>
          {renderedNavGroups.map((group) => (
            <div className="nav-group" key={group.label}>
              <p>{group.label}</p>
              {group.items.map((item) => (
                <a className={route === item.key ? 'active' : ''} href={`#/${item.key}`} key={item.key}>
                  <span className="nav-icon">{item.icon}</span>
                  {routeLabels[item.key]}
                  {item.badge ? <small>{item.badge}</small> : null}
                </a>
              ))}
            </div>
          ))}
        </nav>
        <div className="sidebar-user">
          <div className="avatar"><Avatar seed={avatarSeed} size={38} /></div>
          <div>
            <strong>{user.nama ?? user.username ?? '-'}</strong>
            <span>{user.role}</span>
          </div>
        </div>
        <div className="sidebar-actions">
          <button type="button" className="sidebar-icon-btn" onClick={toggleTheme} aria-label="Ganti tema terang/gelap" title="Ganti tema terang/gelap">
            {theme === 'dark' ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="4" />
                <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
              </svg>
            )}
          </button>
          <span className={`sidebar-icon-btn health-indicator ${health}`} title={`API ${health === 'online' ? 'Online' : health === 'offline' ? 'Offline' : 'Memeriksa...'}`} aria-label={`Status API: ${health}`}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.55a11 11 0 0 1 14.08 0" />
              <path d="M1.42 9a16 16 0 0 1 21.16 0" />
              <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
              <line x1="12" y1="20" x2="12.01" y2="20" />
            </svg>
          </span>
          <button type="button" className="sidebar-icon-btn" onClick={onLogout} aria-label="Keluar" title="Keluar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </aside>

      <section className="main-wrapper">
        <header className="topbar">
          <div>
            <h1>{routeLabels[route]}</h1>
            <p>Shift Pagi - 07 Juni 2026 - {branchName}</p>
          </div>
        </header>
        <main className="page-content">
          <Page route={route} health={health} />
        </main>
      </section>
    </div>
  );
};

const Page = ({ route, health }: { route: RouteKey; health: HealthState }) => {
  if (route === 'dashboard') return <Dashboard health={health} />;
  if (route === 'shift') return <ShiftPage />;
  if (route === 'operator-status') return <OperatorStatusPage />;
  if (route === 'rit') return <RitPage />;
  if (route === 'delay') return <DelayPage />;
  if (route === 'maintenance') return <MaintenancePage />;
  if (route === 'bbm') return <BbmPage />;
  if (route === 'reports') return <ReportsPage />;
  if (route === 'analytic') return <AnalyticPage />;
  if (route === 'daily-report') return <DashboardDailyReport />;
  if (route === 'master') return <MasterDataPage />;
  if (route === 'settings') return <SettingsPage />;
  if (route === 'approval') return <ApprovalPage />;
  return <ModulePlaceholder route={route} />;
};

type BudgetStatusStr = 'good' | 'warn' | 'bad';

type PeriodMinPct = { pct: number; availableMin?: number; scheduledMin?: number; workingMin?: number; targetPct?: number | null };

type DashboardDailyResponse = {
  tanggal: string;
  branch: { id: string; kode: string; nama: string; skemaTimbangan: string };
  pa: { daily: PeriodMinPct; mtd: PeriodMinPct; status: BudgetStatusStr };
  ua: { daily: PeriodMinPct; mtd: PeriodMinPct; status: BudgetStatusStr };
  breakdown: {
    daily: { count: number; hours: number };
    mtd: { count: number; hours: number };
    budgetJamPerHariTotal: number;
    budgetJamPerHariTotalMtd: number;
    status: BudgetStatusStr;
  };
  delay: Array<{
    delayTypeId: string; kode: string; nama: string; kenaPA: boolean;
    daily: { actualMin: number; targetMin: number };
    mtd: { actualMin: number; targetMin: number };
    status: BudgetStatusStr;
  }>;
  production: Array<{
    materialId: string; kode: string; nama: string;
    daily: { ritase: number; ton: number; targetRitase: number | null; targetTon: number | null };
    mtd: { ritase: number; ton: number; targetRitase: number | null; targetTon: number | null };
    status: BudgetStatusStr;
  }>;
  revenue: {
    daily: { actualRp: number; targetRp: number; unpricedRitCount: number };
    mtd: { actualRp: number; targetRp: number; unpricedRitCount: number };
    perTipeUnit: Array<{ tipeUnitId: string; kode: string; daily: { actualRp: number; targetRp: number }; mtd: { actualRp: number; targetRp: number } }>;
    status: BudgetStatusStr;
  };
  bbm: Array<{ tipeUnitId: string; kode: string; liter: number; km: number; ratio: number | null; budgetRatio: number | null; status: BudgetStatusStr }>;
  fleet: { total: number; ready: number; breakdown: number; pm: number };
  unitRanking: Array<{ unitId: string; kode: string; breakdownHours: number; delayMin: number; rank: number }>;
  status: BudgetStatusStr;
};

type DashboardCompareRow = {
  branchId: string; kode: string; nama: string;
  paMtdPct: number; uaMtdPct: number; paTargetPct: number | null; uaTargetPct: number | null;
  breakdownCountMtd: number; delayMinMtd: number;
  ritaseMtd: number; tonaseMtd: number; revenueMtd: number; revenueTargetMtd: number;
  bbmRatioAvg: number | null; status: BudgetStatusStr;
};

const formatCurrency = (value: number) => `Rp ${formatNumber(Math.round(value))}`;

const STATUS_LABEL: Record<BudgetStatusStr, string> = { good: 'Sesuai', warn: 'Waspada', bad: 'Kritis' };

const KpiTargetTile = ({ label, actual, target, unit, format = 'number', status, sub }: {
  label: string; actual: number; target: number | null; unit?: string;
  format?: 'number' | 'percent' | 'currency'; status: BudgetStatusStr; sub?: string;
}) => {
  const fmt = (v: number) => (format === 'currency' ? formatCurrency(v) : format === 'percent' ? `${v.toFixed(1)}%` : formatNumber(Math.round(v)));
  const delta = target != null ? actual - target : null;
  const pct = target ? (actual / target) * 100 : null;
  return (
    <article className={`stat-card kpi-target-tile kpi-target-tile--${status}`}>
      <span>{label}</span>
      <strong>{fmt(actual)}{unit && format !== 'currency' ? ` ${unit}` : ''}</strong>
      <p>{target != null ? `Target: ${fmt(target)}${unit && format !== 'currency' ? ` ${unit}` : ''}` : 'Target belum diatur'}</p>
      <div className="kpi-target-tile__foot">
        {delta != null ? (
          <span className={`status-badge ${status}`}>
            {delta >= 0 ? '+' : ''}{fmt(delta)}{pct != null ? ` (${pct.toFixed(0)}%)` : ''}
          </span>
        ) : null}
        {sub ? <small>{sub}</small> : null}
      </div>
    </article>
  );
};

const BranchCompareTable = ({ rows }: { rows: DashboardCompareRow[] }) => (
  <section className="card">
    <CardHeader title="Perbandingan Antar Branch" meta={`${rows.length} branch • bulan berjalan`} />
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Branch</th><th>PA%</th><th>UA%</th><th>Breakdown</th><th>Delay (mnt)</th>
            <th>Ritase</th><th>Tonase</th><th>Revenue</th><th>Target Revenue</th><th>BBM Ratio</th><th>Status</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.branchId}>
              <td><strong>{r.nama}</strong></td>
              <td className="num">{r.paMtdPct.toFixed(1)}%{r.paTargetPct != null ? <span style={{ color: 'var(--muted)' }}> /{r.paTargetPct.toFixed(0)}%</span> : null}</td>
              <td className="num">{r.uaMtdPct.toFixed(1)}%{r.uaTargetPct != null ? <span style={{ color: 'var(--muted)' }}> /{r.uaTargetPct.toFixed(0)}%</span> : null}</td>
              <td className="num">{r.breakdownCountMtd}</td>
              <td className="num">{formatNumber(r.delayMinMtd)}</td>
              <td className="num">{formatNumber(r.ritaseMtd)}</td>
              <td className="num">{formatNumber(Math.round(r.tonaseMtd))} t</td>
              <td className="num">{formatCurrency(r.revenueMtd)}</td>
              <td className="num">{formatCurrency(r.revenueTargetMtd)}</td>
              <td className="num">{r.bbmRatioAvg != null ? r.bbmRatioAvg.toFixed(2) : '-'}</td>
              <td><span className={`status-badge ${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
            </tr>
          ))}
          {!rows.length ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada branch aktif.</td></tr> : null}
        </tbody>
      </table>
    </div>
  </section>
);

const MaterialTargetTable = ({ rows }: { rows: DashboardDailyResponse['production'] }) => {
  const [period, setPeriod] = useState<'daily' | 'mtd'>('mtd');
  return (
    <section className="card">
      <CardHeader title="Produksi vs Target (per Material)" meta={`${rows.length} material`} />
      <div className="detail-tabs" style={{ padding: '0 18px' }}>
        <button type="button" className={`detail-tab ${period === 'daily' ? 'active' : ''}`} onClick={() => setPeriod('daily')}>Harian</button>
        <button type="button" className={`detail-tab ${period === 'mtd' ? 'active' : ''}`} onClick={() => setPeriod('mtd')}>Bulan Berjalan</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr><th>Material</th><th>Ritase</th><th>Tonase</th><th>Target Ton</th><th>%</th><th>Status</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const p = r[period];
              const pct = p.targetTon ? (p.ton / p.targetTon) * 100 : null;
              return (
                <tr key={r.materialId}>
                  <td><strong>{r.nama}</strong></td>
                  <td className="num">{formatNumber(p.ritase)}</td>
                  <td className="num">{formatNumber(Math.round(p.ton))} t</td>
                  <td className="num">{p.targetTon != null ? `${formatNumber(Math.round(p.targetTon))} t` : '-'}</td>
                  <td className="num">{pct != null ? `${pct.toFixed(0)}%` : '-'}</td>
                  <td><span className={`status-badge ${r.status}`}>{STATUS_LABEL[r.status]}</span></td>
                </tr>
              );
            })}
            {!rows.length ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada produksi tercatat.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};

const UnitRankingTable = ({ rows }: { rows: DashboardDailyResponse['unitRanking'] }) => (
  <section className="card">
    <CardHeader title="Unit Bermasalah Hari Ini" meta={`${rows.length} unit`} />
    <div className="table-wrap">
      <table>
        <thead><tr><th>#</th><th>Unit</th><th>Breakdown (jam)</th><th>Delay (mnt)</th></tr></thead>
        <tbody>
          {rows.map((u) => (
            <tr key={u.unitId}>
              <td><span className={`status-badge ${u.rank <= 3 ? 'bad' : 'good'}`}>{u.rank}</span></td>
              <td><strong>{u.kode}</strong></td>
              <td className="num">{formatNumber(u.breakdownHours)}</td>
              <td className="num">{formatNumber(u.delayMin)}</td>
            </tr>
          ))}
          {!rows.length ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px 0' }}>Tidak ada unit bermasalah hari ini.</td></tr> : null}
        </tbody>
      </table>
    </div>
  </section>
);

const Dashboard = ({ health }: { health: HealthState }) => {
  const [tanggal, setTanggal] = useState(() => new Date().toISOString().slice(0, 10));
  const [branchId, setBranchId] = useState(getSession()?.branchId ?? '');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [compareMode, setCompareMode] = useState(false);
  const [daily, setDailyData] = useState<DashboardDailyResponse | null>(null);
  const [compareRows, setCompareRows] = useState<DashboardCompareRow[]>([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiGet<Branch[]>('/api/v1/master/branches?aktif=true').then(setBranches).catch(() => {});
  }, []);

  useEffect(() => {
    setError('');
    setIsLoading(true);
    if (compareMode) {
      apiGet<DashboardCompareRow[]>(`/api/v1/dashboard/daily-compare?tanggal=${tanggal}`)
        .then(setCompareRows)
        .catch(() => setError('Data perbandingan branch belum bisa diambil dari API.'))
        .finally(() => setIsLoading(false));
      return;
    }
    if (!branchId) { setIsLoading(false); return; }
    apiGet<DashboardDailyResponse>(`/api/v1/dashboard/daily?tanggal=${tanggal}&branchId=${branchId}`)
      .then(setDailyData)
      .catch(() => setError('Data dashboard harian belum bisa diambil dari API.'))
      .finally(() => setIsLoading(false));
  }, [tanggal, branchId, compareMode]);

  return (
    <>
      <PageHeader
        title="Dashboard Operasional"
        description="Monitoring harian: PA/UA, breakdown, delay, produksi, revenue, dan rasio BBM dibandingkan budget/target."
        action={<a className="primary-link" href="#/reports">Lihat Laporan</a>}
      />
      <section className="toolbar-panel">
        <label>Tanggal<input type="date" value={tanggal} onChange={(e) => setTanggal(e.target.value)} /></label>
        <label>Branch
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} disabled={compareMode}>
            {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
          </select>
        </label>
        <label className="toolbar-toggle">
          <input type="checkbox" checked={compareMode} onChange={(e) => setCompareMode(e.target.checked)} /> Semua Branch (bandingkan)
        </label>
      </section>

      {error ? <div className="inline-alert">{error}</div> : null}
      {isLoading ? <p style={{ color: 'var(--muted)' }}>Memuat data...</p> : null}

      {compareMode ? (
        <BranchCompareTable rows={compareRows} />
      ) : daily ? (
        <>
          <div className="stat-grid">
            <KpiTargetTile label="Physical Availability" actual={daily.pa.mtd.pct} target={daily.pa.mtd.targetPct ?? null} format="percent" status={daily.pa.status} sub={`Hari ini: ${daily.pa.daily.pct.toFixed(1)}%`} />
            <KpiTargetTile label="Utilization Availability" actual={daily.ua.mtd.pct} target={daily.ua.mtd.targetPct ?? null} format="percent" status={daily.ua.status} sub={`Hari ini: ${daily.ua.daily.pct.toFixed(1)}%`} />
            <KpiTargetTile label="Breakdown (jam)" actual={daily.breakdown.mtd.hours} target={daily.breakdown.budgetJamPerHariTotalMtd} status={daily.breakdown.status} sub={`Hari ini: ${daily.breakdown.daily.count} unit / ${daily.breakdown.daily.hours} jam`} />
            <KpiTargetTile label="Revenue" actual={daily.revenue.mtd.actualRp} target={daily.revenue.mtd.targetRp || null} format="currency" status={daily.revenue.status} sub={daily.revenue.mtd.unpricedRitCount ? `${daily.revenue.mtd.unpricedRitCount} rit belum ada rate` : 'Semua rit ter-harga'} />
          </div>

          <div className="content-grid">
            <section className="card">
              <CardHeader title="Delay vs Budget" meta={health === 'online' ? `${daily.delay.length} jenis` : 'API belum tersambung'} />
              <div className="delay-list">
                {daily.delay.map((row) => {
                  const pct = row.mtd.targetMin > 0 ? Math.min(100, Math.round((row.mtd.actualMin / row.mtd.targetMin) * 100)) : row.mtd.actualMin > 0 ? 100 : 0;
                  return (
                    <div className="delay-row" key={row.delayTypeId}>
                      <div>
                        <strong>{row.nama}</strong>
                        <span>{row.mtd.actualMin} / {row.mtd.targetMin} mnt (MTD) • hari ini {row.daily.actualMin} mnt</span>
                      </div>
                      <div><span style={{ width: `${pct}%` }} /></div>
                    </div>
                  );
                })}
                {!daily.delay.length ? <p style={{ opacity: 0.7 }}>Belum ada jenis delay.</p> : null}
              </div>
            </section>

            <section className="card">
              <CardHeader title="Rasio BBM per Tipe Unit" meta={`${daily.bbm.length} tipe • hari ini`} />
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Tipe Unit</th><th>Liter</th><th>Km</th><th>Rasio</th><th>Budget</th><th>Status</th></tr></thead>
                  <tbody>
                    {daily.bbm.map((b) => (
                      <tr key={b.tipeUnitId}>
                        <td><strong>{b.kode}</strong></td>
                        <td className="num">{formatNumber(Math.round(b.liter))}</td>
                        <td className="num">{formatNumber(Math.round(b.km))}</td>
                        <td className="num">{b.ratio != null ? b.ratio.toFixed(2) : '-'}</td>
                        <td className="num">{b.budgetRatio != null ? b.budgetRatio.toFixed(2) : '-'}</td>
                        <td><span className={`status-badge ${b.status}`}>{STATUS_LABEL[b.status]}</span></td>
                      </tr>
                    ))}
                    {!daily.bbm.length ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada konsumsi BBM hari ini.</td></tr> : null}
                  </tbody>
                </table>
              </div>
            </section>
          </div>

          <MaterialTargetTable rows={daily.production} />

          <div className="content-grid">
            <section className="card">
              <CardHeader title="Status Fleet" meta={`${daily.fleet.total} unit`} />
              <div className="close-summary" style={{ margin: 18 }}>
                <div><span>Ready</span><strong>{daily.fleet.ready}</strong></div>
                <div><span>Breakdown</span><strong>{daily.fleet.breakdown}</strong></div>
                <div><span>PM</span><strong>{daily.fleet.pm}</strong></div>
                <div><span>Total Unit</span><strong>{daily.fleet.total}</strong></div>
              </div>
            </section>
            <UnitRankingTable rows={daily.unitRanking} />
          </div>
        </>
      ) : null}
    </>
  );
};

const SHIFT_JAM = {
  pagi: { mulai: '07:00', selesai: '17:00', tersedia: '10 jam' },
  malam: { mulai: '19:00', selesai: '07:00', tersedia: '12 jam' },
} as const;

// Durasi tersedia dari jam mulai→selesai (menghitung lintas tengah malam).
const shiftTersedia = (mulai: string, selesai: string): string => {
  const [mh, mm] = mulai.split(':').map(Number);
  const [sh, sm] = selesai.split(':').map(Number);
  if ([mh, mm, sh, sm].some((n) => Number.isNaN(n))) return '-';
  let mins = sh * 60 + sm - (mh * 60 + mm);
  if (mins <= 0) mins += 24 * 60;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m ? `${h} jam ${m} mnt` : `${h} jam`;
};

type UnitAssignment = { operatorId: string; material: string; statusAwal: string };

const ShiftPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [shiftTypes, setShiftTypes] = useState<ShiftTypeRow[]>([]);
  const [branchId, setBranchId] = useState(getSession()?.branchId ?? '');
  const [tanggal, setTanggal] = useState('2026-06-08');
  const [tipe, setTipe] = useState<string>('pagi');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [assignments, setAssignments] = useState<Record<string, UnitAssignment>>({});
  const [rowUnitIds, setRowUnitIds] = useState<string[]>([]); // unit yang di-assign ke shift (baris tabel)
  const [addUnitId, setAddUnitId] = useState('');
  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [genDate, setGenDate] = useState('2026-06-07');
  const [genTipe, setGenTipe] = useState<string>('pagi');
  const [detailShift, setDetailShift] = useState<Shift | null>(null);
  const [detailUnits, setDetailUnits] = useState<ShiftUnitRow[]>([]);
  const [detailTab, setDetailTab] = useState<'kpi' | 'unit' | 'rit' | 'delay' | 'bbm' | 'maintenance'>('kpi');
  const [detailRits, setDetailRits] = useState<Rit[]>([]);
  const [detailDelays, setDetailDelays] = useState<Delay[]>([]);
  const [detailBbm, setDetailBbm] = useState<BbmLog[]>([]);
  const [detailMaintenance, setDetailMaintenance] = useState<Maintenance[]>([]);
  const [closeTarget, setCloseTarget] = useState<Shift | null>(null);
  const [approvalTarget, setApprovalTarget] = useState<Shift | null>(null);
  // Filter daftar shift (dateFrom/dateTo/tipe didukung backend GET /shifts).
  const [filterDateFrom, setFilterDateFrom] = useState('');
  const [filterDateTo, setFilterDateTo] = useState('');
  const [filterTipe, setFilterTipe] = useState<string>('');
  // Status kesiapan operator (soft-warning saat assign) untuk tanggal shift yang dibuka.
  const [operatorStatusMap, setOperatorStatusMap] = useState<Record<string, string | null>>({});

  const loadMeta = () => {
    Promise.all([
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<Unit[]>(`/api/v1/master/units?branchId=${branchId}&aktif=true`),
      apiGet<Operator[]>(`/api/v1/master/operators?branchId=${branchId}&aktif=true`),
      apiGet<MaterialOption[]>('/api/v1/master/materials'),
      apiGet<ShiftTypeRow[]>('/api/v1/master/shift-types?aktif=true'),
    ])
      .then(([nextBranches, nextUnits, nextOperators, nextMaterials, nextShiftTypes]) => {
        setBranches(nextBranches);
        setUnits(nextUnits);
        setOperators(nextOperators);
        setMaterials(nextMaterials);
        setShiftTypes(nextShiftTypes);
        // Default pilihan tipe shift ikut master bila 'pagi' tak tersedia.
        if (nextShiftTypes.length && !nextShiftTypes.some((s) => s.kode === 'pagi')) {
          const first = nextShiftTypes[0].kode;
          setTipe((cur) => (nextShiftTypes.some((s) => s.kode === cur) ? cur : first));
          setGenTipe((cur) => (nextShiftTypes.some((s) => s.kode === cur) ? cur : first));
        }
      })
      .catch(() => setMessage('Gagal mengambil data master shift dari API.'));
  };

  const loadShifts = () => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (branchId) params.set('branchId', branchId);
    if (filterTipe) params.set('tipe', filterTipe);
    if (filterDateFrom) params.set('dateFrom', filterDateFrom);
    if (filterDateTo) params.set('dateTo', filterDateTo);
    apiGet<Shift[]>(`/api/v1/shifts?${params.toString()}`)
      .then((nextShifts) => {
        setShifts(nextShifts);
        setMessage('');
      })
      .catch(() => setMessage('Gagal mengambil daftar shift dari API.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadMeta();
  }, [branchId]);

  useEffect(() => {
    loadShifts();
  }, [branchId, filterTipe, filterDateFrom, filterDateTo]);

  const activeShift = shifts.find((shift) => shift.status === 'open');
  const currentBranchName = branches.find((branch) => branch.id === branchId)?.nama ?? '';
  // Info jam dari master ShiftType (kode = tipe); fallback ke pola lama pagi/malam.
  const jamInfo = (t: string) => {
    const st = shiftTypes.find((s) => s.kode === t);
    if (st) return { mulai: st.jamMulai, selesai: st.jamSelesai, tersedia: shiftTersedia(st.jamMulai, st.jamSelesai) };
    return SHIFT_JAM[t as keyof typeof SHIFT_JAM] ?? { mulai: '-', selesai: '-', tersedia: '-' };
  };
  const jam = jamInfo(tipe);
  // Label tipe shift: pakai nama master bila ada, else helper generik.
  const stLabel = (t: string) => shiftTypes.find((s) => s.kode === t)?.nama ?? formatShiftType(t);
  const selectedCount = rowUnitIds.length;
  const availableUnits = units.filter((unit) => !rowUnitIds.includes(unit.id));

  const defaultAssignment = (unit: Unit): UnitAssignment => ({
    operatorId: operators[0]?.id ?? '',
    material: materials[0]?.kode ?? '',
    statusAwal: unit.status === 'breakdown' ? 'breakdown' : 'ready',
  });

  const openModal = () => {
    const init: Record<string, UnitAssignment> = {};
    units.forEach((unit) => {
      init[unit.id] = defaultAssignment(unit);
    });
    setAssignments(init);
    // Default: semua unit siap (bukan PM) sudah masuk sebagai baris.
    setRowUnitIds(units.filter((unit) => unit.status !== 'pm').map((unit) => unit.id));
    setAddUnitId('');
    setMessage('');
    setIsModalOpen(true);
    // Ambil status kesiapan operator hari itu (soft-warning saat assign; tidak memblokir).
    apiGet<{ rows: Array<{ operatorId: string; statusKode: string | null }> }>(
      `/api/v1/operator-status/daily?tanggal=${tanggal}&branchId=${branchId}`,
    )
      .then((res) => setOperatorStatusMap(Object.fromEntries(res.rows.map((r) => [r.operatorId, r.statusKode]))))
      .catch(() => setOperatorStatusMap({}));
  };

  // Label operator dengan tanda peringatan bila non-Ready atau belum divalidasi hari itu.
  const operatorLabel = (op: Operator) => {
    const kode = operatorStatusMap[op.id];
    if (kode === undefined) return op.nama;
    if (kode === 'READY') return op.nama;
    if (kode === null) return `${op.nama} ⚠ Belum Divalidasi`;
    return `${op.nama} ⚠ ${toTitleCase(kode.toLowerCase())}`;
  };

  const updateAssignment = (unitId: string, patch: Partial<UnitAssignment>) =>
    setAssignments((prev) => ({ ...prev, [unitId]: { ...(prev[unitId] ?? { operatorId: '', material: '', statusAwal: 'ready' }), ...patch } }));

  const addUnitRow = (unitId: string) => {
    if (!unitId || rowUnitIds.includes(unitId)) return;
    const unit = units.find((u) => u.id === unitId);
    setAssignments((prev) => (prev[unitId] ? prev : { ...prev, [unitId]: unit ? defaultAssignment(unit) : { operatorId: '', material: '', statusAwal: 'ready' } }));
    setRowUnitIds((prev) => [...prev, unitId]);
    setAddUnitId('');
  };

  const removeUnitRow = (unitId: string) => setRowUnitIds((prev) => prev.filter((id) => id !== unitId));

  const generateAllUnits = () => {
    setAssignments((prev) => {
      const next = { ...prev };
      units.forEach((unit) => {
        if (!next[unit.id]) next[unit.id] = defaultAssignment(unit);
      });
      return next;
    });
    setRowUnitIds(units.map((unit) => unit.id));
    setMessage(`${units.length} unit di-assign ke shift.`);
  };

  const generateFromDate = async () => {
    const source = shifts.find((shift) => shift.tanggal === genDate && shift.tipe === genTipe);
    if (!source) {
      setMessage('Tidak ada shift pada tanggal & tipe sumber tersebut.');
      return;
    }
    try {
      const sourceUnits = await apiGet<Array<{ unitId: string; operatorId?: string | null; material?: string | null; statusAwal?: string | null }>>(
        `/api/v1/shifts/${source.id}/units`,
      );
      setAssignments((prev) => {
        const next = { ...prev };
        sourceUnits.forEach((su) => {
          const base = next[su.unitId] ?? { operatorId: '', material: '', statusAwal: 'ready' };
          next[su.unitId] = {
            operatorId: su.operatorId ?? base.operatorId,
            material: su.material ?? base.material,
            statusAwal: su.statusAwal ?? base.statusAwal,
          };
        });
        return next;
      });
      // Tambahkan unit sumber ke daftar baris (yang masih ada di master unit branch ini).
      const known = new Set(units.map((u) => u.id));
      setRowUnitIds((prev) => {
        const merged = [...prev];
        sourceUnits.forEach((su) => {
          if (known.has(su.unitId) && !merged.includes(su.unitId)) merged.push(su.unitId);
        });
        return merged;
      });
      setIsGenerateOpen(false);
      setMessage(`Data unit dari ${formatDate(genDate)} (${genTipe}) berhasil disalin ke shift baru.`);
    } catch {
      setMessage('Gagal mengambil data unit dari tanggal sumber.');
    }
  };

  const openShift = async () => {
    if (!rowUnitIds.length) {
      setMessage('Tambahkan minimal satu unit untuk shift ini.');
      return;
    }
    try {
      await apiPost<Shift>('/api/v1/shifts', {
        branchId,
        tanggal,
        tipe,
        assignments: rowUnitIds.map((unitId) => ({
          unitId,
          operatorId: assignments[unitId]?.operatorId || undefined,
          material: assignments[unitId]?.material || undefined,
          statusAwal: assignments[unitId]?.statusAwal || undefined,
        })),
      });
      setMessage('Shift baru berhasil dibuka.');
      setIsModalOpen(false);
      loadShifts();
    } catch {
      setMessage('Shift gagal dibuka. Kemungkinan shift aktif untuk tanggal/tipe tersebut sudah ada.');
    }
  };

  const openDetail = async (shift: Shift) => {
    setDetailShift(shift);
    setDetailTab('kpi');
    setDetailUnits([]);
    setDetailRits([]);
    setDetailDelays([]);
    setDetailBbm([]);
    setDetailMaintenance([]);
    try {
      const [rows, rits, delays, bbm, maintenance] = await Promise.all([
        apiGet<ShiftUnitRow[]>(`/api/v1/shifts/${shift.id}/units`),
        apiGet<Rit[]>(`/api/v1/rits?shiftId=${shift.id}`),
        apiGet<Delay[]>(`/api/v1/delays?shiftId=${shift.id}`),
        apiGet<BbmLog[]>(`/api/v1/bbm?shiftId=${shift.id}`),
        apiGet<Maintenance[]>(`/api/v1/maintenance?shiftId=${shift.id}`),
      ]);
      setDetailUnits(rows);
      setDetailRits(rits);
      setDetailDelays(delays);
      setDetailBbm(bbm);
      setDetailMaintenance(maintenance);
    } catch {
      /* biarkan kosong; header KPI tetap tampil */
    }
  };

  const confirmCloseShift = async () => {
    if (!closeTarget) return;
    try {
      await apiPost<Shift>(`/api/v1/shifts/${closeTarget.id}/close`, {});
      setMessage('Shift ditutup dan masuk pending approval.');
      setCloseTarget(null);
      loadShifts();
    } catch {
      setMessage('Shift gagal ditutup. Hanya shift open yang bisa ditutup.');
    }
  };

  const decideShift = async (aksi: 'approve' | 'reject') => {
    if (!approvalTarget) return;
    try {
      await apiPost<Shift>(`/api/v1/shifts/${approvalTarget.id}/${aksi}`, {});
      setMessage(aksi === 'approve' ? 'Shift berhasil di-approve.' : 'Shift ditolak.');
      setApprovalTarget(null);
      loadShifts();
    } catch {
      setMessage('Aksi gagal. Hanya shift berstatus pending yang bisa di-approve/reject.');
    }
  };

  return (
    <>
      <PageHeader
        title="Manajemen Shift"
        description="Fondasi modul shift: buka shift, assign unit, tutup shift, lalu kirim ke approval."
        action={<button className="primary-link" onClick={openModal}>+ Buka Shift Baru</button>}
      />
      {message ? <div className="inline-alert">{message}</div> : null}
      <section className="toolbar-panel">
        <label>
          Branch
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            {branches.map((branch) => <option value={branch.id} key={branch.id}>{branch.nama}</option>)}
          </select>
        </label>
        <label>
          Dari Tanggal
          <input type="date" value={filterDateFrom} onChange={(event) => setFilterDateFrom(event.target.value)} />
        </label>
        <label>
          Sampai Tanggal
          <input type="date" value={filterDateTo} onChange={(event) => setFilterDateTo(event.target.value)} />
        </label>
        <label>
          Tipe Shift
          <select value={filterTipe} onChange={(event) => setFilterTipe(event.target.value)}>
            <option value="">Semua Tipe</option>
            {shiftTypes.map((s) => <option value={s.kode} key={s.id}>{s.nama}</option>)}
          </select>
        </label>
        {filterDateFrom || filterDateTo || filterTipe ? (
          <label style={{ minWidth: 'auto', justifyContent: 'flex-end' }}>
            &nbsp;
            <button
              type="button"
              className="btn-ghost-sm"
              onClick={() => {
                setFilterDateFrom('');
                setFilterDateTo('');
                setFilterTipe('');
              }}
            >
              Reset Filter
            </button>
          </label>
        ) : null}
      </section>

      {isModalOpen ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsModalOpen(false);
          }}
        >
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Buka Shift Baru">
            <div className="modal-header">
              <span className="modal-title">Buka Shift Baru</span>
              <button className="modal-close" type="button" onClick={() => setIsModalOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <label>
                  Branch <span className="req">*</span>
                  <input value={currentBranchName} disabled />
                </label>
                <label>
                  Tanggal <span className="req">*</span>
                  <input type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} />
                </label>
                <label>
                  Tipe Shift <span className="req">*</span>
                  <select value={tipe} onChange={(event) => setTipe(event.target.value)}>
                    {shiftTypes.length
                      ? shiftTypes.map((s) => <option value={s.kode} key={s.id}>{s.nama} ({s.jamMulai}–{s.jamSelesai})</option>)
                      : <option value="">— belum ada tipe shift di master —</option>}
                  </select>
                </label>
                <label>
                  Jam Mulai
                  <input value={jam.mulai} disabled />
                </label>
                <label>
                  Jam Selesai
                  <input value={jam.selesai} disabled />
                </label>
                <label>
                  Jam Tersedia
                  <input value={jam.tersedia} disabled />
                </label>
              </div>

              <div className="modal-section-head">
                <div className="modal-section-title" style={{ margin: 0 }}>
                  Unit DT Aktif Shift Ini ({selectedCount}/{units.length})
                </div>
                <div className="modal-section-actions">
                  <button type="button" className="btn-ghost-sm" onClick={() => setIsGenerateOpen(true)}>📋 Generate dari Tanggal Lain</button>
                  <button type="button" className="btn-gold-sm" onClick={generateAllUnits}>⚡ Generate Semua Unit Aktif</button>
                </div>
              </div>
              <div className="modal-note">
                Unit yang di-assign akan tersedia sebagai pilihan saat input Rit Operation, Delay, BBM, dan Maintenance.
              </div>
              <div className="modal-unit-list">
                <table>
                  <thead>
                    <tr>
                      <th>Unit</th>
                      <th>Tipe Unit</th>
                      <th>Kapasitas</th>
                      <th>Operator</th>
                      <th>Material</th>
                      <th>Status Awal</th>
                      <th style={{ width: 44 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {rowUnitIds.map((unitId) => {
                      const unit = units.find((u) => u.id === unitId);
                      const a = assignments[unitId] ?? { operatorId: '', material: '', statusAwal: 'ready' };
                      return (
                        <tr key={unitId}>
                          <td><strong>{unit?.kode ?? unitId}</strong></td>
                          <td>{unit?.tipe?.nama ?? '-'}</td>
                          <td>{unit?.tipe?.kapasitasTon ? `${unit.tipe.kapasitasTon} ton` : '-'}</td>
                          <td>
                            <select className="cell-select" value={a.operatorId} onChange={(event) => updateAssignment(unitId, { operatorId: event.target.value })}>
                              <option value="">— pilih —</option>
                              {operators.map((op) => <option value={op.id} key={op.id}>{operatorLabel(op)}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="cell-select" value={a.material} onChange={(event) => updateAssignment(unitId, { material: event.target.value })}>
                              <option value="">— pilih —</option>
                              {materials.map((mat) => <option value={mat.kode} key={mat.id}>{mat.nama}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="cell-select" value={a.statusAwal} onChange={(event) => updateAssignment(unitId, { statusAwal: event.target.value })}>
                              <option value="ready">Ready</option>
                              <option value="standby">Standby</option>
                              <option value="breakdown">Breakdown</option>
                            </select>
                          </td>
                          <td>
                            <button type="button" className="row-remove" title="Hapus unit dari shift" onClick={() => removeUnitRow(unitId)}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                    {!rowUnitIds.length ? (
                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada unit. Tambahkan unit di bawah atau klik ⚡ Generate Semua Unit Aktif.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="add-unit-row">
                <select className="cell-select" style={{ maxWidth: 260 }} value={addUnitId} onChange={(event) => setAddUnitId(event.target.value)}>
                  <option value="">— pilih unit —</option>
                  {availableUnits.map((unit) => (
                    <option value={unit.id} key={unit.id}>{unit.kode} • {unit.tipe?.nama ?? '-'}</option>
                  ))}
                </select>
                <button type="button" className="btn-ghost-sm" disabled={!addUnitId} onClick={() => addUnitRow(addUnitId)}>+ Tambah Unit Lain</button>
                {!availableUnits.length ? <small style={{ color: 'var(--muted)' }}>Semua unit sudah ditambahkan.</small> : null}
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsModalOpen(false)}>Batal</button>
              <button className="primary-link" type="button" onClick={openShift}>Buka Shift</button>
            </div>
          </div>
        </div>
      ) : null}

      {isGenerateOpen ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsGenerateOpen(false);
          }}
        >
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Generate dari Tanggal Lain">
            <div className="modal-header">
              <span className="modal-title">Generate Data Unit dari Tanggal Lain</span>
              <button className="modal-close" type="button" onClick={() => setIsGenerateOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note">
                📅 Salin data unit, operator, dan material dari shift tanggal lain sebagai titik awal.
              </div>
              <div className="modal-form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <label>
                  Tanggal Sumber <span className="req">*</span>
                  <input type="date" value={genDate} onChange={(event) => setGenDate(event.target.value)} />
                </label>
                <label>
                  Shift Sumber
                  <select value={genTipe} onChange={(event) => setGenTipe(event.target.value)}>
                    {shiftTypes.map((s) => <option value={s.kode} key={s.id}>{s.nama} ({s.jamMulai}–{s.jamSelesai})</option>)}
                  </select>
                </label>
              </div>
              <div className="modal-note" style={{ background: '#fff3cd', borderColor: '#f0d08a', color: '#8b6914' }}>
                Unit yang cocok akan tercentang dengan operator & material dari shift sumber. Sisanya tetap default.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsGenerateOpen(false)}>Batal</button>
              <button className="primary-link" type="button" onClick={generateFromDate}>Generate Sekarang</button>
            </div>
          </div>
        </div>
      ) : null}

      {detailShift ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDetailShift(null);
          }}
        >
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Detail Shift">
            <div className="modal-header">
              <span className="modal-title">Detail Shift {stLabel(detailShift.tipe)} — {formatDate(detailShift.tanggal)}</span>
              <button className="modal-close" type="button" onClick={() => setDetailShift(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="stat-grid">
                <article className="stat-card"><span>Ritase</span><strong>{detailShift.ritase}</strong></article>
                <article className="stat-card"><span>Tonase</span><strong>{formatNumber(detailShift.tonase)} t</strong></article>
                <article className="stat-card"><span>PA</span><strong>{detailShift.kpi.pa}%</strong></article>
                <article className="stat-card"><span>UA</span><strong>{detailShift.kpi.ua}%</strong></article>
                <article className="stat-card"><span>Unit Aktif</span><strong>{detailShift.unitAktif}</strong></article>
                <article className="stat-card"><span>Status</span><strong style={{ textTransform: 'capitalize' }}>{detailShift.status}</strong></article>
              </div>
              <div className="modal-section-title" style={{ marginTop: 16 }}>Unit &amp; Operator</div>
              <div className="modal-unit-list">
                <table>
                  <thead>
                    <tr><th>Unit</th><th>Operator</th><th>Material</th><th>Status Awal</th></tr>
                  </thead>
                  <tbody>
                    {detailUnits.map((su) => (
                      <tr key={su.id}>
                        <td><strong>{su.unit?.kode ?? su.unitId}</strong></td>
                        <td>{su.operator?.nama ?? '-'}</td>
                        <td>{su.material ?? '-'}</td>
                        <td><span className={`unit-status ${su.statusAwal ?? ''}`}>{su.statusAwal ?? '-'}</span></td>
                      </tr>
                    ))}
                    {!detailUnits.length ? (
                      <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada unit ter-assign untuk shift ini.</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDetailShift(null)}>Tutup</button>
            </div>
          </div>
        </div>
      ) : null}

      {closeTarget ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setCloseTarget(null);
          }}
        >
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Tutup Shift">
            <div className="modal-header">
              <span className="modal-title">Tutup Shift</span>
              <button className="modal-close" type="button" onClick={() => setCloseTarget(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note" style={{ background: '#fff3cd', borderColor: '#f0d08a', color: '#8b6914' }}>
                Pastikan seluruh data rit, delay, BBM, dan maintenance sudah lengkap sebelum menutup shift.
              </div>
              <div className="close-summary">
                <div><span>Shift</span><strong>{stLabel(closeTarget.tipe)} — {formatDate(closeTarget.tanggal)}</strong></div>
                <div><span>Total Rit</span><strong>{closeTarget.ritase} trip</strong></div>
                <div><span>Total Tonase</span><strong>{formatNumber(closeTarget.tonase)} ton</strong></div>
                <div><span>Unit aktif</span><strong>{closeTarget.unitAktif} DT</strong></div>
                <div><span>PA rata-rata</span><strong>{closeTarget.kpi.pa}%</strong></div>
              </div>
              <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 12 }}>
                Shift yang ditutup masuk status <strong>Pending Approval</strong> dan Supervisor akan dinotifikasi.
              </p>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setCloseTarget(null)}>Batal</button>
              <button className="primary-link" type="button" onClick={confirmCloseShift}>Tutup &amp; Kirim ke Supervisor</button>
            </div>
          </div>
        </div>
      ) : null}

      {activeShift ? (
        <section className="active-shift">
          <div>
            <span>Shift Aktif Sekarang</span>
            <strong>{stLabel(activeShift.tipe)} - {formatDate(activeShift.tanggal)}</strong>
            <p>{activeShift.jamMulai}-{activeShift.jamSelesai} - {activeShift.unitAktif} unit aktif - {activeShift.branch?.nama}</p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => openDetail(activeShift)}>Detail</button>
            <button onClick={() => setCloseTarget(activeShift)}>Tutup Shift</button>
          </div>
        </section>
      ) : (
        <section className="active-shift neutral">
          <div>
            <span>Shift Aktif Sekarang</span>
            <strong>Belum ada shift open</strong>
            <p>Pilih tanggal dan tipe shift, lalu buka shift baru untuk branch aktif.</p>
          </div>
        </section>
      )}
      <section className="card">
        <CardHeader title="Daftar Shift" meta={isLoading ? 'Memuat data...' : `${shifts.length} data dari API`} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Tanggal</th><th>Branch</th><th>Tipe Shift</th><th>Jam Operasi</th><th>Unit</th><th>Ritase</th><th>Tonase</th><th>Status</th><th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {shifts.map((shift) => (
                <tr key={shift.id}>
                  <td>{formatDate(shift.tanggal)}</td>
                  <td>{shift.branch?.nama ?? shift.branchId}</td>
                  <td>{stLabel(shift.tipe)}</td>
                  <td>{shift.jamMulai}-{shift.jamSelesai}</td>
                  <td>{shift.unitAktif}</td>
                  <td>{shift.ritase}</td>
                  <td>{formatNumber(shift.tonase)} t</td>
                  <td><StatusBadge label={shift.status} /></td>
                  <td>
                    <div className="rowact">
                      <button type="button" onClick={() => openDetail(shift)}>Detail</button>
                      {shift.status === 'open' ? (
                        <button type="button" onClick={() => setCloseTarget(shift)}>Tutup</button>
                      ) : null}
                      {shift.status === 'pending' ? (
                        <button type="button" className="btn-gold-sm" onClick={() => setApprovalTarget(shift)}>Approve</button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

// ============ Status Operator (validasi kesiapan harian) ============
type OperatorStatusTypeOption = { id: string; kode: string; nama: string; warna?: string | null };
type OperatorMonthlyDay = { statusTypeId: string; statusKode: string; statusNama: string; catatan: string | null } | null;
type OperatorMonthlyRow = { operatorId: string; nama: string; nik: string; days: Record<string, OperatorMonthlyDay> };
type OperatorMonthlyResponse = { bulan: string; tahun: number; daysInMonth: number; rows: OperatorMonthlyRow[]; statusTypes: OperatorStatusTypeOption[] };
type OperatorHistoryEntry = { id: string; tanggal: string; catatan?: string | null; statusType: { kode: string; nama: string; warna?: string | null } };

const todayStr = () => new Date().toISOString().slice(0, 10);
// Kode 1-huruf untuk sel matriks (huruf pertama kode status — unik untuk 7 status bawaan).
const letterFor = (kode: string) => kode.charAt(0).toUpperCase();

const OperatorStatusPage = () => {
  const [view, setView] = useState<'grid' | 'history'>('grid');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState(getSession()?.branchId ?? '');
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(now.getFullYear());
  const [monthRows, setMonthRows] = useState<OperatorMonthlyRow[]>([]);
  const [statusTypes, setStatusTypes] = useState<OperatorStatusTypeOption[]>([]);
  const [daysInMonth, setDaysInMonth] = useState(30);
  const [message, setMessage] = useState('');
  const [genOpen, setGenOpen] = useState(false);
  const [genFrom, setGenFrom] = useState(todayStr());
  const [genTo, setGenTo] = useState(todayStr());

  // Modal quick-edit per sel (satu operator, satu tanggal)
  const [editCell, setEditCell] = useState<{ operatorId: string; nama: string; day: string } | null>(null);
  const [editStatusTypeId, setEditStatusTypeId] = useState('');
  const [editCatatan, setEditCatatan] = useState('');
  const [isSavingCell, setIsSavingCell] = useState(false);

  // Histori
  const [historyOperatorId, setHistoryOperatorId] = useState('');
  const [historyFrom, setHistoryFrom] = useState(`${todayStr().slice(0, 7)}-01`);
  const [historyTo, setHistoryTo] = useState(todayStr());
  const [historyOperatorName, setHistoryOperatorName] = useState('');
  const [history, setHistory] = useState<OperatorHistoryEntry[]>([]);

  useEffect(() => {
    apiGet<Branch[]>('/api/v1/master/branches?aktif=true').then(setBranches).catch(() => setMessage('Gagal memuat branch.'));
  }, []);

  const loadMonth = () => {
    if (!branchId) return;
    apiGet<OperatorMonthlyResponse>(`/api/v1/operator-status/monthly?bulan=${bulan}&tahun=${tahun}&branchId=${branchId}`)
      .then((res) => { setMonthRows(res.rows); setStatusTypes(res.statusTypes); setDaysInMonth(res.daysInMonth); })
      .catch(() => setMessage('Gagal memuat status operator.'));
  };
  useEffect(() => { loadMonth(); /* eslint-disable-next-line */ }, [branchId, bulan, tahun]);

  const warnaByKode = Object.fromEntries(statusTypes.map((st) => [st.kode, st.warna ?? 'var(--muted)']));
  const dayList = Array.from({ length: daysInMonth }, (_, i) => String(i + 1).padStart(2, '0'));
  const weekdayLabel = (day: string) => new Date(tahun, Number(bulan) - 1, Number(day)).toLocaleDateString('id-ID', { weekday: 'short' });

  const openCellEdit = (operatorId: string, nama: string, day: string, current: OperatorMonthlyDay) => {
    setEditCell({ operatorId, nama, day });
    setEditStatusTypeId(current?.statusTypeId ?? '');
    setEditCatatan(current?.catatan ?? '');
    setMessage('');
  };

  const saveCellEdit = async () => {
    if (!editCell || !editStatusTypeId) { setMessage('Pilih status.'); return; }
    setIsSavingCell(true);
    try {
      const tanggal = `${tahun}-${bulan}-${editCell.day}`;
      await apiPost('/api/v1/operator-status/daily', {
        tanggal,
        entries: [{ operatorId: editCell.operatorId, statusTypeId: editStatusTypeId, catatan: editCatatan || undefined }],
      });
      setMessage(`Status ${editCell.nama} — ${formatDate(tanggal)} tersimpan.`);
      setEditCell(null);
      loadMonth();
    } catch {
      setMessage('Gagal menyimpan status (butuh role supervisor/koordinator/admin).');
    } finally {
      setIsSavingCell(false);
    }
  };

  const runGenerate = async () => {
    if (genFrom === genTo) { setMessage('Tanggal sumber dan target tidak boleh sama.'); return; }
    try {
      const res = await apiPost<{ copied: number }>('/api/v1/operator-status/daily/generate', { branchId, fromTanggal: genFrom, toTanggal: genTo });
      setMessage(`Berhasil menyalin status ${res?.copied ?? 0} operator dari ${genFrom} ke ${genTo}.`);
      setGenOpen(false);
      loadMonth();
    } catch {
      setMessage('Gagal generate status (butuh role supervisor/koordinator/admin).');
    }
  };

  const loadHistory = () => {
    if (!historyOperatorId) { setMessage('Pilih operator dulu.'); return; }
    apiGet<{ operator: { nama: string }; history: OperatorHistoryEntry[] }>(
      `/api/v1/operator-status/history/${historyOperatorId}?from=${historyFrom}&to=${historyTo}`,
    )
      .then((res) => { setHistory(res.history); setHistoryOperatorName(res.operator.nama); })
      .catch(() => setMessage('Gagal memuat riwayat.'));
  };

  return (
    <>
      <PageHeader
        title="Status Operator"
        description="Validasi kesiapan operator setiap hari — Ready, Sakit, Izin, dan status lainnya — sebelum di-assign ke shift."
      />
      {message ? <div className="inline-alert">{message}</div> : null}

      <div className="master-tabs" style={{ marginBottom: 18 }}>
        <button type="button" className={`master-tab ${view === 'grid' ? 'active' : ''}`} onClick={() => setView('grid')}>Grid Bulanan</button>
        <button type="button" className={`master-tab ${view === 'history' ? 'active' : ''}`} onClick={() => setView('history')}>Histori</button>
      </div>

      {view === 'grid' ? (
        <>
          <section className="toolbar-panel">
            <label>Branch
              <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
                {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
              </select>
            </label>
            <label>Bulan
              <select value={bulan} onChange={(e) => setBulan(e.target.value)}>
                {BULAN_OPTS.map(([v, l]) => <option value={v} key={v}>{l}</option>)}
              </select>
            </label>
            <label>Tahun<input type="number" min="2000" style={{ width: 90 }} value={tahun} onChange={(e) => setTahun(Number(e.target.value) || now.getFullYear())} /></label>
            <label style={{ minWidth: 'auto', justifyContent: 'flex-end' }}>&nbsp;
              <button type="button" onClick={() => { setGenFrom(todayStr()); setGenTo(todayStr()); setGenOpen(true); }}>Generate dari Tanggal Lain</button>
            </label>
          </section>

          <MasterAddModal title="Generate Status dari Tanggal Lain" open={genOpen} onClose={() => setGenOpen(false)} onSave={runGenerate} saveLabel="Generate">
            <label>Dari Tanggal <span className="req">*</span><input type="date" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} /></label>
            <label>Ke Tanggal <span className="req">*</span><input type="date" value={genTo} onChange={(e) => setGenTo(e.target.value)} /></label>
          </MasterAddModal>

          <MasterAddModal
            title={editCell ? `Set Status — ${editCell.nama} • ${formatDate(`${tahun}-${bulan}-${editCell.day}`)}` : 'Set Status'}
            open={!!editCell}
            onClose={() => setEditCell(null)}
            onSave={saveCellEdit}
            saveLabel={isSavingCell ? 'Menyimpan...' : 'Simpan'}
          >
            <label>Status <span className="req">*</span>
              <select value={editStatusTypeId} onChange={(e) => setEditStatusTypeId(e.target.value)}>
                <option value="">— pilih —</option>
                {statusTypes.map((st) => <option value={st.id} key={st.id}>{st.nama}</option>)}
              </select>
            </label>
            <label>Catatan<input value={editCatatan} onChange={(e) => setEditCatatan(e.target.value)} placeholder="Opsional" /></label>
          </MasterAddModal>

          <div className="legend-row">
            {statusTypes.map((st) => (
              <span className="legend-chip" key={st.id}>
                <span className="legend-dot" style={{ background: st.warna ?? 'var(--muted)' }} />
                <strong>{letterFor(st.kode)}</strong> {st.nama}
              </span>
            ))}
          </div>

          <section className="card">
            <CardHeader title="Matriks Status Operator" meta={`${monthRows.length} operator • ${BULAN_OPTS.find(([v]) => v === bulan)?.[1]} ${tahun}`} />
            <div className="table-wrap">
              <table className="op-status-matrix">
                <thead>
                  <tr>
                    <th className="op-name-col">Nama Operator</th>
                    {dayList.map((d) => (
                      <th key={d}>
                        <div>{Number(d)}</div>
                        <small>{weekdayLabel(d)}</small>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {monthRows.map((row) => (
                    <tr key={row.operatorId}>
                      <td className="op-name-col" title={row.nik}><strong>{row.nama}</strong></td>
                      {dayList.map((d) => {
                        const cell = row.days[d];
                        return (
                          <td key={d}>
                            <button
                              type="button"
                              className="op-status-cell"
                              style={cell ? { background: `${warnaByKode[cell.statusKode]}22`, color: warnaByKode[cell.statusKode], borderColor: warnaByKode[cell.statusKode] } : undefined}
                              title={cell ? `${cell.statusNama}${cell.catatan ? ` — ${cell.catatan}` : ''}` : 'Belum divalidasi'}
                              onClick={() => openCellEdit(row.operatorId, row.nama, d, cell)}
                            >
                              {cell ? letterFor(cell.statusKode) : '-'}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {!monthRows.length ? <tr><td colSpan={dayList.length + 1} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada operator aktif di branch ini.</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      ) : (
        <>
          <section className="toolbar-panel">
            <label>Operator
              <select value={historyOperatorId} onChange={(e) => setHistoryOperatorId(e.target.value)}>
                <option value="">— pilih operator —</option>
                {monthRows.map((r) => <option value={r.operatorId} key={r.operatorId}>{r.nama}</option>)}
              </select>
            </label>
            <label>Dari<input type="date" value={historyFrom} onChange={(e) => setHistoryFrom(e.target.value)} /></label>
            <label>Sampai<input type="date" value={historyTo} onChange={(e) => setHistoryTo(e.target.value)} /></label>
            <label style={{ minWidth: 'auto', justifyContent: 'flex-end' }}>&nbsp;
              <button className="primary-link" type="button" onClick={loadHistory}>Lihat Riwayat</button>
            </label>
          </section>
          <section className="card">
            <CardHeader title={`Riwayat Status${historyOperatorName ? ` — ${historyOperatorName}` : ''}`} meta={`${history.length} entri`} />
            <div className="table-wrap">
              <table>
                <thead><tr><th>Tanggal</th><th>Status</th><th>Catatan</th></tr></thead>
                <tbody>
                  {history.map((h) => (
                    <tr key={h.id}>
                      <td>{formatDate(h.tanggal)}</td>
                      <td><span className="status-badge" style={{ background: `${h.statusType.warna ?? 'var(--muted)'}22`, color: h.statusType.warna ?? 'var(--text)' }}>{h.statusType.nama}</span></td>
                      <td>{h.catatan ?? '-'}</td>
                    </tr>
                  ))}
                  {!history.length ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: '16px 0' }}>Pilih operator & klik "Lihat Riwayat".</td></tr> : null}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
};

type RitRow = {
  unitId: string;
  operatorId: string;
  pitId: string;
  stockpileId: string;
  material: string;
  jumlahRit: number;
  grossKg?: number;
  tareKg?: number;
  catatan: string;
};

const RitPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);
  const [rits, setRits] = useState<Rit[]>([]);
  const [materials, setMaterials] = useState<MaterialOption[]>([]);
  const [pits, setPits] = useState<LokasiOption[]>([]);
  const [stockpiles, setStockpiles] = useState<LokasiOption[]>([]);
  const [distances, setDistances] = useState<DistanceRow[]>([]);
  const [branchId, setBranchId] = useState(getSession()?.branchId ?? '');
  const [shiftId, setShiftId] = useState<string>('');
  const [unitId, setUnitId] = useState('');
  const [operatorId, setOperatorId] = useState('');
  const [material, setMaterial] = useState('Batu');
  const [jumlahRit, setJumlahRit] = useState(1);
  const [grossKg, setGrossKg] = useState<number | undefined>(undefined);
  const [tareKg, setTareKg] = useState<number | undefined>(undefined);
  const [catatan, setCatatan] = useState('');
  const [editTargetId, setEditTargetId] = useState<string | null>(null);
  const [editMaterial, setEditMaterial] = useState('');
  const [editJumlahRit, setEditJumlahRit] = useState(1);
  const [editGrossKg, setEditGrossKg] = useState<number | undefined>(undefined);
  const [editTareKg, setEditTareKg] = useState<number | undefined>(undefined);
  const [editCatatan, setEditCatatan] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [gridRows, setGridRows] = useState<RitRow[]>([]);
  const [deleteTarget, setDeleteTarget] = useState<Rit | null>(null);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');

  const loadMeta = () => {
    setIsLoading(true);
    Promise.all([
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<Shift[]>(`/api/v1/shifts?branchId=${branchId}`),
      apiGet<Unit[]>(`/api/v1/master/units?branchId=${branchId}&aktif=true`),
      apiGet<Operator[]>(`/api/v1/master/operators?branchId=${branchId}&aktif=true`),
      apiGet<MaterialOption[]>('/api/v1/master/materials'),
      apiGet<LokasiOption[]>(`/api/v1/master/pits?branchId=${branchId}&aktif=true`),
      apiGet<LokasiOption[]>(`/api/v1/master/stockpiles?branchId=${branchId}&aktif=true`),
      apiGet<DistanceRow[]>('/api/v1/master/pit-stockpile-distances'),
    ])
      .then(([nextBranches, nextShifts, nextUnits, nextOperators, nextMaterials, nextPits, nextStockpiles, nextDistances]) => {
        setBranches(nextBranches);
        setShifts(nextShifts);
        setUnits(nextUnits);
        setOperators(nextOperators);
        setMaterials(nextMaterials);
        setPits(nextPits);
        setStockpiles(nextStockpiles);
        setDistances(nextDistances);
        setMessage('');

        const selected = nextShifts.find((shift) => shift.status === 'open') ?? nextShifts[0];
        setShiftId(selected?.id ?? '');
        setUnitId(nextUnits[0]?.id ?? '');
        setOperatorId(nextOperators[0]?.id ?? '');
      })
      .catch(() => setMessage('Gagal mengambil data rit dari API.'))
      .finally(() => setIsLoading(false));
  };

  const loadRits = () => {
    if (!shiftId) {
      setRits([]);
      return;
    }
    setIsLoading(true);
    apiGet<Rit[]>(`/api/v1/rits?shiftId=${shiftId}`)
      .then(setRits)
      .catch(() => setMessage('Gagal memuat daftar rit.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadMeta();
  }, [branchId]);

  useEffect(() => {
    loadRits();
  }, [shiftId]);

  const selectedShift = shifts.find((shift) => shift.id === shiftId);

  const confirmDeleteRit = async () => {
    if (!deleteTarget) return;
    try {
      await apiDelete(`/api/v1/rits/${deleteTarget.id}`);
      setMessage(`Rit ${deleteTarget.noRit} dihapus.`);
      setDeleteTarget(null);
      loadRits();
    } catch {
      setMessage('Gagal menghapus rit. Butuh role supervisor/admin.');
    }
  };

  const openEditRequest = (rit: Rit) => {
    setEditTargetId(rit.id);
    setEditMaterial(rit.material);
    setEditJumlahRit(rit.jumlahRit);
    setEditGrossKg(rit.grossKg);
    setEditTareKg(rit.tareKg);
    setEditCatatan(rit.catatan ?? '');
    setMessage(`Menyiapkan permintaan edit untuk ${rit.noRit}`);
  };

  const requestEdit = async () => {
    if (!editTargetId) return;

    const changes: Record<string, unknown> = {};
    if (editMaterial.trim()) changes.material = editMaterial;
    if (editJumlahRit) changes.jumlahRit = editJumlahRit;
    if (editGrossKg !== undefined) changes.grossKg = editGrossKg;
    if (editTareKg !== undefined) changes.tareKg = editTareKg;
    if (editCatatan.trim()) changes.catatan = editCatatan;

    if (!Object.keys(changes).length) {
      setMessage('Tambahkan setidaknya satu perubahan sebelum mengirim request.');
      return;
    }

    try {
      await apiPost('/api/v1/rits/' + editTargetId + '/edit-request', {
        requestedBy: 'user-demo',
        changes,
      });
      setMessage(`Permintaan edit untuk ${editTargetId} terkirim.`);
      setEditTargetId(null);
      setEditMaterial('');
      setEditJumlahRit(1);
      setEditGrossKg(undefined);
      setEditTareKg(undefined);
      setEditCatatan('');
      loadRits();
      window.dispatchEvent(new Event('haulops:refresh-approval-count'));
    } catch {
      setMessage('Gagal mengirim edit request. Silakan coba lagi.');
    }
  };

  const createRit = async () => {
    if (!shiftId || !unitId || !material.trim()) {
      setMessage('Pilih shift, unit, dan material untuk membuat rit.');
      return;
    }

    try {
      const payload = {
        shiftId,
        unitId,
        operatorId: operatorId || undefined,
        material,
        jumlahRit,
        grossKg,
        tareKg,
        catatan,
      };
      const created = await apiPost<Rit>('/api/v1/rits', payload);
      setMessage(`RIT ${created.noRit} berhasil disimpan.`);
      setCatatan('');
      setJumlahRit(1);
      setGrossKg(undefined);
      setTareKg(undefined);
      loadRits();
    } catch {
      setMessage('Gagal menyimpan rit. Periksa data dan coba lagi.');
    }
  };

  // ---- Batch input (grid) ----
  const newGridRow = (): RitRow => ({
    unitId: unitId || units[0]?.id || '',
    operatorId: operatorId || operators[0]?.id || '',
    pitId: pits[0]?.id || '',
    stockpileId: stockpiles[0]?.id || '',
    material: material || 'OB',
    jumlahRit: 1,
    grossKg: undefined,
    tareKg: undefined,
    catatan: '',
  });

  const openGrid = async () => {
    if (!shiftId) {
      setMessage('Pilih shift terlebih dahulu sebelum menambah rit.');
      return;
    }
    setMessage('');
    setIsGridOpen(true);
    try {
      // Baris otomatis terisi dari unit yang di-assign pada shift ini (hari & shift sama).
      const shiftUnits = await apiGet<ShiftUnitRow[]>(`/api/v1/shifts/${shiftId}/units`);
      if (shiftUnits.length) {
        setGridRows(
          shiftUnits.map((su) => ({
            unitId: su.unitId,
            operatorId: su.operatorId ?? operators[0]?.id ?? '',
            pitId: pits[0]?.id ?? '',
            stockpileId: stockpiles[0]?.id ?? '',
            material: su.material ?? materials[0]?.kode ?? 'OB',
            jumlahRit: 1,
            grossKg: undefined,
            tareKg: undefined,
            catatan: '',
          })),
        );
        setMessage(`${shiftUnits.length} unit ter-assign shift ini dimuat otomatis ke grid.`);
      } else {
        setGridRows([newGridRow()]);
        setMessage('Shift ini belum punya unit ter-assign. Tambahkan unit secara manual.');
      }
    } catch {
      setGridRows([newGridRow()]);
    }
  };

  const updateGridRow = (index: number, patch: Partial<RitRow>) =>
    setGridRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  const addGridRow = () => setGridRows((prev) => [...prev, newGridRow()]);
  const duplicateLastRow = () => setGridRows((prev) => (prev.length ? [...prev, { ...prev[prev.length - 1] }] : [newGridRow()]));
  const removeGridRow = (index: number) => setGridRows((prev) => prev.filter((_, i) => i !== index));
  const fillDown = () =>
    setGridRows((prev) => {
      if (!prev.length) return prev;
      const first = prev[0];
      return prev.map((row) => ({ ...row, unitId: first.unitId, operatorId: first.operatorId, pitId: first.pitId, stockpileId: first.stockpileId, material: first.material }));
    });

  // Jarak km dari matriks master (pasangan pit+stockpile). Null bila belum diisi admin.
  const jarakFor = (pitId: string, stockpileId: string): number | null =>
    (pitId && stockpileId ? distances.find((d) => d.pitId === pitId && d.stockpileId === stockpileId)?.jarakKm : undefined) ?? null;

  const gridTotalRit = gridRows.reduce((sum, row) => sum + (row.jumlahRit || 0), 0);
  // Total = Ton/Rit × jumlah; Ton/Rit default ke kapasitas tipe unit bila tanpa timbangan.
  const gridTotalNetto = gridRows.reduce((sum, row) => {
    const kapasitas = units.find((u) => u.id === row.unitId)?.tipe?.kapasitasTon;
    const tonRit = row.grossKg && row.tareKg ? (row.grossKg - row.tareKg) / 1000 : kapasitas ?? 0;
    return sum + tonRit * (row.jumlahRit || 1);
  }, 0);

  const saveAllRows = async () => {
    if (!shiftId) {
      setMessage('Pilih shift terlebih dahulu.');
      return;
    }
    const valid = gridRows.filter((row) => row.unitId && row.material.trim() && row.jumlahRit > 0);
    if (!valid.length) {
      setMessage('Isi minimal satu baris dengan unit, material, dan jumlah rit.');
      return;
    }
    try {
      const created = await apiPost<Rit[]>(
        '/api/v1/rits/import',
        valid.map((row) => ({
          shiftId,
          unitId: row.unitId,
          operatorId: row.operatorId || undefined,
          pitId: row.pitId || undefined,
          stockpileId: row.stockpileId || undefined,
          material: row.material,
          jumlahRit: row.jumlahRit,
          grossKg: row.grossKg,
          tareKg: row.tareKg,
          catatan: row.catatan || undefined,
        })),
      );
      setMessage(`${created.length} rit berhasil disimpan dari grid.`);
      setIsGridOpen(false);
      loadRits();
    } catch {
      setMessage('Gagal menyimpan rit dari grid. Periksa data dan coba lagi.');
    }
  };

  // ---- Import Timbangan (CSV) ----
  // Format header (case-insensitive): unit,material,jumlah,gross,tare[,catatan]
  // "unit" = kode unit (mis. DT-001). gross/tare dalam kg.
  const parseImportCsv = (): { shiftId: string; unitId: string; material: string; jumlahRit: number; grossKg?: number; tareKg?: number; catatan?: string }[] => {
    const lines = importText.trim().split(/\r?\n/).filter((line) => line.trim());
    if (lines.length < 2) return [];
    const header = lines[0].split(',').map((h) => h.trim().toLowerCase());
    const idx = (name: string) => header.indexOf(name);
    const iUnit = idx('unit');
    const iMaterial = idx('material');
    const iJumlah = idx('jumlah');
    const iGross = idx('gross');
    const iTare = idx('tare');
    const iCatatan = idx('catatan');
    const unitByKode = new Map(units.map((u) => [u.kode.toLowerCase(), u.id]));
    const rows: ReturnType<typeof parseImportCsv> = [];
    for (const line of lines.slice(1)) {
      const cells = line.split(',').map((c) => c.trim());
      const unitId = unitByKode.get((cells[iUnit] ?? '').toLowerCase());
      const material = iMaterial >= 0 ? cells[iMaterial] : '';
      if (!unitId || !material) continue;
      const gross = iGross >= 0 && cells[iGross] ? Number(cells[iGross]) : undefined;
      const tare = iTare >= 0 && cells[iTare] ? Number(cells[iTare]) : undefined;
      rows.push({
        shiftId,
        unitId,
        material,
        jumlahRit: iJumlah >= 0 && cells[iJumlah] ? Number(cells[iJumlah]) || 1 : 1,
        grossKg: Number.isFinite(gross) ? gross : undefined,
        tareKg: Number.isFinite(tare) ? tare : undefined,
        catatan: iCatatan >= 0 ? cells[iCatatan] || undefined : undefined,
      });
    }
    return rows;
  };

  const importRows = importText.trim() ? parseImportCsv() : [];

  const processImport = async () => {
    if (!shiftId) {
      setMessage('Pilih shift terlebih dahulu.');
      return;
    }
    const rows = parseImportCsv();
    if (!rows.length) {
      setMessage('Tidak ada baris valid. Pastikan header "unit,material,jumlah,gross,tare" dan kode unit cocok.');
      return;
    }
    try {
      const created = await apiPost<Rit[]>('/api/v1/rits/import', rows);
      setMessage(`Import selesai: ${created.length} rit dibuat.`);
      setIsImportOpen(false);
      setImportText('');
      loadRits();
    } catch {
      setMessage('Import gagal. Periksa format data.');
    }
  };

  const onImportFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImportText(String(reader.result ?? ''));
    reader.readAsText(file);
  };

  return (
    <>
      <PageHeader
        title="Rit Operation"
        description="Input rit harian untuk shift aktif, lengkap dengan unit, material, dan tonase."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadRits}>Muat Ulang</button>
            <button onClick={() => { setImportText(''); setIsImportOpen(true); }}>📥 Import Timbangan (CSV)</button>
            <button className="primary-link" onClick={openGrid}>+ Tambah Rit</button>
          </div>
        }
      />
      {message ? <div className="inline-alert">{message}</div> : null}
      <section className="toolbar-panel">
        <label>
          Branch
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            {branches.map((branch) => (
              <option value={branch.id} key={branch.id}>{branch.nama}</option>
            ))}
          </select>
        </label>
        <label>
          Shift
          <select value={shiftId} onChange={(event) => setShiftId(event.target.value)}>
            <option value="">Pilih shift</option>
            {shifts.map((shift) => (
              <option value={shift.id} key={shift.id}>
                {formatDate(shift.tanggal)} • {formatShiftType(shift.tipe)} • {shift.status}
              </option>
            ))}
          </select>
        </label>
        <label>
          Unit
          <select value={unitId} onChange={(event) => setUnitId(event.target.value)}>
            <option value="">Pilih unit</option>
            {units.map((unit) => (
              <option value={unit.id} key={unit.id}>{unit.kode} • {unit.tipe?.nama ?? '-'}</option>
            ))}
          </select>
        </label>
        <label>
          Operator
          <select value={operatorId} onChange={(event) => setOperatorId(event.target.value)}>
            <option value="">Auto pilih</option>
            {operators.map((operator) => (
              <option value={operator.id} key={operator.id}>{operator.nama}</option>
            ))}
          </select>
        </label>
      </section>

      {isImportOpen ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsImportOpen(false);
          }}
        >
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Import Timbangan">
            <div className="modal-header">
              <span className="modal-title">Import Data Timbangan (CSV)</span>
              <button className="modal-close" type="button" onClick={() => setIsImportOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note">
                Format header (baris pertama): <strong>unit,material,jumlah,gross,tare,catatan</strong>. Kolom <strong>unit</strong> memakai kode
                unit (mis. DT-001), <strong>gross</strong>/<strong>tare</strong> dalam kg. Rit dibuat pada shift terpilih:{' '}
                <strong>{selectedShift ? `${formatDate(selectedShift.tanggal)} • ${formatShiftType(selectedShift.tipe)}` : 'belum dipilih'}</strong>.
              </div>
              <div className="modal-form-grid" style={{ gridTemplateColumns: '1fr auto', alignItems: 'end' }}>
                <label>
                  Pilih File CSV
                  <input type="file" accept=".csv,text/csv" onChange={(event) => onImportFile(event.target.files?.[0])} />
                </label>
                <button
                  type="button"
                  className="btn-ghost-sm"
                  onClick={() => setImportText('unit,material,jumlah,gross,tare,catatan\nDT-001,OB,3,45000,15000,\nDT-002,ORE,2,50000,15000,shift pagi')}
                >
                  Isi Contoh
                </button>
              </div>
              <label style={{ display: 'grid', gap: 6, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Data CSV (bisa diedit / paste manual)
                <textarea
                  value={importText}
                  onChange={(event) => setImportText(event.target.value)}
                  rows={8}
                  style={{ fontFamily: 'monospace', fontSize: 13, border: '1px solid var(--line)', borderRadius: 8, padding: 10, background: 'var(--cream)' }}
                  placeholder={'unit,material,jumlah,gross,tare,catatan\nDT-001,OB,3,45000,15000,'}
                />
              </label>
              <div className="grid-summary">
                <div><span>Baris valid</span><strong>{importRows.length}</strong></div>
                <div><span>Total Rit</span><strong>{importRows.reduce((s, r) => s + (r.jumlahRit || 0), 0)}</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsImportOpen(false)}>Batal</button>
              <button className="primary-link" type="button" onClick={processImport} disabled={!importRows.length}>Proses Import ({importRows.length})</button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteTarget ? (
        <div
          className="modal-overlay"
          onClick={(event) => {
            if (event.target === event.currentTarget) setDeleteTarget(null);
          }}
        >
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Konfirmasi Hapus">
            <div className="modal-header">
              <span className="modal-title">Konfirmasi Hapus</span>
              <button className="modal-close" type="button" onClick={() => setDeleteTarget(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note" style={{ background: '#f7e0e2', borderColor: '#e2b6ba', color: 'var(--red)' }}>
                Hapus rit <strong>{deleteTarget.noRit}</strong>? Tindakan ini tidak dapat dibatalkan.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDeleteTarget(null)}>Batal</button>
              <button className="btn-danger-sm" type="button" onClick={confirmDeleteRit} style={{ padding: '10px 18px' }}>Hapus</button>
            </div>
          </div>
        </div>
      ) : null}

      {isGridOpen ? (
        <div className="modal-overlay">
          <div className="modal modal-full" role="dialog" aria-modal="true" aria-label="Input Rit Baru">
            <div className="modal-header">
              <span className="modal-title">
                Input Rit Baru — {selectedShift ? `${formatDate(selectedShift.tanggal)} • ${formatShiftType(selectedShift.tipe)}` : 'pilih shift'}
              </span>
              <button className="modal-close" type="button" onClick={() => setIsGridOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section-head">
                <div className="modal-section-title" style={{ margin: 0 }}>Data Rit per Unit ({gridRows.length} baris)</div>
                <div className="modal-section-actions">
                  <button type="button" className="btn-ghost-sm" onClick={fillDown}>⬇ Isi ke Bawah</button>
                  <button type="button" className="btn-ghost-sm" onClick={duplicateLastRow}>📋 Duplikat</button>
                  <button type="button" className="btn-gold-sm" onClick={addGridRow}>+ Baris Baru</button>
                </div>
              </div>
              <div className="modal-note">
                Baris otomatis dimuat dari unit yang di-assign pada shift ini (hari &amp; shift sama). Ton/Rit = (Gross − Tare) / 1000, atau estimasi kapasitas unit bila tanpa timbangan.
              </div>
              <div className="modal-unit-list">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>#</th>
                      <th>Unit</th>
                      <th>Tipe Unit</th>
                      <th>Operator</th>
                      <th>Pit</th>
                      <th>Material</th>
                      <th>Stockpile</th>
                      <th>Jarak (km)</th>
                      <th>Jumlah</th>
                      <th>Gross (kg)</th>
                      <th>Tare (kg)</th>
                      <th>Ton/Rit</th>
                      <th>Catatan</th>
                      <th style={{ width: 44 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {gridRows.map((row, index) => {
                      const rowUnit = units.find((u) => u.id === row.unitId);
                      const kapasitas = rowUnit?.tipe?.kapasitasTon;
                      const hasTimbangan = Boolean(row.grossKg && row.tareKg);
                      // Ton/Rit: dari timbangan, atau default estimasi = kapasitas tipe unit.
                      const tonRit = hasTimbangan ? (row.grossKg! - row.tareKg!) / 1000 : kapasitas;
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <select className="cell-select" value={row.unitId} onChange={(event) => updateGridRow(index, { unitId: event.target.value })}>
                              <option value="">— pilih —</option>
                              {units.map((unit) => <option value={unit.id} key={unit.id}>{unit.kode}</option>)}
                            </select>
                          </td>
                          <td>
                            <span style={{ color: 'var(--muted)' }}>
                              {rowUnit?.tipe?.nama ?? '-'}
                              {kapasitas ? ` • ${kapasitas} t` : ''}
                            </span>
                          </td>
                          <td>
                            <select className="cell-select" value={row.operatorId} onChange={(event) => updateGridRow(index, { operatorId: event.target.value })}>
                              <option value="">Auto</option>
                              {operators.map((op) => <option value={op.id} key={op.id}>{op.nama}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="cell-select" value={row.pitId} onChange={(event) => updateGridRow(index, { pitId: event.target.value })}>
                              <option value="">—</option>
                              {pits.map((pit) => <option value={pit.id} key={pit.id}>{pit.nama}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="cell-select" value={row.material} onChange={(event) => updateGridRow(index, { material: event.target.value })}>
                              {materials.map((mat) => <option value={mat.kode} key={mat.id}>{mat.nama}</option>)}
                              {!materials.some((mat) => mat.kode === row.material) && row.material ? <option value={row.material}>{row.material}</option> : null}
                            </select>
                          </td>
                          <td>
                            <select className="cell-select" value={row.stockpileId} onChange={(event) => updateGridRow(index, { stockpileId: event.target.value })}>
                              <option value="">—</option>
                              {stockpiles.map((sp) => <option value={sp.id} key={sp.id}>{sp.nama}</option>)}
                            </select>
                          </td>
                          <td>
                            {(() => {
                              const j = jarakFor(row.pitId, row.stockpileId);
                              return j != null
                                ? <span title="Otomatis dari matriks jarak master">{formatNumber(j)} km</span>
                                : <span style={{ color: 'var(--muted)', fontStyle: 'italic' }} title="Jarak belum diisi di master Pit & Stockpile">—</span>;
                            })()}
                          </td>
                          <td>
                            <input className="cell-select" style={{ width: 70 }} type="number" min="1" value={row.jumlahRit}
                              onChange={(event) => updateGridRow(index, { jumlahRit: Number(event.target.value) || 1 })} />
                          </td>
                          <td>
                            <input className="cell-select" style={{ width: 90 }} type="number" value={row.grossKg ?? ''}
                              onChange={(event) => updateGridRow(index, { grossKg: event.target.value ? Number(event.target.value) : undefined })} />
                          </td>
                          <td>
                            <input className="cell-select" style={{ width: 90 }} type="number" value={row.tareKg ?? ''}
                              onChange={(event) => updateGridRow(index, { tareKg: event.target.value ? Number(event.target.value) : undefined })} />
                          </td>
                          <td>
                            {tonRit != null ? (
                              <span style={hasTimbangan ? undefined : { color: 'var(--muted)', fontStyle: 'italic' }} title={hasTimbangan ? 'Dari timbangan' : 'Estimasi dari kapasitas unit'}>
                                {formatNumber(Number(tonRit.toFixed(2)))} t{hasTimbangan ? '' : ' (est)'}
                              </span>
                            ) : '-'}
                          </td>
                          <td>
                            <input className="cell-select" style={{ minWidth: 120 }} value={row.catatan}
                              onChange={(event) => updateGridRow(index, { catatan: event.target.value })} />
                          </td>
                          <td>
                            <button type="button" className="row-remove" title="Hapus baris" onClick={() => removeGridRow(index)} disabled={gridRows.length <= 1}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="grid-summary">
                <div><span>Baris</span><strong>{gridRows.length}</strong></div>
                <div><span>Total Rit</span><strong>{gridTotalRit}</strong></div>
                <div><span>Total Netto</span><strong>{formatNumber(Number(gridTotalNetto.toFixed(2)))} t</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsGridOpen(false)}>Batal</button>
              <button className="primary-link" type="button" onClick={saveAllRows}>💾 Simpan Semua Rit</button>
            </div>
          </div>
        </div>
      ) : null}

      <section className="toolbar-panel">
        <label>
          Material
          <input value={material} onChange={(event) => setMaterial(event.target.value)} />
        </label>
        <label>
          Jumlah Rit
          <input
            type="number"
            min="1"
            value={jumlahRit}
            onChange={(event) => setJumlahRit(Number(event.target.value) || 1)}
          />
        </label>
        <label>
          Gross (kg)
          <input
            type="number"
            value={grossKg ?? ''}
            onChange={(event) => setGrossKg(event.target.value ? Number(event.target.value) : undefined)}
          />
        </label>
        <label>
          Tare (kg)
          <input
            type="number"
            value={tareKg ?? ''}
            onChange={(event) => setTareKg(event.target.value ? Number(event.target.value) : undefined)}
          />
        </label>
        <label style={{ flex: '1 1 100%' }}>
          Catatan
          <input value={catatan} onChange={(event) => setCatatan(event.target.value)} />
        </label>
        <button className="primary-link" onClick={createRit} type="button">
          Simpan Rit Baru
        </button>
      </section>

      {editTargetId ? (
        <section className="card">
          <CardHeader title="Request Edit Rit" meta={`Rit ID: ${editTargetId}`} />
          <div className="toolbar-panel">
            <label>
              Material
              <input value={editMaterial} onChange={(event) => setEditMaterial(event.target.value)} />
            </label>
            <label>
              Jumlah Rit
              <input
                type="number"
                min="1"
                value={editJumlahRit}
                onChange={(event) => setEditJumlahRit(Number(event.target.value) || 1)}
              />
            </label>
            <label>
              Gross (kg)
              <input
                type="number"
                value={editGrossKg ?? ''}
                onChange={(event) => setEditGrossKg(event.target.value ? Number(event.target.value) : undefined)}
              />
            </label>
            <label>
              Tare (kg)
              <input
                type="number"
                value={editTareKg ?? ''}
                onChange={(event) => setEditTareKg(event.target.value ? Number(event.target.value) : undefined)}
              />
            </label>
            <label style={{ flex: '1 1 100%' }}>
              Catatan
              <input value={editCatatan} onChange={(event) => setEditCatatan(event.target.value)} />
            </label>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
              <button className="primary-link" onClick={requestEdit} type="button">
                Kirim Request Edit
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditTargetId(null);
                  setEditMaterial('');
                  setEditJumlahRit(1);
                  setEditGrossKg(undefined);
                  setEditTareKg(undefined);
                  setEditCatatan('');
                }}
              >
                Batal
              </button>
            </div>
          </div>
        </section>
      ) : null}

      <section className="card">
        <CardHeader
          title="Daftar Rit"
          meta={isLoading ? 'Memuat daftar rit...' : `${rits.length} rit dari shift terpilih`}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>No Rit</th>
                <th>Shift</th>
                <th>Unit</th>
                <th>Pit</th>
                <th>Material</th>
                <th>Stockpile</th>
                <th>Jarak (km)</th>
                <th>Jumlah</th>
                <th>Gross</th>
                <th>Tare</th>
                <th>Netto</th>
                <th>Status</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {rits.map((rit) => (
                <tr key={rit.id}>
                  <td>{rit.noRit}</td>
                  <td>{selectedShift ? `${formatDate(selectedShift.tanggal)} • ${formatShiftType(selectedShift.tipe)}` : rit.shiftId}</td>
                  <td>{rit.unit?.kode ?? rit.unitId}</td>
                  <td>{rit.pit?.nama ?? '-'}</td>
                  <td>{rit.material}</td>
                  <td>{rit.stockpile?.nama ?? '-'}</td>
                  <td>{rit.jarakKm != null ? `${formatNumber(rit.jarakKm)} km` : '-'}</td>
                  <td>{rit.jumlahRit}</td>
                  <td>{rit.grossKg ?? '-'}</td>
                  <td>{rit.tareKg ?? '-'}</td>
                  <td>
                    {rit.nettoTon
                      ? `${formatNumber(rit.nettoTon)} t`
                      : rit.estimasiTon
                        ? <span style={{ color: 'var(--muted)', fontStyle: 'italic' }} title="Estimasi dari kapasitas unit">~{formatNumber(rit.estimasiTon)} t</span>
                        : '-'}
                  </td>
                  <td>{rit.statusTimbangan}</td>
                  <td>
                    <div className="rowact">
                      <button type="button" onClick={() => openEditRequest(rit)}>Request Edit</button>
                      <button type="button" className="btn-danger-sm" onClick={() => setDeleteTarget(rit)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!rits.length && !isLoading ? (
                <tr>
                  <td colSpan={13} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Belum ada data rit untuk shift terpilih.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type ApprovalHistoryRow = { type: string; id: string; status: string; reviewedBy?: unknown; updatedAt: string };

const parseJsonSafe = (raw: string): Record<string, unknown> => {
  try {
    const v = JSON.parse(raw);
    return v && typeof v === 'object' ? v : {};
  } catch {
    return {};
  }
};

const ApprovalPage = () => {
  const [tab, setTab] = useState<'shifts' | 'editreq' | 'history'>('shifts');
  const [pendingShifts, setPendingShifts] = useState<Shift[]>([]);
  const [editRequests, setEditRequests] = useState<EditRequest[]>([]);
  const [history, setHistory] = useState<ApprovalHistoryRow[]>([]);
  const [selShifts, setSelShifts] = useState<string[]>([]);
  const [selEr, setSelEr] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const refreshBadge = () => window.dispatchEvent(new Event('haulops:refresh-approval-count'));

  const loadAll = () => {
    setIsLoading(true);
    Promise.all([
      apiGet<Shift[]>('/api/v1/shifts?status=pending'),
      apiGet<EditRequest[]>('/api/v1/approvals/edit-requests?status=pending'),
      apiGet<ApprovalHistoryRow[]>('/api/v1/approvals'),
    ])
      .then(([shifts, ers, hist]) => {
        setPendingShifts(shifts);
        setEditRequests(ers);
        setHistory(hist);
        setSelShifts([]);
        setSelEr([]);
        setMessage('');
      })
      .catch(() => setMessage('Gagal memuat data approval.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadAll();
  }, []);

  const toggleSel = (setter: React.Dispatch<React.SetStateAction<string[]>>, id: string) =>
    setter((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const decideShift = async (id: string, aksi: 'approve' | 'reject') => {
    try {
      await apiPost(`/api/v1/shifts/${id}/${aksi}`, {});
      setMessage(`Shift ${aksi === 'approve' ? 'disetujui' : 'ditolak'}.`);
      refreshBadge();
      loadAll();
    } catch {
      setMessage('Aksi gagal. Hanya shift pending yang bisa diproses.');
    }
  };

  const bulkShift = async (aksi: 'approve' | 'reject') => {
    if (!selShifts.length) {
      setMessage('Pilih minimal satu shift.');
      return;
    }
    try {
      await apiPost(`/api/v1/approvals/bulk-${aksi}-shifts`, { shiftIds: selShifts });
      setMessage(`${selShifts.length} shift di-${aksi}.`);
      refreshBadge();
      loadAll();
    } catch {
      setMessage('Bulk aksi gagal.');
    }
  };

  const decideEr = async (id: string, aksi: 'approve' | 'reject') => {
    try {
      if (aksi === 'reject') {
        const reason = window.prompt('Alasan reject (opsional):') ?? '';
        await apiPost(`/api/v1/approvals/edit-requests/${id}/reject`, { reason });
      } else {
        await apiPost(`/api/v1/approvals/edit-requests/${id}/approve`, {});
      }
      setMessage(`Edit request ${aksi === 'approve' ? 'disetujui' : 'ditolak'}.`);
      refreshBadge();
      loadAll();
    } catch {
      setMessage('Aksi edit request gagal.');
    }
  };

  const bulkEr = async (aksi: 'approve' | 'reject') => {
    if (!selEr.length) {
      setMessage('Pilih minimal satu edit request.');
      return;
    }
    try {
      await Promise.all(selEr.map((id) => apiPost(`/api/v1/approvals/edit-requests/${id}/${aksi}`, {})));
      setMessage(`${selEr.length} edit request di-${aksi}.`);
      refreshBadge();
      loadAll();
    } catch {
      setMessage('Bulk aksi edit request gagal.');
    }
  };

  const reviewerName = (v: unknown): string => {
    if (!v) return '-';
    if (typeof v === 'string') return v;
    if (typeof v === 'object' && v && 'nama' in v) return String((v as { nama: unknown }).nama);
    return '-';
  };

  const tabs: Array<{ key: typeof tab; label: string; count: number }> = [
    { key: 'shifts', label: 'Approval Shift', count: pendingShifts.length },
    { key: 'editreq', label: 'Edit Request', count: editRequests.length },
    { key: 'history', label: 'Riwayat', count: history.length },
  ];

  return (
    <>
      <PageHeader
        title="Approval & Edit Request"
        description="Review shift pending dan edit request; approve/reject satuan atau bulk, lengkap dengan riwayat."
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <span className="status-badge pending">{pendingShifts.length + editRequests.length} Menunggu Review</span>
            <button onClick={loadAll}>Segarkan</button>
          </div>
        }
      />
      {message ? <div className="inline-alert">{message}</div> : null}

      <section className="toolbar-panel">
        {tabs.map((t) => (
          <button key={t.key} type="button" className={tab === t.key ? 'primary-link' : ''} onClick={() => setTab(t.key)}>
            {t.label}{t.count ? ` (${t.count})` : ''}
          </button>
        ))}
      </section>

      {tab === 'shifts' ? (
        <>
          <section className="toolbar-panel" style={{ alignItems: 'center' }}>
            <label style={{ minWidth: 'auto', flexDirection: 'row', alignItems: 'center', textTransform: 'none' }}>
              <input
                type="checkbox"
                checked={pendingShifts.length > 0 && selShifts.length === pendingShifts.length}
                onChange={(e) => setSelShifts(e.target.checked ? pendingShifts.map((s) => s.id) : [])}
              /> &nbsp;Pilih Semua ({selShifts.length})
            </label>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button type="button" className="btn-gold-sm" onClick={() => bulkShift('approve')}>✓ Approve Selected</button>
              <button type="button" className="btn-danger-sm" onClick={() => bulkShift('reject')}>✕ Reject Selected</button>
            </div>
          </section>
          {pendingShifts.map((shift) => (
            <section className="card" key={shift.id}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <input type="checkbox" checked={selShifts.includes(shift.id)} onChange={() => toggleSel(setSelShifts, shift.id)} />
                <strong style={{ color: 'var(--brown-deep)' }}>⏳ {formatShiftType(shift.tipe)} — {formatDate(shift.tanggal)}</strong>
                <span className="status-badge pending" style={{ marginLeft: 'auto' }}>Pending Approval</span>
              </div>
              <div className="stat-grid">
                <article className="stat-card"><span>Ritase</span><strong>{shift.ritase}</strong></article>
                <article className="stat-card"><span>Tonase</span><strong>{formatNumber(shift.tonase)} t</strong></article>
                <article className="stat-card"><span>PA</span><strong>{shift.kpi.pa}%</strong></article>
                <article className="stat-card"><span>UA</span><strong>{shift.kpi.ua}%</strong></article>
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 12 }}>
                <button type="button" className="btn-danger-sm" onClick={() => decideShift(shift.id, 'reject')}>✕ Reject</button>
                <button type="button" className="primary-link" onClick={() => decideShift(shift.id, 'approve')}>✓ Approve Shift</button>
              </div>
            </section>
          ))}
          {!pendingShifts.length && !isLoading ? (
            <section className="card"><p style={{ textAlign: 'center', padding: '24px 0', opacity: 0.7 }}>Tidak ada shift menunggu approval.</p></section>
          ) : null}
        </>
      ) : null}

      {tab === 'editreq' ? (
        <>
          <section className="toolbar-panel" style={{ alignItems: 'center' }}>
            <label style={{ minWidth: 'auto', flexDirection: 'row', alignItems: 'center', textTransform: 'none' }}>
              <input
                type="checkbox"
                checked={editRequests.length > 0 && selEr.length === editRequests.length}
                onChange={(e) => setSelEr(e.target.checked ? editRequests.map((r) => r.id) : [])}
              /> &nbsp;Pilih Semua ({selEr.length})
            </label>
            <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
              <button type="button" className="btn-gold-sm" onClick={() => bulkEr('approve')}>✓ Approve Selected</button>
              <button type="button" className="btn-danger-sm" onClick={() => bulkEr('reject')}>✕ Reject Selected</button>
            </div>
          </section>
          {editRequests.map((req) => {
            const changes = parseJsonSafe(req.nilaiBaru);
            const old = parseJsonSafe(req.nilaiLama);
            const keys = Object.keys(changes);
            return (
              <section className="card" key={req.id}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                  <input type="checkbox" checked={selEr.includes(req.id)} onChange={() => toggleSel(setSelEr, req.id)} />
                  <strong style={{ color: 'var(--brown-deep)' }}>{req.tipe} · {req.recordId.slice(0, 12)}</strong>
                  <span style={{ color: 'var(--muted)', fontSize: 12 }}>{new Date(req.createdAt).toLocaleString('id-ID')}</span>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  {(keys.length ? keys : [req.field]).map((k) => (
                    <div key={k} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr', gap: 10, alignItems: 'center' }}>
                      <span style={{ fontWeight: 800, fontSize: 12, textTransform: 'uppercase', color: 'var(--muted)' }}>{k}</span>
                      <div style={{ background: '#f7e0e2', color: 'var(--red)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                        <div style={{ fontSize: 10, textTransform: 'uppercase' }}>Nilai Lama</div>
                        <strong>{String(old[k] ?? '-')}</strong>
                      </div>
                      <div style={{ background: '#e3f2e8', color: 'var(--green)', borderRadius: 8, padding: '8px 10px', fontSize: 13 }}>
                        <div style={{ fontSize: 10, textTransform: 'uppercase' }}>Nilai Baru</div>
                        <strong>{String(changes[k] ?? '-')}</strong>
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: 13, color: 'var(--muted)', marginTop: 10 }}>Alasan: {req.alasan}</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                  <button type="button" className="btn-danger-sm" onClick={() => decideEr(req.id, 'reject')}>✕ Reject</button>
                  <button type="button" className="btn-gold-sm" onClick={() => decideEr(req.id, 'approve')}>✓ Approve</button>
                </div>
              </section>
            );
          })}
          {!editRequests.length && !isLoading ? (
            <section className="card"><p style={{ textAlign: 'center', padding: '24px 0', opacity: 0.7 }}>Tidak ada edit request pending.</p></section>
          ) : null}
        </>
      ) : null}

      {tab === 'history' ? (
        <section className="card">
          <CardHeader title="Riwayat Approval" meta={`${history.length} item`} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Tanggal</th><th>Tipe</th><th>Subjek</th><th>Aksi</th><th>Oleh</th></tr>
              </thead>
              <tbody>
                {history.map((h) => (
                  <tr key={`${h.type}-${h.id}`}>
                    <td>{new Date(h.updatedAt).toLocaleString('id-ID')}</td>
                    <td>{h.type === 'shift' ? 'Shift Approval' : 'Edit Request'}</td>
                    <td>{h.id.slice(0, 20)}</td>
                    <td><StatusBadge label={h.status === 'approved' ? 'Approved' : 'Rejected'} /></td>
                    <td>{reviewerName(h.reviewedBy)}</td>
                  </tr>
                ))}
                {!history.length ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>Belum ada riwayat approval.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </>
  );
};

type DelayType = {
  id: string;
  kode: string;
  nama: string;
  kategori: string;
  scope: 'UNIT' | 'FLEET';
  budgetMenit?: number | null;
  kenaPA: boolean;
};

type Delay = {
  id: string;
  shiftId: string;
  unitId?: string | null;
  delayTypeId: string;
  scope: 'UNIT' | 'FLEET';
  durasiMenit: number;
  jamMulai?: string | null;
  jamSelesai?: string | null;
  keterangan?: string | null;
  createdAt: string;
  delayType?: DelayType;
  unit?: Unit;
};

const delayDuration = (mulai: string, selesai: string) =>
  mulai && selesai ? Math.max(0, Math.round((new Date(selesai).getTime() - new Date(mulai).getTime()) / 60000)) : 0;

// ISO → nilai untuk <input type="datetime-local"> dalam waktu lokal.
const isoToLocalInput = (iso?: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
};

const formatJam = (value?: string | null) =>
  value ? new Date(value).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : '-';

const DelayPage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [delayTypes, setDelayTypes] = useState<DelayType[]>([]);
  const [delays, setDelays] = useState<Delay[]>([]);
  const [branchId, setBranchId] = useState(getSession()?.branchId ?? '');
  const [shiftId, setShiftId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  // Fleet modal
  const [isFleetOpen, setIsFleetOpen] = useState(false);
  const [fType, setFType] = useState('');
  const [fMulai, setFMulai] = useState('');
  const [fSelesai, setFSelesai] = useState('');
  const [fFullDay, setFFullDay] = useState(false);
  const [fUnits, setFUnits] = useState<string[]>([]);
  const [fCatatan, setFCatatan] = useState('');
  // Per-unit modal
  const [isUnitOpen, setIsUnitOpen] = useState(false);
  const [uType, setUType] = useState('');
  const [uUnit, setUUnit] = useState('');
  const [uMulai, setUMulai] = useState('');
  const [uSelesai, setUSelesai] = useState('');
  const [uCatatan, setUCatatan] = useState('');
  // Row actions
  const [detailDelay, setDetailDelay] = useState<Delay | null>(null);
  const [deleteDelay, setDeleteDelay] = useState<Delay | null>(null);
  const [editDelay, setEditDelay] = useState<Delay | null>(null);
  const [eType, setEType] = useState('');
  const [eMulai, setEMulai] = useState('');
  const [eSelesai, setESelesai] = useState('');
  const [eCatatan, setECatatan] = useState('');

  const loadMeta = () => {
    setIsLoading(true);
    Promise.all([
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<Shift[]>(`/api/v1/shifts?branchId=${branchId}`),
      apiGet<Unit[]>(`/api/v1/master/units?branchId=${branchId}&aktif=true`),
      apiGet<DelayType[]>('/api/v1/master/delay-types'),
    ])
      .then(([nextBranches, nextShifts, nextUnits, nextDelayTypes]) => {
        setBranches(nextBranches);
        setShifts(nextShifts);
        setUnits(nextUnits);
        setDelayTypes(nextDelayTypes);
        setMessage('');
        const selected = nextShifts.find((shift) => shift.status === 'open') ?? nextShifts[0];
        setShiftId(selected?.id ?? '');
      })
      .catch(() => setMessage('Gagal mengambil data delay dari API.'))
      .finally(() => setIsLoading(false));
  };

  const loadDelays = () => {
    if (!shiftId) {
      setDelays([]);
      return;
    }
    apiGet<Delay[]>(`/api/v1/delays?shiftId=${shiftId}`)
      .then(setDelays)
      .catch(() => setMessage('Gagal memuat daftar delay.'));
  };

  useEffect(() => {
    loadMeta();
  }, [branchId]);

  useEffect(() => {
    loadDelays();
  }, [shiftId]);

  const selectedShift = shifts.find((shift) => shift.id === shiftId);
  const fleetTypes = delayTypes.filter((t) => t.scope === 'FLEET');
  const unitTypes = delayTypes.filter((t) => t.scope === 'UNIT');
  const fType_ = delayTypes.find((t) => t.id === fType);
  const uType_ = delayTypes.find((t) => t.id === uType);
  const fDur = delayDuration(fMulai, fSelesai);
  const uDur = delayDuration(uMulai, uSelesai);

  const openFleet = () => {
    if (!shiftId) {
      setMessage('Pilih shift terlebih dahulu.');
      return;
    }
    setFType((fleetTypes[0] ?? delayTypes[0])?.id ?? '');
    setFMulai('');
    setFSelesai('');
    setFFullDay(false);
    setFUnits(units.map((u) => u.id));
    setFCatatan('');
    setMessage('');
    setIsFleetOpen(true);
  };

  const handleFullDay = (checked: boolean) => {
    setFFullDay(checked);
    if (checked && selectedShift) {
      setFMulai(`${selectedShift.tanggal}T${selectedShift.jamMulai}`);
      setFSelesai(`${selectedShift.tanggal}T${selectedShift.jamSelesai}`);
    }
  };

  const toggleFUnit = (id: string) =>
    setFUnits((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const saveFleet = async () => {
    if (!fType) {
      setMessage('Pilih jenis delay.');
      return;
    }
    if (fDur <= 0) {
      setMessage('Isi Jam Mulai & Jam Selesai yang valid.');
      return;
    }
    if (fUnits.length === 0) {
      setMessage('Pilih minimal satu unit terdampak.');
      return;
    }
    try {
      const payload: Record<string, unknown> = {
        shiftId,
        delayTypeId: fType,
        durasiMenit: fDur,
        jamMulai: fMulai,
        jamSelesai: fSelesai,
        catatan: fCatatan || undefined,
      };
      // Semua unit tercentang → 1 record FLEET; sebagian → per-unit.
      if (fUnits.length < units.length) payload.unitIds = fUnits;
      const created = await apiPost<Delay[]>('/api/v1/delays', payload);
      setMessage(`${created.length} record delay fleet berhasil disimpan.`);
      setIsFleetOpen(false);
      loadDelays();
    } catch {
      setMessage('Gagal menyimpan delay fleet.');
    }
  };

  const openUnit = () => {
    if (!shiftId) {
      setMessage('Pilih shift terlebih dahulu.');
      return;
    }
    setUType((unitTypes[0] ?? delayTypes[0])?.id ?? '');
    setUUnit(units[0]?.id ?? '');
    setUMulai('');
    setUSelesai('');
    setUCatatan('');
    setMessage('');
    setIsUnitOpen(true);
  };

  const saveUnit = async () => {
    if (!uType || !uUnit) {
      setMessage('Pilih unit dan jenis delay.');
      return;
    }
    if (uDur <= 0) {
      setMessage('Isi Jam Mulai & Jam Selesai yang valid.');
      return;
    }
    try {
      const created = await apiPost<Delay[]>('/api/v1/delays', {
        shiftId,
        delayTypeId: uType,
        unitIds: [uUnit],
        durasiMenit: uDur,
        jamMulai: uMulai,
        jamSelesai: uSelesai,
        catatan: uCatatan || undefined,
      });
      setMessage(`${created.length} record delay per unit berhasil disimpan.`);
      setIsUnitOpen(false);
      loadDelays();
    } catch {
      setMessage('Gagal menyimpan delay per unit.');
    }
  };

  const openEdit = (delay: Delay) => {
    setEditDelay(delay);
    setEType(delay.delayTypeId);
    setEMulai(isoToLocalInput(delay.jamMulai));
    setESelesai(isoToLocalInput(delay.jamSelesai));
    setECatatan(delay.keterangan ?? '');
    setMessage('');
  };

  const eDur = delayDuration(eMulai, eSelesai);
  const saveEdit = async () => {
    if (!editDelay) return;
    if (eDur <= 0) {
      setMessage('Isi Jam Mulai & Jam Selesai yang valid.');
      return;
    }
    try {
      await apiPut<Delay>(`/api/v1/delays/${editDelay.id}`, {
        delayTypeId: eType,
        jamMulai: eMulai,
        jamSelesai: eSelesai,
        durasiMenit: eDur,
        catatan: eCatatan || undefined,
      });
      setMessage('Delay diperbarui.');
      setEditDelay(null);
      loadDelays();
    } catch {
      setMessage('Gagal memperbarui delay.');
    }
  };

  const confirmDeleteDelay = async () => {
    if (!deleteDelay) return;
    try {
      await apiDelete(`/api/v1/delays/${deleteDelay.id}`);
      setMessage('Delay dihapus.');
      setDeleteDelay(null);
      loadDelays();
    } catch {
      setMessage('Gagal menghapus delay. Butuh role supervisor/admin.');
    }
  };

  const budgetRows = delayTypes
    .map((type) => {
      const real = delays.filter((delay) => delay.delayTypeId === type.id).reduce((sum, delay) => sum + delay.durasiMenit, 0);
      const budget = type.budgetMenit ?? 0;
      return { ...type, real, budget, over: budget > 0 && real > budget };
    })
    .filter((row) => row.real > 0 || row.budget > 0);
  const overCount = budgetRows.filter((row) => row.over).length;
  const totalDelayMenit = delays.reduce((sum, delay) => sum + delay.durasiMenit, 0);

  return (
    <>
      <PageHeader
        title="Delay Operasional"
        description="Catat delay fleet-wide atau per unit dengan jam mulai/selesai; realisasi dibandingkan budget per jenis delay."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadDelays}>Muat Ulang</button>
            <button onClick={openFleet}>🔴 Input Delay Fleet</button>
            <button className="primary-link" onClick={openUnit}>🟡 Input Delay Per Unit</button>
          </div>
        }
      />
      {message ? <div className="inline-alert">{message}</div> : null}

      <section className="toolbar-panel">
        <label>
          Branch
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            {branches.map((branch) => (
              <option value={branch.id} key={branch.id}>{branch.nama}</option>
            ))}
          </select>
        </label>
        <label>
          Shift
          <select value={shiftId} onChange={(event) => setShiftId(event.target.value)}>
            <option value="">Pilih shift</option>
            {shifts.map((shift) => (
              <option value={shift.id} key={shift.id}>
                {formatDate(shift.tanggal)} • {formatShiftType(shift.tipe)} • {shift.status}
              </option>
            ))}
          </select>
        </label>
      </section>

      {/* Realisasi vs Budget */}
      <section className="card">
        <CardHeader
          title="Realisasi vs Budget Delay"
          meta={overCount > 0 ? `${overCount} jenis over budget • total ${totalDelayMenit} mnt` : `total ${totalDelayMenit} mnt`}
        />
        <div className="budget-grid">
          {budgetRows.map((row) => {
            const pct = row.budget > 0 ? Math.min(100, Math.round((row.real / row.budget) * 100)) : row.real > 0 ? 100 : 0;
            return (
              <article className={`budget-card ${row.over ? 'over' : ''}`} key={row.id}>
                <div className="budget-card-head">
                  <strong>{row.nama}</strong>
                  <span className={`unit-status ${row.scope === 'FLEET' ? 'pm' : 'ready'}`}>{row.scope}</span>
                </div>
                <div className="budget-bar"><span style={{ width: `${pct}%`, background: row.over ? 'var(--red)' : 'var(--green)' }} /></div>
                <div className="budget-card-foot">
                  <span>{row.real} mnt / {row.budget || '—'} mnt</span>
                  {row.over ? <span style={{ color: 'var(--red)', fontWeight: 800 }}>⚠ +{row.real - row.budget} mnt</span> : null}
                </div>
              </article>
            );
          })}
          {!budgetRows.length ? <p style={{ opacity: 0.7 }}>Belum ada data budget/realisasi delay.</p> : null}
        </div>
      </section>

      <section className="card">
        <CardHeader title="Log Delay" meta={isLoading ? 'Memuat data...' : `${delays.length} record dari shift terpilih`} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Jenis Delay</th>
                <th>Kategori</th>
                <th>Scope</th>
                <th>Unit</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Durasi</th>
                <th>Budget</th>
                <th>Status</th>
                <th>Catatan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {delays.map((delay) => {
                const budget = delay.delayType?.budgetMenit ?? 0;
                const over = budget > 0 && delay.durasiMenit > budget;
                return (
                  <tr key={delay.id}>
                    <td>{delay.delayType?.nama ?? delay.delayTypeId}</td>
                    <td>{delay.delayType?.kategori ?? '-'}</td>
                    <td><StatusBadge label={delay.scope === 'FLEET' ? 'Fleet' : 'Unit'} /></td>
                    <td>{delay.scope === 'FLEET' ? `${units.length} unit` : delay.unit?.kode ?? '-'}</td>
                    <td>{formatJam(delay.jamMulai)}</td>
                    <td>{formatJam(delay.jamSelesai)}</td>
                    <td>{delay.durasiMenit} mnt</td>
                    <td>{budget ? `${budget} mnt` : '-'}</td>
                    <td>
                      <span className={`unit-status ${over ? 'breakdown' : 'ready'}`}>{over ? 'Over' : 'OK'}</span>
                    </td>
                    <td>{delay.keterangan ?? '-'}</td>
                    <td>
                      <div className="rowact">
                        <button type="button" onClick={() => setDetailDelay(delay)}>Detail</button>
                        <button type="button" onClick={() => openEdit(delay)}>Edit</button>
                        <button type="button" className="btn-danger-sm" onClick={() => setDeleteDelay(delay)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!delays.length && !isLoading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Belum ada delay untuk shift terpilih.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: Fleet */}
      {isFleetOpen ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setIsFleetOpen(false); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Input Delay Fleet">
            <div className="modal-header">
              <span className="modal-title">🔴 Input Delay Fleet Wide</span>
              <button className="modal-close" type="button" onClick={() => setIsFleetOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note">
                Delay Fleet Wide berdampak ke semua unit DT aktif. Uncheck unit yang tidak terdampak — jika sebagian, disimpan sebagai delay per-unit.
              </div>
              <div className="modal-form-grid">
                <label style={{ gridColumn: '1 / -1' }}>
                  Jenis Delay <span className="req">*</span>
                  <select value={fType} onChange={(event) => setFType(event.target.value)}>
                    {(fleetTypes.length ? fleetTypes : delayTypes).map((t) => (
                      <option value={t.id} key={t.id}>{t.nama} — {t.kategori} (budget {t.budgetMenit ?? 0} mnt)</option>
                    ))}
                  </select>
                </label>
                <label>
                  Jam Mulai <span className="req">*</span>
                  <input type="datetime-local" value={fMulai} onChange={(event) => { setFMulai(event.target.value); setFFullDay(false); }} />
                </label>
                <label>
                  Jam Selesai <span className="req">*</span>
                  <input type="datetime-local" value={fSelesai} onChange={(event) => { setFSelesai(event.target.value); setFFullDay(false); }} />
                </label>
                <label style={{ alignSelf: 'end' }}>
                  <span style={{ display: 'flex', gap: 6, alignItems: 'center', textTransform: 'none' }}>
                    <input type="checkbox" checked={fFullDay} onChange={(event) => handleFullDay(event.target.checked)} />
                    ☀ Full Day (ikuti jam shift)
                  </span>
                </label>
              </div>
              <div className="grid-summary">
                <div><span>Durasi</span><strong>{fDur} mnt</strong></div>
                <div><span>Budget</span><strong>{fType_?.budgetMenit ?? 0} mnt</strong></div>
                <div><span>vs Budget</span><strong style={{ color: fType_ && fDur > (fType_.budgetMenit ?? 0) ? 'var(--red)' : 'var(--green)' }}>
                  {fType_ ? (fDur - (fType_.budgetMenit ?? 0) > 0 ? `+${fDur - (fType_.budgetMenit ?? 0)}` : fDur - (fType_.budgetMenit ?? 0)) : 0} mnt
                </strong></div>
              </div>
              <div className="modal-section-head">
                <div className="modal-section-title" style={{ margin: 0 }}>Unit Terdampak ({fUnits.length}/{units.length})</div>
                <div className="modal-section-actions">
                  <button type="button" className="btn-ghost-sm" onClick={() => setFUnits(units.map((u) => u.id))}>Pilih Semua</button>
                  <button type="button" className="btn-ghost-sm" onClick={() => setFUnits([])}>Batalkan Semua</button>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {units.map((unit) => (
                  <label key={unit.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13 }}>
                    <input type="checkbox" checked={fUnits.includes(unit.id)} onChange={() => toggleFUnit(unit.id)} />
                    {unit.kode}
                  </label>
                ))}
              </div>
              <label style={{ display: 'grid', gap: 6, marginTop: 12, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', color: 'var(--muted)' }}>
                Catatan
                <input value={fCatatan} onChange={(event) => setFCatatan(event.target.value)} style={{ border: '1px solid var(--line)', borderRadius: 8, padding: 10, background: 'var(--cream)' }} />
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsFleetOpen(false)}>Batal</button>
              <button className="primary-link" type="button" onClick={saveFleet}>Simpan Delay Fleet</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Per Unit */}
      {isUnitOpen ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setIsUnitOpen(false); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Input Delay Per Unit">
            <div className="modal-header">
              <span className="modal-title">🟡 Input Delay Per Unit</span>
              <button className="modal-close" type="button" onClick={() => setIsUnitOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <label>
                  Unit <span className="req">*</span>
                  <select value={uUnit} onChange={(event) => setUUnit(event.target.value)}>
                    <option value="">— pilih —</option>
                    {units.map((unit) => <option value={unit.id} key={unit.id}>{unit.kode} • {unit.tipe?.nama ?? '-'}</option>)}
                  </select>
                </label>
                <label style={{ gridColumn: 'span 2' }}>
                  Jenis Delay <span className="req">*</span>
                  <select value={uType} onChange={(event) => setUType(event.target.value)}>
                    {(unitTypes.length ? unitTypes : delayTypes).map((t) => (
                      <option value={t.id} key={t.id}>{t.nama} — {t.kategori} (budget {t.budgetMenit ?? 0} mnt)</option>
                    ))}
                  </select>
                </label>
                <label>
                  Jam Mulai <span className="req">*</span>
                  <input type="datetime-local" value={uMulai} onChange={(event) => setUMulai(event.target.value)} />
                </label>
                <label>
                  Jam Selesai <span className="req">*</span>
                  <input type="datetime-local" value={uSelesai} onChange={(event) => setUSelesai(event.target.value)} />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Catatan
                  <input value={uCatatan} onChange={(event) => setUCatatan(event.target.value)} />
                </label>
              </div>
              <div className="grid-summary">
                <div><span>Durasi</span><strong>{uDur} mnt</strong></div>
                <div><span>Budget</span><strong>{uType_?.budgetMenit ?? 0} mnt</strong></div>
                <div><span>vs Budget</span><strong style={{ color: uType_ && uDur > (uType_.budgetMenit ?? 0) ? 'var(--red)' : 'var(--green)' }}>
                  {uType_ ? (uDur - (uType_.budgetMenit ?? 0) > 0 ? `+${uDur - (uType_.budgetMenit ?? 0)}` : uDur - (uType_.budgetMenit ?? 0)) : 0} mnt
                </strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsUnitOpen(false)}>Batal</button>
              <button className="primary-link" type="button" onClick={saveUnit}>Simpan Delay</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Detail Delay */}
      {detailDelay ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDetailDelay(null); }}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Detail Delay">
            <div className="modal-header">
              <span className="modal-title">Detail Delay</span>
              <button className="modal-close" type="button" onClick={() => setDetailDelay(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="close-summary">
                <div><span>Jenis Delay</span><strong>{detailDelay.delayType?.nama ?? detailDelay.delayTypeId}</strong></div>
                <div><span>Kategori</span><strong>{detailDelay.delayType?.kategori ?? '-'}</strong></div>
                <div><span>Scope</span><strong>{detailDelay.scope}</strong></div>
                <div><span>Unit</span><strong>{detailDelay.scope === 'FLEET' ? `${units.length} unit` : detailDelay.unit?.kode ?? '-'}</strong></div>
                <div><span>Jam Mulai</span><strong>{formatJam(detailDelay.jamMulai)}</strong></div>
                <div><span>Jam Selesai</span><strong>{formatJam(detailDelay.jamSelesai)}</strong></div>
                <div><span>Durasi</span><strong>{detailDelay.durasiMenit} mnt</strong></div>
                <div><span>Budget</span><strong>{detailDelay.delayType?.budgetMenit ?? 0} mnt</strong></div>
                <div><span>Catatan</span><strong>{detailDelay.keterangan ?? '-'}</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDetailDelay(null)}>Tutup</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Edit Delay */}
      {editDelay ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setEditDelay(null); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Edit Delay">
            <div className="modal-header">
              <span className="modal-title">Edit Delay — {editDelay.delayType?.nama ?? editDelay.delayTypeId}</span>
              <button className="modal-close" type="button" onClick={() => setEditDelay(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <label style={{ gridColumn: '1 / -1' }}>
                  Jenis Delay
                  <select value={eType} onChange={(event) => setEType(event.target.value)}>
                    {delayTypes.map((t) => <option value={t.id} key={t.id}>{t.nama} — {t.kategori} (budget {t.budgetMenit ?? 0} mnt)</option>)}
                  </select>
                </label>
                <label>
                  Jam Mulai <span className="req">*</span>
                  <input type="datetime-local" value={eMulai} onChange={(event) => setEMulai(event.target.value)} />
                </label>
                <label>
                  Jam Selesai <span className="req">*</span>
                  <input type="datetime-local" value={eSelesai} onChange={(event) => setESelesai(event.target.value)} />
                </label>
                <label style={{ gridColumn: '1 / -1' }}>
                  Catatan
                  <input value={eCatatan} onChange={(event) => setECatatan(event.target.value)} />
                </label>
              </div>
              <div className="grid-summary">
                <div><span>Durasi</span><strong>{eDur} mnt</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setEditDelay(null)}>Batal</button>
              <button className="primary-link" type="button" onClick={saveEdit}>Simpan Perubahan</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Hapus Delay */}
      {deleteDelay ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDeleteDelay(null); }}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Konfirmasi Hapus">
            <div className="modal-header">
              <span className="modal-title">Konfirmasi Hapus</span>
              <button className="modal-close" type="button" onClick={() => setDeleteDelay(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note" style={{ background: '#f7e0e2', borderColor: '#e2b6ba', color: 'var(--red)' }}>
                Hapus delay <strong>{deleteDelay.delayType?.nama ?? deleteDelay.delayTypeId}</strong> ({deleteDelay.durasiMenit} mnt)? Tindakan ini tidak dapat dibatalkan.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDeleteDelay(null)}>Batal</button>
              <button className="btn-danger-sm" type="button" onClick={confirmDeleteDelay} style={{ padding: '10px 18px' }}>Hapus</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

type Maintenance = {
  id: string;
  shiftId: string;
  unitId: string;
  jenis: 'breakdown' | 'pm' | 'full-day' | 'standby';
  status: 'open' | 'closed';
  durasiJam: number;
  budgetJam: number;
  jamMulai?: string | null;
  jamSelesai?: string | null;
  partDiganti?: string | null;
  keterangan?: string | null;
  createdAt: string;
  unit?: Unit;
};

const jenisLabel: Record<string, string> = { breakdown: 'Breakdown', pm: 'PM', 'full-day': 'Full Day', standby: 'Standby' };

type MaintForm = { unitId: string; jenis: Maintenance['jenis']; status: 'open' | 'closed'; mulai: string; selesai: string; catatan: string; part: string; fullDay: boolean };
const emptyMaintForm: MaintForm = { unitId: '', jenis: 'breakdown', status: 'open', mulai: '', selesai: '', catatan: '', part: '', fullDay: false };

const MaintenancePage = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [records, setRecords] = useState<Maintenance[]>([]);
  const [branchId, setBranchId] = useState(getSession()?.branchId ?? '');
  const [shiftId, setShiftId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isInputOpen, setIsInputOpen] = useState(false);
  const [form, setForm] = useState<MaintForm>(emptyMaintForm);
  const [editRecord, setEditRecord] = useState<Maintenance | null>(null);
  const [detailRecord, setDetailRecord] = useState<Maintenance | null>(null);
  const [deleteRecord, setDeleteRecord] = useState<Maintenance | null>(null);
  const [historyUnit, setHistoryUnit] = useState<Unit | null>(null);
  const [historyRecords, setHistoryRecords] = useState<Maintenance[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);

  const loadMeta = () => {
    setIsLoading(true);
    Promise.all([
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<Shift[]>(`/api/v1/shifts?branchId=${branchId}`),
      apiGet<Unit[]>(`/api/v1/master/units?branchId=${branchId}&aktif=true`),
    ])
      .then(([nextBranches, nextShifts, nextUnits]) => {
        setBranches(nextBranches);
        setShifts(nextShifts);
        setUnits(nextUnits);
        setMessage('');
        const selected = nextShifts.find((shift) => shift.status === 'open') ?? nextShifts[0];
        setShiftId(selected?.id ?? '');
      })
      .catch(() => setMessage('Gagal mengambil data maintenance dari API.'))
      .finally(() => setIsLoading(false));
  };

  const loadRecords = () => {
    if (!shiftId) {
      setRecords([]);
      return;
    }
    apiGet<Maintenance[]>(`/api/v1/maintenance?shiftId=${shiftId}`)
      .then(setRecords)
      .catch(() => setMessage('Gagal memuat daftar maintenance.'));
  };

  useEffect(() => {
    loadMeta();
  }, [branchId]);

  useEffect(() => {
    loadRecords();
  }, [shiftId]);

  const selectedShift = shifts.find((shift) => shift.id === shiftId);
  const formUnit = units.find((u) => u.id === form.unitId);
  const formBudget = formUnit?.budgetBreakdownJam ?? 3;
  const formDurasiJam = delayDuration(form.mulai, form.selesai) / 60;
  const editDurasiJam = editRecord ? delayDuration(form.mulai, form.selesai) / 60 : 0;

  const setFormField = (patch: Partial<MaintForm>) => setForm((prev) => ({ ...prev, ...patch }));

  const applyFullDay = (checked: boolean) => {
    if (checked && selectedShift) {
      setFormField({
        fullDay: true,
        jenis: 'full-day',
        mulai: `${selectedShift.tanggal}T${selectedShift.jamMulai}`,
        selesai: `${selectedShift.tanggal}T${selectedShift.jamSelesai}`,
      });
    } else {
      setFormField({ fullDay: checked });
    }
  };

  const openInput = (preUnitId?: string) => {
    if (!shiftId) {
      setMessage('Pilih shift terlebih dahulu.');
      return;
    }
    setForm({ ...emptyMaintForm, unitId: preUnitId || units[0]?.id || '' });
    setMessage('');
    setIsInputOpen(true);
  };

  const openEdit = (record: Maintenance) => {
    setEditRecord(record);
    setForm({
      unitId: record.unitId,
      jenis: record.jenis,
      status: record.status,
      mulai: isoToLocalInput(record.jamMulai),
      selesai: isoToLocalInput(record.jamSelesai),
      catatan: record.keterangan ?? '',
      part: record.partDiganti ?? '',
      fullDay: false,
    });
    setMessage('');
  };

  const saveInput = async () => {
    if (!shiftId || !form.unitId) {
      setMessage('Pilih shift dan unit terlebih dahulu.');
      return;
    }
    try {
      await apiPost<Maintenance>('/api/v1/maintenance', {
        shiftId,
        unitId: form.unitId,
        jenis: form.jenis,
        status: form.status,
        jamMulai: form.mulai || undefined,
        jamSelesai: form.selesai || undefined,
        partDiganti: form.part || undefined,
        catatan: form.catatan || undefined,
      });
      setMessage('Downtime unit berhasil disimpan.');
      setIsInputOpen(false);
      loadRecords();
    } catch {
      setMessage('Gagal menyimpan. Satu unit hanya boleh punya satu record maintenance per shift.');
    }
  };

  const saveEdit = async () => {
    if (!editRecord) return;
    try {
      await apiPut<Maintenance>(`/api/v1/maintenance/${editRecord.id}`, {
        jenis: form.jenis,
        status: form.status,
        jamMulai: form.mulai || undefined,
        jamSelesai: form.selesai || undefined,
        partDiganti: form.part || undefined,
        catatan: form.catatan || undefined,
      });
      setMessage('Maintenance diperbarui.');
      setEditRecord(null);
      loadRecords();
    } catch {
      setMessage('Gagal memperbarui maintenance.');
    }
  };

  const toggleStatus = async (record: Maintenance) => {
    const nextStatus = record.status === 'open' ? 'closed' : 'open';
    try {
      await apiPut<Maintenance>(`/api/v1/maintenance/${record.id}`, { status: nextStatus });
      setMessage(`Status maintenance diubah menjadi ${nextStatus === 'closed' ? 'ready/completed' : 'ongoing'}.`);
      loadRecords();
    } catch {
      setMessage('Gagal mengubah status maintenance.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteRecord) return;
    try {
      await apiDelete(`/api/v1/maintenance/${deleteRecord.id}`);
      setMessage('Maintenance dihapus.');
      setDeleteRecord(null);
      loadRecords();
    } catch {
      setMessage('Gagal menghapus. Butuh role supervisor/admin.');
    }
  };

  // History breakdown/maintenance unit (semua shift) untuk unit ready.
  const openHistory = (unit: Unit) => {
    setHistoryUnit(unit);
    setHistoryRecords([]);
    setHistoryLoading(true);
    apiGet<Maintenance[]>(`/api/v1/maintenance?unitId=${unit.id}`)
      .then(setHistoryRecords)
      .catch(() => setMessage('Gagal memuat history unit.'))
      .finally(() => setHistoryLoading(false));
  };

  // Tandai ongoing kembali (dari history / unit ready).
  const reopenRecord = async (record: Maintenance) => {
    try {
      await apiPut<Maintenance>(`/api/v1/maintenance/${record.id}`, { status: 'open' });
      setMessage('Downtime dibuka kembali (ongoing).');
      setHistoryUnit(null);
      loadRecords();
    } catch {
      setMessage('Gagal membuka kembali downtime.');
    }
  };

  const kpi = {
    breakdown: records.filter((r) => r.jenis === 'breakdown').length,
    pm: records.filter((r) => r.jenis === 'pm').length,
    fullday: records.filter((r) => r.jenis === 'full-day').length,
    totalJam: records.reduce((s, r) => s + r.durasiJam, 0),
    over: records.filter((r) => r.budgetJam > 0 && r.durasiJam > r.budgetJam).length,
  };

  // Downtime aktif = record status open (ongoing). Yang sudah closed dianggap ready.
  const downtimeRecords = records.filter((r) => r.status === 'open');
  // Unit ready = unit tanpa downtime aktif (belum ada record ATAU record-nya sudah closed).
  const readyUnits = units.filter((unit) => !downtimeRecords.some((r) => r.unitId === unit.id));
  const closedByUnit = new Map(records.filter((r) => r.status === 'closed').map((r) => [r.unitId, r]));

  const renderFormBody = (durasi: number) => (
    <>
      <div className="modal-form-grid">
        <label>
          Unit <span className="req">*</span>
          <select value={form.unitId} disabled={!!editRecord} onChange={(event) => setFormField({ unitId: event.target.value })}>
            <option value="">— pilih —</option>
            {units.map((unit) => (
              <option value={unit.id} key={unit.id}>{unit.kode} • {unit.tipe?.nama ?? '-'} (budget {unit.budgetBreakdownJam ?? 3}j)</option>
            ))}
          </select>
        </label>
        <label>
          Jenis Downtime <span className="req">*</span>
          <select value={form.jenis} onChange={(event) => setFormField({ jenis: event.target.value as Maintenance['jenis'] })}>
            <option value="breakdown">Breakdown</option>
            <option value="pm">Preventive Maintenance</option>
            <option value="full-day">Full Day</option>
            <option value="standby">Standby</option>
          </select>
        </label>
        <label>
          Status
          <select value={form.status} onChange={(event) => setFormField({ status: event.target.value as 'open' | 'closed' })}>
            <option value="open">Ongoing</option>
            <option value="closed">Completed</option>
          </select>
        </label>
        <label>
          Jam Mulai <span className="req">*</span>
          <input type="datetime-local" value={form.mulai} onChange={(event) => setFormField({ mulai: event.target.value, fullDay: false })} />
        </label>
        <label>
          Jam Selesai <small style={{ textTransform: 'none' }}>(opsional jika ongoing)</small>
          <input type="datetime-local" value={form.selesai} onChange={(event) => setFormField({ selesai: event.target.value, fullDay: false })} />
        </label>
        <label style={{ alignSelf: 'end' }}>
          <span style={{ display: 'flex', gap: 6, alignItems: 'center', textTransform: 'none' }}>
            <input type="checkbox" checked={form.fullDay} onChange={(event) => applyFullDay(event.target.checked)} />
            ☀ Full Day (ikuti jam shift)
          </span>
        </label>
      </div>
      <div className="grid-summary">
        <div><span>Durasi Actual</span><strong>{durasi.toFixed(1)} jam</strong></div>
        <div><span>Budget</span><strong>{(editRecord?.budgetJam ?? formBudget).toFixed(1)} jam</strong></div>
        <div><span>vs Budget</span><strong style={{ color: durasi > (editRecord?.budgetJam ?? formBudget) ? 'var(--red)' : 'var(--green)' }}>
          {(durasi - (editRecord?.budgetJam ?? formBudget)).toFixed(1)} jam
        </strong></div>
      </div>
      <div className="modal-form-grid" style={{ gridTemplateColumns: '1fr' }}>
        <label>
          Keterangan / Deskripsi Masalah <span className="req">*</span>
          <input value={form.catatan} onChange={(event) => setFormField({ catatan: event.target.value })} placeholder="Deskripsi kerusakan / jenis PM..." />
        </label>
        <label>
          Part yang Diganti <small style={{ textTransform: 'none' }}>(khusus PM, opsional)</small>
          <input value={form.part} onChange={(event) => setFormField({ part: event.target.value })} placeholder="Oli mesin 20L, filter, v-belt..." />
        </label>
      </div>
    </>
  );

  return (
    <>
      <PageHeader
        title="Maintenance Unit"
        description="Input downtime 1x per unit per shift · Actual vs Budget Breakdown Hours · tandai Ready saat unit kembali beroperasi."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadRecords}>Muat Ulang</button>
            <button className="primary-link" onClick={() => openInput()}>+ Input Downtime</button>
          </div>
        }
      />
      {message ? <div className="inline-alert">{message}</div> : null}

      <section className="toolbar-panel">
        <label>
          Branch
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            {branches.map((branch) => (
              <option value={branch.id} key={branch.id}>{branch.nama}</option>
            ))}
          </select>
        </label>
        <label>
          Shift
          <select value={shiftId} onChange={(event) => setShiftId(event.target.value)}>
            <option value="">Pilih shift</option>
            {shifts.map((shift) => (
              <option value={shift.id} key={shift.id}>
                {formatDate(shift.tanggal)} • {formatShiftType(shift.tipe)} • {shift.status}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="stat-grid">
        <article className="stat-card"><span>🔴 Breakdown</span><strong>{kpi.breakdown}</strong></article>
        <article className="stat-card"><span>🔧 PM Terjadwal</span><strong>{kpi.pm}</strong></article>
        <article className="stat-card"><span>☀ Full Day</span><strong>{kpi.fullday}</strong></article>
        <article className="stat-card"><span>Total Downtime</span><strong>{kpi.totalJam.toFixed(1)} jam</strong><small>{kpi.over} over budget</small></article>
      </div>

      <section className="card">
        <CardHeader title="Downtime & Maintenance" meta={isLoading ? 'Memuat data...' : `${downtimeRecords.length} downtime aktif (ongoing)`} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th>Tipe</th>
                <th>Jenis</th>
                <th>Status</th>
                <th>Mulai</th>
                <th>Selesai</th>
                <th>Actual (jam)</th>
                <th>Budget (jam)</th>
                <th>Part</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {downtimeRecords.map((record) => {
                const over = record.budgetJam > 0 && record.durasiJam > record.budgetJam;
                return (
                  <tr key={record.id}>
                    <td><strong>{record.unit?.kode ?? record.unitId}</strong></td>
                    <td>{record.unit?.tipe?.nama ?? '-'}</td>
                    <td><span className={`unit-status ${record.jenis === 'pm' ? 'pm' : record.jenis === 'standby' ? 'ready' : 'breakdown'}`}>{jenisLabel[record.jenis] ?? record.jenis}</span></td>
                    <td><StatusBadge label="Pending" /></td>
                    <td>{formatJam(record.jamMulai)}</td>
                    <td>{record.jamSelesai ? formatJam(record.jamSelesai) : '—'}</td>
                    <td style={over ? { color: 'var(--red)', fontWeight: 800 } : undefined}>{record.durasiJam.toFixed(1)}</td>
                    <td>{record.budgetJam.toFixed(1)}</td>
                    <td>{record.partDiganti ?? '-'}</td>
                    <td>{record.keterangan ?? '-'}</td>
                    <td>
                      <div className="rowact">
                        <button type="button" onClick={() => setDetailRecord(record)}>Detail</button>
                        <button type="button" onClick={() => openEdit(record)}>Edit</button>
                        <button type="button" className="btn-gold-sm" onClick={() => toggleStatus(record)}>✓ Ready</button>
                        <button type="button" className="btn-danger-sm" onClick={() => setDeleteRecord(record)}>Hapus</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!downtimeRecords.length && !isLoading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Tidak ada downtime aktif — semua unit beroperasi normal.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <CardHeader title="Unit Ready (Tidak Ada Downtime)" meta={`${readyUnits.length} unit beroperasi normal`} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th>Tipe</th>
                <th>Kapasitas</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {readyUnits.map((unit) => {
                const closed = closedByUnit.get(unit.id);
                return (
                  <tr key={unit.id}>
                    <td><strong>{unit.kode}</strong></td>
                    <td>{unit.tipe?.nama ?? '-'}</td>
                    <td>{unit.tipe?.kapasitasTon ? `${unit.tipe.kapasitasTon} ton` : '-'}</td>
                    <td>
                      {closed ? (
                        <span className="unit-status ready">Selesai downtime ({jenisLabel[closed.jenis] ?? closed.jenis}, {closed.durasiJam.toFixed(1)}j)</span>
                      ) : (
                        <span style={{ color: 'var(--muted)' }}>Beroperasi normal</span>
                      )}
                    </td>
                    <td>
                      <div className="rowact">
                        <button type="button" onClick={() => openHistory(unit)}>Detail</button>
                        <button type="button" onClick={() => openInput(unit.id)}>+ Input Downtime</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {!readyUnits.length ? (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '24px 0' }}>
                    {shiftId ? 'Semua unit sedang ada downtime aktif.' : 'Pilih shift untuk melihat unit ready.'}
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: Input Downtime */}
      {isInputOpen ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setIsInputOpen(false); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Input Downtime">
            <div className="modal-header">
              <span className="modal-title">Input Downtime Unit</span>
              <button className="modal-close" type="button" onClick={() => setIsInputOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note">Input 1 hari 1 kali per unit. Untuk breakdown seharian, centang "Full Day" untuk auto-isi jam shift.</div>
              {renderFormBody(formDurasiJam)}
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsInputOpen(false)}>Batal</button>
              <button className="primary-link" type="button" onClick={saveInput}>Simpan</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Edit */}
      {editRecord ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setEditRecord(null); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Edit Downtime">
            <div className="modal-header">
              <span className="modal-title">Edit Downtime — {editRecord.unit?.kode ?? editRecord.unitId}</span>
              <button className="modal-close" type="button" onClick={() => setEditRecord(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">{renderFormBody(editDurasiJam)}</div>
            <div className="modal-footer">
              <button type="button" onClick={() => setEditRecord(null)}>Batal</button>
              <button className="primary-link" type="button" onClick={saveEdit}>Simpan Perubahan</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Detail */}
      {detailRecord ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDetailRecord(null); }}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Detail Downtime">
            <div className="modal-header">
              <span className="modal-title">Detail Downtime</span>
              <button className="modal-close" type="button" onClick={() => setDetailRecord(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="close-summary">
                <div><span>Unit</span><strong>{detailRecord.unit?.kode ?? detailRecord.unitId} • {detailRecord.unit?.tipe?.nama ?? '-'}</strong></div>
                <div><span>Jenis</span><strong>{jenisLabel[detailRecord.jenis] ?? detailRecord.jenis}</strong></div>
                <div><span>Status</span><strong>{detailRecord.status === 'open' ? 'Ongoing' : 'Completed'}</strong></div>
                <div><span>Jam Mulai</span><strong>{formatJam(detailRecord.jamMulai)}</strong></div>
                <div><span>Jam Selesai</span><strong>{detailRecord.jamSelesai ? formatJam(detailRecord.jamSelesai) : '—'}</strong></div>
                <div><span>Actual</span><strong>{detailRecord.durasiJam.toFixed(1)} jam</strong></div>
                <div><span>Budget</span><strong>{detailRecord.budgetJam.toFixed(1)} jam</strong></div>
                <div><span>Part Diganti</span><strong>{detailRecord.partDiganti ?? '-'}</strong></div>
                <div><span>Keterangan</span><strong>{detailRecord.keterangan ?? '-'}</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDetailRecord(null)}>Tutup</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Hapus */}
      {deleteRecord ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDeleteRecord(null); }}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Konfirmasi Hapus">
            <div className="modal-header">
              <span className="modal-title">Konfirmasi Hapus</span>
              <button className="modal-close" type="button" onClick={() => setDeleteRecord(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note" style={{ background: '#f7e0e2', borderColor: '#e2b6ba', color: 'var(--red)' }}>
                Hapus record maintenance <strong>{deleteRecord.unit?.kode ?? deleteRecord.unitId}</strong> ({jenisLabel[deleteRecord.jenis]})? Tindakan ini tidak dapat dibatalkan.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDeleteRecord(null)}>Batal</button>
              <button className="btn-danger-sm" type="button" onClick={confirmDelete} style={{ padding: '10px 18px' }}>Hapus</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: History Breakdown Unit */}
      {historyUnit ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setHistoryUnit(null); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="History Breakdown Unit">
            <div className="modal-header">
              <span className="modal-title">History Breakdown — {historyUnit.kode} • {historyUnit.tipe?.nama ?? '-'}</span>
              <button className="modal-close" type="button" onClick={() => setHistoryUnit(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note">Riwayat seluruh downtime/maintenance unit ini lintas shift.</div>
              <div className="modal-unit-list">
                <table>
                  <thead>
                    <tr>
                      <th>Tanggal</th>
                      <th>Jenis</th>
                      <th>Status</th>
                      <th>Mulai</th>
                      <th>Selesai</th>
                      <th>Actual (jam)</th>
                      <th>Budget (jam)</th>
                      <th>Keterangan</th>
                      <th>Part</th>
                      <th />
                    </tr>
                  </thead>
                  <tbody>
                    {historyRecords.map((h) => {
                      const over = h.budgetJam > 0 && h.durasiJam > h.budgetJam;
                      return (
                        <tr key={h.id}>
                          <td>{new Date(h.createdAt).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })}</td>
                          <td><span className={`unit-status ${h.jenis === 'pm' ? 'pm' : h.jenis === 'standby' ? 'ready' : 'breakdown'}`}>{jenisLabel[h.jenis] ?? h.jenis}</span></td>
                          <td>{h.status === 'open' ? 'Ongoing' : 'Completed'}</td>
                          <td>{formatJam(h.jamMulai)}</td>
                          <td>{h.jamSelesai ? formatJam(h.jamSelesai) : '—'}</td>
                          <td style={over ? { color: 'var(--red)', fontWeight: 800 } : undefined}>{h.durasiJam.toFixed(1)}</td>
                          <td>{h.budgetJam.toFixed(1)}</td>
                          <td>{h.keterangan ?? '-'}</td>
                          <td>{h.partDiganti ?? '-'}</td>
                          <td>
                            {h.status === 'closed' ? (
                              <button type="button" onClick={() => reopenRecord(h)}>Buka Lagi</button>
                            ) : null}
                          </td>
                        </tr>
                      );
                    })}
                    {!historyRecords.length ? (
                      <tr><td colSpan={10} style={{ textAlign: 'center', padding: '16px 0' }}>{historyLoading ? 'Memuat history...' : 'Belum ada history downtime untuk unit ini.'}</td></tr>
                    ) : null}
                  </tbody>
                </table>
              </div>
              <div className="grid-summary">
                <div><span>Total Downtime</span><strong>{historyRecords.reduce((s, h) => s + h.durasiJam, 0).toFixed(1)} jam</strong></div>
                <div><span>Jumlah Record</span><strong>{historyRecords.length}</strong></div>
                <div><span>Breakdown</span><strong>{historyRecords.filter((h) => h.jenis === 'breakdown').length}</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setHistoryUnit(null)}>Tutup</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

type BbmLog = {
  id: string;
  shiftId: string;
  unitId: string;
  operatorBbmId: string;
  fuelStationId?: string | null;
  fuelTypeId?: string | null;
  liter: number;
  odoKm?: number | null;
  hm?: number | null;
  lokasi?: string | null;
  jamPengisian?: string | null;
  keterangan?: string | null;
  createdAt: string;
  unit?: Unit;
  operatorBbm?: { nama: string };
  fuelStation?: { nama: string } | null;
  fuelType?: { nama: string } | null;
};

type BbmRow = { unitId: string; jamPengisian: string; liter: number; odoKm?: number; hm?: number; fuelStationId: string; fuelTypeId: string; keterangan: string };

const BbmPage = () => {
  const session = getSession();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [fuelStations, setFuelStations] = useState<LokasiOption[]>([]);
  const [fuelTypes, setFuelTypes] = useState<FuelTypeRow[]>([]);
  const [logs, setLogs] = useState<BbmLog[]>([]);
  const [branchId, setBranchId] = useState(session?.branchId ?? '');
  const [shiftId, setShiftId] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isGridOpen, setIsGridOpen] = useState(false);
  const [gridRows, setGridRows] = useState<BbmRow[]>([]);
  const [editLog, setEditLog] = useState<BbmLog | null>(null);
  const [eLiter, setELiter] = useState(0);
  const [eOdo, setEOdo] = useState<number | undefined>(undefined);
  const [eHm, setEHm] = useState<number | undefined>(undefined);
  const [eStation, setEStation] = useState('');
  const [eFuelType, setEFuelType] = useState('');
  const [eJam, setEJam] = useState('');
  const [eKeterangan, setEKeterangan] = useState('');
  const [detailLog, setDetailLog] = useState<BbmLog | null>(null);
  const [deleteLog, setDeleteLog] = useState<BbmLog | null>(null);

  const loadMeta = () => {
    setIsLoading(true);
    Promise.all([
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<Shift[]>(`/api/v1/shifts?branchId=${branchId}`),
      apiGet<Unit[]>(`/api/v1/master/units?branchId=${branchId}&aktif=true`),
      apiGet<LokasiOption[]>(`/api/v1/master/fuel-stations?aktif=true`),
      apiGet<FuelTypeRow[]>('/api/v1/master/fuel-types?aktif=true'),
    ])
      .then(([nextBranches, nextShifts, nextUnits, nextStations, nextFuelTypes]) => {
        setBranches(nextBranches);
        setShifts(nextShifts);
        setUnits(nextUnits);
        setFuelStations(nextStations);
        setFuelTypes(nextFuelTypes);
        setMessage('');
        const selected = nextShifts.find((shift) => shift.status === 'open') ?? nextShifts[0];
        setShiftId(selected?.id ?? '');
      })
      .catch(() => setMessage('Gagal mengambil data BBM dari API.'))
      .finally(() => setIsLoading(false));
  };

  const loadLogs = () => {
    if (!shiftId) {
      setLogs([]);
      return;
    }
    apiGet<BbmLog[]>(`/api/v1/bbm?shiftId=${shiftId}`)
      .then(setLogs)
      .catch(() => setMessage('Gagal memuat daftar BBM.'));
  };

  useEffect(() => {
    loadMeta();
  }, [branchId]);

  useEffect(() => {
    loadLogs();
  }, [shiftId]);

  const newBbmRow = (unitId = ''): BbmRow => {
    const shift = shifts.find((s) => s.id === shiftId);
    // Default jam = tanggal shift + jam mulai (bisa diubah bebas per baris).
    const defaultJam = shift ? `${shift.tanggal}T${shift.jamMulai}` : new Date().toISOString().slice(0, 16);
    return { unitId: unitId || units[0]?.id || '', jamPengisian: defaultJam, liter: 0, odoKm: undefined, hm: undefined, fuelStationId: fuelStations[0]?.id || '', fuelTypeId: fuelTypes[0]?.id || '', keterangan: '' };
  };

  const openGrid = async () => {
    if (!shiftId) {
      setMessage('Pilih shift terlebih dahulu.');
      return;
    }
    setMessage('');
    setIsGridOpen(true);
    try {
      // Baris otomatis dari unit yang di-assign pada shift ini (hari & shift sama).
      const su = await apiGet<ShiftUnitRow[]>(`/api/v1/shifts/${shiftId}/units`);
      setGridRows(su.length ? su.map((x) => newBbmRow(x.unitId)) : [newBbmRow()]);
    } catch {
      setGridRows([newBbmRow()]);
    }
  };

  const updateGridRow = (index: number, patch: Partial<BbmRow>) =>
    setGridRows((prev) => prev.map((row, i) => (i === index ? { ...row, ...patch } : row)));
  const addGridRow = () => setGridRows((prev) => [...prev, newBbmRow()]);
  const removeGridRow = (index: number) => setGridRows((prev) => prev.filter((_, i) => i !== index));
  const fillDownLokasi = () =>
    setGridRows((prev) => (prev.length ? prev.map((row) => ({ ...row, fuelStationId: prev[0].fuelStationId, fuelTypeId: prev[0].fuelTypeId, jamPengisian: prev[0].jamPengisian })) : prev));

  const gridTotalLiter = gridRows.reduce((sum, row) => sum + (row.liter || 0), 0);

  const saveGrid = async () => {
    if (!shiftId || !session) {
      setMessage('Sesi/shift tidak valid.');
      return;
    }
    const valid = gridRows.filter((row) => row.unitId && row.liter > 0);
    if (!valid.length) {
      setMessage('Isi minimal satu baris dengan unit dan liter > 0.');
      return;
    }
    try {
      const created = await apiPost<BbmLog[]>(
        '/api/v1/bbm/import',
        valid.map((row) => ({
          shiftId,
          unitId: row.unitId,
          operatorBbmId: session.id,
          liter: row.liter,
          odoKm: row.odoKm,
          hm: row.hm,
          fuelStationId: row.fuelStationId || undefined,
          fuelTypeId: row.fuelTypeId || undefined,
          jamPengisian: row.jamPengisian || undefined,
          keterangan: row.keterangan || undefined,
        })),
      );
      setMessage(`${created.length} pengisian BBM berhasil disimpan.`);
      setIsGridOpen(false);
      loadLogs();
    } catch {
      setMessage('Gagal menyimpan pengisian BBM.');
    }
  };

  const openEdit = (log: BbmLog) => {
    setEditLog(log);
    setELiter(log.liter);
    setEOdo(log.odoKm ?? undefined);
    setEHm(log.hm ?? undefined);
    setEStation(log.fuelStationId ?? '');
    setEFuelType(log.fuelTypeId ?? '');
    setEJam(isoToLocalInput(log.jamPengisian));
    setEKeterangan(log.keterangan ?? '');
    setMessage('');
  };

  const saveEdit = async () => {
    if (!editLog) return;
    try {
      await apiPut<BbmLog>(`/api/v1/bbm/${editLog.id}`, {
        liter: eLiter,
        odoKm: eOdo,
        hm: eHm,
        fuelStationId: eStation || undefined,
        fuelTypeId: eFuelType || undefined,
        jamPengisian: eJam || undefined,
        keterangan: eKeterangan || undefined,
      });
      setMessage('Pengisian BBM diperbarui.');
      setEditLog(null);
      loadLogs();
    } catch {
      setMessage('Gagal memperbarui pengisian BBM.');
    }
  };

  const confirmDelete = async () => {
    if (!deleteLog) return;
    try {
      await apiDelete(`/api/v1/bbm/${deleteLog.id}`);
      setMessage('Pengisian BBM dihapus.');
      setDeleteLog(null);
      loadLogs();
    } catch {
      setMessage('Gagal menghapus. Butuh role supervisor/admin.');
    }
  };

  const totalLiter = logs.reduce((sum, log) => sum + log.liter, 0);
  const unitCount = new Set(logs.map((l) => l.unitId)).size;
  const avgLiter = logs.length ? totalLiter / logs.length : 0;

  return (
    <>
      <PageHeader
        title="Konsumsi BBM"
        description="Pencatatan konsumsi bahan bakar per unit per shift — input batch multi-baris, pantau total & rata-rata liter."
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={loadLogs}>Muat Ulang</button>
            <button className="primary-link" onClick={openGrid}>+ Input Pengisian BBM</button>
          </div>
        }
      />
      {message ? <div className="inline-alert">{message}</div> : null}

      <section className="toolbar-panel">
        <label>
          Branch
          <select value={branchId} onChange={(event) => setBranchId(event.target.value)}>
            {branches.map((branch) => (
              <option value={branch.id} key={branch.id}>{branch.nama}</option>
            ))}
          </select>
        </label>
        <label>
          Shift
          <select value={shiftId} onChange={(event) => setShiftId(event.target.value)}>
            <option value="">Pilih shift</option>
            {shifts.map((shift) => (
              <option value={shift.id} key={shift.id}>
                {formatDate(shift.tanggal)} • {formatShiftType(shift.tipe)} • {shift.status}
              </option>
            ))}
          </select>
        </label>
      </section>

      <div className="stat-grid">
        <article className="stat-card"><span>Total Liter</span><strong>{formatNumber(totalLiter)} L</strong><small>shift terpilih</small></article>
        <article className="stat-card"><span>Jumlah Pengisian</span><strong>{logs.length}</strong></article>
        <article className="stat-card"><span>Unit Terisi</span><strong>{unitCount}</strong></article>
        <article className="stat-card"><span>Rata / Pengisian</span><strong>{formatNumber(Math.round(avgLiter))} L</strong></article>
      </div>

      <section className="card">
        <CardHeader
          title="Log Pengisian BBM"
          meta={isLoading ? 'Memuat data...' : `${logs.length} pengisian • total ${formatNumber(totalLiter)} L`}
        />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Unit</th>
                <th>Tipe</th>
                <th>Petugas</th>
                <th>Jam</th>
                <th>Lokasi</th>
                <th>Jenis BBM</th>
                <th>Liter</th>
                <th>Odometer (km)</th>
                <th>HM</th>
                <th>Keterangan</th>
                <th>Aksi</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id}>
                  <td><strong>{log.unit?.kode ?? log.unitId}</strong></td>
                  <td>{log.unit?.tipe?.nama ?? '-'}</td>
                  <td>{log.operatorBbm?.nama ?? '-'}</td>
                  <td>{log.jamPengisian ? `${new Date(log.jamPengisian).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' })} ${formatJam(log.jamPengisian)}` : new Date(log.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</td>
                  <td>{log.fuelStation?.nama ?? log.lokasi ?? '-'}</td>
                  <td>{log.fuelType?.nama ?? '-'}</td>
                  <td><strong>{formatNumber(log.liter)} L</strong></td>
                  <td>{log.odoKm != null ? formatNumber(log.odoKm) : '-'}</td>
                  <td>{log.hm != null ? formatNumber(log.hm) : '-'}</td>
                  <td>{log.keterangan ?? '-'}</td>
                  <td>
                    <div className="rowact">
                      <button type="button" onClick={() => setDetailLog(log)}>Detail</button>
                      <button type="button" onClick={() => openEdit(log)}>Edit</button>
                      <button type="button" className="btn-danger-sm" onClick={() => setDeleteLog(log)}>Hapus</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!logs.length && !isLoading ? (
                <tr>
                  <td colSpan={11} style={{ textAlign: 'center', padding: '24px 0' }}>
                    Belum ada pengisian BBM untuk shift terpilih.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      {/* MODAL: Grid Input BBM */}
      {isGridOpen ? (
        <div className="modal-overlay">
          <div className="modal modal-full" role="dialog" aria-modal="true" aria-label="Input Pengisian BBM">
            <div className="modal-header">
              <span className="modal-title">
                Input Pengisian BBM — {selectedShiftLabel(shifts, shiftId)}
              </span>
              <button className="modal-close" type="button" onClick={() => setIsGridOpen(false)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-section-head">
                <div className="modal-section-title" style={{ margin: 0 }}>Data Pengisian per Unit ({gridRows.length} baris)</div>
                <div className="modal-section-actions">
                  <button type="button" className="btn-ghost-sm" onClick={fillDownLokasi}>⬇ Isi Lokasi &amp; Jam ke Bawah</button>
                  <button type="button" className="btn-gold-sm" onClick={addGridRow}>+ Baris Baru</button>
                </div>
              </div>
              <div className="modal-note">Baris otomatis dari unit ter-assign shift ini. Petugas BBM = akun Anda ({session?.nama ?? session?.username ?? '-'}).</div>
              <div className="modal-unit-list">
                <table>
                  <thead>
                    <tr>
                      <th style={{ width: 32 }}>#</th>
                      <th>Unit</th>
                      <th>Tipe</th>
                      <th>Tanggal &amp; Jam Pengisian</th>
                      <th>Lokasi (Fuel Station)</th>
                      <th>Jenis BBM</th>
                      <th>Liter</th>
                      <th>Odometer (km)</th>
                      <th>HM</th>
                      <th>Keterangan</th>
                      <th style={{ width: 44 }} />
                    </tr>
                  </thead>
                  <tbody>
                    {gridRows.map((row, index) => {
                      const rowUnit = units.find((u) => u.id === row.unitId);
                      return (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <select className="cell-select" value={row.unitId} onChange={(event) => updateGridRow(index, { unitId: event.target.value })}>
                              <option value="">— pilih —</option>
                              {units.map((unit) => <option value={unit.id} key={unit.id}>{unit.kode}</option>)}
                            </select>
                          </td>
                          <td>{rowUnit?.tipe?.nama ?? '-'}</td>
                          <td>
                            <input className="cell-select" style={{ minWidth: 180 }} type="datetime-local" value={row.jamPengisian}
                              onChange={(event) => updateGridRow(index, { jamPengisian: event.target.value })} />
                          </td>
                          <td>
                            <select className="cell-select" style={{ minWidth: 150 }} value={row.fuelStationId} onChange={(event) => updateGridRow(index, { fuelStationId: event.target.value })}>
                              <option value="">— pilih —</option>
                              {fuelStations.map((fs) => <option value={fs.id} key={fs.id}>{fs.nama}</option>)}
                            </select>
                          </td>
                          <td>
                            <select className="cell-select" style={{ minWidth: 130 }} value={row.fuelTypeId} onChange={(event) => updateGridRow(index, { fuelTypeId: event.target.value })}>
                              <option value="">— pilih —</option>
                              {fuelTypes.map((ft) => <option value={ft.id} key={ft.id}>{ft.nama}</option>)}
                            </select>
                          </td>
                          <td>
                            <input className="cell-select" style={{ width: 80 }} type="number" min="0" value={row.liter}
                              onChange={(event) => updateGridRow(index, { liter: Number(event.target.value) || 0 })} />
                          </td>
                          <td>
                            <input className="cell-select" style={{ width: 110 }} type="number" value={row.odoKm ?? ''}
                              onChange={(event) => updateGridRow(index, { odoKm: event.target.value ? Number(event.target.value) : undefined })} />
                          </td>
                          <td>
                            <input className="cell-select" style={{ width: 90 }} type="number" value={row.hm ?? ''}
                              onChange={(event) => updateGridRow(index, { hm: event.target.value ? Number(event.target.value) : undefined })} />
                          </td>
                          <td>
                            <input className="cell-select" style={{ minWidth: 140 }} value={row.keterangan}
                              onChange={(event) => updateGridRow(index, { keterangan: event.target.value })} />
                          </td>
                          <td>
                            <button type="button" className="row-remove" title="Hapus baris" onClick={() => removeGridRow(index)} disabled={gridRows.length <= 1}>✕</button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="grid-summary">
                <div><span>Baris</span><strong>{gridRows.length}</strong></div>
                <div><span>Total Liter</span><strong>{formatNumber(gridTotalLiter)} L</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setIsGridOpen(false)}>Batal</button>
              <button className="primary-link" type="button" onClick={saveGrid}>💾 Simpan Semua</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Edit */}
      {editLog ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setEditLog(null); }}>
          <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label="Edit Pengisian BBM">
            <div className="modal-header">
              <span className="modal-title">Edit Pengisian — {editLog.unit?.kode ?? editLog.unitId}</span>
              <button className="modal-close" type="button" onClick={() => setEditLog(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-form-grid">
                <label>Tanggal &amp; Jam<input type="datetime-local" value={eJam} onChange={(event) => setEJam(event.target.value)} /></label>
                <label>
                  Lokasi (Fuel Station)
                  <select value={eStation} onChange={(event) => setEStation(event.target.value)}>
                    <option value="">— pilih —</option>
                    {fuelStations.map((fs) => <option value={fs.id} key={fs.id}>{fs.nama}</option>)}
                  </select>
                </label>
                <label>
                  Jenis BBM
                  <select value={eFuelType} onChange={(event) => setEFuelType(event.target.value)}>
                    <option value="">— pilih —</option>
                    {fuelTypes.map((ft) => <option value={ft.id} key={ft.id}>{ft.nama}</option>)}
                  </select>
                </label>
                <label>Liter <span className="req">*</span><input type="number" min="0" value={eLiter} onChange={(event) => setELiter(Number(event.target.value) || 0)} /></label>
                <label>Odometer (km)<input type="number" value={eOdo ?? ''} onChange={(event) => setEOdo(event.target.value ? Number(event.target.value) : undefined)} /></label>
                <label>HM<input type="number" value={eHm ?? ''} onChange={(event) => setEHm(event.target.value ? Number(event.target.value) : undefined)} /></label>
                <label style={{ gridColumn: '1 / -1' }}>Keterangan<input value={eKeterangan} onChange={(event) => setEKeterangan(event.target.value)} /></label>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setEditLog(null)}>Batal</button>
              <button className="primary-link" type="button" onClick={saveEdit}>Simpan Perubahan</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Detail */}
      {detailLog ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDetailLog(null); }}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Detail Pengisian BBM">
            <div className="modal-header">
              <span className="modal-title">Detail Pengisian BBM</span>
              <button className="modal-close" type="button" onClick={() => setDetailLog(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="close-summary">
                <div><span>Unit</span><strong>{detailLog.unit?.kode ?? detailLog.unitId} • {detailLog.unit?.tipe?.nama ?? '-'}</strong></div>
                <div><span>Petugas BBM</span><strong>{detailLog.operatorBbm?.nama ?? '-'}</strong></div>
                <div><span>Jam Pengisian</span><strong>{detailLog.jamPengisian ? `${new Date(detailLog.jamPengisian).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })} ${formatJam(detailLog.jamPengisian)}` : '-'}</strong></div>
                <div><span>Lokasi (Fuel Station)</span><strong>{detailLog.fuelStation?.nama ?? detailLog.lokasi ?? '-'}</strong></div>
                <div><span>Jenis BBM</span><strong>{detailLog.fuelType?.nama ?? '-'}</strong></div>
                <div><span>Liter</span><strong>{formatNumber(detailLog.liter)} L</strong></div>
                <div><span>Odometer</span><strong>{detailLog.odoKm != null ? `${formatNumber(detailLog.odoKm)} km` : '-'}</strong></div>
                <div><span>HM</span><strong>{detailLog.hm != null ? formatNumber(detailLog.hm) : '-'}</strong></div>
                <div><span>Keterangan</span><strong>{detailLog.keterangan ?? '-'}</strong></div>
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDetailLog(null)}>Tutup</button>
            </div>
          </div>
        </div>
      ) : null}

      {/* MODAL: Hapus */}
      {deleteLog ? (
        <div className="modal-overlay" onClick={(event) => { if (event.target === event.currentTarget) setDeleteLog(null); }}>
          <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Konfirmasi Hapus">
            <div className="modal-header">
              <span className="modal-title">Konfirmasi Hapus</span>
              <button className="modal-close" type="button" onClick={() => setDeleteLog(null)} aria-label="Tutup">✕</button>
            </div>
            <div className="modal-body">
              <div className="modal-note" style={{ background: '#f7e0e2', borderColor: '#e2b6ba', color: 'var(--red)' }}>
                Hapus pengisian BBM <strong>{deleteLog.unit?.kode ?? deleteLog.unitId}</strong> ({formatNumber(deleteLog.liter)} L)? Tindakan ini tidak dapat dibatalkan.
              </div>
            </div>
            <div className="modal-footer">
              <button type="button" onClick={() => setDeleteLog(null)}>Batal</button>
              <button className="btn-danger-sm" type="button" onClick={confirmDelete} style={{ padding: '10px 18px' }}>Hapus</button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
};

const selectedShiftLabel = (shifts: Shift[], shiftId: string) => {
  const s = shifts.find((x) => x.id === shiftId);
  return s ? `${formatDate(s.tanggal)} • ${formatShiftType(s.tipe)}` : 'pilih shift';
};

type DailyReport = {
  shiftId: string;
  tanggal: string;
  branchId: string;
  tipe: string;
  ritCount: number;
  totalTonase: number;
  totalDelayMinutes: number;
  maintenanceCount: number;
  totalBBMLiter: number;
};

type DelaySummaryRow = { delayType: string; nama: string; totalDurasiMenit: number; budgetMenit?: number | null };
type BbmReportRow = { unitId: string; totalLiter: number; entries: number };
type MaintenanceReportRow = { jenis: string; count: number; open: number; closed: number };
type MonthlyReport = {
  bulan: string;
  shifts: number;
  totalRit: number;
  totalTonase: number;
  delayMinutes: number;
  maintenanceCount: number;
};

const downloadCsv = async (query: string, filename: string): Promise<boolean> => {
  const response = await fetch(apiUrl(`/api/v1/laporan/export?${query}`), { headers: buildHeaders() });
  if (response.status === 401) {
    onUnauthorized?.();
    return false;
  }
  if (!response.ok) return false;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
  return true;
};

// ============ Analytic (viewer raw data /analytic/daily) ============
type AnalyticBasis = {
  tipeUnitKode: string; materialKode: string;
  ewhPerUnitJam: number; jumlahUnitPlan: number; produktivitasTonPerJam: number; berlakuDari: string;
};
type AnalyticDelay = { delayTypeId: string; kode: string; nama: string; kenaPA: boolean; actualMin: number; targetMin: number };
type AnalyticRow = {
  tanggal: string; hari: number;
  produksi: { planTon: number; aktualTon: number };
  dtBeroperasi: { plan: number; aktual: number };
  availability: { paPct: number; uaPct: number; ewhJam: number; jamTersediaJam: number; breakdownJam: number };
  delays: AnalyticDelay[];
  totalStandbyMin: { aktual: number; target: number };
  basisTerpakai: AnalyticBasis[];
  noData: boolean;
};
type AnalyticResponse = {
  branch: { id: string; kode: string; nama: string };
  bulan: string; tahun: number; jumlahHari: number; rows: AnalyticRow[];
};

// ============ Dashboard Daily Report (matriks Aktual vs Target — mirror sheet) ============
type MatrixMetric = {
  name: string; unit: string;
  aktual: (r: AnalyticRow) => number;
  target?: (r: AnalyticRow) => number;
  lowerBetter?: boolean; // delay/breakdown/standby: makin kecil makin baik
  decimals?: number;
  percent?: boolean; // metrik rasio: Total tidak dijumlah
};

const DashboardDailyReport = () => {
  const now = new Date();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [bulan, setBulan] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [data, setData] = useState<AnalyticResponse | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet<Branch[]>('/api/v1/master/branches?aktif=true')
      .then((b) => { setBranches(b); if (b[0]) setBranchId(b[0].id); })
      .catch(() => setMessage('Gagal memuat daftar branch.'));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true); setMessage('');
    apiGet<AnalyticResponse>(`/api/v1/analytic/daily?branchId=${branchId}&bulan=${bulan}&tahun=${tahun}`)
      .then(setData)
      .catch(() => { setData(null); setMessage('Gagal memuat data.'); })
      .finally(() => setLoading(false));
  }, [branchId, bulan, tahun]);

  const rows = data?.rows ?? [];
  const num = (n: number, dec = 0) => n.toLocaleString('id-ID', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const achOf = (a: number, t: number, lowerBetter?: boolean) => {
    if (!t) return null;
    return lowerBetter ? (t / Math.max(a, 0.0001)) * 100 : (a / t) * 100;
  };
  const achClass = (pct: number | null) => {
    if (pct == null) return '';
    if (pct >= 100) return 'ach-good';
    if (pct >= 80) return 'ach-warn';
    return 'ach-bad';
  };
  const isWeekend = (tanggal: string) => { const d = new Date(tanggal + 'T00:00:00').getDay(); return d === 0 || d === 5; }; // Minggu / Jumat

  // Metrik utama (urutan seperti sheet). Delay ditambahkan dinamis di bawah.
  const metrics: MatrixMetric[] = [
    { name: 'Produksi Total', unit: 'ton', aktual: (r) => r.produksi.aktualTon, target: (r) => r.produksi.planTon },
    { name: 'DT Beroperasi', unit: 'unit', aktual: (r) => r.dtBeroperasi.aktual, target: (r) => r.dtBeroperasi.plan },
    { name: 'PA', unit: '%', aktual: (r) => r.availability.paPct, percent: true, decimals: 0 },
    { name: 'UA', unit: '%', aktual: (r) => r.availability.uaPct, percent: true, decimals: 0 },
    { name: 'Jam Tersedia', unit: 'jam', aktual: (r) => r.availability.jamTersediaJam, decimals: 1 },
    { name: 'EWH', unit: 'jam', aktual: (r) => r.availability.ewhJam, decimals: 1 },
    { name: 'Breakdown', unit: 'jam', aktual: (r) => r.availability.breakdownJam, lowerBetter: true, decimals: 1 },
    { name: 'Total Standby selain BD', unit: 'menit', aktual: (r) => r.totalStandbyMin.aktual, target: (r) => r.totalStandbyMin.target, lowerBetter: true },
  ];
  const delayTypes = rows[0]?.delays ?? [];

  const sumBy = (fn: (r: AnalyticRow) => number) => rows.reduce((s, r) => s + fn(r), 0);

  // Satu metrik = blok baris (Aktual / Target? / Ach?). Kolom = hari + Total.
  const renderMetric = (m: MatrixMetric, key: string) => {
    const hasTarget = !!m.target;
    const totalA = sumBy(m.aktual);
    const totalT = hasTarget ? sumBy(m.target!) : 0;
    const dec = m.decimals ?? 0;
    return (
      <Fragment key={key}>
        <tr className="ddr-aktual ddr-group-start">
          <td className="ddr-metric" rowSpan={hasTarget ? 3 : 1}>{m.name}<span className="ddr-unit">{m.unit}</span></td>
          <td className="ddr-sub">Aktual</td>
          {rows.map((r) => {
            const v = m.aktual(r);
            const flag = m.name === 'Produksi Total' && r.noData;
            return <td key={r.tanggal} className={`ddr-num${flag ? ' ddr-flag' : ''}`}>{v ? num(v, dec) : (m.percent ? (r.availability.jamTersediaJam ? num(v, dec) : '–') : '–')}</td>;
          })}
          <td className="ddr-num ddr-total">{m.percent ? '–' : num(totalA, dec)}</td>
        </tr>
        {hasTarget ? (
          <>
            <tr className="ddr-plan">
              <td className="ddr-sub">Target</td>
              {rows.map((r) => <td key={r.tanggal} className="ddr-num">{num(m.target!(r), dec)}</td>)}
              <td className="ddr-num ddr-total">{num(totalT, dec)}</td>
            </tr>
            <tr className="ddr-ach">
              <td className="ddr-sub">Ach%</td>
              {rows.map((r) => {
                const pct = achOf(m.aktual(r), m.target!(r), m.lowerBetter);
                return <td key={r.tanggal} className={`ddr-num ${achClass(pct)}`}>{pct == null ? '–' : `${Math.round(pct)}%`}</td>;
              })}
              <td className={`ddr-num ddr-total ${achClass(achOf(totalA, totalT, m.lowerBetter))}`}>{totalT ? `${Math.round(achOf(totalA, totalT, m.lowerBetter)!)}%` : '–'}</td>
            </tr>
          </>
        ) : null}
      </Fragment>
    );
  };

  const renderDelay = (idx: number) => {
    const dt = delayTypes[idx];
    const aktual = (r: AnalyticRow) => r.delays[idx]?.actualMin ?? 0;
    const target = (r: AnalyticRow) => r.delays[idx]?.targetMin ?? 0;
    const hasTarget = rows.some((r) => target(r) > 0);
    const totalA = sumBy(aktual);
    const totalT = sumBy(target);
    return (
      <Fragment key={`delay-${idx}`}>
        <tr className="ddr-aktual ddr-group-start">
          <td className="ddr-metric" rowSpan={hasTarget ? 2 : 1}>{idx + 1}. {dt.nama}<span className="ddr-unit">menit{dt.kenaPA ? ' · PA' : ''}</span></td>
          <td className="ddr-sub">Aktual</td>
          {rows.map((r) => <td key={r.tanggal} className="ddr-num">{aktual(r) ? num(aktual(r)) : '–'}</td>)}
          <td className="ddr-num ddr-total">{num(totalA)}</td>
        </tr>
        {hasTarget ? (
          <tr className="ddr-plan">
            <td className="ddr-sub">Target</td>
            {rows.map((r) => <td key={r.tanggal} className="ddr-num">{target(r) ? num(target(r)) : '–'}</td>)}
            <td className="ddr-num ddr-total">{num(totalT)}</td>
          </tr>
        ) : null}
      </Fragment>
    );
  };

  return (
    <>
      <PageHeader
        title="Daily Report"
        description="Matriks harian Aktual vs Target sebulan penuh — Produksi, availability, dan delay. Sumber: modul Analytic."
      />
      <section className="toolbar-panel">
        <label>Branch
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
          </select>
        </label>
        <label>Bulan
          <select value={bulan} onChange={(e) => setBulan(e.target.value)}>
            {BULAN_OPTS.map(([v, l]) => <option value={v} key={v}>{l}</option>)}
          </select>
        </label>
        <label>Tahun
          <input type="number" min="2000" style={{ width: 90 }} value={tahun} onChange={(e) => setTahun(e.target.value)} />
        </label>
      </section>

      {message ? <div className="inline-alert">{message}</div> : null}

      <div className="ddr-legend">
        <span><i className="ddr-sw ach-good" />Ach ≥ 100%</span>
        <span><i className="ddr-sw ach-warn" />80–99%</span>
        <span><i className="ddr-sw ach-bad" />&lt; 80%</span>
        <span><i className="ddr-sw ddr-flag" />Aktual 0 tapi ada Target (hari hilang data)</span>
        <span style={{ marginLeft: 'auto', color: 'var(--muted)' }}>Kolom <strong>J</strong>=Jumat, <strong>M</strong>=Minggu</span>
      </div>

      <section className="card">
        <CardHeader title={data ? `${data.branch.nama} — ${BULAN_OPTS.find(([v]) => v === bulan)?.[1]} ${tahun}` : 'Daily Report'} meta={loading ? 'memuat…' : `${rows.length} hari`} />
        <div className="table-wrap">
          <table className="ddr-table">
            <thead>
              <tr>
                <th className="ddr-metric-head" colSpan={2}>Metrik</th>
                {rows.map((r) => {
                  const d = new Date(r.tanggal + 'T00:00:00').getDay();
                  const tag = d === 5 ? ' J' : d === 0 ? ' M' : '';
                  return <th key={r.tanggal} className={`ddr-num${isWeekend(r.tanggal) ? ' ddr-weekend' : ''}`}>{r.hari}{tag}</th>;
                })}
                <th className="ddr-num ddr-total">Total</th>
              </tr>
            </thead>
            <tbody>
              {!loading && rows.length ? metrics.map((m, i) => renderMetric(m, `m-${i}`)) : null}
              {!loading && rows.length && delayTypes.length ? (
                <tr className="ddr-divider"><td colSpan={rows.length + 3}>Delay per Jenis</td></tr>
              ) : null}
              {!loading && rows.length ? delayTypes.map((_, i) => renderDelay(i)) : null}
              {loading ? <tr><td colSpan={rows.length + 3} style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)' }}>Memuat…</td></tr> : null}
              {!loading && !rows.length ? <tr><td style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)' }}>Tidak ada data.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const AnalyticPage = () => {
  const now = new Date();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [bulan, setBulan] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [data, setData] = useState<AnalyticResponse | null>(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiGet<Branch[]>('/api/v1/master/branches?aktif=true')
      .then((b) => { setBranches(b); if (b[0]) setBranchId(b[0].id); })
      .catch(() => setMessage('Gagal memuat daftar branch.'));
  }, []);

  useEffect(() => {
    if (!branchId) return;
    setLoading(true); setMessage('');
    apiGet<AnalyticResponse>(`/api/v1/analytic/daily?branchId=${branchId}&bulan=${bulan}&tahun=${tahun}`)
      .then(setData)
      .catch(() => { setData(null); setMessage('Gagal memuat data analytic.'); })
      .finally(() => setLoading(false));
  }, [branchId, bulan, tahun]);

  const achPct = (aktual: number, plan: number) => (plan > 0 ? (aktual / plan) * 100 : null);
  const achColor = (pct: number | null) => {
    if (pct == null) return 'var(--muted)';
    if (pct >= 95) return 'var(--green)';
    if (pct >= 80) return 'var(--warn-ink)';
    return 'var(--red)';
  };
  const fmt1 = (n: number) => n.toLocaleString('id-ID', { maximumFractionDigits: 1 });

  // Kombinasi basis unik yang dipakai sepanjang bulan (untuk caption transparansi).
  const basisUsed = new Map<string, AnalyticBasis>();
  data?.rows.forEach((r) => r.basisTerpakai.forEach((b) => basisUsed.set(`${b.tipeUnitKode}|${b.materialKode}|${b.berlakuDari}`, b)));

  return (
    <>
      <PageHeader
        title="Analytic"
        description="Raw data harian hasil komputasi: Target (turunan input dasar) vs Aktual (data operasional). Sumber untuk Dashboard Daily Report."
      />
      <section className="toolbar-panel">
        <label>Branch
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
          </select>
        </label>
        <label>Bulan
          <select value={bulan} onChange={(e) => setBulan(e.target.value)}>
            {BULAN_OPTS.map(([v, l]) => <option value={v} key={v}>{l}</option>)}
          </select>
        </label>
        <label>Tahun
          <input type="number" min="2000" style={{ width: 90 }} value={tahun} onChange={(e) => setTahun(e.target.value)} />
        </label>
      </section>

      {message ? <div className="inline-alert">{message}</div> : null}

      {basisUsed.size ? (
        <p style={{ color: 'var(--muted)', fontSize: 'var(--font-size-sm)', margin: '0 0 12px' }}>
          Input dasar dipakai bulan ini:{' '}
          {Array.from(basisUsed.values()).map((b, i) => (
            <span key={i}>{i ? ' · ' : ''}<strong>{b.tipeUnitKode}/{b.materialKode}</strong> ({fmt1(b.ewhPerUnitJam)}j × {b.jumlahUnitPlan} × {fmt1(b.produktivitasTonPerJam)}t, sejak {b.berlakuDari})</span>
          ))}
        </p>
      ) : (
        <p style={{ color: 'var(--muted)', fontSize: 'var(--font-size-sm)', margin: '0 0 12px' }}>
          Belum ada input dasar untuk branch ini — Target Produksi belum bisa dihitung. Isi di Master Data → Budget &amp; Target → "Input Dasar Target Produksi".
        </p>
      )}

      <section className="card">
        <CardHeader title={data ? `Raw Data Harian — ${data.branch.nama}` : 'Raw Data Harian'} meta={data ? `${data.jumlahHari} hari` : ''} />
        <div className="table-wrap">
          <table className="analytic-table">
            <thead>
              <tr>
                <th rowSpan={2}>Tgl</th>
                <th colSpan={3} style={{ textAlign: 'center' }}>Produksi (ton)</th>
                <th colSpan={2} style={{ textAlign: 'center' }}>DT Beroperasi</th>
                <th colSpan={5} style={{ textAlign: 'center' }}>Availability (Aktual)</th>
              </tr>
              <tr>
                <th>Target</th><th>Aktual</th><th>Ach%</th>
                <th>Plan</th><th>Aktual</th>
                <th>PA%</th><th>UA%</th><th>EWH (j)</th><th>Jam Tersedia</th><th>Breakdown (j)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)' }}>Memuat…</td></tr> : null}
              {!loading && data?.rows.map((r) => {
                const ach = achPct(r.produksi.aktualTon, r.produksi.planTon);
                return (
                  <tr key={r.tanggal} className={r.noData ? 'analytic-nodata' : ''}>
                    <td className="tabular">{r.hari}{r.noData ? <span title="Ada Target tapi tak ada shift tercatat" style={{ color: 'var(--red)', marginLeft: 4 }}>⚠</span> : null}</td>
                    <td className="tabular">{r.produksi.planTon ? formatNumber(Math.round(r.produksi.planTon)) : '—'}</td>
                    <td className="tabular">{r.produksi.aktualTon ? formatNumber(Math.round(r.produksi.aktualTon)) : '—'}</td>
                    <td className="tabular" style={{ color: achColor(ach), fontWeight: 600 }}>{ach == null ? '—' : `${Math.round(ach)}%`}</td>
                    <td className="tabular">{r.dtBeroperasi.plan || '—'}</td>
                    <td className="tabular">{r.dtBeroperasi.aktual || '—'}</td>
                    <td className="tabular">{r.availability.jamTersediaJam ? `${Math.round(r.availability.paPct)}%` : '—'}</td>
                    <td className="tabular">{r.availability.jamTersediaJam ? `${Math.round(r.availability.uaPct)}%` : '—'}</td>
                    <td className="tabular">{r.availability.ewhJam ? fmt1(r.availability.ewhJam) : '—'}</td>
                    <td className="tabular">{r.availability.jamTersediaJam ? fmt1(r.availability.jamTersediaJam) : '—'}</td>
                    <td className="tabular">{r.availability.breakdownJam ? fmt1(r.availability.breakdownJam) : '—'}</td>
                  </tr>
                );
              })}
              {!loading && !data?.rows.length ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)' }}>Tidak ada data.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const ReportsPage = () => {
  const [tanggal, setTanggal] = useState('');
  const [bulan, setBulan] = useState('');
  const [daily, setDaily] = useState<DailyReport[]>([]);
  const [delaySummary, setDelaySummary] = useState<DelaySummaryRow[]>([]);
  const [bbmReport, setBbmReport] = useState<BbmReportRow[]>([]);
  const [maintenanceReport, setMaintenanceReport] = useState<MaintenanceReportRow[]>([]);
  const [monthly, setMonthly] = useState<MonthlyReport | null>(null);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  // Default tanggal/bulan ke shift terbaru agar laporan langsung berisi data.
  useEffect(() => {
    apiGet<Shift[]>('/api/v1/shifts')
      .then((shifts) => {
        const latest = shifts[0]?.tanggal ?? new Date().toISOString().slice(0, 10);
        setTanggal(latest);
        setBulan(latest.slice(0, 7));
      })
      .catch(() => {
        const today = new Date().toISOString().slice(0, 10);
        setTanggal(today);
        setBulan(today.slice(0, 7));
      });
  }, []);

  const loadReports = () => {
    if (!tanggal || !bulan) return;
    setIsLoading(true);
    Promise.all([
      apiGet<DailyReport[]>(`/api/v1/laporan/daily?tanggal=${tanggal}`),
      apiGet<DelaySummaryRow[]>('/api/v1/laporan/delay-summary'),
      apiGet<BbmReportRow[]>('/api/v1/laporan/bbm'),
      apiGet<MaintenanceReportRow[]>('/api/v1/laporan/maintenance'),
      apiGet<MonthlyReport>(`/api/v1/laporan/bulanan?bulan=${bulan}`),
    ])
      .then(([nextDaily, nextDelay, nextBbm, nextMaintenance, nextMonthly]) => {
        setDaily(nextDaily);
        setDelaySummary(nextDelay);
        setBbmReport(nextBbm);
        setMaintenanceReport(nextMaintenance);
        setMonthly(nextMonthly);
        setMessage('');
      })
      .catch(() => setMessage('Gagal mengambil data laporan dari API.'))
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    loadReports();
  }, [tanggal, bulan]);

  const exportDaily = async () => {
    const ok = await downloadCsv(`tanggal=${tanggal}`, `laporan-harian-${tanggal}.csv`);
    setMessage(ok ? 'Export laporan harian diunduh.' : 'Export gagal.');
  };
  const exportMonthly = async () => {
    const ok = await downloadCsv(`bulan=${bulan}`, `laporan-bulanan-${bulan}.csv`);
    setMessage(ok ? 'Export laporan bulanan diunduh.' : 'Export gagal.');
  };

  const dailyTotals = daily.reduce(
    (acc, row) => ({
      rit: acc.rit + row.ritCount,
      tonase: acc.tonase + row.totalTonase,
      delay: acc.delay + row.totalDelayMinutes,
      bbm: acc.bbm + row.totalBBMLiter,
    }),
    { rit: 0, tonase: 0, delay: 0, bbm: 0 },
  );

  return (
    <>
      <PageHeader
        title="Laporan Operasional"
        description="Rekap harian dan bulanan produksi, delay, maintenance, dan BBM. Export CSV untuk analisis lanjutan."
        action={<button className="primary-link" onClick={loadReports}>Muat Ulang</button>}
      />
      {message ? <div className="inline-alert">{message}</div> : null}

      <section className="toolbar-panel">
        <label>
          Tanggal (harian)
          <input type="date" value={tanggal} onChange={(event) => setTanggal(event.target.value)} />
        </label>
        <label>
          Bulan (bulanan)
          <input type="month" value={bulan} onChange={(event) => setBulan(event.target.value)} />
        </label>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <button className="primary-link" type="button" onClick={exportDaily}>Export Harian CSV</button>
          <button type="button" onClick={exportMonthly}>Export Bulanan CSV</button>
        </div>
      </section>

      <div className="stat-grid">
        <article className="stat-card">
          <span>Ritase ({tanggal})</span>
          <strong>{dailyTotals.rit}</strong>
          <p>Total rit tercatat harian</p>
          <small>{daily.length} shift</small>
        </article>
        <article className="stat-card">
          <span>Tonase Harian</span>
          <strong>{formatNumber(Math.round(dailyTotals.tonase))} t</strong>
          <p>Akumulasi netto tonase</p>
          <small>{tanggal}</small>
        </article>
        <article className="stat-card">
          <span>Delay Harian</span>
          <strong>{dailyTotals.delay} mnt</strong>
          <p>Total durasi delay</p>
          <small>{tanggal}</small>
        </article>
        <article className="stat-card">
          <span>BBM Harian</span>
          <strong>{formatNumber(dailyTotals.bbm)} L</strong>
          <p>Total konsumsi BBM</p>
          <small>{tanggal}</small>
        </article>
      </div>

      {monthly ? (
        <section className="card">
          <CardHeader title={`Rekap Bulanan ${monthly.bulan}`} meta={`${monthly.shifts} shift`} />
          <div className="stat-grid" style={{ marginTop: 12 }}>
            <article className="stat-card"><span>Total Rit</span><strong>{monthly.totalRit}</strong></article>
            <article className="stat-card"><span>Total Tonase</span><strong>{formatNumber(Math.round(monthly.totalTonase))} t</strong></article>
            <article className="stat-card"><span>Total Delay</span><strong>{monthly.delayMinutes} mnt</strong></article>
            <article className="stat-card"><span>Maintenance</span><strong>{monthly.maintenanceCount}</strong></article>
          </div>
        </section>
      ) : null}

      <div className="content-grid">
        <section className="card">
          <CardHeader title="Ringkasan Delay per Jenis" meta={`${delaySummary.length} jenis`} />
          <div className="delay-list">
            {delaySummary.map((row) => {
              const budget = row.budgetMenit ?? 0;
              const pct = budget > 0 ? Math.min(100, Math.round((row.totalDurasiMenit / budget) * 100)) : row.totalDurasiMenit > 0 ? 100 : 0;
              return (
                <div className="delay-row" key={row.delayType}>
                  <div>
                    <strong>{row.nama}</strong>
                    <span>{row.totalDurasiMenit} mnt{budget ? ` / budget ${budget}` : ''}</span>
                  </div>
                  <div><span style={{ width: `${pct}%` }} /></div>
                </div>
              );
            })}
            {!delaySummary.length ? <p style={{ opacity: 0.7 }}>Belum ada data delay.</p> : null}
          </div>
        </section>

        <section className="card">
          <CardHeader title="Maintenance per Jenis" meta={`${maintenanceReport.length} jenis`} />
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Jenis</th><th>Total</th><th>Open</th><th>Closed</th></tr>
              </thead>
              <tbody>
                {maintenanceReport.map((row) => (
                  <tr key={row.jenis}>
                    <td>{row.jenis}</td>
                    <td>{row.count}</td>
                    <td>{row.open}</td>
                    <td>{row.closed}</td>
                  </tr>
                ))}
                {!maintenanceReport.length ? (
                  <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada data.</td></tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="card">
        <CardHeader title={`Detail Shift Harian ${tanggal}`} meta={isLoading ? 'Memuat...' : `${daily.length} shift`} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Shift</th><th>Tipe</th><th>Rit</th><th>Tonase</th><th>Delay (mnt)</th><th>Maintenance</th><th>BBM (L)</th>
              </tr>
            </thead>
            <tbody>
              {daily.map((row) => (
                <tr key={row.shiftId}>
                  <td>{formatShiftType(row.tipe)}</td>
                  <td>{row.tipe}</td>
                  <td>{row.ritCount}</td>
                  <td>{formatNumber(Math.round(row.totalTonase))} t</td>
                  <td>{row.totalDelayMinutes}</td>
                  <td>{row.maintenanceCount}</td>
                  <td>{formatNumber(row.totalBBMLiter)}</td>
                </tr>
              ))}
              {!daily.length && !isLoading ? (
                <tr><td colSpan={7} style={{ textAlign: 'center', padding: '24px 0' }}>Tidak ada shift pada tanggal ini.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <CardHeader title="Konsumsi BBM per Unit" meta={`${bbmReport.length} unit`} />
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Unit ID</th><th>Total Liter</th><th>Jumlah Pengisian</th></tr>
            </thead>
            <tbody>
              {bbmReport.map((row) => (
                <tr key={row.unitId}>
                  <td>{row.unitId}</td>
                  <td>{formatNumber(row.totalLiter)} L</td>
                  <td>{row.entries}</td>
                </tr>
              ))}
              {!bbmReport.length ? (
                <tr><td colSpan={3} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada data BBM.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type TipeUnit = { id: string; kode: string; nama: string; kapasitasTon: number; aktif: boolean };
type MasterUnit = {
  id: string;
  kode: string;
  polisi: string;
  noRangka?: string | null;
  noMesin?: string | null;
  tahun?: number | null;
  kapasitas?: number | null;
  tipeId?: string;
  branchId?: string;
  status: 'ready' | 'breakdown' | 'pm';
  aktif: boolean;
  tipe?: { nama: string };
  branch?: { nama: string };
};
type MasterOperator = {
  id: string; nama: string; nik: string; aktif: boolean; branchId?: string; branch?: { nama: string };
  nid?: string | null; telepon?: string | null; sim?: string | null; simJenis?: string | null; simMasaBerlaku?: string | null;
  kontakDaruratNama?: string | null; kontakDaruratHubungan?: string | null; kontakDaruratTelepon?: string | null;
};

const MasterAddModal = ({ title, open, onClose, onSave, children, saveLabel }: { title: string; open: boolean; onClose: () => void; onSave: () => void; children: React.ReactNode; saveLabel?: string }) => {
  if (!open) return null;
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-lg" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-form-grid">{children}</div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose}>Batal</button>
          <button className="primary-link" type="button" onClick={onSave}>{saveLabel ?? 'Simpan'}</button>
        </div>
      </div>
    </div>
  );
};

// Avatar Multiavatar — SVG deterministik dari string "seed" (bukan file upload).
// Aman untuk dangerouslySetInnerHTML: multiavatar() men-hash seed jadi 6 indeks
// bagian avatar, teks seed tidak pernah disisipkan mentah ke markup SVG.
const Avatar = ({ seed, size = 38 }: { seed: string; size?: number }) => {
  const svg = useMemo(() => multiavatar(seed || 'HAULOPS'), [seed]);
  return (
    <span
      className="avatar-svg"
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
};

const MasterBar = ({ label, onAdd, extra }: { label: string; onAdd: () => void; extra?: React.ReactNode }) => (
  <div className="master-bar">
    {extra}
    <button className="primary-link" type="button" onClick={onAdd}>+ {label}</button>
  </div>
);

const RowActions = ({ onView, onEdit, onDelete }: { onView?: () => void; onEdit?: () => void; onDelete?: () => void }) => (
  <div className="rowact">
    {onView ? <button type="button" onClick={onView}>Lihat</button> : null}
    {onEdit ? <button type="button" onClick={onEdit}>Edit</button> : null}
    {onDelete ? <button type="button" className="btn-danger-sm" onClick={onDelete}>Hapus</button> : null}
  </div>
);

const ConfirmDelete = ({ open, label, onClose, onConfirm }: { open: boolean; label: string; onClose: () => void; onConfirm: () => void }) =>
  open ? (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label="Konfirmasi Hapus">
        <div className="modal-header">
          <span className="modal-title">Konfirmasi Hapus</span>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-note" style={{ background: '#f7e0e2', borderColor: '#e2b6ba', color: 'var(--red)' }}>
            Hapus <strong>{label}</strong>? Tindakan ini tidak dapat dibatalkan.
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose}>Batal</button>
          <button type="button" className="btn-danger-sm" style={{ padding: '10px 18px' }} onClick={onConfirm}>Hapus</button>
        </div>
      </div>
    </div>
  ) : null;

const ViewModal = ({ title, open, onClose, rows }: { title: string; open: boolean; onClose: () => void; rows: Array<[string, React.ReactNode]> }) =>
  open ? (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal modal-sm" role="dialog" aria-modal="true" aria-label={title}>
        <div className="modal-header">
          <span className="modal-title">{title}</span>
          <button className="modal-close" type="button" onClick={onClose} aria-label="Tutup">✕</button>
        </div>
        <div className="modal-body">
          <div className="close-summary">
            {rows.map(([k, v], i) => (
              <div key={i}><span>{k}</span><strong>{v ?? '-'}</strong></div>
            ))}
          </div>
        </div>
        <div className="modal-footer">
          <button type="button" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  ) : null;

const emptyBranchForm = { kode: '', nama: '', skemaTimbangan: 'WITH_TIMBANGAN', aktif: true };

const MasterBranches = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [list, setList] = useState<Branch[]>([]);
  const [form, setForm] = useState({ ...emptyBranchForm });
  const [message, setMessage] = useState('');

  const load = () => apiGet<Branch[]>('/api/v1/master/branches').then(setList).catch(() => setMessage('Gagal memuat branch.'));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setForm({ ...emptyBranchForm }); setMessage(''); setOpen(true); };
  const openEdit = (b: Branch) => {
    setEditId(b.id);
    setForm({ kode: b.kode, nama: b.nama, skemaTimbangan: b.skemaTimbangan ?? 'WITH_TIMBANGAN', aktif: b.aktif ?? true });
    setMessage('');
    setOpen(true);
  };

  const save = async () => {
    if (!form.kode.trim() || !form.nama.trim()) {
      setMessage('Kode dan nama branch wajib diisi.');
      return;
    }
    try {
      if (editId) await apiPut(`/api/v1/master/branches/${editId}`, { nama: form.nama, skemaTimbangan: form.skemaTimbangan, aktif: form.aktif });
      else await apiPost('/api/v1/master/branches', { kode: form.kode, nama: form.nama, skemaTimbangan: form.skemaTimbangan });
      setMessage(editId ? 'Branch diperbarui.' : 'Branch baru tersimpan.');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan — pastikan kode branch belum dipakai dan Anda punya role admin.');
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Branch" onAdd={openAdd} />
      <MasterAddModal title={editId ? 'Edit Branch' : 'Tambah Branch'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Kode <span className="req">*</span><input value={form.kode} onChange={(e) => setForm((f) => ({ ...f, kode: e.target.value.toUpperCase() }))} placeholder="NPM" disabled={!!editId} /></label>
        <label>Nama <span className="req">*</span><input value={form.nama} onChange={(e) => setForm((f) => ({ ...f, nama: e.target.value }))} placeholder="Project NPM" /></label>
        <label>Skema Timbangan
          <select value={form.skemaTimbangan} onChange={(e) => setForm((f) => ({ ...f, skemaTimbangan: e.target.value }))}>
            <option value="WITH_TIMBANGAN">Dengan Timbangan</option>
            <option value="WITHOUT_TIMBANGAN">Tanpa Timbangan (estimasi)</option>
          </select>
        </label>
        {editId ? (
          <label>Status
            <select value={form.aktif ? '1' : '0'} onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.value === '1' }))}>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </label>
        ) : null}
      </MasterAddModal>
      <section className="card">
        <CardHeader title="Daftar Branch" meta={`${list.length} branch`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Nama</th><th>Skema Timbangan</th><th>Aktif</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((b) => (
                <tr key={b.id}>
                  <td className="code">{b.kode}</td>
                  <td><strong>{b.nama}</strong></td>
                  <td>{b.skemaTimbangan === 'WITHOUT_TIMBANGAN' ? 'Tanpa Timbangan' : 'Dengan Timbangan'}</td>
                  <td>{b.aktif ? 'Ya' : 'Tidak'}</td>
                  <td><RowActions onEdit={() => openEdit(b)} /></td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada branch.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const emptyUnitForm = { kode: '', polisi: '', noRangka: '', noMesin: '', tahun: '', kapasitas: '', tipeId: '', branchId: '', status: 'ready' as 'ready' | 'breakdown' | 'pm' };

const MasterUnits = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewUnit, setViewUnit] = useState<MasterUnit | null>(null);
  const [delUnit, setDelUnit] = useState<MasterUnit | null>(null);
  const [list, setList] = useState<MasterUnit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tipeUnits, setTipeUnits] = useState<TipeUnit[]>([]);
  const [form, setForm] = useState(emptyUnitForm);
  const [message, setMessage] = useState('');
  const set = (patch: Partial<typeof emptyUnitForm>) => setForm((p) => ({ ...p, ...patch }));

  const load = () => {
    Promise.all([
      apiGet<MasterUnit[]>('/api/v1/master/units'),
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<TipeUnit[]>('/api/v1/master/tipe-unit'),
    ])
      .then(([nextUnits, nextBranches, nextTipe]) => {
        setList(nextUnits);
        setBranches(nextBranches);
        setTipeUnits(nextTipe);
      })
      .catch(() => setMessage('Gagal memuat data unit.'));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyUnitForm, tipeId: tipeUnits[0]?.id ?? '', branchId: branches[0]?.id ?? '' });
    setMessage('');
    setOpen(true);
  };
  const openEdit = (u: MasterUnit) => {
    setEditId(u.id);
    setForm({
      kode: u.kode, polisi: u.polisi ?? '', noRangka: u.noRangka ?? '', noMesin: u.noMesin ?? '',
      tahun: u.tahun != null ? String(u.tahun) : '', kapasitas: u.kapasitas != null ? String(u.kapasitas) : '',
      tipeId: u.tipeId ?? tipeUnits.find((t) => t.nama === u.tipe?.nama)?.id ?? '', branchId: u.branchId ?? '', status: u.status,
    });
    setMessage('');
    setOpen(true);
  };

  const save = async () => {
    if (!form.kode.trim() || !form.polisi.trim() || !form.tipeId || !form.branchId) {
      setMessage('Kode, nomor polisi, tipe, dan branch wajib diisi.');
      return;
    }
    const payload = {
      kode: form.kode, polisi: form.polisi, tipeId: form.tipeId, branchId: form.branchId, status: form.status,
      noRangka: form.noRangka || undefined, noMesin: form.noMesin || undefined,
      tahun: form.tahun ? Number(form.tahun) : undefined, kapasitas: form.kapasitas ? Number(form.kapasitas) : undefined,
    };
    try {
      if (editId) await apiPut(`/api/v1/master/units/${editId}`, payload);
      else await apiPost('/api/v1/master/units', payload);
      setMessage(editId ? 'Unit diperbarui.' : 'Unit baru tersimpan.');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan unit (butuh role admin-mining/general-admin).');
    }
  };

  const confirmDelete = async () => {
    if (!delUnit) return;
    try {
      await apiDelete(`/api/v1/master/units/${delUnit.id}`);
      setMessage(`Unit ${delUnit.kode} dihapus.`);
      setDelUnit(null);
      load();
    } catch {
      setMessage('Unit tidak bisa dihapus (masih dipakai) atau butuh role admin.');
      setDelUnit(null);
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Unit" onAdd={openAdd} />
      <MasterAddModal title={editId ? 'Edit Unit' : 'Tambah Unit'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Kode <span className="req">*</span><input value={form.kode} onChange={(e) => set({ kode: e.target.value })} placeholder="DT-003" /></label>
        <label>No Polisi <span className="req">*</span><input value={form.polisi} onChange={(e) => set({ polisi: e.target.value })} placeholder="KT 8103 HA" /></label>
        <label>No Rangka<input value={form.noRangka} onChange={(e) => set({ noRangka: e.target.value })} /></label>
        <label>No Mesin<input value={form.noMesin} onChange={(e) => set({ noMesin: e.target.value })} /></label>
        <label>Tahun<input type="number" value={form.tahun} onChange={(e) => set({ tahun: e.target.value })} placeholder="2022" /></label>
        <label>Kapasitas (ton)<input type="number" value={form.kapasitas} onChange={(e) => set({ kapasitas: e.target.value })} placeholder="30" /></label>
        <label>
          Tipe Unit <span className="req">*</span>
          <select value={form.tipeId} onChange={(e) => set({ tipeId: e.target.value })}>
            <option value="">— pilih —</option>
            {tipeUnits.map((t) => <option value={t.id} key={t.id}>{t.nama}</option>)}
          </select>
        </label>
        <label>
          Branch <span className="req">*</span>
          <select value={form.branchId} onChange={(e) => set({ branchId: e.target.value })}>
            <option value="">— pilih —</option>
            {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
          </select>
        </label>
        <label>
          Status
          <select value={form.status} onChange={(e) => set({ status: e.target.value as typeof form.status })}>
            <option value="ready">Ready</option>
            <option value="breakdown">Breakdown</option>
            <option value="pm">PM</option>
          </select>
        </label>
      </MasterAddModal>
      <ViewModal
        title={`Detail Unit — ${viewUnit?.kode ?? ''}`}
        open={!!viewUnit}
        onClose={() => setViewUnit(null)}
        rows={viewUnit ? [
          ['Kode', viewUnit.kode], ['No Polisi', viewUnit.polisi], ['No Rangka', viewUnit.noRangka ?? '-'],
          ['No Mesin', viewUnit.noMesin ?? '-'], ['Tahun', viewUnit.tahun ?? '-'], ['Kapasitas', viewUnit.kapasitas != null ? `${viewUnit.kapasitas} ton` : '-'],
          ['Tipe', viewUnit.tipe?.nama ?? '-'], ['Branch', viewUnit.branch?.nama ?? '-'], ['Status', viewUnit.status],
        ] : []}
      />
      <ConfirmDelete open={!!delUnit} label={`unit ${delUnit?.kode ?? ''}`} onClose={() => setDelUnit(null)} onConfirm={confirmDelete} />
      <section className="card">
        <CardHeader title="Daftar Unit" meta={`${list.length} unit`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>No Polisi</th><th>Tipe</th><th>Kapasitas</th><th>Tahun</th><th>Branch</th><th>Status</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((unit) => (
                <tr key={unit.id}>
                  <td><strong>{unit.kode}</strong></td>
                  <td>{unit.polisi}</td>
                  <td>{unit.tipe?.nama ?? '-'}</td>
                  <td>{unit.kapasitas != null ? `${unit.kapasitas} t` : '-'}</td>
                  <td>{unit.tahun ?? '-'}</td>
                  <td>{unit.branch?.nama ?? '-'}</td>
                  <td><span className={`unit-status ${unit.status}`}>{unit.status}</span></td>
                  <td><RowActions onView={() => setViewUnit(unit)} onEdit={() => openEdit(unit)} onDelete={() => setDelUnit(unit)} /></td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada unit.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const emptyOperatorForm = {
  nama: '', nik: '', nid: '', branchId: '', telepon: '',
  sim: '', simJenis: '', simMasaBerlaku: '',
  kontakDaruratNama: '', kontakDaruratHubungan: '', kontakDaruratTelepon: '',
};

const MasterOperators = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewOp, setViewOp] = useState<MasterOperator | null>(null);
  const [delOp, setDelOp] = useState<MasterOperator | null>(null);
  const [list, setList] = useState<MasterOperator[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ ...emptyOperatorForm });
  const [message, setMessage] = useState('');
  const set = (k: keyof typeof emptyOperatorForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const load = () => {
    Promise.all([
      apiGet<MasterOperator[]>('/api/v1/master/operators'),
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
    ])
      .then(([nextOps, nextBranches]) => {
        setList(nextOps);
        setBranches(nextBranches);
      })
      .catch(() => setMessage('Gagal memuat operator.'));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyOperatorForm, branchId: branches[0]?.id || '' });
    setMessage('');
    setOpen(true);
  };
  const openEdit = (op: MasterOperator) => {
    setEditId(op.id);
    setForm({
      nama: op.nama, nik: op.nik, nid: op.nid ?? '', branchId: op.branchId ?? '', telepon: op.telepon ?? '',
      sim: op.sim ?? '', simJenis: op.simJenis ?? '', simMasaBerlaku: op.simMasaBerlaku ? op.simMasaBerlaku.slice(0, 10) : '',
      kontakDaruratNama: op.kontakDaruratNama ?? '', kontakDaruratHubungan: op.kontakDaruratHubungan ?? '', kontakDaruratTelepon: op.kontakDaruratTelepon ?? '',
    });
    setMessage('');
    setOpen(true);
  };

  const save = async () => {
    if (!form.nama.trim() || !form.nik.trim() || !form.branchId) {
      setMessage('Nama, NIK, dan branch wajib diisi.');
      return;
    }
    const payload: Record<string, unknown> = {
      nama: form.nama, nik: form.nik, branchId: form.branchId,
      nid: form.nid || undefined, telepon: form.telepon || undefined,
      sim: form.sim || undefined, simJenis: form.simJenis || undefined,
      simMasaBerlaku: form.simMasaBerlaku || undefined,
      kontakDaruratNama: form.kontakDaruratNama || undefined,
      kontakDaruratHubungan: form.kontakDaruratHubungan || undefined,
      kontakDaruratTelepon: form.kontakDaruratTelepon || undefined,
    };
    try {
      if (editId) await apiPut(`/api/v1/master/operators/${editId}`, payload);
      else await apiPost('/api/v1/master/operators', payload);
      setMessage(editId ? 'Operator diperbarui.' : 'Operator baru tersimpan.');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan operator (butuh role admin).');
    }
  };

  const confirmDelete = async () => {
    if (!delOp) return;
    try {
      await apiDelete(`/api/v1/master/operators/${delOp.id}`);
      setMessage(`Operator ${delOp.nama} dihapus.`);
      setDelOp(null);
      load();
    } catch {
      setMessage('Operator tidak bisa dihapus (masih dipakai) atau butuh role admin.');
      setDelOp(null);
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Operator" onAdd={openAdd} />
      <MasterAddModal title={editId ? 'Edit Operator' : 'Tambah Operator'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Nama <span className="req">*</span><input value={form.nama} onChange={(e) => set('nama', e.target.value)} placeholder="Nama operator" /></label>
        <label>NIK <span className="req">*</span><input value={form.nik} onChange={(e) => set('nik', e.target.value)} placeholder="OP-KALA-003" /></label>
        <label>NID<input value={form.nid} onChange={(e) => set('nid', e.target.value)} placeholder="NID internal" /></label>
        <label>No. Telepon<input value={form.telepon} onChange={(e) => set('telepon', e.target.value)} placeholder="0812xxxx" /></label>
        <label>
          Branch <span className="req">*</span>
          <select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
            {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
          </select>
        </label>
        <div className="modal-form-section">Data SIM &amp; Lisensi</div>
        <label>No. SIM<input value={form.sim} onChange={(e) => set('sim', e.target.value)} placeholder="Nomor SIM" /></label>
        <label>
          Jenis SIM
          <select value={form.simJenis} onChange={(e) => set('simJenis', e.target.value)}>
            <option value="">-</option>
            <option value="B1">B1</option>
            <option value="B2">B2</option>
            <option value="B1 Umum">B1 Umum</option>
            <option value="B2 Umum">B2 Umum</option>
            <option value="A">A</option>
          </select>
        </label>
        <label>Masa Berlaku SIM<input type="date" value={form.simMasaBerlaku} onChange={(e) => set('simMasaBerlaku', e.target.value)} /></label>
        <div className="modal-form-section">Kontak Darurat</div>
        <label>Nama Kontak<input value={form.kontakDaruratNama} onChange={(e) => set('kontakDaruratNama', e.target.value)} placeholder="Nama kontak darurat" /></label>
        <label>Hubungan<input value={form.kontakDaruratHubungan} onChange={(e) => set('kontakDaruratHubungan', e.target.value)} placeholder="Istri / Orang tua / dll" /></label>
        <label>No. Telepon Kontak<input value={form.kontakDaruratTelepon} onChange={(e) => set('kontakDaruratTelepon', e.target.value)} placeholder="0812xxxx" /></label>
      </MasterAddModal>
      <ViewModal title={`Detail Operator — ${viewOp?.nama ?? ''}`} open={!!viewOp} onClose={() => setViewOp(null)}
        rows={viewOp ? [
          ['Nama', viewOp.nama], ['NIK', viewOp.nik], ['NID', viewOp.nid || '-'],
          ['Branch', viewOp.branch?.nama ?? '-'], ['No. Telepon', viewOp.telepon || '-'],
          ['No. SIM', viewOp.sim || '-'], ['Jenis SIM', viewOp.simJenis || '-'],
          ['Masa Berlaku SIM', viewOp.simMasaBerlaku ? viewOp.simMasaBerlaku.slice(0, 10) : '-'],
          ['Kontak Darurat', viewOp.kontakDaruratNama ? `${viewOp.kontakDaruratNama}${viewOp.kontakDaruratHubungan ? ` (${viewOp.kontakDaruratHubungan})` : ''}${viewOp.kontakDaruratTelepon ? ` — ${viewOp.kontakDaruratTelepon}` : ''}` : '-'],
          ['Aktif', viewOp.aktif ? 'Ya' : 'Tidak'],
        ] : []} />
      <ConfirmDelete open={!!delOp} label={`operator ${delOp?.nama ?? ''}`} onClose={() => setDelOp(null)} onConfirm={confirmDelete} />
      <section className="card">
        <CardHeader title="Daftar Operator" meta={`${list.length} operator`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>NIK</th><th>NID</th><th>No. Telepon</th><th>No. SIM</th><th>Branch</th><th>Aktif</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((op) => (
                <tr key={op.id}>
                  <td><strong>{op.nama}</strong></td>
                  <td>{op.nik}</td>
                  <td>{op.nid || '-'}</td>
                  <td>{op.telepon || '-'}</td>
                  <td>{op.sim || '-'}</td>
                  <td>{op.branch?.nama ?? '-'}</td>
                  <td>{op.aktif ? 'Ya' : 'Tidak'}</td>
                  <td><RowActions onView={() => setViewOp(op)} onEdit={() => openEdit(op)} onDelete={() => setDelOp(op)} /></td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada operator.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type MasterUser = {
  id: string;
  username: string;
  nama: string;
  email?: string | null;
  role: string;
  branchId?: string | null;
  aktif: boolean;
  lastLoginAt?: string | null;
  branch?: { nama: string } | null;
};

const USER_ROLES: Array<[string, string]> = [
  ['admin-mining', 'Admin Mining'],
  ['general-admin', 'General Admin'],
  ['supervisor', 'Supervisor'],
  ['koordinator-operator', 'Koordinator Operator'],
  ['operator', 'Operator (Petugas Lapangan/BBM)'],
];
const roleLabel = (role: string) => USER_ROLES.find(([v]) => v === role)?.[1] ?? role;

const emptyUserForm = { username: '', password: '', nama: '', email: '', role: 'operator', branchId: '', aktif: true };

const MasterUsers = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [list, setList] = useState<MasterUser[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [form, setForm] = useState({ ...emptyUserForm });
  const [message, setMessage] = useState('');
  const set = <K extends keyof typeof emptyUserForm>(k: K, v: (typeof emptyUserForm)[K]) => setForm((f) => ({ ...f, [k]: v }));

  const [resetTarget, setResetTarget] = useState<MasterUser | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const load = () => {
    Promise.all([
      apiGet<MasterUser[]>('/api/v1/master/users'),
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
    ])
      .then(([nextUsers, nextBranches]) => { setList(nextUsers); setBranches(nextBranches); })
      .catch(() => setMessage('Gagal memuat user.'));
  };
  useEffect(() => { load(); }, []);

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyUserForm, branchId: branches[0]?.id || '' });
    setMessage('');
    setOpen(true);
  };
  const openEdit = (u: MasterUser) => {
    setEditId(u.id);
    setForm({ username: u.username, password: '', nama: u.nama, email: u.email ?? '', role: u.role, branchId: u.branchId ?? '', aktif: u.aktif });
    setMessage('');
    setOpen(true);
  };

  const save = async () => {
    if (!form.username.trim() || !form.nama.trim() || (!editId && form.password.length < 6)) {
      setMessage('Username, nama wajib diisi; password minimal 6 karakter saat tambah user baru.');
      return;
    }
    try {
      if (editId) {
        await apiPut(`/api/v1/master/users/${editId}`, {
          nama: form.nama, email: form.email || undefined, role: form.role, branchId: form.branchId || undefined, aktif: form.aktif,
        });
        setMessage('User diperbarui.');
      } else {
        await apiPost('/api/v1/master/users', {
          username: form.username, password: form.password, nama: form.nama,
          email: form.email || undefined, role: form.role, branchId: form.branchId || undefined,
        });
        setMessage('User baru tersimpan.');
      }
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan user — pastikan username belum dipakai dan Anda punya role admin.');
    }
  };

  const openReset = (u: MasterUser) => { setResetTarget(u); setNewPassword(''); setMessage(''); };
  const submitReset = async () => {
    if (!resetTarget || newPassword.length < 6) { setMessage('Password baru minimal 6 karakter.'); return; }
    try {
      await apiPut(`/api/v1/master/users/${resetTarget.id}/password`, { newPassword });
      setMessage(`Password ${resetTarget.nama} berhasil direset.`);
      setResetTarget(null);
    } catch {
      setMessage('Gagal reset password (butuh role admin).');
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah User" onAdd={openAdd} />
      <MasterAddModal title={editId ? 'Edit User' : 'Tambah User'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Username <span className="req">*</span>
          <input value={form.username} onChange={(e) => set('username', e.target.value)} placeholder="andi.saputra" disabled={!!editId} />
        </label>
        {!editId ? (
          <label>Password <span className="req">*</span><input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} placeholder="min 6 karakter" /></label>
        ) : null}
        <label>Nama <span className="req">*</span><input value={form.nama} onChange={(e) => set('nama', e.target.value)} placeholder="Nama lengkap" /></label>
        <label>Email<input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} placeholder="opsional" /></label>
        <label>Role <span className="req">*</span>
          <select value={form.role} onChange={(e) => set('role', e.target.value)}>
            {USER_ROLES.map(([v, l]) => <option value={v} key={v}>{l}</option>)}
          </select>
        </label>
        <label>Branch
          <select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
            <option value="">— tanpa branch —</option>
            {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
          </select>
        </label>
        {editId ? (
          <label>Status
            <select value={form.aktif ? '1' : '0'} onChange={(e) => set('aktif', e.target.value === '1')}>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </label>
        ) : null}
      </MasterAddModal>

      <MasterAddModal title={`Reset Password — ${resetTarget?.nama ?? ''}`} open={!!resetTarget} onClose={() => setResetTarget(null)} onSave={submitReset} saveLabel="Reset Password">
        <label>Password Baru <span className="req">*</span><input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="min 6 karakter" /></label>
      </MasterAddModal>

      <section className="card">
        <CardHeader title="Daftar User" meta={`${list.length} user`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Username</th><th>Nama</th><th>Role</th><th>Branch</th><th>Aktif</th><th>Login Terakhir</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((u) => (
                <tr key={u.id}>
                  <td className="code">{u.username}</td>
                  <td><strong>{u.nama}</strong></td>
                  <td>{roleLabel(u.role)}</td>
                  <td>{u.branch?.nama ?? '-'}</td>
                  <td>{u.aktif ? 'Ya' : 'Tidak'}</td>
                  <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString('id-ID') : '-'}</td>
                  <td>
                    <div className="rowact">
                      <button type="button" onClick={() => openEdit(u)}>Edit</button>
                      <button type="button" onClick={() => openReset(u)}>Reset Password</button>
                    </div>
                  </td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada user.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type ModulePermissionRow = { id: string; moduleKode: string; moduleNama: string; deskripsi?: string | null; rolesAllowed: string[]; aktif: boolean };
const emptyPermForm = { moduleKode: '', moduleNama: '', deskripsi: '', rolesAllowed: [] as string[], aktif: true };

const MasterModulePermissions = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [list, setList] = useState<ModulePermissionRow[]>([]);
  const [form, setForm] = useState({ ...emptyPermForm });
  const [message, setMessage] = useState('');

  const load = () => apiGet<ModulePermissionRow[]>('/api/v1/master/module-permissions').then(setList).catch(() => setMessage('Gagal memuat data permission.'));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setForm({ ...emptyPermForm }); setMessage(''); setOpen(true); };
  const openEdit = (p: ModulePermissionRow) => {
    setEditId(p.id);
    setForm({ moduleKode: p.moduleKode, moduleNama: p.moduleNama, deskripsi: p.deskripsi ?? '', rolesAllowed: p.rolesAllowed, aktif: p.aktif });
    setMessage('');
    setOpen(true);
  };

  const toggleRole = (role: string) =>
    setForm((f) => ({ ...f, rolesAllowed: f.rolesAllowed.includes(role) ? f.rolesAllowed.filter((r) => r !== role) : [...f.rolesAllowed, role] }));

  const save = async () => {
    if (!form.moduleKode.trim() || !form.moduleNama.trim()) {
      setMessage('Kode dan nama modul wajib diisi.');
      return;
    }
    try {
      if (editId) {
        await apiPut(`/api/v1/master/module-permissions/${editId}`, {
          moduleNama: form.moduleNama, deskripsi: form.deskripsi || undefined, rolesAllowed: form.rolesAllowed, aktif: form.aktif,
        });
        setMessage('Permission modul diperbarui.');
      } else {
        await apiPost('/api/v1/master/module-permissions', {
          moduleKode: form.moduleKode, moduleNama: form.moduleNama, deskripsi: form.deskripsi || undefined, rolesAllowed: form.rolesAllowed,
        });
        setMessage('Permission modul tersimpan.');
      }
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan — pastikan kode modul belum dipakai dan Anda punya role admin.');
    }
  };

  return (
    <>
      <div className="inline-alert">
        ⚠ Tabel ini bersifat <strong>referensi/dokumentasi</strong> — menggambarkan role apa saja yang (secara aktual di kode)
        boleh mengakses tiap modul. Mengubah data di sini <strong>belum mengubah hak akses sesungguhnya</strong> di sistem
        (masih dikontrol lewat pengecekan role di backend).
      </div>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Modul" onAdd={openAdd} />
      <MasterAddModal title={editId ? 'Edit Permission Modul' : 'Tambah Permission Modul'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Kode Modul <span className="req">*</span>
          <input value={form.moduleKode} onChange={(e) => setForm((f) => ({ ...f, moduleKode: e.target.value.toLowerCase() }))} placeholder="mis. rit" disabled={!!editId} />
        </label>
        <label>Nama Modul <span className="req">*</span><input value={form.moduleNama} onChange={(e) => setForm((f) => ({ ...f, moduleNama: e.target.value }))} placeholder="Rit Operation" /></label>
        <label style={{ gridColumn: '1 / -1' }}>Catatan<input value={form.deskripsi} onChange={(e) => setForm((f) => ({ ...f, deskripsi: e.target.value }))} placeholder="Opsional — catat pengecualian per aksi" /></label>
        <div className="modal-form-section" style={{ gridColumn: '1 / -1' }}>Role yang Diizinkan</div>
        <div style={{ gridColumn: '1 / -1', display: 'flex', flexWrap: 'wrap', gap: 14 }}>
          {USER_ROLES.map(([v, l]) => (
            <label key={v} style={{ flexDirection: 'row', alignItems: 'center', gap: 6, textTransform: 'none' }}>
              <input type="checkbox" checked={form.rolesAllowed.includes(v)} onChange={() => toggleRole(v)} style={{ width: 'auto' }} /> {l}
            </label>
          ))}
        </div>
        {editId ? (
          <label>Status
            <select value={form.aktif ? '1' : '0'} onChange={(e) => setForm((f) => ({ ...f, aktif: e.target.value === '1' }))}>
              <option value="1">Aktif</option>
              <option value="0">Nonaktif</option>
            </select>
          </label>
        ) : null}
      </MasterAddModal>

      <section className="card">
        <CardHeader title="Referensi Permission Modul" meta={`${list.length} modul`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Modul</th><th>Role yang Diizinkan</th><th>Catatan</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.moduleNama}</strong> <span className="code" style={{ color: 'var(--muted)' }}>({p.moduleKode})</span></td>
                  <td>
                    {p.rolesAllowed.length ? (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {p.rolesAllowed.map((r) => <span className="status-badge open" key={r}>{roleLabel(r)}</span>)}
                      </div>
                    ) : <span style={{ color: 'var(--muted)' }}>Semua role (baca-saja)</span>}
                  </td>
                  <td style={{ color: 'var(--muted)' }}>{p.deskripsi ?? '-'}</td>
                  <td><RowActions onEdit={() => openEdit(p)} /></td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada data permission.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

const MasterTipeUnit = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<TipeUnit | null>(null);
  const [delItem, setDelItem] = useState<TipeUnit | null>(null);
  const [list, setList] = useState<TipeUnit[]>([]);
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kapasitasTon, setKapasitasTon] = useState(30);
  const [message, setMessage] = useState('');

  const load = () => apiGet<TipeUnit[]>('/api/v1/master/tipe-unit').then(setList).catch(() => setMessage('Gagal memuat tipe unit.'));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setKode(''); setNama(''); setKapasitasTon(30); setMessage(''); setOpen(true); };
  const openEdit = (t: TipeUnit) => { setEditId(t.id); setKode(t.kode); setNama(t.nama); setKapasitasTon(t.kapasitasTon); setMessage(''); setOpen(true); };

  const save = async () => {
    if (!kode.trim() || !nama.trim() || kapasitasTon < 1) {
      setMessage('Kode, nama, dan kapasitas (>=1) wajib diisi.');
      return;
    }
    try {
      if (editId) await apiPut(`/api/v1/master/tipe-unit/${editId}`, { kode, nama, kapasitasTon });
      else await apiPost('/api/v1/master/tipe-unit', { kode, nama, kapasitasTon });
      setMessage(editId ? 'Tipe unit diperbarui.' : 'Tipe unit tersimpan.');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan tipe unit (butuh role admin).');
    }
  };

  const confirmDelete = async () => {
    if (!delItem) return;
    try {
      await apiDelete(`/api/v1/master/tipe-unit/${delItem.id}`);
      setMessage(`Tipe ${delItem.nama} dihapus.`);
      setDelItem(null);
      load();
    } catch {
      setMessage('Tipe unit tidak bisa dihapus (masih dipakai unit) atau butuh role admin.');
      setDelItem(null);
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Tipe Unit" onAdd={openAdd} />
      <MasterAddModal title={editId ? 'Edit Tipe Unit' : 'Tambah Tipe Unit'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Kode <span className="req">*</span><input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="DT50" /></label>
        <label>Nama <span className="req">*</span><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Dump Truck 50T" /></label>
        <label>Kapasitas (ton) <span className="req">*</span><input type="number" min="1" value={kapasitasTon} onChange={(e) => setKapasitasTon(Number(e.target.value) || 0)} /></label>
      </MasterAddModal>
      <ViewModal title={`Detail Tipe — ${viewItem?.nama ?? ''}`} open={!!viewItem} onClose={() => setViewItem(null)}
        rows={viewItem ? [['Kode', viewItem.kode], ['Nama', viewItem.nama], ['Kapasitas', `${viewItem.kapasitasTon} ton`], ['Aktif', viewItem.aktif ? 'Ya' : 'Tidak']] : []} />
      <ConfirmDelete open={!!delItem} label={`tipe unit ${delItem?.nama ?? ''}`} onClose={() => setDelItem(null)} onConfirm={confirmDelete} />
      <section className="card">
        <CardHeader title="Daftar Tipe Unit" meta={`${list.length} tipe`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Nama</th><th>Kapasitas (ton)</th><th>Aktif</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((t) => (
                <tr key={t.id}><td>{t.kode}</td><td><strong>{t.nama}</strong></td><td>{t.kapasitasTon}</td><td>{t.aktif ? 'Ya' : 'Tidak'}</td>
                  <td><RowActions onView={() => setViewItem(t)} onEdit={() => openEdit(t)} onDelete={() => setDelItem(t)} /></td></tr>
              ))}
              {!list.length ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada tipe unit.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type DelayBudgetRow = { id: string; delayTypeId: string; bulan: string; budgetMenit: number };

const currentBulan = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
};

const MasterDelayTypes = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewItem, setViewItem] = useState<DelayType | null>(null);
  const [list, setList] = useState<DelayType[]>([]);
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState('Operasional');
  const [budgetMenit, setBudgetMenit] = useState(60);
  const [message, setMessage] = useState('');
  // Budget per bulan
  const [bulan, setBulan] = useState(currentBulan());
  const [budgets, setBudgets] = useState<DelayBudgetRow[]>([]);
  const [budgetDraft, setBudgetDraft] = useState<Record<string, string>>({});
  // Generate (copy) modal
  const [genOpen, setGenOpen] = useState(false);
  const [genFrom, setGenFrom] = useState(currentBulan());
  const [genTo, setGenTo] = useState(currentBulan());

  const loadTypes = () => apiGet<DelayType[]>('/api/v1/master/delay-types').then(setList).catch(() => setMessage('Gagal memuat jenis delay.'));
  const loadBudgets = (b: string) => apiGet<DelayBudgetRow[]>(`/api/v1/master/delay-budgets?bulan=${b}`)
    .then((rows) => {
      setBudgets(rows);
      const draft: Record<string, string> = {};
      rows.forEach((r) => { draft[r.delayTypeId] = String(r.budgetMenit); });
      setBudgetDraft(draft);
    })
    .catch(() => setMessage('Gagal memuat budget bulan.'));
  useEffect(() => { loadTypes(); }, []);
  useEffect(() => { loadBudgets(bulan); }, [bulan]);

  const openAdd = () => { setEditId(null); setKode(''); setNama(''); setKategori('Operasional'); setBudgetMenit(60); setMessage(''); setOpen(true); };
  const openEdit = (d: DelayType) => { setEditId(d.id); setKode(d.kode); setNama(d.nama); setKategori(d.kategori); setBudgetMenit(d.budgetMenit ?? 0); setMessage(''); setOpen(true); };

  const save = async () => {
    if (!kode.trim() || !nama.trim() || !kategori.trim()) {
      setMessage('Kode, nama, dan kategori wajib diisi.');
      return;
    }
    try {
      if (editId) await apiPut(`/api/v1/master/delay-types/${editId}`, { kode, nama, kategori, budgetMenit });
      else await apiPost('/api/v1/master/delay-types', { kode, nama, kategori, budgetMenit });
      setMessage(editId ? 'Jenis delay diperbarui.' : 'Jenis delay tersimpan.');
      setOpen(false);
      loadTypes();
    } catch {
      setMessage('Gagal menyimpan jenis delay (butuh role admin).');
    }
  };

  const saveBudget = async (delayTypeId: string) => {
    const raw = budgetDraft[delayTypeId];
    const val = Number(raw);
    if (raw === undefined || raw === '' || Number.isNaN(val) || val < 0) {
      setMessage('Budget harus angka >= 0.');
      return;
    }
    try {
      await apiPost('/api/v1/master/delay-budgets', { delayTypeId, bulan, budgetMenit: Math.round(val) });
      setMessage(`Budget ${bulan} tersimpan.`);
      loadBudgets(bulan);
    } catch {
      setMessage('Gagal menyimpan budget (butuh role admin).');
    }
  };

  const runGenerate = async () => {
    if (genFrom === genTo) { setMessage('Bulan sumber dan target tidak boleh sama.'); return; }
    try {
      const res = await apiPost<{ copied: number }>('/api/v1/master/delay-budgets/generate', { fromBulan: genFrom, toBulan: genTo });
      setMessage(`Berhasil menyalin ${res?.copied ?? 0} budget dari ${genFrom} ke ${genTo}.`);
      setGenOpen(false);
      if (genTo === bulan) loadBudgets(bulan);
    } catch {
      setMessage('Gagal generate budget (butuh role admin).');
    }
  };

  const budgetForType = (id: string) => budgets.find((b) => b.delayTypeId === id)?.budgetMenit;

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Jenis Delay" onAdd={openAdd} extra={
        <button type="button" onClick={() => { setGenFrom(currentBulan()); setGenTo(currentBulan()); setGenOpen(true); }}>Generate per Bulan (Copy)</button>
      } />
      <MasterAddModal title={editId ? 'Edit Jenis Delay' : 'Tambah Jenis Delay'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Kode <span className="req">*</span><input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="WAIT" /></label>
        <label>Nama <span className="req">*</span><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Waiting Loader" /></label>
        <label>Kategori <span className="req">*</span><input value={kategori} onChange={(e) => setKategori(e.target.value)} /></label>
        <label>Budget default (menit)<input type="number" min="0" value={budgetMenit} onChange={(e) => setBudgetMenit(Number(e.target.value) || 0)} /></label>
      </MasterAddModal>
      <MasterAddModal title="Generate Budget per Bulan (Copy)" open={genOpen} onClose={() => setGenOpen(false)} onSave={runGenerate} saveLabel="Generate">
        <label>Dari Bulan <span className="req">*</span><input type="month" value={genFrom} onChange={(e) => setGenFrom(e.target.value)} /></label>
        <label>Ke Bulan <span className="req">*</span><input type="month" value={genTo} onChange={(e) => setGenTo(e.target.value)} /></label>
      </MasterAddModal>
      <ViewModal title={`Detail Delay — ${viewItem?.nama ?? ''}`} open={!!viewItem} onClose={() => setViewItem(null)}
        rows={viewItem ? [['Kode', viewItem.kode], ['Nama', viewItem.nama], ['Kategori', viewItem.kategori], ['Scope', viewItem.scope], ['Budget default', viewItem.budgetMenit != null ? `${viewItem.budgetMenit} mnt` : '-'], ['Kena PA', viewItem.kenaPA ? 'Ya' : 'Tidak']] : []} />
      <section className="card">
        <CardHeader title="Budget Delay per Bulan" meta={bulan} />
        <div className="toolbar-panel" style={{ marginBottom: 14 }}>
          <label>Bulan Budget<input type="month" value={bulan} onChange={(e) => setBulan(e.target.value)} /></label>
        </div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Nama</th><th>Kategori</th><th>Scope</th><th>Budget Default</th><th>Budget {bulan} (mnt)</th><th>Kena PA</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((d) => (
                <tr key={d.id}>
                  <td>{d.kode}</td><td><strong>{d.nama}</strong></td><td>{d.kategori}</td><td>{d.scope}</td>
                  <td>{d.budgetMenit ?? '-'}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <input type="number" min="0" style={{ width: 90 }} value={budgetDraft[d.id] ?? ''}
                        placeholder={budgetForType(d.id) != null ? undefined : '—'}
                        onChange={(e) => setBudgetDraft((prev) => ({ ...prev, [d.id]: e.target.value }))} />
                      <button type="button" onClick={() => saveBudget(d.id)}>Simpan</button>
                    </div>
                  </td>
                  <td>{d.kenaPA ? 'Ya' : 'Tidak'}</td>
                  <td><RowActions onView={() => setViewItem(d)} onEdit={() => openEdit(d)} /></td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada jenis delay.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type FuelStationRow = { id: string; nama: string; kode?: string | null; branchId?: string | null; aktif: boolean };

const MasterFuelStations = () => {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<FuelStationRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [branchId, setBranchId] = useState('');
  const [message, setMessage] = useState('');

  const load = () => {
    Promise.all([
      apiGet<FuelStationRow[]>('/api/v1/master/fuel-stations'),
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
    ])
      .then(([fs, b]) => {
        setList(fs);
        setBranches(b);
        setBranchId((current) => current || b[0]?.id || '');
      })
      .catch(() => setMessage('Gagal memuat fuel station.'));
  };
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!nama.trim()) {
      setMessage('Nama fuel station wajib diisi.');
      return;
    }
    try {
      await apiPost('/api/v1/master/fuel-stations', { nama, kode: kode || undefined, branchId: branchId || undefined });
      setMessage('Fuel station tersimpan.');
      setNama('');
      setKode('');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan fuel station (butuh role admin).');
    }
  };

  const branchName = (id?: string | null) => branches.find((b) => b.id === id)?.nama ?? '-';

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Fuel Station" onAdd={() => setOpen(true)} />
      <MasterAddModal title="Tambah Fuel Station" open={open} onClose={() => setOpen(false)} onSave={create}>
        <label>Nama <span className="req">*</span><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Pool Kalimantan A" /></label>
        <label>Kode<input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="FS-POOL-A" /></label>
        <label>
          Branch
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)}>
            <option value="">— tanpa branch —</option>
            {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
          </select>
        </label>
      </MasterAddModal>
      <section className="card">
        <CardHeader title="Daftar Fuel Station" meta={`${list.length} lokasi`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Kode</th><th>Branch</th><th>Aktif</th></tr></thead>
            <tbody>
              {list.map((fs) => (
                <tr key={fs.id}>
                  <td><strong>{fs.nama}</strong></td>
                  <td>{fs.kode ?? '-'}</td>
                  <td>{branchName(fs.branchId)}</td>
                  <td>{fs.aktif ? 'Ya' : 'Tidak'}</td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={4} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada fuel station.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type MaterialRow = { id: string; nama: string; kode: string; kategori?: string | null; satuan?: string | null; aktif: boolean };

const MasterMaterials = () => {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<MaterialRow[]>([]);
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [kategori, setKategori] = useState('OB');
  const [satuan, setSatuan] = useState('ton');
  const [message, setMessage] = useState('');

  const load = () => apiGet<MaterialRow[]>('/api/v1/master/materials').then(setList).catch(() => setMessage('Gagal memuat material.'));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!nama.trim() || !kode.trim()) {
      setMessage('Nama dan kode wajib diisi.');
      return;
    }
    try {
      await apiPost('/api/v1/master/materials', { nama, kode, kategori: kategori || undefined, satuan });
      setMessage('Material tersimpan.');
      setNama('');
      setKode('');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan material (butuh role admin, kode/nama unik).');
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Material" onAdd={() => setOpen(true)} />
      <MasterAddModal title="Tambah Material" open={open} onClose={() => setOpen(false)} onSave={create}>
        <label>Nama <span className="req">*</span><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Nickel Ore" /></label>
        <label>Kode <span className="req">*</span><input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="ORE" /></label>
        <label>Kategori<input value={kategori} onChange={(e) => setKategori(e.target.value)} placeholder="OB / ORE" /></label>
        <label>Satuan<input value={satuan} onChange={(e) => setSatuan(e.target.value)} placeholder="ton" /></label>
      </MasterAddModal>
      <section className="card">
        <CardHeader title="Daftar Material" meta={`${list.length} material`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Kode</th><th>Kategori</th><th>Satuan</th><th>Aktif</th></tr></thead>
            <tbody>
              {list.map((m) => (
                <tr key={m.id}><td><strong>{m.nama}</strong></td><td>{m.kode}</td><td>{m.kategori ?? '-'}</td><td>{m.satuan ?? '-'}</td><td>{m.aktif ? 'Ya' : 'Tidak'}</td></tr>
              ))}
              {!list.length ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada material.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type FuelTypeRow = { id: string; nama: string; kode?: string | null; aktif: boolean };

const MasterFuelTypes = () => {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<FuelTypeRow[]>([]);
  const [nama, setNama] = useState('');
  const [kode, setKode] = useState('');
  const [message, setMessage] = useState('');

  const load = () => apiGet<FuelTypeRow[]>('/api/v1/master/fuel-types').then(setList).catch(() => setMessage('Gagal memuat fuel type.'));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!nama.trim()) {
      setMessage('Nama fuel type wajib diisi.');
      return;
    }
    try {
      await apiPost('/api/v1/master/fuel-types', { nama, kode: kode || undefined });
      setMessage('Fuel type tersimpan.');
      setNama('');
      setKode('');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan fuel type (butuh role admin, nama unik).');
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Fuel Type" onAdd={() => setOpen(true)} />
      <MasterAddModal title="Tambah Fuel Type" open={open} onClose={() => setOpen(false)} onSave={create}>
        <label>Nama <span className="req">*</span><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Biosolar (B35)" /></label>
        <label>Kode<input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="BIOSOLAR" /></label>
      </MasterAddModal>
      <section className="card">
        <CardHeader title="Daftar Fuel Type" meta={`${list.length} jenis BBM`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Kode</th><th>Aktif</th></tr></thead>
            <tbody>
              {list.map((f) => (
                <tr key={f.id}><td><strong>{f.nama}</strong></td><td>{f.kode ?? '-'}</td><td>{f.aktif ? 'Ya' : 'Tidak'}</td></tr>
              ))}
              {!list.length ? <tr><td colSpan={3} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada fuel type.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type ShiftTypeRow = { id: string; kode: string; nama: string; jamMulai: string; jamSelesai: string; aktif: boolean };

const MasterShiftTypes = () => {
  const [open, setOpen] = useState(false);
  const [list, setList] = useState<ShiftTypeRow[]>([]);
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [jamMulai, setJamMulai] = useState('07:00');
  const [jamSelesai, setJamSelesai] = useState('17:00');
  const [message, setMessage] = useState('');

  const load = () => apiGet<ShiftTypeRow[]>('/api/v1/master/shift-types').then(setList).catch(() => setMessage('Gagal memuat tipe shift.'));
  useEffect(() => { load(); }, []);

  const create = async () => {
    if (!kode.trim() || !nama.trim() || !jamMulai || !jamSelesai) {
      setMessage('Kode, nama, jam mulai & selesai wajib diisi.');
      return;
    }
    try {
      await apiPost('/api/v1/master/shift-types', { kode, nama, jamMulai, jamSelesai });
      setMessage('Tipe shift tersimpan.');
      setKode('');
      setNama('');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan tipe shift (butuh role admin, kode unik).');
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Tipe Shift" onAdd={() => setOpen(true)} />
      <MasterAddModal title="Tambah Tipe Shift" open={open} onClose={() => setOpen(false)} onSave={create}>
        <label>Kode <span className="req">*</span><input value={kode} onChange={(e) => setKode(e.target.value)} placeholder="siang" /></label>
        <label>Nama <span className="req">*</span><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Shift Siang" /></label>
        <label>Jam Mulai <span className="req">*</span><input type="time" value={jamMulai} onChange={(e) => setJamMulai(e.target.value)} /></label>
        <label>Jam Selesai <span className="req">*</span><input type="time" value={jamSelesai} onChange={(e) => setJamSelesai(e.target.value)} /></label>
      </MasterAddModal>
      <section className="card">
        <CardHeader title="Daftar Tipe Shift" meta={`${list.length} tipe`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Nama</th><th>Jam Mulai</th><th>Jam Selesai</th><th>Aktif</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}><td>{s.kode}</td><td><strong>{s.nama}</strong></td><td>{s.jamMulai}</td><td>{s.jamSelesai}</td><td>{s.aktif ? 'Ya' : 'Tidak'}</td></tr>
              ))}
              {!list.length ? <tr><td colSpan={5} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada tipe shift.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

type OperatorStatusTypeRow = { id: string; kode: string; nama: string; warna?: string | null; urutan: number; aktif: boolean };

const MasterOperatorStatusTypes = () => {
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [list, setList] = useState<OperatorStatusTypeRow[]>([]);
  const [kode, setKode] = useState('');
  const [nama, setNama] = useState('');
  const [warna, setWarna] = useState('#2D6A3F');
  const [urutan, setUrutan] = useState(0);
  const [message, setMessage] = useState('');

  const load = () => apiGet<OperatorStatusTypeRow[]>('/api/v1/master/operator-status-types').then(setList).catch(() => setMessage('Gagal memuat status operator.'));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditId(null); setKode(''); setNama(''); setWarna('#2D6A3F'); setUrutan(list.length + 1); setMessage(''); setOpen(true); };
  const openEdit = (s: OperatorStatusTypeRow) => { setEditId(s.id); setKode(s.kode); setNama(s.nama); setWarna(s.warna ?? '#2D6A3F'); setUrutan(s.urutan); setMessage(''); setOpen(true); };

  const save = async () => {
    if (!kode.trim() || !nama.trim()) {
      setMessage('Kode dan nama wajib diisi.');
      return;
    }
    try {
      if (editId) await apiPut(`/api/v1/master/operator-status-types/${editId}`, { kode, nama, warna, urutan });
      else await apiPost('/api/v1/master/operator-status-types', { kode, nama, warna, urutan });
      setMessage(editId ? 'Status operator diperbarui.' : 'Status operator tersimpan.');
      setOpen(false);
      load();
    } catch {
      setMessage('Gagal menyimpan status operator (butuh role admin, kode unik).');
    }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Status Operator" onAdd={openAdd} />
      <MasterAddModal title={editId ? 'Edit Status Operator' : 'Tambah Status Operator'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Kode <span className="req">*</span><input value={kode} onChange={(e) => setKode(e.target.value.toUpperCase())} placeholder="READY" /></label>
        <label>Nama <span className="req">*</span><input value={nama} onChange={(e) => setNama(e.target.value)} placeholder="Ready" /></label>
        <label>Warna<input type="color" value={warna} onChange={(e) => setWarna(e.target.value)} /></label>
        <label>Urutan<input type="number" min="0" value={urutan} onChange={(e) => setUrutan(Number(e.target.value) || 0)} /></label>
      </MasterAddModal>
      <section className="card">
        <CardHeader title="Daftar Status Operator" meta={`${list.length} status`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Kode</th><th>Nama</th><th>Warna</th><th>Urutan</th><th>Aktif</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.id}>
                  <td>{s.kode}</td>
                  <td><strong>{s.nama}</strong></td>
                  <td><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: '50%', background: s.warna ?? 'var(--muted)', display: 'inline-block' }} />{s.warna ?? '-'}</span></td>
                  <td>{s.urutan}</td>
                  <td>{s.aktif ? 'Ya' : 'Tidak'}</td>
                  <td><RowActions onEdit={() => openEdit(s)} /></td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada status operator.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

// ============ #4 Pit & Stockpile + Matriks Jarak ============
type PitRow = { id: string; nama: string; kodeArea?: string | null; branchId?: string | null; materialDominan?: string | null; aktif: boolean };
type StockpileRow = { id: string; nama: string; kode?: string | null; branchId?: string | null; kapasitasTon?: number | null; aktif: boolean };
type DistanceRow = { id: string; pitId: string; stockpileId: string; jarakKm: number };

const emptyPitForm = { nama: '', kodeArea: '', branchId: '', materialDominan: '' };
const emptySpForm = { nama: '', kode: '', branchId: '', kapasitasTon: '' };

const MasterPitStockpile = () => {
  const [pits, setPits] = useState<PitRow[]>([]);
  const [stockpiles, setStockpiles] = useState<StockpileRow[]>([]);
  const [distances, setDistances] = useState<DistanceRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [message, setMessage] = useState('');

  const [pitOpen, setPitOpen] = useState(false);
  const [pitEditId, setPitEditId] = useState<string | null>(null);
  const [pitForm, setPitForm] = useState({ ...emptyPitForm });
  const [delPit, setDelPit] = useState<PitRow | null>(null);

  const [spOpen, setSpOpen] = useState(false);
  const [spEditId, setSpEditId] = useState<string | null>(null);
  const [spForm, setSpForm] = useState({ ...emptySpForm });
  const [delSp, setDelSp] = useState<StockpileRow | null>(null);

  const [matrixDraft, setMatrixDraft] = useState<Record<string, string>>({});

  const distKey = (pitId: string, spId: string) => `${pitId}|${spId}`;
  const existingDist = (pitId: string, spId: string) => distances.find((d) => d.pitId === pitId && d.stockpileId === spId);

  const load = () => {
    Promise.all([
      apiGet<PitRow[]>('/api/v1/master/pits'),
      apiGet<StockpileRow[]>('/api/v1/master/stockpiles'),
      apiGet<DistanceRow[]>('/api/v1/master/pit-stockpile-distances'),
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
    ])
      .then(([p, s, d, b]) => {
        setPits(p); setStockpiles(s); setDistances(d); setBranches(b);
        const draft: Record<string, string> = {};
        d.forEach((row) => { draft[distKey(row.pitId, row.stockpileId)] = String(row.jarakKm); });
        setMatrixDraft(draft);
      })
      .catch(() => setMessage('Gagal memuat data pit/stockpile.'));
  };
  useEffect(() => { load(); }, []);

  const branchName = (id?: string | null) => branches.find((b) => b.id === id)?.nama ?? '-';

  // ---- Pit ----
  const openPitAdd = () => { setPitEditId(null); setPitForm({ ...emptyPitForm, branchId: branches[0]?.id || '' }); setMessage(''); setPitOpen(true); };
  const openPitEdit = (p: PitRow) => { setPitEditId(p.id); setPitForm({ nama: p.nama, kodeArea: p.kodeArea ?? '', branchId: p.branchId ?? '', materialDominan: p.materialDominan ?? '' }); setMessage(''); setPitOpen(true); };
  const savePit = async () => {
    if (!pitForm.nama.trim()) { setMessage('Nama pit wajib diisi.'); return; }
    const payload = { nama: pitForm.nama, kodeArea: pitForm.kodeArea || undefined, branchId: pitForm.branchId || undefined, materialDominan: pitForm.materialDominan || undefined };
    try {
      if (pitEditId) await apiPut(`/api/v1/master/pits/${pitEditId}`, payload);
      else await apiPost('/api/v1/master/pits', payload);
      setMessage(pitEditId ? 'Pit diperbarui.' : 'Pit tersimpan.');
      setPitOpen(false); load();
    } catch { setMessage('Gagal menyimpan pit (butuh role admin).'); }
  };
  const confirmDelPit = async () => {
    if (!delPit) return;
    try { await apiDelete(`/api/v1/master/pits/${delPit.id}`); setMessage(`Pit ${delPit.nama} dihapus.`); setDelPit(null); load(); }
    catch { setMessage('Pit tidak bisa dihapus (masih dipakai) atau butuh role admin.'); setDelPit(null); }
  };

  // ---- Stockpile ----
  const openSpAdd = () => { setSpEditId(null); setSpForm({ ...emptySpForm, branchId: branches[0]?.id || '' }); setMessage(''); setSpOpen(true); };
  const openSpEdit = (s: StockpileRow) => { setSpEditId(s.id); setSpForm({ nama: s.nama, kode: s.kode ?? '', branchId: s.branchId ?? '', kapasitasTon: s.kapasitasTon != null ? String(s.kapasitasTon) : '' }); setMessage(''); setSpOpen(true); };
  const saveSp = async () => {
    if (!spForm.nama.trim()) { setMessage('Nama stockpile wajib diisi.'); return; }
    const payload = { nama: spForm.nama, kode: spForm.kode || undefined, branchId: spForm.branchId || undefined, kapasitasTon: spForm.kapasitasTon ? Number(spForm.kapasitasTon) : undefined };
    try {
      if (spEditId) await apiPut(`/api/v1/master/stockpiles/${spEditId}`, payload);
      else await apiPost('/api/v1/master/stockpiles', payload);
      setMessage(spEditId ? 'Stockpile diperbarui.' : 'Stockpile tersimpan.');
      setSpOpen(false); load();
    } catch { setMessage('Gagal menyimpan stockpile (butuh role admin).'); }
  };
  const confirmDelSp = async () => {
    if (!delSp) return;
    try { await apiDelete(`/api/v1/master/stockpiles/${delSp.id}`); setMessage(`Stockpile ${delSp.nama} dihapus.`); setDelSp(null); load(); }
    catch { setMessage('Stockpile tidak bisa dihapus (masih dipakai) atau butuh role admin.'); setDelSp(null); }
  };

  // ---- Matriks jarak ----
  const saveMatrix = async () => {
    const changes: Array<{ pitId: string; stockpileId: string; jarakKm: number }> = [];
    pits.forEach((p) => stockpiles.forEach((s) => {
      const raw = matrixDraft[distKey(p.id, s.id)];
      if (raw === undefined || raw === '') return;
      const val = Number(raw);
      if (Number.isNaN(val) || val < 0) return;
      const prev = existingDist(p.id, s.id)?.jarakKm;
      if (prev === undefined || prev !== val) changes.push({ pitId: p.id, stockpileId: s.id, jarakKm: val });
    }));
    if (!changes.length) { setMessage('Tidak ada perubahan jarak.'); return; }
    try {
      for (const c of changes) await apiPost('/api/v1/master/pit-stockpile-distances', c);
      setMessage(`Matriks jarak tersimpan (${changes.length} pasangan).`);
      load();
    } catch { setMessage('Gagal menyimpan matriks jarak (butuh role admin).'); }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}

      <MasterBar label="Tambah Pit" onAdd={openPitAdd} />
      <MasterAddModal title={pitEditId ? 'Edit Pit' : 'Tambah Pit'} open={pitOpen} onClose={() => setPitOpen(false)} onSave={savePit}>
        <label>Nama <span className="req">*</span><input value={pitForm.nama} onChange={(e) => setPitForm((f) => ({ ...f, nama: e.target.value }))} placeholder="Pit Utama" /></label>
        <label>Kode Area<input value={pitForm.kodeArea} onChange={(e) => setPitForm((f) => ({ ...f, kodeArea: e.target.value }))} placeholder="PIT-001" /></label>
        <label>Material Dominan<input value={pitForm.materialDominan} onChange={(e) => setPitForm((f) => ({ ...f, materialDominan: e.target.value }))} placeholder="OB / ORE" /></label>
        <label>Branch<select value={pitForm.branchId} onChange={(e) => setPitForm((f) => ({ ...f, branchId: e.target.value }))}>
          <option value="">— tanpa branch —</option>
          {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
        </select></label>
      </MasterAddModal>
      <ConfirmDelete open={!!delPit} label={`pit ${delPit?.nama ?? ''}`} onClose={() => setDelPit(null)} onConfirm={confirmDelPit} />
      <section className="card">
        <CardHeader title="Daftar Pit" meta={`${pits.length} pit`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Kode Area</th><th>Material Dominan</th><th>Branch</th><th>Aktif</th><th>Aksi</th></tr></thead>
            <tbody>
              {pits.map((p) => (
                <tr key={p.id}>
                  <td><strong>{p.nama}</strong></td><td>{p.kodeArea ?? '-'}</td><td>{p.materialDominan ?? '-'}</td>
                  <td>{branchName(p.branchId)}</td><td>{p.aktif ? 'Ya' : 'Tidak'}</td>
                  <td><RowActions onEdit={() => openPitEdit(p)} onDelete={() => setDelPit(p)} /></td>
                </tr>
              ))}
              {!pits.length ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada pit.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <MasterBar label="Tambah Stockpile" onAdd={openSpAdd} />
      <MasterAddModal title={spEditId ? 'Edit Stockpile' : 'Tambah Stockpile'} open={spOpen} onClose={() => setSpOpen(false)} onSave={saveSp}>
        <label>Nama <span className="req">*</span><input value={spForm.nama} onChange={(e) => setSpForm((f) => ({ ...f, nama: e.target.value }))} placeholder="Stockpile A" /></label>
        <label>Kode<input value={spForm.kode} onChange={(e) => setSpForm((f) => ({ ...f, kode: e.target.value }))} placeholder="SP-001" /></label>
        <label>Kapasitas (ton)<input type="number" min="0" value={spForm.kapasitasTon} onChange={(e) => setSpForm((f) => ({ ...f, kapasitasTon: e.target.value }))} /></label>
        <label>Branch<select value={spForm.branchId} onChange={(e) => setSpForm((f) => ({ ...f, branchId: e.target.value }))}>
          <option value="">— tanpa branch —</option>
          {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
        </select></label>
      </MasterAddModal>
      <ConfirmDelete open={!!delSp} label={`stockpile ${delSp?.nama ?? ''}`} onClose={() => setDelSp(null)} onConfirm={confirmDelSp} />
      <section className="card">
        <CardHeader title="Daftar Stockpile" meta={`${stockpiles.length} stockpile`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Nama</th><th>Kode</th><th>Kapasitas (ton)</th><th>Branch</th><th>Aktif</th><th>Aksi</th></tr></thead>
            <tbody>
              {stockpiles.map((s) => (
                <tr key={s.id}>
                  <td><strong>{s.nama}</strong></td><td>{s.kode ?? '-'}</td><td>{s.kapasitasTon ?? '-'}</td>
                  <td>{branchName(s.branchId)}</td><td>{s.aktif ? 'Ya' : 'Tidak'}</td>
                  <td><RowActions onEdit={() => openSpEdit(s)} onDelete={() => setDelSp(s)} /></td>
                </tr>
              ))}
              {!stockpiles.length ? <tr><td colSpan={6} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada stockpile.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="card">
        <CardHeader title="Matriks Jarak Pit → Stockpile (km)" meta={`${pits.length} × ${stockpiles.length}`} />
        {!pits.length || !stockpiles.length ? (
          <p style={{ color: 'var(--muted)' }}>Tambahkan minimal 1 pit dan 1 stockpile untuk mengisi matriks jarak.</p>
        ) : (
          <>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Pit \ Stockpile</th>{stockpiles.map((s) => <th key={s.id}>{s.nama}</th>)}</tr></thead>
                <tbody>
                  {pits.map((p) => (
                    <tr key={p.id}>
                      <td><strong>{p.nama}</strong></td>
                      {stockpiles.map((s) => (
                        <td key={s.id}>
                          <input type="number" min="0" step="0.1" style={{ width: 80 }}
                            value={matrixDraft[distKey(p.id, s.id)] ?? ''}
                            onChange={(e) => setMatrixDraft((prev) => ({ ...prev, [distKey(p.id, s.id)]: e.target.value }))} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: 12 }}>
              <button className="primary-link" type="button" onClick={saveMatrix}>Simpan Matriks Jarak</button>
            </div>
          </>
        )}
      </section>
    </>
  );
};

// ============ #5 Hauling Rate ============
type RateRow = {
  id: string; branchId: string; tipeUnitId: string; materialId: string;
  pitId?: string | null; stockpileId?: string | null; rateRpPerTon: number;
  berlakuDari: string; berlakuSampai?: string | null;
  tipeUnit?: { nama: string }; material?: { nama: string }; branch?: { nama: string };
};

const emptyRateForm = { branchId: '', tipeUnitId: '', materialId: '', pitId: '', stockpileId: '', rateRpPerTon: '', berlakuDari: '', berlakuSampai: '' };

const MasterRates = () => {
  const [list, setList] = useState<RateRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tipeUnits, setTipeUnits] = useState<TipeUnit[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [pits, setPits] = useState<PitRow[]>([]);
  const [stockpiles, setStockpiles] = useState<StockpileRow[]>([]);
  const [message, setMessage] = useState('');

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyRateForm });
  const [delRate, setDelRate] = useState<RateRow | null>(null);
  const set = (k: keyof typeof emptyRateForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  const load = () => {
    Promise.all([
      apiGet<RateRow[]>('/api/v1/master/rates'),
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<TipeUnit[]>('/api/v1/master/tipe-unit'),
      apiGet<MaterialRow[]>('/api/v1/master/materials'),
      apiGet<PitRow[]>('/api/v1/master/pits'),
      apiGet<StockpileRow[]>('/api/v1/master/stockpiles'),
    ])
      .then(([r, b, t, m, p, s]) => { setList(r); setBranches(b); setTipeUnits(t); setMaterials(m); setPits(p); setStockpiles(s); })
      .catch(() => setMessage('Gagal memuat hauling rate.'));
  };
  useEffect(() => { load(); }, []);

  const nameOf = <T extends { id: string; nama: string }>(arr: T[], id?: string | null) => arr.find((x) => x.id === id)?.nama ?? '-';

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyRateForm, branchId: branches[0]?.id || '', tipeUnitId: tipeUnits[0]?.id || '', materialId: materials[0]?.id || '', berlakuDari: currentBulan() + '-01' });
    setMessage(''); setOpen(true);
  };
  const openEdit = (r: RateRow) => {
    setEditId(r.id);
    setForm({
      branchId: r.branchId, tipeUnitId: r.tipeUnitId, materialId: r.materialId,
      pitId: r.pitId ?? '', stockpileId: r.stockpileId ?? '', rateRpPerTon: String(r.rateRpPerTon),
      berlakuDari: r.berlakuDari ? r.berlakuDari.slice(0, 10) : '', berlakuSampai: r.berlakuSampai ? r.berlakuSampai.slice(0, 10) : '',
    });
    setMessage(''); setOpen(true);
  };

  const save = async () => {
    if (!form.branchId || !form.tipeUnitId || !form.materialId || !form.rateRpPerTon || !form.berlakuDari) {
      setMessage('Branch, tipe unit, material, rate, dan berlaku dari wajib diisi.');
      return;
    }
    const payload = {
      branchId: form.branchId, tipeUnitId: form.tipeUnitId, materialId: form.materialId,
      pitId: form.pitId || undefined, stockpileId: form.stockpileId || undefined,
      rateRpPerTon: Number(form.rateRpPerTon), berlakuDari: form.berlakuDari,
      berlakuSampai: form.berlakuSampai || undefined,
    };
    try {
      if (editId) await apiPut(`/api/v1/master/rates/${editId}`, payload);
      else await apiPost('/api/v1/master/rates', payload);
      setMessage(editId ? 'Rate diperbarui.' : 'Rate tersimpan.');
      setOpen(false); load();
    } catch { setMessage('Gagal menyimpan rate (butuh role admin).'); }
  };

  const confirmDelete = async () => {
    if (!delRate) return;
    try { await apiDelete(`/api/v1/master/rates/${delRate.id}`); setMessage('Rate dihapus.'); setDelRate(null); load(); }
    catch { setMessage('Gagal menghapus rate (butuh role admin).'); setDelRate(null); }
  };

  const fmtRp = (n: number) => `Rp ${n.toLocaleString('id-ID')}`;
  const fmtDate = (d?: string | null) => d ? d.slice(0, 10) : '-';

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <MasterBar label="Tambah Rate" onAdd={openAdd} />
      <MasterAddModal title={editId ? 'Edit Hauling Rate' : 'Tambah Hauling Rate'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Branch <span className="req">*</span><select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
          {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
        </select></label>
        <label>Tipe Unit <span className="req">*</span><select value={form.tipeUnitId} onChange={(e) => set('tipeUnitId', e.target.value)}>
          {tipeUnits.map((t) => <option value={t.id} key={t.id}>{t.nama}</option>)}
        </select></label>
        <label>Material <span className="req">*</span><select value={form.materialId} onChange={(e) => set('materialId', e.target.value)}>
          {materials.map((m) => <option value={m.id} key={m.id}>{m.nama}</option>)}
        </select></label>
        <label>Pit<select value={form.pitId} onChange={(e) => set('pitId', e.target.value)}>
          <option value="">— semua pit —</option>
          {pits.map((p) => <option value={p.id} key={p.id}>{p.nama}</option>)}
        </select></label>
        <label>Stockpile<select value={form.stockpileId} onChange={(e) => set('stockpileId', e.target.value)}>
          <option value="">— semua stockpile —</option>
          {stockpiles.map((s) => <option value={s.id} key={s.id}>{s.nama}</option>)}
        </select></label>
        <label>Rate (Rp / ton) <span className="req">*</span><input type="number" min="0" value={form.rateRpPerTon} onChange={(e) => set('rateRpPerTon', e.target.value)} placeholder="15000" /></label>
        <label>Berlaku Dari <span className="req">*</span><input type="date" value={form.berlakuDari} onChange={(e) => set('berlakuDari', e.target.value)} /></label>
        <label>Berlaku Sampai<input type="date" value={form.berlakuSampai} onChange={(e) => set('berlakuSampai', e.target.value)} /></label>
      </MasterAddModal>
      <ConfirmDelete open={!!delRate} label="rate ini" onClose={() => setDelRate(null)} onConfirm={confirmDelete} />
      <section className="card">
        <CardHeader title="Daftar Hauling Rate" meta={`${list.length} rate`} />
        <div className="table-wrap">
          <table>
            <thead><tr><th>Branch</th><th>Tipe Unit</th><th>Material</th><th>Pit</th><th>Stockpile</th><th>Rate (Rp/ton)</th><th>Berlaku Dari</th><th>Berlaku Sampai</th><th>Aksi</th></tr></thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.id}>
                  <td>{r.branch?.nama ?? nameOf(branches, r.branchId)}</td>
                  <td>{r.tipeUnit?.nama ?? nameOf(tipeUnits, r.tipeUnitId)}</td>
                  <td>{r.material?.nama ?? nameOf(materials, r.materialId)}</td>
                  <td>{r.pitId ? nameOf(pits, r.pitId) : 'Semua'}</td>
                  <td>{r.stockpileId ? nameOf(stockpiles, r.stockpileId) : 'Semua'}</td>
                  <td><strong>{fmtRp(r.rateRpPerTon)}</strong></td>
                  <td>{fmtDate(r.berlakuDari)}</td>
                  <td>{fmtDate(r.berlakuSampai)}</td>
                  <td><RowActions onEdit={() => openEdit(r)} onDelete={() => setDelRate(r)} /></td>
                </tr>
              ))}
              {!list.length ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '16px 0' }}>Belum ada hauling rate.</td></tr> : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
};

// ============ Input Dasar Target Produksi (versioned, bagian Budget & Target) ============
type BasisTPRow = {
  id: string; branchId: string; tipeUnitId: string; materialId: string;
  ewhPerUnitJam: number; jumlahUnitPlan: number; produktivitasTonPerJam: number;
  berlakuDari: string; berlakuSampai?: string | null;
  tipeUnit?: { nama: string }; material?: { nama: string }; branch?: { nama: string };
};

const emptyBasisForm = { branchId: '', tipeUnitId: '', materialId: '', ewhPerUnitJam: '', jumlahUnitPlan: '', produktivitasTonPerJam: '', berlakuDari: '', berlakuSampai: '' };

const MasterBasisTargetProduksi = () => {
  const [list, setList] = useState<BasisTPRow[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tipeUnits, setTipeUnits] = useState<TipeUnit[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  const [branchId, setBranchId] = useState('');
  const [message, setMessage] = useState('');

  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyBasisForm });
  const [delRec, setDelRec] = useState<BasisTPRow | null>(null);
  const set = (k: keyof typeof emptyBasisForm, v: string) => setForm((f) => ({ ...f, [k]: v }));

  useEffect(() => {
    Promise.all([
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<TipeUnit[]>('/api/v1/master/tipe-unit'),
      apiGet<MaterialRow[]>('/api/v1/master/materials'),
    ])
      .then(([b, t, m]) => { setBranches(b); setTipeUnits(t); setMaterials(m); if (b[0]) setBranchId(b[0].id); })
      .catch(() => setMessage('Gagal memuat data master.'));
  }, []);

  const load = (bId: string) => {
    if (!bId) return;
    apiGet<BasisTPRow[]>(`/api/v1/master/basis-target-produksi?branchId=${bId}`)
      .then(setList)
      .catch(() => setMessage('Gagal memuat input dasar.'));
  };
  useEffect(() => { load(branchId); /* eslint-disable-next-line */ }, [branchId]);

  const nameOf = <T extends { id: string; nama: string }>(arr: T[], id?: string | null) => arr.find((x) => x.id === id)?.nama ?? '-';

  const openAdd = () => {
    setEditId(null);
    setForm({ ...emptyBasisForm, branchId: branchId || branches[0]?.id || '', tipeUnitId: tipeUnits[0]?.id || '', materialId: materials[0]?.id || '', berlakuDari: currentBulan() + '-01' });
    setMessage(''); setOpen(true);
  };
  const openEdit = (r: BasisTPRow) => {
    setEditId(r.id);
    setForm({
      branchId: r.branchId, tipeUnitId: r.tipeUnitId, materialId: r.materialId,
      ewhPerUnitJam: String(r.ewhPerUnitJam), jumlahUnitPlan: String(r.jumlahUnitPlan), produktivitasTonPerJam: String(r.produktivitasTonPerJam),
      berlakuDari: r.berlakuDari ? r.berlakuDari.slice(0, 10) : '', berlakuSampai: r.berlakuSampai ? r.berlakuSampai.slice(0, 10) : '',
    });
    setMessage(''); setOpen(true);
  };

  const save = async () => {
    if (!form.branchId || !form.tipeUnitId || !form.materialId || !form.ewhPerUnitJam || !form.jumlahUnitPlan || !form.produktivitasTonPerJam || !form.berlakuDari) {
      setMessage('Semua kolom kecuali "berlaku sampai" wajib diisi.');
      return;
    }
    const payload = {
      branchId: form.branchId, tipeUnitId: form.tipeUnitId, materialId: form.materialId,
      ewhPerUnitJam: Number(form.ewhPerUnitJam), jumlahUnitPlan: parseInt(form.jumlahUnitPlan, 10),
      produktivitasTonPerJam: Number(form.produktivitasTonPerJam), berlakuDari: form.berlakuDari,
      berlakuSampai: form.berlakuSampai || undefined,
    };
    try {
      if (editId) await apiPut(`/api/v1/master/basis-target-produksi/${editId}`, payload);
      else await apiPost('/api/v1/master/basis-target-produksi', payload);
      setMessage(editId ? 'Input dasar diperbarui.' : 'Input dasar tersimpan.');
      setOpen(false); load(branchId);
    } catch { setMessage('Gagal menyimpan (butuh role admin).'); }
  };

  const confirmDelete = async () => {
    if (!delRec) return;
    try { await apiDelete(`/api/v1/master/basis-target-produksi/${delRec.id}`); setMessage('Input dasar dihapus.'); setDelRec(null); load(branchId); }
    catch { setMessage('Gagal menghapus (butuh role admin).'); setDelRec(null); }
  };

  const fmtDate = (d?: string | null) => d ? d.slice(0, 10) : '—';
  const planTon = (r: BasisTPRow) => r.ewhPerUnitJam * r.jumlahUnitPlan * r.produktivitasTonPerJam;

  return (
    <section className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
          <strong>9. Input Dasar Target Produksi (Versioned)</strong>
          <span>{list.length} versi</span>
        </div>
        <button className="btn-gold-sm" type="button" onClick={openAdd}>+ Tambah</button>
      </div>
      <div style={{ padding: '12px 18px 0' }}>
        <p style={{ color: 'var(--muted)', fontSize: 'var(--font-size-sm)', margin: '0 0 8px' }}>
          Target Produksi harian diturunkan otomatis: <strong>EWH/unit × Jumlah Unit Plan × Produktivitas</strong>.
          Berlaku sejak tanggal tertentu (histori versi lama tidak ditimpa). Dipakai modul Analytic.
        </p>
        {message ? <div className="inline-alert" style={{ margin: 0 }}>{message}</div> : null}
        <label style={{ display: 'inline-flex', flexDirection: 'column', gap: 4, marginTop: 8 }}>Branch
          <select value={branchId} onChange={(e) => setBranchId(e.target.value)} style={{ minWidth: 200 }}>
            {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
          </select>
        </label>
      </div>

      <MasterAddModal title={editId ? 'Edit Input Dasar' : 'Tambah Input Dasar'} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>Branch <span className="req">*</span><select value={form.branchId} onChange={(e) => set('branchId', e.target.value)}>
          {branches.map((b) => <option value={b.id} key={b.id}>{b.nama}</option>)}
        </select></label>
        <label>Tipe Unit <span className="req">*</span><select value={form.tipeUnitId} onChange={(e) => set('tipeUnitId', e.target.value)}>
          {tipeUnits.map((t) => <option value={t.id} key={t.id}>{t.nama}</option>)}
        </select></label>
        <label>Material <span className="req">*</span><select value={form.materialId} onChange={(e) => set('materialId', e.target.value)}>
          {materials.map((m) => <option value={m.id} key={m.id}>{m.nama}</option>)}
        </select></label>
        <label>EWH / Unit (jam) <span className="req">*</span><input type="number" min="0" step="0.1" value={form.ewhPerUnitJam} onChange={(e) => set('ewhPerUnitJam', e.target.value)} placeholder="10" /></label>
        <label>Jumlah Unit Plan <span className="req">*</span><input type="number" min="0" value={form.jumlahUnitPlan} onChange={(e) => set('jumlahUnitPlan', e.target.value)} placeholder="8" /></label>
        <label>Produktivitas (ton/jam) <span className="req">*</span><input type="number" min="0" step="0.01" value={form.produktivitasTonPerJam} onChange={(e) => set('produktivitasTonPerJam', e.target.value)} placeholder="2.5" /></label>
        <label>Berlaku Dari <span className="req">*</span><input type="date" value={form.berlakuDari} onChange={(e) => set('berlakuDari', e.target.value)} /></label>
        <label>Berlaku Sampai<input type="date" value={form.berlakuSampai} onChange={(e) => set('berlakuSampai', e.target.value)} /></label>
      </MasterAddModal>
      <ConfirmDelete open={!!delRec} label="input dasar ini" onClose={() => setDelRec(null)} onConfirm={confirmDelete} />

      <div className="table-wrap">
        <table>
          <thead><tr><th>Tipe Unit</th><th>Material</th><th>EWH/Unit</th><th>Unit Plan</th><th>Produktivitas</th><th>Produksi Plan/hari</th><th>Berlaku Dari</th><th>Berlaku Sampai</th><th style={{ width: 120 }}>Aksi</th></tr></thead>
          <tbody>
            {list.map((r) => (
              <tr key={r.id}>
                <td>{r.tipeUnit?.nama ?? nameOf(tipeUnits, r.tipeUnitId)}</td>
                <td>{r.material?.nama ?? nameOf(materials, r.materialId)}</td>
                <td>{formatNumber(r.ewhPerUnitJam)}</td>
                <td>{r.jumlahUnitPlan}</td>
                <td>{formatNumber(r.produktivitasTonPerJam)}</td>
                <td><strong>{formatNumber(planTon(r))}</strong> ton</td>
                <td>{fmtDate(r.berlakuDari)}</td>
                <td>{fmtDate(r.berlakuSampai)}</td>
                <td><RowActions onEdit={() => openEdit(r)} onDelete={() => setDelRec(r)} /></td>
              </tr>
            ))}
            {!list.length ? <tr><td colSpan={9} style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)' }}>Belum ada input dasar untuk branch ini.</td></tr> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
};

// ============ Master "Budget & Target" (bulanan) ============
const BULAN_OPTS = [
  ['01', 'Januari'], ['02', 'Februari'], ['03', 'Maret'], ['04', 'April'], ['05', 'Mei'], ['06', 'Juni'],
  ['07', 'Juli'], ['08', 'Agustus'], ['09', 'September'], ['10', 'Oktober'], ['11', 'November'], ['12', 'Desember'],
];

type BTField = { name: string; label: string; integer?: boolean };
type BTRow = { key: string; label: string; sublabel?: string; dims: Record<string, string> };

const BudgetTargetCard = ({ title, endpoint, rows, fields, bulan, tahun, reloadToken, note, dimLabel, unitHint }: {
  title: string; endpoint: string; rows: BTRow[]; fields: BTField[];
  bulan: string; tahun: string; reloadToken: number; note?: string; dimLabel: string; unitHint?: string;
}) => {
  type Rec = Record<string, unknown> & { id: string };
  const [records, setRecords] = useState<Rec[]>([]);
  const [msg, setMsg] = useState('');
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [selKey, setSelKey] = useState('');
  const [vals, setVals] = useState<Record<string, string>>({});
  const [delRec, setDelRec] = useState<{ id: string; label: string } | null>(null);

  const load = () => apiGet<Rec[]>(`/api/v1/master/${endpoint}?bulan=${bulan}&tahun=${tahun}`)
    .then(setRecords)
    .catch(() => setMsg('Gagal memuat data.'));
  useEffect(() => { load(); /* eslint-disable-next-line */ }, [bulan, tahun, reloadToken]);

  const rowOf = (rec: Record<string, unknown>) => rows.find((r) => Object.entries(r.dims).every(([k, v]) => rec[k] === v));
  const usedKeys = new Set(records.map((rec) => rowOf(rec)?.key).filter(Boolean) as string[]);
  const availableRows = rows.filter((r) => !usedKeys.has(r.key));

  const openAdd = () => { setEditId(null); setSelKey(availableRows[0]?.key ?? ''); setVals({}); setMsg(''); setOpen(true); };
  const openEdit = (rec: Rec) => {
    setEditId(rec.id); setSelKey(rowOf(rec)?.key ?? '');
    const v: Record<string, string> = {}; fields.forEach((f) => { v[f.name] = rec[f.name] != null ? String(rec[f.name]) : ''; });
    setVals(v); setMsg(''); setOpen(true);
  };

  const save = async () => {
    const row = rows.find((r) => r.key === selKey);
    if (!row) { setMsg(`Pilih ${dimLabel} lebih dulu.`); return; }
    const payload: Record<string, unknown> = { ...row.dims, bulan, tahun: Number(tahun) };
    let hasVal = false;
    for (const f of fields) {
      const raw = vals[f.name];
      if (raw !== undefined && raw !== '') {
        const num = f.integer ? parseInt(raw, 10) : Number(raw);
        if (Number.isNaN(num) || num < 0) { setMsg(`Nilai ${f.label} tidak valid.`); return; }
        payload[f.name] = num; hasVal = true;
      }
    }
    if (!hasVal) { setMsg('Isi minimal satu nilai.'); return; }
    try { await apiPost(`/api/v1/master/${endpoint}`, payload); setMsg(editId ? 'Data diperbarui.' : 'Data ditambahkan.'); setOpen(false); load(); }
    catch { setMsg('Gagal menyimpan (butuh role admin).'); }
  };

  const confirmDelete = async () => {
    if (!delRec) return;
    try { await apiDelete(`/api/v1/master/${endpoint}/${delRec.id}`); setMsg('Data dihapus.'); setDelRec(null); load(); }
    catch { setMsg('Gagal menghapus (butuh role admin).'); setDelRec(null); }
  };

  const selRow = rows.find((r) => r.key === selKey);

  return (
    <section className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'baseline', gap: 10, minWidth: 0 }}>
          <strong>{title}</strong>
          <span>{records.length} data</span>
        </div>
        <button className="btn-gold-sm" type="button" onClick={openAdd}>+ Tambah</button>
      </div>
      {note || msg ? (
        <div style={{ padding: '12px 18px 0' }}>
          {note ? <p style={{ color: 'var(--muted)', fontSize: 'var(--font-size-sm)', margin: '0 0 8px' }}>{note}</p> : null}
          {msg ? <div className="inline-alert" style={{ margin: 0 }}>{msg}</div> : null}
        </div>
      ) : null}
      <div className="table-wrap">
        <table>
          <thead><tr><th>{dimLabel}</th>{fields.map((f) => <th key={f.name}>{f.label}</th>)}<th style={{ width: 120 }}>Aksi</th></tr></thead>
          <tbody>
            {records.map((rec) => {
              const r = rowOf(rec);
              return (
                <tr key={rec.id}>
                  <td><strong>{r?.label ?? '-'}</strong>{r?.sublabel ? <span style={{ color: 'var(--muted)' }}> · {r.sublabel}</span> : null}</td>
                  {fields.map((f) => <td key={f.name}>{rec[f.name] != null ? formatNumber(Number(rec[f.name])) : '—'}</td>)}
                  <td><RowActions onEdit={() => openEdit(rec)} onDelete={() => setDelRec({ id: rec.id, label: r?.label ?? '' })} /></td>
                </tr>
              );
            })}
            {!records.length ? (
              <tr><td colSpan={fields.length + 2} style={{ textAlign: 'center', padding: '18px 0', color: 'var(--muted)' }}>
                Belum ada data untuk periode {bulan}/{tahun}. Klik “+ Tambah”.
              </td></tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <MasterAddModal title={`${editId ? 'Edit' : 'Tambah'} — ${title}`} open={open} onClose={() => setOpen(false)} onSave={save}>
        <label>{dimLabel} <span className="req">*</span>
          {editId
            ? <input value={selRow ? `${selRow.label}${selRow.sublabel ? ` · ${selRow.sublabel}` : ''}` : ''} disabled />
            : (
              <select value={selKey} onChange={(e) => setSelKey(e.target.value)}>
                {availableRows.length
                  ? availableRows.map((r) => <option value={r.key} key={r.key}>{r.label}{r.sublabel ? ` · ${r.sublabel}` : ''}</option>)
                  : <option value="">— semua {dimLabel.toLowerCase()} sudah punya data —</option>}
              </select>
            )}
        </label>
        {fields.map((f) => (
          <label key={f.name}>{f.label}{unitHint && fields.length === 1 ? ` (${unitHint})` : ''}
            <input type="number" min="0" value={vals[f.name] ?? ''} onChange={(e) => setVals((p) => ({ ...p, [f.name]: e.target.value }))} />
          </label>
        ))}
        <div className="modal-form-section">Periode: {bulan}/{tahun}</div>
      </MasterAddModal>
      <ConfirmDelete open={!!delRec} label={`${delRec?.label ?? ''} (${bulan}/${tahun})`} onClose={() => setDelRec(null)} onConfirm={confirmDelete} />
    </section>
  );
};

const BUDGET_TARGET_ENDPOINTS = [
  'budget-breakdown-units', 'target-produksi-branch', 'budget-ratio-bbm',
  'target-revenue', 'target-revenue-tipe-unit', 'target-material-bulanan',
];

const MasterBudgetTarget = () => {
  const now = new Date();
  const [bulan, setBulan] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [tahun, setTahun] = useState(String(now.getFullYear()));
  const [reloadToken, setReloadToken] = useState(0);
  const [message, setMessage] = useState('');
  const [units, setUnits] = useState<Unit[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [tipeUnits, setTipeUnits] = useState<TipeUnit[]>([]);
  const [materials, setMaterials] = useState<MaterialRow[]>([]);
  // Generate (copy dari bulan lain)
  const [genOpen, setGenOpen] = useState(false);
  const [genBulan, setGenBulan] = useState(String(now.getMonth() + 1).padStart(2, '0'));
  const [genTahun, setGenTahun] = useState(String(now.getFullYear()));

  useEffect(() => {
    Promise.all([
      apiGet<Unit[]>('/api/v1/master/units?aktif=true'),
      apiGet<Branch[]>('/api/v1/master/branches?aktif=true'),
      apiGet<TipeUnit[]>('/api/v1/master/tipe-unit'),
      apiGet<MaterialRow[]>('/api/v1/master/materials'),
    ])
      .then(([u, b, t, m]) => { setUnits(u); setBranches(b); setTipeUnits(t); setMaterials(m); })
      .catch(() => setMessage('Gagal memuat data master.'));
  }, []);

  const unitRows: BTRow[] = units.map((u) => ({ key: u.id, label: u.kode, sublabel: u.tipe?.nama, dims: { unitId: u.id } }));
  const branchRows: BTRow[] = branches.map((b) => ({ key: b.id, label: b.nama, dims: { branchId: b.id } }));
  const tipeRows: BTRow[] = tipeUnits.map((t) => ({ key: t.id, label: t.nama, dims: { tipeUnitId: t.id } }));
  const materialRows: BTRow[] = branches.flatMap((b) => materials.map((m) => ({
    key: `${b.id}|${m.id}`, label: m.nama, sublabel: b.nama, dims: { branchId: b.id, materialId: m.id },
  })));

  const runGenerate = async () => {
    if (genBulan === bulan && genTahun === tahun) { setMessage('Bulan/tahun sumber dan target tidak boleh sama.'); return; }
    try {
      let total = 0;
      for (const ep of BUDGET_TARGET_ENDPOINTS) {
        const r = await apiPost<{ copied: number }>(`/api/v1/master/${ep}/generate`, {
          fromBulan: genBulan, fromTahun: Number(genTahun), toBulan: bulan, toTahun: Number(tahun),
        });
        total += r?.copied ?? 0;
      }
      setMessage(`Generate selesai: ${total} baris disalin ke ${bulan}/${tahun}.`);
      setGenOpen(false);
      setReloadToken((t) => t + 1);
    } catch { setMessage('Gagal generate (butuh role admin).'); }
  };

  return (
    <>
      {message ? <div className="inline-alert">{message}</div> : null}
      <section className="toolbar-panel" style={{ marginBottom: 16 }}>
        <label>Bulan
          <select value={bulan} onChange={(e) => setBulan(e.target.value)}>
            {BULAN_OPTS.map(([v, l]) => <option value={v} key={v}>{l}</option>)}
          </select>
        </label>
        <label>Tahun
          <input type="number" min="2000" style={{ width: 90 }} value={tahun} onChange={(e) => setTahun(e.target.value)} />
        </label>
        <label style={{ minWidth: 'auto', justifyContent: 'flex-end' }}>&nbsp;
          <button type="button" onClick={() => { setGenBulan(bulan); setGenTahun(tahun); setGenOpen(true); }}>Generate dari Bulan Lain (Copy)</button>
        </label>
      </section>

      <MasterAddModal title="Generate Budget & Target dari Bulan Lain" open={genOpen} onClose={() => setGenOpen(false)} onSave={runGenerate} saveLabel="Generate">
        <label>Dari Bulan <span className="req">*</span>
          <select value={genBulan} onChange={(e) => setGenBulan(e.target.value)}>
            {BULAN_OPTS.map(([v, l]) => <option value={v} key={v}>{l}</option>)}
          </select>
        </label>
        <label>Dari Tahun <span className="req">*</span><input type="number" min="2000" value={genTahun} onChange={(e) => setGenTahun(e.target.value)} /></label>
        <label>Ke <input value={`${bulan}/${tahun}`} disabled /></label>
      </MasterAddModal>

      <BudgetTargetCard title="1. Budget Breakdown per Unit" endpoint="budget-breakdown-units" dimLabel="Unit" rows={unitRows} bulan={bulan} tahun={tahun} reloadToken={reloadToken}
        fields={[{ name: 'budgetJamPerHari', label: 'Jam / Hari' }]} unitHint="jam/hari" note="Batas maksimal jam downtime (breakdown) per unit per hari." />
      <BudgetTargetCard title="2. Target Produksi Bulanan (per Branch)" endpoint="target-produksi-branch" dimLabel="Branch" rows={branchRows} bulan={bulan} tahun={tahun} reloadToken={reloadToken}
        fields={[{ name: 'targetTon', label: 'Target Ton' }]} unitHint="ton" />
      <BudgetTargetCard title="3. Budget Ratio BBM (per Tipe Unit)" endpoint="budget-ratio-bbm" dimLabel="Tipe Unit" rows={tipeRows} bulan={bulan} tahun={tahun} reloadToken={reloadToken}
        fields={[{ name: 'ratioLPerKm', label: 'Liter / km' }]} unitHint="L/km" />
      <BudgetTargetCard title="4. Target Revenue Bulanan (per Branch)" endpoint="target-revenue" dimLabel="Branch" rows={branchRows} bulan={bulan} tahun={tahun} reloadToken={reloadToken}
        fields={[{ name: 'targetRp', label: 'Target Rp' }]} unitHint="Rp" />
      <BudgetTargetCard title="5. Target Revenue Bulanan (per Tipe Unit)" endpoint="target-revenue-tipe-unit" dimLabel="Tipe Unit" rows={tipeRows} bulan={bulan} tahun={tahun} reloadToken={reloadToken}
        fields={[{ name: 'targetRp', label: 'Target Rp' }]} unitHint="Rp" />
      <BudgetTargetCard title="6 & 7. Target Ritase & Tonase Bulanan (per Material, per Branch)" endpoint="target-material-bulanan" dimLabel="Material" rows={materialRows} bulan={bulan} tahun={tahun} reloadToken={reloadToken}
        fields={[{ name: 'targetRitase', label: 'Target Ritase', integer: true }, { name: 'targetTon', label: 'Target Ton' }]} />
      <BudgetTargetCard title="8. Target PA% & UA% (per Branch)" endpoint="target-availability-branch" dimLabel="Branch" rows={branchRows} bulan={bulan} tahun={tahun} reloadToken={reloadToken}
        fields={[{ name: 'targetPaPct', label: 'Target PA%' }, { name: 'targetUaPct', label: 'Target UA%' }]}
        note="Dibandingkan ke PA%/UA% aktual (dihitung dari jam terjadwal, breakdown, dan delay) di Dashboard Monitoring Harian." />
      <MasterBasisTargetProduksi />
    </>
  );
};

const masterTabs: Array<{ key: string; label: string }> = [
  { key: 'branches', label: 'Branch' },
  { key: 'units', label: 'Unit' },
  { key: 'operators', label: 'Operator' },
  { key: 'operator-status-types', label: 'Status Operator' },
  { key: 'tipe-unit', label: 'Tipe Unit' },
  { key: 'shift-types', label: 'Tipe Shift' },
  { key: 'material', label: 'Material' },
  { key: 'pit-stockpile', label: 'Pit & Stockpile' },
  { key: 'rates', label: 'Hauling Rate' },
  { key: 'budget-target', label: 'Budget & Target' },
  { key: 'fuel-types', label: 'Fuel Type' },
  { key: 'delay-types', label: 'Jenis Delay' },
  { key: 'fuel-stations', label: 'Fuel Station' },
  { key: 'users', label: 'User' },
  { key: 'permissions', label: 'Permission' },
];

const MasterDataPage = () => {
  const [tab, setTab] = useState('units');
  return (
    <>
      <PageHeader
        title="Master Data"
        description="Konfigurasi data referensi sistem: unit, operator, tipe unit, jenis delay, dan fuel station."
      />
      <div className="master-tabs">
        {masterTabs.map((item) => (
          <button
            key={item.key}
            type="button"
            className={`master-tab ${tab === item.key ? 'active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            {item.label}
          </button>
        ))}
      </div>
      {tab === 'branches' ? <MasterBranches /> : null}
      {tab === 'units' ? <MasterUnits /> : null}
      {tab === 'operators' ? <MasterOperators /> : null}
      {tab === 'operator-status-types' ? <MasterOperatorStatusTypes /> : null}
      {tab === 'tipe-unit' ? <MasterTipeUnit /> : null}
      {tab === 'shift-types' ? <MasterShiftTypes /> : null}
      {tab === 'material' ? <MasterMaterials /> : null}
      {tab === 'pit-stockpile' ? <MasterPitStockpile /> : null}
      {tab === 'rates' ? <MasterRates /> : null}
      {tab === 'budget-target' ? <MasterBudgetTarget /> : null}
      {tab === 'fuel-types' ? <MasterFuelTypes /> : null}
      {tab === 'delay-types' ? <MasterDelayTypes /> : null}
      {tab === 'fuel-stations' ? <MasterFuelStations /> : null}
      {tab === 'users' ? <MasterUsers /> : null}
      {tab === 'permissions' ? <MasterModulePermissions /> : null}
    </>
  );
};

type MeProfile = {
  id: string;
  username: string;
  nama: string;
  role: string;
  branchId?: string | null;
  lastLoginAt?: string | null;
  avatarUrl?: string | null;
};

// String acak pendek dipakai sebagai seed pilihan avatar (bukan identifier bermakna,
// cuma sumber variasi untuk Multiavatar).
const randomAvatarSeed = () => Math.random().toString(36).slice(2, 9);

const SettingsPage = () => {
  const [profile, setProfile] = useState<MeProfile | null>(null);
  const [branchName, setBranchName] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [avatarSeed, setAvatarSeed] = useState('');
  const [avatarSuggestions, setAvatarSuggestions] = useState<string[]>(() => Array.from({ length: 6 }, randomAvatarSeed));
  const [avatarMessage, setAvatarMessage] = useState('');
  const [isSavingAvatar, setIsSavingAvatar] = useState(false);

  useEffect(() => {
    apiGet<MeProfile>('/api/v1/auth/me')
      .then((me) => {
        setProfile(me);
        setAvatarSeed(me.avatarUrl || me.username);
        if (me.branchId) {
          apiGet<Branch[]>('/api/v1/master/branches')
            .then((branches) => setBranchName(branches.find((b) => b.id === me.branchId)?.nama ?? me.branchId ?? ''))
            .catch(() => setBranchName(me.branchId ?? ''));
        }
      })
      .catch(() => setMessage('Gagal memuat profil.'));
  }, []);

  const shuffleAvatarSuggestions = () => setAvatarSuggestions(Array.from({ length: 6 }, randomAvatarSeed));

  const saveAvatar = async () => {
    if (!avatarSeed.trim()) {
      setAvatarMessage('Isi teks kustom atau pilih salah satu opsi.');
      return;
    }
    setIsSavingAvatar(true);
    setAvatarMessage('');
    try {
      await apiPut<{ avatarUrl: string }>('/api/v1/auth/avatar', { avatarSeed: avatarSeed.trim() });
      setAvatarMessage('Avatar tersimpan.');
      setProfile((prev) => (prev ? { ...prev, avatarUrl: avatarSeed.trim() } : prev));
      // Sinkron ke sidebar (Shell) & sesi lokal tanpa perlu reload halaman.
      const session = getSession();
      if (session) {
        localStorage.setItem(SESSION_KEY, JSON.stringify({ ...session, avatarUrl: avatarSeed.trim() }));
      }
      window.dispatchEvent(new CustomEvent('haulops:avatar-updated', { detail: { avatarUrl: avatarSeed.trim() } }));
    } catch {
      setAvatarMessage('Gagal menyimpan avatar.');
    } finally {
      setIsSavingAvatar(false);
    }
  };

  const changePassword = async () => {
    setMessage('');
    if (!currentPassword || newPassword.length < 6) {
      setMessage('Password baru minimal 6 karakter dan password saat ini wajib diisi.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage('Konfirmasi password tidak cocok.');
      return;
    }
    setIsSaving(true);
    try {
      await apiPut<{ message: string }>('/api/v1/auth/password', { currentPassword, newPassword });
      setMessage('Password berhasil diperbarui.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch {
      setMessage('Gagal memperbarui password. Pastikan password saat ini benar.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Settings"
        description="Informasi akun dan keamanan. Ubah password dan lihat detail profil operasional Anda."
      />
      {message ? <div className="inline-alert">{message}</div> : null}

      <section className="card" style={{ marginBottom: 20 }}>
        <CardHeader title="Avatar" meta="Berlaku untuk semua user" />
        <div style={{ padding: 18, display: 'flex', gap: 24, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
            <div className="avatar" style={{ width: 96, height: 96 }}>
              <Avatar seed={avatarSeed} size={96} />
            </div>
            <span style={{ color: 'var(--muted)', fontSize: 12 }}>Pratinjau</span>
          </div>
          <div style={{ flex: '1 1 320px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {avatarMessage ? <div className="inline-alert">{avatarMessage}</div> : null}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em', color: 'var(--muted)' }}>
                  Pilih dari opsi acak
                </span>
                <button type="button" className="btn-ghost-sm" onClick={shuffleAvatarSuggestions}>🔀 Acak Ulang</button>
              </div>
              <div className="avatar-picker">
                {avatarSuggestions.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className={avatarSeed === s ? 'selected' : ''}
                    onClick={() => setAvatarSeed(s)}
                    aria-label={`Pilih avatar ${s}`}
                  >
                    <Avatar seed={s} size={48} />
                  </button>
                ))}
              </div>
            </div>
            <div className="modal-form-grid" style={{ gridTemplateColumns: '1fr', margin: 0 }}>
              <label>
                Atau ketik teks kustom (nama panggilan, kode unit, dll)
                <input value={avatarSeed} onChange={(e) => setAvatarSeed(e.target.value)} placeholder="mis. Andi Saputra" />
              </label>
            </div>
            <button className="primary-link" type="button" style={{ width: 'fit-content' }} onClick={saveAvatar} disabled={isSavingAvatar}>
              {isSavingAvatar ? 'Menyimpan...' : 'Simpan Avatar'}
            </button>
          </div>
        </div>
      </section>

      <div className="content-grid">
        <section className="card">
          <CardHeader title="Profil Akun" meta={profile ? profile.role : 'memuat...'} />
          <div className="close-summary" style={{ margin: 18 }}>
            <div><span>Nama</span><strong>{profile?.nama ?? '-'}</strong></div>
            <div><span>Username</span><strong>{profile?.username ?? '-'}</strong></div>
            <div><span>Role</span><strong>{profile?.role ?? '-'}</strong></div>
            <div><span>Branch</span><strong>{branchName || '-'}</strong></div>
            <div>
              <span>Login Terakhir</span>
              <strong>{profile?.lastLoginAt ? new Date(profile.lastLoginAt).toLocaleString('id-ID') : '-'}</strong>
            </div>
          </div>
        </section>

        <section className="card">
          <CardHeader title="Ubah Password" meta="Keamanan akun" />
          <div style={{ padding: 18 }}>
            <div className="modal-form-grid" style={{ gridTemplateColumns: '1fr' }}>
              <label>
                Password Saat Ini
                <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </label>
              <label>
                Password Baru (min 6 karakter)
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </label>
              <label>
                Konfirmasi Password Baru
                <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </label>
            </div>
            <button className="primary-link" type="button" onClick={changePassword} disabled={isSaving}>
              {isSaving ? 'Menyimpan...' : 'Simpan Password'}
            </button>
          </div>
        </section>
      </div>
    </>
  );
};

const ModulePlaceholder = ({ route }: { route: RouteKey }) => {
  const moduleNotes: Record<RouteKey, string> = {
    dashboard: '',
    shift: '',
    'operator-status': '',
    rit: 'Input rit, tonase, status surat jalan, dan integrasi dengan shift aktif.',
    delay: 'Catat delay fleet-wide atau per unit dengan delay type dari master data.',
    maintenance: 'Pastikan satu record maintenance per unit per shift sesuai aturan ERD.',
    bbm: 'Input konsumsi BBM dan alokasi per unit untuk kontrol produktivitas.',
    approval: 'Review shift tertutup, approve/reject, dan siapkan audit trail.',
    reports: 'Dashboard KPI, rekap bulanan, dan export CSV/Excel.',
    analytic: 'Raw data harian: Target turunan input dasar vs Aktual operasional.',
    'daily-report': 'Matriks harian Aktual vs Target sebulan penuh (mirror sheet Site NPM).',
    master: 'Branch, unit, operator, material, pit, stockpile, delay type, dan target.',
    settings: 'Konfigurasi branch, role, dan preferensi sistem.',
  };

  return (
    <>
      <PageHeader title={routeLabels[route]} description={moduleNotes[route]} />
      <section className="card empty-module">
        <strong>{routeLabels[route]} siap dikembangkan</strong>
        <p>Route dan layout sudah tersedia. Langkah berikutnya adalah menambahkan schema, service API, dan form/table sesuai prioritas modul.</p>
      </section>
    </>
  );
};

const PageHeader = ({ title, description, action }: { title: string; description: string; action?: JSX.Element }) => (
  <div className="page-header">
    <div>
      <h2>{title}</h2>
      <p>{description}</p>
    </div>
    {action ? <div>{action}</div> : null}
  </div>
);

const CardHeader = ({ title, meta }: { title: string; meta: string }) => (
  <div className="card-header">
    <strong>{title}</strong>
    <span>{meta}</span>
  </div>
);

const StatusBadge = ({ label }: { label: ShiftStatus | string }) => {
  const normalized = label.toLowerCase();
  const className = normalized === 'approved' ? 'approved' : normalized === 'open' ? 'open' : normalized === 'rejected' ? 'rejected' : 'pending';
  return <span className={`status-badge ${className}`}>{toTitleCase(label)}</span>;
};

// Label tipe shift. pagi/malam punya label baku; tipe kustom dari master di-Title-case.
const formatShiftType = (tipe: string) => {
  if (tipe === 'pagi') return 'Shift Pagi';
  if (tipe === 'malam') return 'Shift Malam';
  return tipe ? toTitleCase(tipe) : '-';
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(`${value}T00:00:00`));

const formatNumber = (value: number) => new Intl.NumberFormat('id-ID').format(value);

const toTitleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

export default App;
