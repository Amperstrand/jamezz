import { describe, expect, it } from "vitest";
import { JAMEZZ_ADAPTER, resolveChain, validateAdapter } from "../src/adapter.js";
import { JamezzAdapterEngine } from "../src/adapter-engine.js";
import { fakeJamezz } from "./jamezz-fake.js";
import { sent } from "./transport-fake.js";
import { burgermeisterTable } from "../src/client.js";

describe("declarative adapter spec", () => {
  it("validates structurally", () => {
    expect(validateAdapter(JAMEZZ_ADAPTER)).toEqual([]);
  });

  it("declares the exact wire the fake pins (conformance)", async () => {
    const { fetchImpl, requests } = fakeJamezz();
    const client = new (await import("../src/client.js")).JamezzClient({ fetchImpl });
    const table = burgermeisterTable();
    await client.venue(table);
    await client.menu(table);
    await client.openCart(table);

    for (const endpoint of ["salesarea-fetch", "data-fetch-v2", "shopping-cart", "/v5/qr/"]) {
      expect(sent(requests, endpoint), `fake saw ${endpoint}`).toBeDefined();
    }
    const declared = [
      ...Object.values(JAMEZZ_ADAPTER.endpoints).map((e) => e.path),
      JAMEZZ_ADAPTER.auth.bootstrap.path,
    ].map((template) => template.replace("/{mid}", ""));
    for (const request of requests) {
      const path = new URL(request.url).pathname;
      if (path.startsWith("/v5")) {
        expect(declared.some((prefix) => path.startsWith(prefix)), `wire path ${path} is declared`).toBe(true);
      }
    }
  });

  it("checkoutUrl fallback chain keeps platform precedence (drift fact #7-q4)", () => {
    const everywhere = {
      data: { paymentData: { transaction: { paymentURL: "https://nested" } }, paymentUrl: "https://legacy-data", checkoutUrl: "https://legacy-checkout" },
      paymentUrl: "https://legacy-top",
    };
    expect(resolveChain(everywhere, JAMEZZ_ADAPTER.fieldMaps.checkoutUrl)?.value).toBe("https://nested");

    const legacyOnly = { data: { paymentUrl: "https://legacy-data" } };
    expect(resolveChain(legacyOnly, JAMEZZ_ADAPTER.fieldMaps.checkoutUrl)?.value).toBe("https://legacy-data");

    const topLevelOnly = { paymentUrl: "https://legacy-top" };
    expect(resolveChain(topLevelOnly, JAMEZZ_ADAPTER.fieldMaps.checkoutUrl)?.value).toBe("https://legacy-top");

    expect(resolveChain({}, JAMEZZ_ADAPTER.fieldMaps.checkoutUrl)).toBeNull();
  });

  it("cart uuid resolves nested-first", () => {
    expect(resolveChain({ data: { uuid: "nested" }, uuid: "top" }, JAMEZZ_ADAPTER.fieldMaps.cartUuid)?.value).toBe("nested");
    expect(resolveChain({ uuid: "top" }, JAMEZZ_ADAPTER.fieldMaps.cartUuid)?.value).toBe("top");
  });

  it("documents the drift facts issue #7 asked about", () => {
    const log = JAMEZZ_ADAPTER.driftLog.map((fact) => fact.fact).join(" ");
    expect(log).toContain("paymentData.transaction.paymentURL");
    expect(log).toContain("every order line needs its own uuid");
    expect(log).toContain("NUMBER ids");
    expect(log).toContain("V3 platform generation");
  });

  it("dry-run cannot reach mutating endpoints", () => {
    expect(JAMEZZ_ADAPTER.dryRun.forbidden).toContain("cartOpen");
    expect(JAMEZZ_ADAPTER.dryRun.forbidden).toContain("orderSubmit");
    for (const step of JAMEZZ_ADAPTER.dryRun.steps) {
      expect(JAMEZZ_ADAPTER.dryRun.forbidden).not.toContain(step);
    }
  });

  it("catalogs every PSP the corpus observed", () => {
    for (const psp of ["MOLLIE", "ADYEN", "CM", "PAYNL", "OMNIKASSA"]) {
      expect(JAMEZZ_ADAPTER.psps).toContain(psp);
    }
  });
});

