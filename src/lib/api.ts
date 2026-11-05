import {
  User,
  Advocate,
  CaseRecord,
  DocumentRecord,
  AssistantAnswer,
  ConsultationRequest,
  NotificationItem,
} from '../types';

const TOKEN_KEY = 'nextgen_justice_token';
const API_BASE = '/api';

export const tokenStore = {
  get: (): string | null => localStorage.getItem(TOKEN_KEY),
  set: (token: string): void => localStorage.setItem(TOKEN_KEY, token),
  clear: (): void => localStorage.removeItem(TOKEN_KEY),
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = tokenStore.get();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const data = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(data.message || `API error: ${res.status} ${res.statusText}`);
  }

  return data;
}

export const api = {
  // Auth
  auth: {
    login: async (email: string, password: string): Promise<{ success: boolean; token: string; user: User }> => {
      const res = await request<{ success: boolean; token: string; user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      tokenStore.set(res.token);
      return res;
    },
    register: async (data: Record<string, any>): Promise<{ success: boolean; token: string; user: User }> => {
      const res = await request<{ success: boolean; token: string; user: User }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });
      tokenStore.set(res.token);
      return res;
    },
    me: async (): Promise<{ success: boolean; user: User }> => {
      return request<{ success: boolean; user: User }>('/auth/me');
    },
    logout: (): void => {
      tokenStore.clear();
    },
  },

  // Profile
  profile: {
    get: async (): Promise<{ success: boolean; profile: User }> => {
      return request<{ success: boolean; profile: User }>('/profile');
    },
    update: async (updates: Partial<User>): Promise<{ success: boolean; profile: User; message: string }> => {
      return request<{ success: boolean; profile: User; message: string }>('/profile', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
  },

  // Advocates
  advocates: {
    list: async (params: Record<string, any> = {}): Promise<{ success: boolean; total: number; data: Advocate[] }> => {
      const query = new URLSearchParams();
      for (const [k, v] of Object.entries(params)) {
        if (v !== undefined && v !== null && v !== '') {
          query.set(k, String(v));
        }
      }
      return request<{ success: boolean; total: number; data: Advocate[] }>(`/advocates?${query.toString()}`);
    },
    get: async (id: string): Promise<{ success: boolean; data: Advocate }> => {
      return request<{ success: boolean; data: Advocate }>(`/advocates/${id}`);
    },
  },

  // Cases
  cases: {
    list: async (): Promise<{ success: boolean; total: number; data: CaseRecord[] }> => {
      return request<{ success: boolean; total: number; data: CaseRecord[] }>('/cases');
    },
    get: async (id: string): Promise<{ success: boolean; data: CaseRecord }> => {
      return request<{ success: boolean; data: CaseRecord }>(`/cases/${id}`);
    },
    create: async (data: {
      title: string;
      category: string;
      description: string;
      state: string;
      district: string;
      city: string;
      urgency?: string;
    }): Promise<{ success: boolean; data: CaseRecord }> => {
      return request<{ success: boolean; data: CaseRecord }>('/cases', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    update: async (id: string, updates: Partial<CaseRecord>): Promise<{ success: boolean; data: CaseRecord }> => {
      return request<{ success: boolean; data: CaseRecord }>(`/cases/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
    },
  },

  // Documents
  documents: {
    list: async (): Promise<{ success: boolean; data: DocumentRecord[] }> => {
      return request<{ success: boolean; data: DocumentRecord[] }>('/documents');
    },
    listForCase: async (caseId: string): Promise<{ success: boolean; data: DocumentRecord[] }> => {
      return request<{ success: boolean; data: DocumentRecord[] }>(`/cases/${caseId}/documents`);
    },
    upload: (
      caseId: string,
      file: File,
      onProgress?: (percent: number) => void
    ): Promise<{ success: boolean; data: DocumentRecord; message: string }> => {
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        const formData = new FormData();
        formData.append('file', file);

        xhr.open('POST', `${API_BASE}/cases/${caseId}/documents`);

        const token = tokenStore.get();
        if (token) {
          xhr.setRequestHeader('Authorization', `Bearer ${token}`);
        }

        if (xhr.upload && onProgress) {
          xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) {
              const percent = Math.round((e.loaded / e.total) * 100);
              onProgress(percent);
            }
          };
        }

        xhr.onload = () => {
          try {
            const data = JSON.parse(xhr.responseText);
            if (xhr.status >= 200 && xhr.status < 300) {
              resolve(data);
            } else {
              reject(new Error(data.message || 'Document upload failed.'));
            }
          } catch {
            reject(new Error('Invalid response from upload service.'));
          }
        };

        xhr.onerror = () => {
          reject(new Error('Network error during file upload. Check server connectivity.'));
        };

        xhr.send(formData);
      });
    },
    approveFacts: async (docId: string): Promise<{ success: boolean; message: string; case: CaseRecord }> => {
      return request<{ success: boolean; message: string; case: CaseRecord }>(`/documents/${docId}/approve-facts`, {
        method: 'POST',
      });
    },
    delete: async (docId: string): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>(`/documents/${docId}`, {
        method: 'DELETE',
      });
    },
    getDownloadUrl: (docId: string): string => {
      return `${API_BASE}/documents/${docId}/download`;
    },
  },

  // Assistant
  assistant: {
    askGeneral: async (question: string, language = 'en'): Promise<{ success: boolean; data: AssistantAnswer }> => {
      return request<{ success: boolean; data: AssistantAnswer }>('/assistant/general', {
        method: 'POST',
        body: JSON.stringify({ question, language }),
      });
    },
    askCase: async (
      question: string,
      options: { caseId?: string; documentId?: string; language?: string } = {}
    ): Promise<{ success: boolean; data: AssistantAnswer }> => {
      return request<{ success: boolean; data: AssistantAnswer }>('/assistant/case', {
        method: 'POST',
        body: JSON.stringify({ question, ...options }),
      });
    },
  },

  // Consultations
  consultations: {
    list: async (): Promise<{ success: boolean; data: ConsultationRequest[] }> => {
      return request<{ success: boolean; data: ConsultationRequest[] }>('/consultations');
    },
    request: async (data: {
      advocateId: string;
      caseId?: string;
      message: string;
      mode: string;
      preferredDate?: string;
    }): Promise<{ success: boolean; data: ConsultationRequest; message: string }> => {
      return request<{ success: boolean; data: ConsultationRequest; message: string }>('/consultations', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    updateStatus: async (
      id: string,
      status: string,
      responseNote?: string
    ): Promise<{ success: boolean; message: string; data: ConsultationRequest }> => {
      return request<{ success: boolean; message: string; data: ConsultationRequest }>(`/consultations/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status, responseNote }),
      });
    },
  },

  // Notifications
  notifications: {
    list: async (): Promise<{ success: boolean; data: NotificationItem[] }> => {
      return request<{ success: boolean; data: NotificationItem[] }>('/notifications');
    },
    markRead: async (id: string): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>(`/notifications/${id}/read`, { method: 'PUT' });
    },
    markAllRead: async (): Promise<{ success: boolean }> => {
      return request<{ success: boolean }>('/notifications/read-all', { method: 'PUT' });
    },
  },

  // Admin
  admin: {
    stats: async (): Promise<{ success: boolean; data: any }> => {
      return request<{ success: boolean; data: any }>('/admin/stats');
    },
    users: async (): Promise<{ success: boolean; data: any[] }> => {
      return request<{ success: boolean; data: any[] }>('/admin/users');
    },
    seedReset: async (): Promise<{ success: boolean; message: string }> => {
      return request<{ success: boolean; message: string }>('/admin/seed-reset', { method: 'POST' });
    },
  },

  // Health
  health: async (): Promise<any> => {
    return request<any>('/health');
  },
};
