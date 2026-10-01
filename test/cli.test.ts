import { describe, expect, it } from "vitest";
import { runCli } from "../src/cli.js";
import { fakeJamezz } from "./jamezz-fake.js";

function ports(lines: string[], errors: string[]) {
  return {
    out: (line: string) => lines.push(line),
    err: (line: string) => errors.push(line),
  };
}

describe("runCli", () => {
  it("lists mapped tables", async () => {
    const lines: string[] = [];
    const errors: string[] = [];
    const code = await runCli(["tables"], ports(lines, errors));
    expect(code).toBe(0);
    expect(lines.join("\n")).toContain("8613S3X");
    expect(lines.join("\n")).toContain("Mehringdamm");
  });

  it("prints a venue and a menu through an injected transport", async () => {
    const { fetchImpl } = fakeJamezz();
    const venueLines: string[] = [];
    expect(await runCli(["venue", "8613S3X"], { ...ports(venueLines, []), fetchImpl })).toBe(0);
    expect(venueLines.join("\n")).toContain("MOLLIE hosted checkout");

    const menuLines: string[] = [];
    expect(await runCli(["menu", "8613S3X"], { ...ports(menuLines, []), fetchImpl })).toBe(0);
    expect(menuLines.join("\n")).toContain("Cheeseburger  6.40 EUR");
  });

  it("rejects bad input and transport failures with exit code 1", async () => {
    const bad: string[] = [];
    expect(await runCli(["venue", "!!"], ports([], bad))).toBe(1);
    expect(bad[0]).toContain("invalid table mid");

    const dead: typeof fetch = (async () => {
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    const netErr: string[] = [];
    expect(await runCli(["menu", "8613S3X"], { ...ports([], netErr), fetchImpl: dead })).toBe(1);
    expect(netErr[0]).toContain("fetch failed");
  });
});
