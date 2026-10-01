import { describe, expect, it } from "vitest";
import { knownTable, KNOWN_TABLES, UNMAPPED_LOCATIONS } from "../src/venues.js";

describe("venue catalog", () => {
  it("maps only photographed QR codes", () => {
    expect(KNOWN_TABLES.map((table) => table.mid)).toEqual(["8613S3X"]);
    expect(knownTable("8613S3X")?.address).toContain("Mehringdamm");
    expect(knownTable("NOPE")).toBeUndefined();
  });

  it("keeps unmapped locations free of invented mids", () => {
    expect(UNMAPPED_LOCATIONS.length).toBeGreaterThan(10);
    expect(UNMAPPED_LOCATIONS.some((location) => location.name === "Mehringdamm")).toBe(true);
    expect(JSON.stringify(UNMAPPED_LOCATIONS)).not.toMatch(/[0-9]{3,}[A-Z]{3}/);
  });
});
