#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { JamezzAdapterEngine } from "./adapter-engine.js";
import { JAMEZZ_ADAPTER, validateAdapter } from "./adapter.js";
import { JamezzClient } from "./client.js";
import { tableMid, type Menu, type Venue } from "./types.js";
import { KNOWN_TABLES } from "./venues.js";

/**
 * Read-only CLI: `jamezz tables`, `jamezz venue <mid>`, `jamezz menu <mid>`.
 * Deliberately no order command — preparing an order is a library call that
 * a person confirms; the payment boundary stays with the caller.
 */
export interface CliPorts {
  readonly out: (line: string) => void;
  readonly err: (line: string) => void;
  readonly fetchImpl?: typeof fetch;
}

const USAGE = `jamezz — read-only Jamezz table ordering

commands:
  tables            list mapped table QR codes
  venue <mid>       venue config for a table mid
  menu <mid>        menu for a table mid
  adapter-check <mid>  spec-driven dry-run: read venue+menu THROUGH the
                      declarative adapter, report field-path hits/misses.
                      Never opens carts or submits orders.

The mid is the code in the QR URL, e.g. 8613S3X (Burgermeister Mehringdamm).`;

function processPorts(): CliPorts {
  return {
    out: (line) => process.stdout.write(`${line}\n`),
    err: (line) => process.stderr.write(`${line}\n`),
  };
}

function printVenue(venue: Venue, out: (line: string) => void): void {
  out(`${venue.name}`);
  out(`  table:    ${venue.id}`);
  out(`  address:  ${venue.address ?? "unknown"}`);
  out(`  currency: ${venue.currency}`);
  out(`  pays via: ${venue.payProvider} hosted checkout`);
  out(`  online:   ${venue.orderingEnabled ? "yes" : "no"}`);
  out(`  payment:  ${venue.paymentEnabled ? "live (bridge)" : "menu-only"}`);
  out(`  url:      ${venue.website}`);
}

function printMenu(menu: Menu, out: (line: string) => void): void {
  out(`${menu.venueName} — ${menu.currency} (${menu.updatedAt})`);
  for (const category of menu.categories) {
    out(`${category.name}`);
    for (const item of category.items) {
      out(`  ${item.name}  ${item.price.toFixed(2)} ${item.currency}${item.available ? "" : "  (unavailable)"}`);
    }
  }
}

export async function runCli(
  argv: readonly string[],
  ports: CliPorts = processPorts(),
): Promise<0 | 1> {
  const [command, arg] = argv;
  if (command === undefined || command === "help" || command === "-h" || command === "--help") {
    ports.out(USAGE);
    return 0;
  }
  if (command === "tables") {
    for (const table of KNOWN_TABLES) {
      ports.out(`${table.mid}  ${table.name} — ${table.address}`);
    }
    return 0;
  }
  if (command === "adapter-check") {
    if (arg === undefined) {
      ports.err("adapter-check needs a table mid, e.g. 8613S3X");
      return 1;
    }
    let mid;
    try {
      mid = tableMid(arg);
    } catch {
      ports.err(`invalid table mid: ${arg}`);
      return 1;
    }
    const problems = validateAdapter(JAMEZZ_ADAPTER);
    if (problems.length > 0) {
      ports.err(`adapter spec invalid: ${problems.join("; ")}`);
      return 1;
    }
    const engine = new JamezzAdapterEngine(JAMEZZ_ADAPTER);
    const dry = await engine.dryRun(mid);
    if (!dry.ok) {
      ports.err(`adapter-check failed: ${dry.reason}`);
      return 1;
    }
    ports.out(`spec ${JAMEZZ_ADAPTER.platform}/${JAMEZZ_ADAPTER.generation}: dry-run ok (${dry.steps.join(" -> ")})`);
    for (const hit of dry.fieldHits) {
      ports.out(`  ${hit.path}${hit.viaFallback ? " (fallback)" : ""} = ${String(hit.value).slice(0, 60)}`);
    }
    for (const miss of dry.fieldMisses) ports.out(`  MISSING ${miss}`);
    return dry.fieldMisses.length === 0 ? 0 : 1;
  }
  if (command !== "venue" && command !== "menu") {
    ports.err(`unknown command: ${command}`);
    ports.err(USAGE);
    return 1;
  }
  if (arg === undefined) {
    ports.err(`${command} needs a table mid, e.g. 8613S3X`);
    return 1;
  }
  let mid;
  try {
    mid = tableMid(arg);
  } catch {
    ports.err(`invalid table mid: ${arg}`);
    return 1;
  }
  const client = new JamezzClient(ports.fetchImpl === undefined ? {} : { fetchImpl: ports.fetchImpl });
  try {
    if (command === "venue") {
      const venue = await client.venue(mid);
      if (venue === null) {
        ports.err(`no venue for ${mid}`);
        return 1;
      }
      printVenue(venue, ports.out);
      return 0;
    }
    const menu = await client.menu(mid);
    if (menu === null) {
      ports.err(`no menu for ${mid}`);
      return 1;
    }
    printMenu(menu, ports.out);
    return 0;
  } catch (error) {
    ports.err(error instanceof Error ? error.message : String(error));
    return 1;
  }
}

// npm installs the bin as a .bin symlink while Node realpaths the ESM
// entry — argv[1] must be realpathed before the URL compare or the CLI
// silently no-ops for real consumers (same bug class as the other
// Amperstrand platform clients; regression-tested in
// test/cli-invocation.test.ts).
function invokedAsScript(): boolean {
  if (process.argv[1] === undefined) return false;
  try {
    return import.meta.url === pathToFileURL(realpathSync(process.argv[1])).href;
  } catch {
    return false;
  }
}
if (invokedAsScript()) {
  process.exit(await runCli(process.argv.slice(2)));
}
