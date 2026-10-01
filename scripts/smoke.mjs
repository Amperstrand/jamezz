#!/usr/bin/env node
/**
 * Weekly smoke: read-only venue check for every mapped table.
 * Exit 1 when a table errors, throws, or disappears from salesarea-fetch.
 * Never opens a session for ordering, never persists cookies.
 */
import { JamezzClient, KNOWN_TABLES } from "../dist/index.js";

const client = new JamezzClient();
let failed = false;
for (const table of KNOWN_TABLES) {
  try {
    const venue = await client.venue(table.mid);
    if (venue === null) {
      console.error(`SMOKE FAIL ${table.mid}: salesarea-fetch answered but no venue`);
      failed = true;
    } else {
      console.log(`SMOKE OK ${table.mid}: ${venue.name} ${venue.currency} ordering=${venue.orderingEnabled}`);
    }
  } catch (error) {
    console.error(`SMOKE FAIL ${table.mid}: ${error instanceof Error ? error.message : String(error)}`);
    failed = true;
  }
}
process.exit(failed ? 1 : 0);
