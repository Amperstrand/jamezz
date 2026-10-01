import { describe, expect, it } from "vitest";
import { loginCodeFromText, openCashuEmailAccount, type Signer } from "../src/cashu-email.js";

const signer: Signer = {
  async generate() {
    return {
      secretKeyHex: "11".repeat(32),
      publicKeyHex: "22".repeat(32),
      address: "npub1example@cashu.email",
    };
  },
  async sign(_secret, nonce, createdAt) {
    return {
      id: "33".repeat(32),
      pubkey: "22".repeat(32),
      kind: 1,
      content: nonce,
      tags: [["challenge", nonce]],
      created_at: createdAt,
      sig: "44".repeat(64),
    };
  },
};

function jsonResponse(body: unknown, cookie?: string): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: {
      "content-type": "application/json",
      ...(cookie === undefined ? {} : { "set-cookie": cookie }),
    },
  });
}

describe("openCashuEmailAccount", () => {
  it("signs the challenge and keeps the session cookie", async () => {
    const calls: string[] = [];
    const fetchImpl: typeof fetch = async (input, init) => {
      const url = String(input);
      calls.push(`${init?.method ?? "GET"} ${url}`);
      if (url.endsWith("/api/auth/challenge")) return jsonResponse({ nonce: "abc" });
      return jsonResponse({ pubkey: "22".repeat(32) }, "__Host-session=session-token; Path=/; Secure; HttpOnly");
    };
    const opened = await openCashuEmailAccount(signer, fetchImpl);
    expect(opened.session.address).toBe("npub1example@cashu.email");
    expect(opened.session.cookie).toContain("__Host-session=session-token");
    expect(calls).toEqual([
      "POST https://cashu.email/api/auth/challenge",
      "POST https://cashu.email/api/auth/verify",
    ]);
  });
});

describe("loginCodeFromText", () => {
  it("returns the six-digit code and ignores shorter numbers", () => {
    expect(loginCodeFromText("Your Login Code is 123456. Ref 12.")).toBe("123456");
    expect(loginCodeFromText("no code here")).toBeNull();
  });
});
