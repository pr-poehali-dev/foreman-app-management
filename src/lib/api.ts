const AUTH_URL   = 'https://functions.poehali.dev/13707451-a5e0-45b6-a7e6-febd1cc14f49';
const API_URL    = 'https://functions.poehali.dev/6a443ab9-b2f7-4356-a130-8735a8ad1b9e';
const UPLOAD_URL = 'https://functions.poehali.dev/2207a271-e3a3-4f64-abcb-a4528276d907';

export function getSessionId(): string {
  return localStorage.getItem('session_id') || '';
}

function headers(extra?: Record<string, string>): Record<string, string> {
  return { 'Content-Type': 'application/json', 'X-Session-Id': getSessionId(), ...extra };
}

// ---- Types ----
export interface User { id: number; login: string; full_name: string; role: 'manager' | 'foreman'; phone?: string; is_active?: boolean }
export interface Obj { id: number; name: string; address: string; status: string; tag: string; progress: number; deadline: string; budget: number; foreman_id: number; foreman_name: string }
export interface TimesheetRow { id: number; worker_id: number; work_date: string; status: string; note?: string; full_name: string; login: string; object_id?: number }
export interface Doc { id: number; name: string; file_url: string; file_size: string; file_type: string; category: string; object_id: number; object_name: string; uploader: string; created_at: string }
export interface Photo { id: number; caption: string; photo_url: string; stage: string; object_id: number; object_name: string; uploader: string; created_at: string }
export interface Message { id: number; text: string; created_at: string; full_name: string; role: string; login: string }
export interface Stats { active_objects: number; foremans: number; on_site_today: number; documents: number; photos: number; messages: number; objects: Obj[] }

// ---- AUTH ----
export async function login(loginVal: string, password: string) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ login: loginVal, password }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка входа');
  localStorage.setItem('session_id', data.session_id);
  return data as { session_id: string; user: User };
}

export async function logout() {
  await fetch(AUTH_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ __action: 'logout' }),
  });
  localStorage.removeItem('session_id');
}

export async function getMe(): Promise<User | null> {
  const sid = getSessionId();
  if (!sid) return null;
  const res = await fetch(AUTH_URL, { method: 'GET', headers: headers() });
  if (!res.ok) return null;
  const data = await res.json();
  return data.user || null;
}

export async function registerForeman(payload: { login: string; password: string; full_name: string; phone?: string }) {
  const res = await fetch(AUTH_URL, {
    method: 'POST',
    headers: headers(),
    body: JSON.stringify({ __action: 'register', ...payload }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка регистрации');
  return data;
}

// ---- API core ----
async function call(path: string, method = 'GET', body?: object) {
  const opts: RequestInit = { method, headers: headers({ 'X-Api-Path': path }) };
  opts.body = JSON.stringify({ __path: path, ...(body || {}) });
  const res = await fetch(API_URL, opts);
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка');
  return data;
}

// ---- Objects ----
export const getObjects = (): Promise<Obj[]> => call('/objects');
export const createObject = (b: Partial<Obj>) => call('/objects', 'POST', b);
export const updateObject = (id: number, b: Partial<Obj>) => call(`/objects/${id}`, 'PUT', b);
export const deleteObject = (id: number) => call(`/objects/${id}`, 'DELETE');

// ---- Timesheet ----
export const getTimesheet = (month: string): Promise<TimesheetRow[]> => call('/timesheet', 'GET', { month });
export const setTimesheet = (b: object) => call('/timesheet', 'POST', b);

// ---- Documents ----
export const getDocuments = (object_id?: number): Promise<Doc[]> => call('/documents', 'GET', object_id ? { object_id } : {});
export const addDocument = (b: object) => call('/documents', 'POST', b);
export const deleteDocument = (id: number) => call(`/documents/${id}`, 'DELETE');

// ---- Photos ----
export const getPhotos = (object_id?: number): Promise<Photo[]> => call('/photos', 'GET', object_id ? { object_id } : {});
export const addPhoto = (b: object) => call('/photos', 'POST', b);

// ---- Team ----
export const getTeam = (): Promise<User[]> => call('/team');
export const updateTeamMember = (id: number, b: object) => call(`/team/${id}`, 'PUT', b);

// ---- Chat ----
export const getChat = (): Promise<Message[]> => call('/chat');
export const sendMessage = (text: string) => call('/chat', 'POST', { text });

// ---- Stats ----
export const getStats = (): Promise<Stats> => call('/stats');

// ---- Workers ----
export interface Worker {
  id: number; full_name: string; specialty?: string; phone?: string;
  object_id?: number; object_name?: string; is_active?: boolean; created_at?: string;
}
export interface WorkerTimesheetRow {
  id: number; worker_id: number; work_date: string; status: string;
  note?: string; full_name: string; specialty?: string; object_id?: number;
}

export const getWorkers = (object_id?: number): Promise<Worker[]> =>
  call('/workers', 'GET', object_id ? { object_id } : {});
export const createWorker = (b: Partial<Worker>) => call('/workers', 'POST', b);
export const updateWorker = (id: number, b: Partial<Worker>) => call(`/workers/${id}`, 'PUT', b);
export const deleteWorker = (id: number) => call(`/workers/${id}`, 'DELETE');

export const getWorkerTimesheet = (month: string, object_id?: number): Promise<WorkerTimesheetRow[]> =>
  call('/worker-timesheet', 'GET', { month, ...(object_id ? { object_id } : {}) });
export const setWorkerTimesheet = (b: object) => call('/worker-timesheet', 'POST', b);

// ---- Upload ----
export async function uploadFile(payload: {
  file_data: string;       // base64 (с data: префиксом или без)
  file_name: string;
  file_type: string;       // MIME type
  upload_type: 'document' | 'photo';
  object_id?: number;
  category?: string;
  caption?: string;
  stage?: string;
}) {
  const res = await fetch(UPLOAD_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Session-Id': getSessionId() },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Ошибка загрузки');
  return data;
}