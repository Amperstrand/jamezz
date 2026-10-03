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
      "3500EUN",
      "40306FP",
      "412FBF",
      "41853R",
      "423U5F",
      "4481969",
      "471X1A",
      "472S8X",
      "475TXS",
      "4771UEG",
      "477FY3",
      "47811U",
      "479C5N",
      "480GFN",
      "481EF9",
      "482WSP",
      "483S4C",
      "484ZS8",
      "485RTW",
      "4868RD",
      "488QYG",
      "5449JAA",
      "5555VVY",
      "6746ST3",
      "7396EHR",
      "7745CED",
      "81476E9",
      "8924NWV",
      "9511X1R",
      "9512JZC",
      "73819BK",
      "7384ZPR",
      "8316ADD",
      "8810PKE",
      "6905NCW",
      "59357VD",
      "8823T2W",
      "7775CMQ",
      "2578ZD4",
      "4249H44",
      "1116SDA",
      "4486ZZK",
      "6275KFA",
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
