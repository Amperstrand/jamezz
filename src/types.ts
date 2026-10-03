export type TableMid = string & { readonly __brand: "TableMid" };

export function tableMid(value: string): TableMid {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9]{4,16}$/.test(trimmed)) {
    throw new Error(`invalid table mid: ${value}`);
  }
  return trimmed as TableMid;
}

export interface VenueQuery {
  readonly search?: string;
}

export interface Venue {
  readonly id: TableMid;
  readonly name: string;
  readonly currency: string;
  readonly payProvider: string;
  readonly orderingEnabled: boolean;
  /** True only for venues wired to the bridge (real payment loop). Others are menu-read-only. */
  readonly paymentEnabled: boolean;
  readonly website: string;
  readonly address?: string;
}

export interface MenuItem {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly currency: string;
  readonly category: string;
  readonly available: boolean;
}

export interface MenuCategory {
  readonly name: string;
  readonly items: readonly MenuItem[];
}

export interface Menu {
  readonly venueId: TableMid;
  readonly venueName: string;
  readonly currency: string;
  readonly categories: readonly MenuCategory[];
  readonly updatedAt: string;
}

export interface CartLine {
  readonly productId: string;
  readonly name: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly optionProductIds: readonly string[];
}

export type Fulfillment = "eat-in" | "take-away";

/** Reference to a pinned trust set (NIP-51 kind 30000, id + content hash). */
export interface TrustSetPin {
  readonly setId: string;
  readonly contentHash: string;
}

/**
 * Platform-supplied attestation (issue #7). Opaque passthrough: this SDK
 * carries it and digests it, and never verifies it — the pin and the policy
 * are deployment properties of the platform layer. The proof shape is
 * platform-defined (LSAG ring today, plain schnorr if the ring is retired),
 * so everything except the optional pin travels as an open record.
 */
export interface OrderAttestation {
  readonly pin?: TrustSetPin;
  readonly [field: string]: unknown;
}

/**
 * Audit record derived from an OrderAttestation: sha256 over the canonical
 * JSON encoding of the attestation. Persist this, never the verdict —
 * verification lives above the SDK.
 */
export interface AttestationDigest {
  readonly algorithm: "sha256";
  readonly digest: string;
}

export interface OrderDraft {
  readonly table: TableMid;
  readonly lines: readonly CartLine[];
  readonly fulfillment: Fulfillment;
  readonly email: string;
  readonly cartUuid: string;
  readonly payMethod: "creditcard";
  readonly attestation?: OrderAttestation;
}

export interface PreparedOrder {
  readonly draft: OrderDraft;
  readonly total: number;
  readonly currency: string;
  readonly endpoint: string;
  readonly body: Readonly<Record<string, unknown>>;
  readonly attestation?: AttestationDigest;
}

export interface PaymentHandoff {
  readonly orderId: string;
  readonly checkoutUrl: string;
  readonly note: string;
  readonly attestation?: AttestationDigest;
}

export interface CashuEmailAccount {
  readonly host: "https://cashu.email";
  readonly address: string;
  readonly secretKeyHex: string;
}
