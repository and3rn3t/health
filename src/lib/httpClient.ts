// Centralized HTTP client wrapper around fetch with base URL, timeout, and basic error handling.
// Reads base URL from window.__VITALSENSE_CONFIG__.api.baseUrl if available, otherwise falls back to origin-relative paths.
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface HttpClientOptions {
  baseUrl?: string;
  defaultTimeoutMs?: number;
  getAuthToken?: () => string | null | undefined;
}

export class HttpClient {
  private readonly baseUrl: string;
  private readonly defaultTimeoutMs: number;
  private readonly getAuthToken?: () => string | null | undefined;

  constructor(options?: HttpClientOptions) {
    const cfg = (typeof window !== 'undefined'
      ? (window as any).__VITALSENSE_CONFIG__
      : null) as
      | {
          api?: { baseUrl?: string };
        }
      | null;
    const cfgBase =
      (options?.baseUrl ??
        cfg?.api?.baseUrl ??
        (typeof window !== 'undefined' ? window.location.origin : '')) || '';
    this.baseUrl = cfgBase.replace(/\/+$/, '');
    this.defaultTimeoutMs = options?.defaultTimeoutMs ?? 10000;
    this.getAuthToken = options?.getAuthToken;
  }

  private withBase(url: string): string {
    if (!url) return this.baseUrl;
    if (/^https?:\/\//i.test(url)) return url;
    if (url.startsWith('/')) return `${this.baseUrl}${url}`;
    return `${this.baseUrl}/${url}`;
  }

  private applyTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const id = setTimeout(() => reject(new Error('request_timeout')), ms);
      promise
        .then((v) => {
          clearTimeout(id);
          resolve(v);
        })
        .catch((e) => {
          clearTimeout(id);
          reject(e);
        });
    });
  }

  async request<T = unknown>(
    path: string,
    init?: RequestInit & { timeoutMs?: number; method?: HttpMethod }
  ): Promise<T> {
    const url = this.withBase(path);
    const headers: Record<string, string> = {
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (!headers['content-type'] && init?.body) {
      headers['content-type'] = 'application/json';
    }
    const token = this.getAuthToken?.();
    if (token) headers['authorization'] = `Bearer ${token}`;

    const doFetch = fetch(url, {
      ...init,
      headers,
    }).then(async (res) => {
      if (!res.ok) {
        // Attempt to parse error payload for better context
        let errDetail: unknown;
        try {
          errDetail = await res.json();
        } catch {
          // ignore
        }
        const err = new Error(
          `http_${res.status}${
            typeof errDetail === 'object' && errDetail
              ? `:${JSON.stringify(errDetail)}`
              : ''
          }`
        );
        (err as any).status = res.status;
        throw err;
      }
      const ct = res.headers.get('content-type') || '';
      if (ct.includes('application/json')) {
        return (await res.json()) as T;
      }
      // Fallback to text, let caller parse if needed
      return (await res.text()) as unknown as T;
    });
    return this.applyTimeout(doFetch, init?.timeoutMs ?? this.defaultTimeoutMs);
  }

  get<T = unknown>(path: string, init?: RequestInit & { timeoutMs?: number }) {
    return this.request<T>(path, { ...init, method: 'GET' });
  }
  post<T = unknown>(
    path: string,
    body?: unknown,
    init?: RequestInit & { timeoutMs?: number }
  ) {
    return this.request<T>(path, {
      ...init,
      method: 'POST',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  put<T = unknown>(
    path: string,
    body?: unknown,
    init?: RequestInit & { timeoutMs?: number }
  ) {
    return this.request<T>(path, {
      ...init,
      method: 'PUT',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  patch<T = unknown>(
    path: string,
    body?: unknown,
    init?: RequestInit & { timeoutMs?: number }
  ) {
    return this.request<T>(path, {
      ...init,
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  }
  delete<T = unknown>(
    path: string,
    init?: RequestInit & { timeoutMs?: number }
  ) {
    return this.request<T>(path, { ...init, method: 'DELETE' });
  }
}

export const httpClient = new HttpClient();
