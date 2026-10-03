import { createHash } from "node:crypto";
import type { Fulfillment, TableMid, TrustSetPin } from "./types.js";

/**
 * Canonical order-intent encoder (issue #7). The platform and the exchange
 * sign THIS object by importing this encoder, never by re-implementing it.
 *
 * Byte layout (identical scheme to plugin-trust-ring prove.ts orderMessage):
 * the UTF-8 domain tag raw, then every field as uint32 big-endian byte
 * length + UTF-8 bytes, in the fixed order below. `orderIntentMessage`
 * returns sha256(preimage) — the bytes a signature covers.
 *
 * Field order: orderId, venueId, itemCount, then per item {menuItemId,
 * quantity, optionCount, option ids...}, fulfillment, total, currency,
 * emailHash, createdAt, expiresAt, pin.setId, pin.contentHash.
 * Counts and quantities are decimal strings through the same prefixing.
 *
 * `total` is a decimal string in ISO-4217 minor units taken from the
 * server's quote ("1440", never "14.40" and never client math).
 */
export const ORDER_INTENT_DOMAIN = "DROPSHOP-ORDER-INTENT/v1";

export interface OrderIntentItem {
  readonly menuItemId: string;
  readonly quantity: number;
  readonly options: readonly string[];
}

export interface OrderIntent {
  readonly orderId: string;
  readonly venueId: TableMid;
  readonly items: readonly OrderIntentItem[];
  readonly fulfillment: Fulfillment;
  readonly total: string;
  readonly currency: string;
  readonly emailHash: string;
  readonly createdAt: string;
  readonly expiresAt: string;
  readonly pin: TrustSetPin;
}

const TOTAL_PATTERN = /^[0-9]+$/;
const CURRENCY_PATTERN = /^[A-Z]{3}$/;
const SHA256_HEX_PATTERN = /^[0-9a-f]{64}$/;

function field(value: string, path: string): string {
  if (value === "") throw new Error(`order intent ${path} must not be empty`);
  return value;
}

function intentFields(intent: OrderIntent): string[] {
  if (intent.orderId === "") throw new Error("order intent orderId must not be empty");
  if (intent.items.length === 0) throw new Error("order intent needs at least one item");
  if (!TOTAL_PATTERN.test(intent.total)) {
    throw new Error(
      `order intent total must be a non-negative integer string in minor units, got "${intent.total}"`,
    );
  }
  if (!CURRENCY_PATTERN.test(intent.currency)) {
    throw new Error(`order intent currency must be ISO-4217 uppercase, got "${intent.currency}"`);
  }
  if (!SHA256_HEX_PATTERN.test(intent.emailHash)) {
    throw new Error("order intent emailHash must be a lowercase sha256 hex string");
  }
  for (const stamp of [intent.createdAt, intent.expiresAt]) {
    if (Number.isNaN(Date.parse(stamp))) {
      throw new Error(`order intent timestamps must be ISO-8601, got "${stamp}"`);
    }
  }

  const fields: string[] = [intent.orderId, intent.venueId, String(intent.items.length)];
  for (const [index, item] of intent.items.entries()) {
    if (!Number.isInteger(item.quantity) || item.quantity < 1) {
      throw new Error(`order intent items[${index}].quantity must be an integer >= 1`);
    }
    fields.push(
      field(item.menuItemId, `items[${index}].menuItemId`),
      String(item.quantity),
      String(item.options.length),
      ...item.options.map((optionId, optionIndex) =>
        field(optionId, `items[${index}].options[${optionIndex}]`),
      ),
    );
  }
  fields.push(
    intent.fulfillment,
    intent.total,
    intent.currency,
    intent.emailHash,
    intent.createdAt,
    intent.expiresAt,
    field(intent.pin.setId, "pin.setId"),
    field(intent.pin.contentHash, "pin.contentHash"),
  );
  return fields;
}

export function encodeOrderIntent(intent: OrderIntent): Uint8Array {
  const encoder = new TextEncoder();
  const parts: Uint8Array[] = [encoder.encode(ORDER_INTENT_DOMAIN)];
  for (const value of intentFields(intent)) {
    const encoded = encoder.encode(value);
    const prefix = new Uint8Array(4);
    new DataView(prefix.buffer).setUint32(0, encoded.length, false);
    parts.push(prefix, encoded);
  }
  const preimage = new Uint8Array(parts.reduce((length, part) => length + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    preimage.set(part, offset);
    offset += part.length;
  }
  return preimage;
}

export function orderIntentMessage(intent: OrderIntent): Uint8Array {
  return createHash("sha256").update(encodeOrderIntent(intent)).digest();
}