describe("adapter-engine dry-run discipline (#26/#27)", () => {

  it("fetches venueConfig only when the steps select it", async () => {
    const { fetchImpl, requests } = fakeJamezz();
    const spec = { ...JAMEZZ_ADAPTER, dryRun: { ...JAMEZZ_ADAPTER.dryRun, steps: ["menuFetch"] as const } };
    const result = await new JamezzAdapterEngine(spec, fetchImpl).dryRun("8613S3X");
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.steps).toEqual(["menuFetch"]);
    }
    expect(sent(requests, "salesarea-fetch")).toBeUndefined();
    expect(sent(requests, "data-fetch-v2")).toBeDefined();
  });

  it("uses the injected transport, never global fetch (#26)", async () => {
    const calls: string[] = [];
    const countingFetch = (async (input: RequestInfo | URL) => {
      calls.push(String(input));
      return new Response("{}", { status: 200, headers: { "content-type": "application/json" } });
    }) as typeof fetch;
    const spec = { ...JAMEZZ_ADAPTER, dryRun: { ...JAMEZZ_ADAPTER.dryRun, steps: ["venueConfig"] as const } };
    const result = await new JamezzAdapterEngine(spec, countingFetch).dryRun("8613S3X");
    expect(result.ok).toBe(true);
    expect(calls.length).toBe(1);
  });

  it("refuses an endpoint that aliases a forbidden one (#27)", async () => {
    const { fetchImpl, requests } = fakeJamezz();
    const aliased = {
      ...JAMEZZ_ADAPTER,
      endpoints: {
        ...JAMEZZ_ADAPTER.endpoints,
        venueConfig: { ...JAMEZZ_ADAPTER.endpoints.venueConfig, method: "POST" as const, path: JAMEZZ_ADAPTER.endpoints.cartOpen.path },
      },
    };
    const result = await new JamezzAdapterEngine(aliased, fetchImpl).dryRun("8613S3X");
    expect(result).toEqual({ ok: false, reason: expect.stringContaining("aliases forbidden endpoint 'cartOpen'") });
    expect(requests.length).toBe(0);
  });

  it("validateAdapter flags aliased steps at spec time (#27)", () => {
    const aliased = {
      ...JAMEZZ_ADAPTER,
      endpoints: {
        ...JAMEZZ_ADAPTER.endpoints,
        venueConfig: { ...JAMEZZ_ADAPTER.endpoints.venueConfig, method: "POST" as const, path: JAMEZZ_ADAPTER.endpoints.orderSubmit.path },
      },
    };
    const problems = validateAdapter(aliased);
    expect(problems.some((p) => p.includes("aliases forbidden endpoint 'orderSubmit'"))).toBe(true);
  });

  it("orderStatus is templated by {orderId}, not {mid} (#26)", () => {
    expect(JAMEZZ_ADAPTER.endpoints.orderStatus.path).toContain("{orderId}");
    expect(JAMEZZ_ADAPTER.endpoints.orderStatus.path).not.toContain("{mid}");
    expect(validateAdapter(JAMEZZ_ADAPTER)).toEqual([]);
  });

  it("rejects a spec whose steps select nothing", async () => {
    const { fetchImpl } = fakeJamezz();
    const spec = { ...JAMEZZ_ADAPTER, dryRun: { ...JAMEZZ_ADAPTER.dryRun, steps: [] as const } };
    const result = await new JamezzAdapterEngine(spec, fetchImpl).dryRun("8613S3X");
    expect(result).toEqual({ ok: false, reason: "dryRun.steps selects no reads" });
  });
});
