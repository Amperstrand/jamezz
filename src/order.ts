import { JAMEZZ_ORIGIN } from "./http.js";
import { attestationDigest } from "./attestation.js";
import type { CartLine, Fulfillment, OrderDraft, PreparedOrder, TableMid } from "./types.js";

export const ORDER_ENDPOINT = `${JAMEZZ_ORIGIN}/v5_2/kiosk/order`;

const FULFILLMENT_VALUE = {
  "eat-in": 1,
  "take-away": 2,
} as const;

export function cartTotal(lines: readonly CartLine[]): number {
  return lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
}

export function buildOrderBody(draft: OrderDraft): Readonly<Record<string, unknown>> {
  const items = draft.lines.map((line) => ({
    uuid: crypto.randomUUID(),
    count: line.quantity,
    added_origin: "MENU",
    note: "",
    sendToApi: true,
    type: 0,
    article: { id: line.productId, name: line.name, price: line.unitPrice },
    extraOrderArticles: [],
    orderOptionGroups: line.optionProductIds.map((optionId) => ({
      orderArticles: [
        {
          uuid: crypto.randomUUID(),
          count: 1,
          article: { id: optionId },
          extraOrderArticles: [],
          orderOptionGroups: [],
        },
      ],
    })),
  }));
  const total = cartTotal(draft.lines);
  return {
    items,
    orderCustomFields: {
      OrderMode: { customFieldName: "OrderMode", value: FULFILLMENT_VALUE[draft.fulfillment] },
      email: { customFieldName: "email", value: draft.email },
    },
    shoppingCart: {
      orderArticles: items,
      totalAmount: total,
      tipAmount: 0,
      deliveryFee: 0,
      transactionFee: 0,
      serviceFee: 0,
      smallOrderFee: 0,
    },
    returnUrl: `${JAMEZZ_ORIGIN}/v5/qr/${draft.table}/return`,
    selectedLanguage: "en",
    payMethod: draft.payMethod,
    payProvider: "MOLLIE",
    unique_shopping_cart_uuid: draft.cartUuid,
    shopping_cart_uuid: draft.cartUuid,
    session_mid: draft.table,
    session_return_path: `${JAMEZZ_ORIGIN}/v5/qr/${draft.table}/return`,
  };
}

export function prepareOrder(draft: OrderDraft, currency: string): PreparedOrder {
  return {
    draft,
    total: cartTotal(draft.lines),
    currency,
    endpoint: ORDER_ENDPOINT,
    body: buildOrderBody(draft),
    ...(draft.attestation === undefined
      ? {}
      : { attestation: attestationDigest(draft.attestation) }),
  };
}

export function assertOwnEmail(email: string): string {
  const trimmed = email.trim();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
    throw new Error("email must be an address you control");
  }
  return trimmed;
}

export function draftFromLines(input: {
  readonly table: TableMid;
  readonly lines: readonly CartLine[];
  readonly fulfillment: Fulfillment;
  readonly email: string;
  readonly cartUuid: string;
  readonly attestation?: OrderDraft["attestation"];
}): OrderDraft {
  if (input.lines.length === 0) throw new Error("order needs at least one line");
  return {
    table: input.table,
    lines: input.lines,
    fulfillment: input.fulfillment,
    email: assertOwnEmail(input.email),
    cartUuid: input.cartUuid,
    payMethod: "creditcard",
    ...(input.attestation === undefined ? {} : { attestation: input.attestation }),
  };
}
