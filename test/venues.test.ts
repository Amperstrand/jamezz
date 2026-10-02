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
      "5664DQG",
      "4239RHK",
      "7774HRA",
      "326HS2",
      "7378ZVM",
      "1881RKN",
      "87674F",
      "476WWU",
      "81497N3",
      "2029G5T",
      "8570ZSY",
      "8402YDM",
      "6395VGP",
      "5750FMD",
      "56699YH",
      "7229MSB",
      "5779SPH",
      "6983CS7",
    ]);
    expect(knownTable("8613S3X")?.address).toContain("Mehringdamm");
    expect(knownTable("8329DHW")?.name).toContain("Limoncello");
    expect(knownTable("7991NQZ")?.address).toContain("Scherpenheuvel");
    expect(knownTable("84608JJ")?.note).toContain("SEK");
    expect(knownTable("56699YH")?.note).toContain("OMNIKASSA");
    expect(knownTable("4239RHK")?.note).toContain("PAYNL");
    expect(knownTable("NOPE")).toBeUndefined();
  });

  it("keeps unmapped locations free of invented mids", () => {
    expect(UNMAPPED_LOCATIONS.length).toBeGreaterThan(10);
    expect(UNMAPPED_LOCATIONS.some((location) => location.name === "Mehringdamm")).toBe(true);
    expect(JSON.stringify(UNMAPPED_LOCATIONS)).not.toMatch(/[0-9]{3,}[A-Z]{3}/);
  });
});
