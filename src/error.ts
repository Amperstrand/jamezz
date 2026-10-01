/**
 * Transport-level failure (network down, DNS, timeout). A thrown
 * JamezzError always means "we could not talk to the platform"; a null
 * return from a client method always means "the platform answered: absent".
 */
export type JamezzFailureReason = "network";

export class JamezzError extends Error {
  constructor(readonly reason: JamezzFailureReason, message: string) {
    super(message);
    this.name = "JamezzError";
  }
}

export function asTransportError(error: unknown): JamezzError {
  return new JamezzError("network", error instanceof Error ? error.message : String(error));
}

export function isTransportFailure(error: unknown): boolean {
  return error instanceof Error || typeof DOMException === "function" && error instanceof DOMException;
}
