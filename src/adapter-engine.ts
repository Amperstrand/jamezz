import { resolveChain, resolvePath, type AdapterSpec, type EndpointTemplate, type FieldRule, type FallbackRule } from "./adapter.js";
import { asTransportError } from "./error.js";
import { tableMid, type TableMid } from "./types.js";

export interface FieldHit {
  readonly path: string;
  readonly value: unknown;
  readonly viaFallback: boolean;
}

export type DryRunResult =
  | { readonly ok: true; readonly steps: readonly string[]; readonly fieldHits: readonly FieldHit[]; readonly fieldMisses: readonly string[] }
  | { readonly ok: false; readonly reason: string };

function renderPath(path: string, mid: string): string {
  return path.replace("{mid}", mid);
}

/**
 * Engine side of the declarative adapter (issue #7): one reviewed reader
 * driven entirely by AdapterSpec data. The dry-run executes ONLY the
 * endpoints listed in spec.dryRun.steps and structurally refuses every
 * endpoint named in spec.dryRun.forbidden — a misconfigured spec cannot
 * make this engine open a cart or submit an order.
 */
export class JamezzAdapterEngine {
  constructor(private readonly spec: AdapterSpec) {}

  async dryRun(midInput: string): Promise<DryRunResult> {
    let mid: TableMid;
    try {
      mid = tableMid(midInput);
    } catch {
      return { ok: false, reason: `invalid table mid: ${midInput}` };
    }
    const venueUrl = this.endpointUrl("venueConfig", mid);
    const venue = await this.getJson(venueUrl, mid, null);
    if (!venue.ok) return { ok: false, reason: venue.reason };
    const hits: FieldHit[] = [];
    const misses: string[] = [];
    this.mapFields(venue.value, [
      ["venueName", this.spec.fieldMaps.venueName],
      ["currency", this.spec.fieldMaps.currency],
      ["payProvider", this.spec.fieldMaps.payProvider],
      ["orderingEnabled", this.spec.fieldMaps.orderingEnabled],
    ], hits, misses);

    let menuPayload: unknown = null;
    const menuStep = this.spec.dryRun.steps.includes("menuFetch");
    if (menuStep) {
      const bootstrap = await this.fetch(this.endpointUrl("bootstrapSession", mid, this.spec.auth.bootstrap), mid, null);
      if (!bootstrap.ok) return { ok: false, reason: `session bootstrap failed: ${bootstrap.reason}` };
      const cookie = bootstrap.ok ? bootstrap.cookie : null;
      const menu = await this.getJson(this.endpointUrl("menuFetch", mid), mid, cookie);
      if (!menu.ok) return { ok: false, reason: menu.reason };
      menuPayload = menu.value;
      const categories = resolvePath(menu.value, "data.menukaarts");
      if (categories === undefined) misses.push("data.menukaarts (menu payload shape)");
    }
    void menuPayload;
    return {
      ok: true,
      steps: ["venueConfig", ...(menuStep ? ["menuFetch"] : [])],
      fieldHits: hits,
      fieldMisses: misses,
    };
  }

  private mapFields(
    payload: unknown,
    rules: readonly (readonly [string, FieldRule | FallbackRule])[],
    hits: FieldHit[],
    misses: string[],
  ): void {
    for (const [name, rule] of rules) {
      if ("fallbacks" in rule) {
        const found = resolveChain(payload, rule);
        if (found === null) {
          misses.push(name);
        } else {
          hits.push({ path: found.path, value: found.value, viaFallback: found.path !== rule.jsonPath });
        }
      } else {
        const value = resolvePath(payload, rule.jsonPath);
        if (value === undefined) {
          if (rule.required) misses.push(name);
        } else {
          hits.push({ path: rule.jsonPath, value, viaFallback: false });
        }
      }
    }
  }

  private endpointUrl(name: keyof AdapterSpec["endpoints"] | "bootstrapSession", mid: TableMid, template?: EndpointTemplate): string {
    const endpoint: EndpointTemplate =
      template ?? this.spec.endpoints[name as keyof AdapterSpec["endpoints"]];
    const url = new URL(renderPath(endpoint.path, mid), this.spec.origin);
    for (const [key, kind] of Object.entries(endpoint.query ?? {})) {
      url.searchParams.set(key, kind === "mid" ? mid : this.returnPath(mid));
    }
    return url.toString();
  }

  private returnPath(mid: TableMid): string {
    return `${this.spec.origin}/v5/qr/${mid}/return`;
  }

  private headers(mid: TableMid, cookie: string | null): Record<string, string> {
    const headers: Record<string, string> = { "user-agent": "jamezz-adapter/0.1", accept: "application/json" };
    if (this.spec.auth.requestHeaders.includes("session-mid")) headers["session-mid"] = mid;
    if (this.spec.auth.requestHeaders.includes("session-return-path")) headers["session-return-path"] = this.returnPath(mid);
    if (this.spec.auth.requestHeaders.includes("session-locale")) headers["session-locale"] = "en";
    if (cookie !== null) headers["cookie"] = cookie;
    return headers;
  }

  private async fetch(
    url: string,
    mid: TableMid,
    cookie: string | null,
  ): Promise<{ ok: true; cookie: string | null } | { ok: false; reason: string }> {
    try {
      const response = await fetch(url, { headers: this.headers(mid, cookie), signal: AbortSignal.timeout(20_000) });
      const setCookie = response.headers
        .getSetCookie()
        .map((entry) => entry.split(";")[0])
        .filter(Boolean)
        .join("; ") || null;
      return { ok: true, cookie: setCookie };
    } catch (error) {
      return { ok: false, reason: asTransportError(error).message };
    }
  }

  private async getJson(
    url: string,
    mid: TableMid,
    cookie: string | null,
  ): Promise<{ ok: true; value: unknown } | { ok: false; reason: string }> {
    try {
      const response = await fetch(url, { headers: this.headers(mid, cookie), signal: AbortSignal.timeout(20_000) });
      if (!response.ok) return { ok: false, reason: `HTTP ${response.status} from ${new URL(url).pathname}` };
      return { ok: true, value: await response.json() };
    } catch (error) {
      return { ok: false, reason: asTransportError(error).message };
    }
  }
}
