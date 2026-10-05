/**
 * Declarative platform adapter spec (issue #7 q1). The engine that drives a
 * venue is reviewed code; the venue's platform facts are DATA. Everything
 * this module exports is derived from live-verified wire behavior pinned by
 * the test fakes — see driftLog for the known platform revisions.
 */

export type HttpMethod = "GET" | "POST";

export interface EndpointTemplate {
  readonly method: HttpMethod;
  readonly path: string;
  readonly contentType?: "json" | "form-data";
  readonly query?: Readonly<Record<string, "mid" | "return-path">>;
  readonly body?: Readonly<Record<string, "mid" | "return-path" | "cart-uuid" | "session-only">>;
}

export interface FieldRule {
  readonly jsonPath: string;
  readonly required: boolean;
}

export interface FallbackRule extends FieldRule {
  readonly fallbacks: readonly string[];
}

export interface DriftFact {
  readonly since: string;
  readonly fact: string;
  readonly fields: readonly string[];
}

export interface AdapterSpec {
  readonly platform: string;
  readonly generation: string;
  readonly origin: string;
  readonly auth: {
    readonly kind: "laravel-session";
    readonly bootstrap: EndpointTemplate;
    readonly cookieNames: readonly string[];
    readonly requestHeaders: readonly string[];
  };
  readonly endpoints: {
    readonly venueConfig: EndpointTemplate;
    readonly menuFetch: EndpointTemplate;
    readonly cartOpen: EndpointTemplate;
    readonly orderSubmit: EndpointTemplate;
    readonly orderStatus: EndpointTemplate;
  };
  readonly fieldMaps: {
    readonly venueName: FieldRule;
    readonly currency: FieldRule;
    readonly payProvider: FieldRule;
    readonly orderingEnabled: FieldRule;
    readonly cartUuid: FallbackRule;
    readonly checkoutUrl: FallbackRule;
    readonly orderId: FallbackRule;
    readonly orderStatusGate: FieldRule;
  };
  readonly menu: {
    readonly transport: "session-delta";
    readonly categoriesJoin: readonly string[];
    readonly joinKeyTypes: Readonly<Record<string, "number">>;
    readonly priceZeroParents: string;
  };
  readonly order: {
    readonly bodyShape: "v2.0-nested-cart-uuid";
    readonly perLineUuids: true;
    readonly fulfillmentValues: Readonly<Record<string, number>>;
    readonly zeroedFees: readonly string[];
  };
  readonly psps: readonly string[];
  readonly dryRun: {
    readonly steps: readonly ("venueConfig" | "menuFetch")[];
    readonly forbidden: readonly ("cartOpen" | "orderSubmit" | "orderStatus")[];
  };
  readonly driftLog: readonly DriftFact[];
}

