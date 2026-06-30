/**
 * API client — typed fetch wrapper for the Hermes Dashboard backend.
 * All endpoints are proxied via next.config.js rewrites → /api/* goes to backend.
 */

const API_BASE = '/api';

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!res.ok) {
    let msg = `HTTP ${res.status}`;
    try {
      const body = await res.json();
      msg = body.detail || body.message || msg;
    } catch {
      // non-JSON error
    }
    throw new ApiError(res.status, msg);
  }

  // 204 No Content
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  // Knowledge
  searchNotes: (q: string, limit = 20) =>
    request<SearchResult[]>(`/knowledge/search?q=${encodeURIComponent(q)}&limit=${limit}`),
  getNote: (id: string) =>
    request<NoteDetail>(`/knowledge/notes/${id}`),
  getTags: () =>
    request<Tag[]>(`/knowledge/tags`),
  getFolders: () =>
    request<Folder[]>(`/knowledge/folders`),
  getGraph: () =>
    request<GraphData>(`/knowledge/graph`),

  // Skills
  getSkills: () =>
    request<Skill[]>(`/skills`),
  getSkillsGrouped: () =>
    request<SkillGroup[]>(`/skills/grouped`),
  getSkill: (name: string) =>
    request<SkillDetail>(`/skills/${name}`),
  saveSkill: (name: string, content: string) =>
    request<{ success: boolean }>(`/skills/${name}/save`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    }),

  // Cron
  getCrons: () =>
    request<CronJob[]>(`/crons`),
  getCronOutput: (id: string) =>
    request<CronOutput>(`/crons/${id}/output`),

  // Sessions
  getSessions: () =>
    request<Session[]>(`/sessions`),
  getSessionMessages: (id: string) =>
    request<SessionMessage[]>(`/sessions/${id}/messages`),

  // Auth
  whoami: () =>
    request<User>(`/auth/whoami`),
  login: (ip: string) =>
    request<{ success: boolean; user: User }>(`/auth/login`, {
      method: 'POST',
      body: JSON.stringify({ ip }),
    }),
  logout: () =>
    request<{ success: boolean }>(`/auth/logout`, { method: 'POST' }),

  // System
  health: () =>
    request<HealthStatus>(`/health`),
  status: () =>
    request<SystemStatus>(`/status`),
};

// ─── Types ───────────────────────────────────────────────

export interface SearchResult {
  id: string;
  title: string;
  snippet: string;
  path: string;
  tags: string[];
  score: number;
}

export interface NoteDetail {
  id: string;
  title: string;
  content: string;
  path: string;
  tags: string[];
  folder: string;
  links: string[];
  modified: string;
}

export interface Tag {
  name: string;
  count: number;
}

export interface Folder {
  name: string;
  count: number;
  path: string;
}

export interface GraphData {
  nodes: { id: string; title: string; tags: string[]; folder: string }[];
  links: { source: string; target: string }[];
}

export interface Skill {
  name: string;
  description: string;
  category: string;
  tags: string[];
}

export interface SkillGroup {
  category: string;
  skills: Skill[];
}

export interface SkillDetail {
  name: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
}

export interface CronJob {
  id: string;
  name: string;
  schedule: string;
  prompt: string;
  status: string;
  last_run: string | null;
  next_run: string | null;
}

export interface CronOutput {
  id: string;
  output: string;
  timestamp: string;
}

export interface Session {
  id: string;
  title: string;
  source: string;
  when: string;
  messages: number;
}

export interface SessionMessage {
  id: number;
  role: 'user' | 'assistant' | 'tool';
  content: string;
  timestamp: string;
}

export interface User {
  id: string;
  name: string;
  ip: string;
  channels: string[];
}

export interface HealthStatus {
  status: 'ok' | 'degraded' | 'down';
  database: 'ok' | 'down';
  version: string;
}

export interface SystemStatus {
  platform: string;
  uptime: string;
  active_sessions: number;
  skills_count: number;
  cron_count: number;
}