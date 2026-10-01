/**
 * Account bootstrap for https://cashu.email (same API as nomail.name).
 * Spec: https://cashu.email/llms.txt and https://cashu.email/llms-full.txt
 *
 * Receiving is free. The npub address exists on first login. This module
 * creates a key and a session. It does not send mail, so it does not need
 * a Cashu postage token. Keep the secret key in a 0600 file you own.
 */

export const CASHU_EMAIL_HOST = "https://cashu.email";

export interface NostrKeyPair {
  readonly secretKeyHex: string;
  readonly publicKeyHex: string;
  readonly address: string;
}

export interface SignedAuthEvent {
  readonly id: string;
  readonly pubkey: string;
  readonly kind: 1;
  readonly content: string;
  readonly tags: readonly [readonly ["challenge", string]];
  readonly created_at: number;
  readonly sig: string;
}

export interface CashuEmailSession {
  readonly host: typeof CASHU_EMAIL_HOST;
  readonly address: string;
  readonly cookie: string;
}

export interface Signer {
  generate(): Promise<NostrKeyPair>;
  sign(secretKeyHex: string, nonce: string, createdAt: number): Promise<SignedAuthEvent>;
}

export async function openCashuEmailAccount(
  signer: Signer,
  fetchImpl: typeof fetch = fetch,
): Promise<{ readonly keys: NostrKeyPair; readonly session: CashuEmailSession }> {
  const keys = await signer.generate();
  const challenge = await fetchImpl(`${CASHU_EMAIL_HOST}/api/auth/challenge`, { method: "POST" });
  if (!challenge.ok) throw new Error(`cashu.email challenge failed: ${challenge.status}`);
  const payload: unknown = await challenge.json();
  if (payload === null || typeof payload !== "object" || !("nonce" in payload) || typeof payload.nonce !== "string") {
    throw new Error("cashu.email challenge did not return a nonce");
  }
  const event = await signer.sign(keys.secretKeyHex, payload.nonce, Math.floor(Date.now() / 1000));
  const verify = await fetchImpl(`${CASHU_EMAIL_HOST}/api/auth/verify`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ event }),
  });
  if (!verify.ok) throw new Error(`cashu.email verify failed: ${verify.status}`);
  const cookie = verify.headers.getSetCookie().map((entry) => entry.split(";")[0]).filter(Boolean).join("; ");
  if (cookie === "") throw new Error("cashu.email did not set a session cookie");
  return {
    keys,
    session: { host: CASHU_EMAIL_HOST, address: keys.address, cookie },
  };
}

export function loginCodeFromText(text: string): string | null {
  const match = text.match(/\b(\d{6})\b/);
  return match?.[1] ?? null;
}
