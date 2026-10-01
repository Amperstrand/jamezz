/**
 * Generic helpers for building a platform transport fake.
 * Reusable across venue APIs: the platform fake routes URLs, these helpers
 * normalize what a RequestInit carries so assertions read real shapes.
 */

export interface RecordedRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: Record<string, string>;
  readonly body: string | FormData | null;
}

export function headerRecord(init: RequestInit | undefined): Record<string, string> {
  const headers = init?.headers;
  if (headers === undefined) return {};
  if (headers instanceof Headers) {
    const record: Record<string, string> = {};
    for (const [key, value] of headers.entries()) record[key.toLowerCase()] = value;
    return record;
  }
  if (Array.isArray(headers)) {
    return Object.fromEntries(headers.map(([key, value]) => [key.toLowerCase(), value]));
  }
  return Object.fromEntries(
    Object.entries(headers).map(([key, value]) => [key.toLowerCase(), String(value)]),
  );
}

export function bodyOf(init: RequestInit | undefined): string | FormData | null {
  const body = init?.body;
  if (body === undefined || body === null) return null;
  if (typeof body === "string") return body;
  if (body instanceof FormData) return body;
  return "[unrecorded body]";
}

export function jsonResponse(body: unknown, headers: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "content-type": "application/json", ...headers },
  });
}

export function sent(requests: readonly RecordedRequest[], urlPart: string): RecordedRequest | undefined {
  return requests.find((request) => request.url.includes(urlPart));
}