export const JAMEZZ_ADAPTER = {
  platform: "jamezz",
  generation: "v5.2",
  origin: "https://qrv5.jamezz.app",
  auth: {
    kind: "laravel-session",
    bootstrap: { method: "GET", path: "/v5/qr/{mid}" },
    cookieNames: ["jamezz_app_session", "XSRF-TOKEN"],
    requestHeaders: ["session-mid", "session-return-path", "session-locale"],
  },
  endpoints: {
    venueConfig: {
      method: "GET",
      path: "/v5_2/qr/salesarea-fetch",
      query: { session_mid: "mid", session_return_path: "return-path" },
    },
    menuFetch: { method: "GET", path: "/v5_2/qr/data-fetch-v2" },
    cartOpen: {
      method: "POST",
      path: "/v5_2/shopping-cart",
      contentType: "form-data",
      body: { session_mid: "mid", session_return_path: "return-path" },
    },
    orderSubmit: {
      method: "POST",
      path: "/v5_2/kiosk/order",
      contentType: "json",
      body: { session_mid: "mid", session_return_path: "return-path", unique_shopping_cart_uuid: "cart-uuid", shopping_cart_uuid: "cart-uuid" },
    },
    orderStatus: { method: "GET", path: "/v5_2/kiosk/order/{mid}" },
  },
  fieldMaps: {
    venueName: { jsonPath: "data.salesarea.systeemNaam", required: true },
    currency: { jsonPath: "data.salesarea.valuta", required: false },
    payProvider: { jsonPath: "data.salesarea.payProvider", required: false },
    orderingEnabled: { jsonPath: "data.salesarea.systemOnline", required: false },
    cartUuid: { jsonPath: "data.uuid", required: true, fallbacks: ["uuid"] },
    checkoutUrl: {
      jsonPath: "data.paymentData.transaction.paymentURL",
      required: true,
      fallbacks: ["data.paymentUrl", "data.checkoutUrl", "data.redirectUrl", "paymentUrl"],
    },
    orderId: { jsonPath: "data.orderId", required: true, fallbacks: ["data.id", "id"] },
    orderStatusGate: { jsonPath: "data.orderStatus", required: false },
  },
  menu: {
    transport: "session-delta",
    categoriesJoin: ["menukaarts", "menukaart_products", "products"],
    joinKeyTypes: { menukaart_products: "number" },
    priceZeroParents: "display price resolves from the '{name} 0,2l' sibling rows; some rows are genuinely 0",
  },
  order: {
    bodyShape: "v2.0-nested-cart-uuid",
    perLineUuids: true,
    fulfillmentValues: { "eat-in": 1, "take-away": 2 },
    zeroedFees: ["tipAmount", "deliveryFee", "transactionFee", "serviceFee", "smallOrderFee"],
  },
  psps: ["MOLLIE", "ADYEN", "CM", "PAYNL", "OMNIKASSA"],
  dryRun: {
    steps: ["venueConfig", "menuFetch"],
    forbidden: ["cartOpen", "orderSubmit", "orderStatus"],
  },
  driftLog: [
    {
      since: "v2.0 order API (jamezz#5)",
      fact: "checkout URL moved into nested paymentData.transaction.paymentURL; four legacy locations still occur per venue",
      fields: ["checkoutUrl fallback chain"],
    },
    {
      since: "v2.0 order API (jamezz#5)",
      fact: "cart uuid is nested (unique_shopping_cart_uuid AND shopping_cart_uuid both carry it) and every order line needs its own uuid",
      fields: ["orderSubmit.body", "perLineUuids"],
    },
    {
      since: "observed 2026-10 (jamezz#6 corpus)",
      fact: "menukaart_products join keys are NUMBER ids, not strings; string joins silently drop categories",
      fields: ["menu.joinKeyTypes"],
    },
    {
      since: "observed 2026-10 (venue 1116SDA)",
      fact: "a V3 platform generation exists in the wild; spec covers v5.2 — treat V3 venues as a separate generation",
      fields: ["generation"],
    },
  ],
} as const satisfies AdapterSpec;

export type SpecProblem = string;

/** Structural validation: a foreign adapter spec must pass every check before an engine consumes it. */
export function validateAdapter(spec: AdapterSpec): readonly SpecProblem[] {
  const problems: SpecProblem[] = [];
  if (!/^[a-z][a-z0-9-]*$/.test(spec.platform)) problems.push("platform: kebab-case id required");
  if (spec.auth.kind !== "laravel-session") problems.push("auth.kind: only laravel-session is specced");
  for (const [name, endpoint] of Object.entries(spec.endpoints)) {
    if (!endpoint.path.startsWith("/")) problems.push(`endpoints.${name}.path: must be origin-relative`);
    if (endpoint.path.includes("{") && !endpoint.path.includes("{mid}")) {
      problems.push(`endpoints.${name}.path: only {mid} templating is supported`);
    }
  }
  for (const [name, rule] of Object.entries(spec.fieldMaps)) {
    if (!rule.jsonPath.startsWith("data") && !rule.jsonPath.includes(".")) {
      problems.push(`fieldMaps.${name}.jsonPath: '${rule.jsonPath}' is not a dotted path`);
    }
    const all = [rule.jsonPath, ...("fallbacks" in rule ? rule.fallbacks : [])];
    if (new Set(all).size !== all.length) problems.push(`fieldMaps.${name}: duplicate paths in chain`);
  }
  if (spec.dryRun.forbidden.length === 0) problems.push("dryRun.forbidden: must name the mutating endpoints");
  const mutating = new Set(["cartOpen", "orderSubmit"]);
  for (const step of spec.dryRun.steps) {
    if (mutating.has(step) || (spec.dryRun.forbidden as readonly string[]).includes(step)) {
      problems.push(`dryRun.steps: ${step} is mutating and must not be a dry-run step`);
    }
  }
  return problems;
}

/** Resolve a dotted JSON path; undefined when any hop is absent. */
export function resolvePath(payload: unknown, jsonPath: string): unknown {
  return jsonPath.split(".").reduce<unknown>((node, key) => {
    if (node !== null && typeof node === "object" && key in (node as Record<string, unknown>)) {
      return (node as Record<string, unknown>)[key];
    }
    return undefined;
  }, payload);
}

/** First matching path in a fallback chain (spec order = platform precedence). */
export function resolveChain(
  payload: unknown,
  rule: FallbackRule,
): { value: unknown; path: string } | null {
  for (const path of [rule.jsonPath, ...rule.fallbacks]) {
    const value = resolvePath(payload, path);
    if (value !== undefined) return { value, path };
  }
  return null;
}
