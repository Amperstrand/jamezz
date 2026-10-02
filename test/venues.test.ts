import { describe, expect, it } from "vitest";
import { knownTable, KNOWN_TABLES, UNMAPPED_LOCATIONS } from "../src/venues.js";

describe("venue catalog", () => {
  it("maps only verified QR codes", () => {
    expect(KNOWN_TABLES.map((table) => table.mid)).toEqual([
      "8613S3X",
      "8329DHW",
      "5960PM3",
      "4577SVC",
      "6442UFX",
      "7540MAK",
      "8114MKM",
      "6399J53",
      "8325JY4",
      "7541HE2",
      "7991NQZ",
      "84608JJ",
      "487MVV",
      "489URT",
    ]);
    expect(knownTable("8613S3X")?.address).toContain("Mehringdamm");
    expect(knownTable("8329DHW")?.name).toContain("Limoncello");
    expect(knownTable("7991NQZ")?.address).toContain("Scherpenheuvel");
    expect(knownTable("84608JJ")?.note).toContain("SEK");
    expect(knownTable("NOPE")).toBeUndefined();
  });

  it("keeps unmapped locations free of invented mids", () => {
    expect(UNMAPPED_LOCATIONS.length).toBeGreaterThan(10);
    expect(UNMAPPED_LOCATIONS.some((location) => location.name === "Mehringdamm")).toBe(true);
    expect(JSON.stringify(UNMAPPED_LOCATIONS)).not.toMatch(/[0-9]{3,}[A-Z]{3}/);
  });
});
