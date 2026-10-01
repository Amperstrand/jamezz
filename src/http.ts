export const JAMEZZ_ORIGIN = "https://qrv5.jamezz.app";
export const USER_AGENT = "jamezz/0.1";

export interface JsonResult<T> {
  readonly ok: true;
  readonly value: T;
  readonly cookie: string | null;
}

export interface JsonFailure {
  readonly ok: false;
  readonly status: number;
  readonly body: string;
}

export type FetchJsonResult<T> = JsonResult<T> | JsonFailure;

export function sessionHeaders(table: string, cookie: string | null): Record<string, string> {
  return {
    "user-agent": USER_AGENT,
    accept: "application/json",
    "session-mid": table,
    "session-return-path": `${JAMEZZ_ORIGIN}/v5/qr/${table}/return`,
    "session-locale": "en",
    ...(cookie === null ? {} : { cookie }),
  };
}

export function cookieHeader(response: Response): string | null {
  const cookies = response.headers.getSetCookie().map((entry) => entry.split(";")[0]).filter(Boolean);
  return cookies.length > 0 ? cookies.join("; ") : null;
}

export async function fetchJson<T>(
  url: string,
  init: RequestInit,
  fetchImpl: typeof fetch = fetch,
): Promise<FetchJsonResult<T>> {
  const response = await fetchImpl(url, init);
  const cookie = cookieHeader(response);
  if (!response.ok) {
    return { ok: false, status: response.status, body: (await response.text()).slice(0, 500) };
  }
  return { ok: true, value: (await response.json()) as T, cookie };
}
