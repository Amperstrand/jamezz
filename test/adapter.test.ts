import { describe, expect, it } from "vitest";
import { JAMEZZ_ADAPTER, resolveChain, validateAdapter } from "../src/adapter.js";
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
