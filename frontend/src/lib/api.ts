const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001';

export async function apiFetch(path: string, options: RequestInit = {}) {
  return fetch(`${API_URL}/api${path}`, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });
}
