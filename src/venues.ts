import type { TableMid } from "./types.js";

export interface KnownTable {
  readonly mid: TableMid;
  readonly name: string;
  readonly address: string;
  readonly note: string;
}

export interface UnmappedLocation {
  readonly name: string;
  readonly address: string;
  readonly status: "open" | "coming-soon";
}

/** Tables whose QR was photographed. Add a row only after reading the code. */
export const KNOWN_TABLES = [
  {
    mid: "8613S3X" as TableMid,
    name: "Burgermeister Mehringdamm (Tafel 1)",
    address: "Mehringdamm 39, 10961 Berlin",
    note: "Only mapped table QR as of 2026-09-30.",
  },
] as const satisfies readonly KnownTable[];

/** Public street addresses. QR mids are unknown until someone photographs the table. */
export const UNMAPPED_LOCATIONS = [
  { name: "Schlesisches Tor", address: "Oberbaumstraße 8, 10997 Berlin", status: "open" },
  { name: "Kottbusser Tor", address: "Skalitzer Straße 136, 10999 Berlin", status: "open" },
  { name: "Bahnhof Zoo", address: "Joachimsthaler Straße 1-4, 10623 Berlin", status: "open" },
  { name: "Eberswalder", address: "Schönhauser Allee 45, 10435 Berlin", status: "open" },
  { name: "Konstanzer", address: "Konstanzer Straße 1, 10707 Berlin", status: "open" },
  { name: "Alexanderplatz", address: "Dircksenstraße 113, 10178 Berlin", status: "open" },
  { name: "Warschauer Straße", address: "Warschauer Straße 65, 10243 Berlin", status: "open" },
  { name: "Mehringdamm", address: "Mehringdamm 39, 10961 Berlin", status: "open" },
  { name: "Schloßstraße", address: "Schloßstraße 117, 12163 Berlin", status: "open" },
  { name: "Hermannplatz", address: "Hasenheide 113, 10967 Berlin", status: "open" },
  { name: "Gropiusstadt", address: "Johannisthaler Chaussee 317, 12351 Berlin", status: "open" },
  { name: "Leopoldplatz", address: "Müllerstraße 28, 13353 Berlin", status: "open" },
  { name: "Akazienstraße", address: "Grunewaldstraße 118, 10823 Berlin", status: "open" },
  { name: "Potsdamer Platz", address: "Potsdamer Platz, 10785 Berlin", status: "open" },
  { name: "Zehlendorf Eiche", address: "Berlin", status: "open" },
  { name: "Uber Arena", address: "Berlin", status: "open" },
  { name: "Friedrichstraße", address: "Friedrichstraße 141-142, 10117 Berlin", status: "coming-soon" },
  { name: "Checkpoint Charlie", address: "Berlin", status: "coming-soon" },
] as const satisfies readonly UnmappedLocation[];

export function knownTable(mid: string): KnownTable | undefined {
  return KNOWN_TABLES.find((table) => table.mid === mid);
}
