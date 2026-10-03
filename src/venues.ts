import type { TableMid } from "./types.js";

export interface KnownTable {
  readonly mid: TableMid;
  readonly name: string;
  readonly address: string;
  readonly note: string;
  /** True when the bridge can take payment (Lightning → 2fiat → hosted checkout). */
  readonly paymentEnabled?: boolean;
}

export interface UnmappedLocation {
  readonly name: string;
  readonly address: string;
  readonly status: "open" | "coming-soon";
}

/**
 * Mapped tables: photographed QRs or mids verifiably published by the venue
 * itself (Google-indexed QR pages, venue websites). Every row was confirmed
 * by a live read: venue name, currency, and real menu prices. Never guess
 * or derive a mid.
 */
export const KNOWN_TABLES = [
  {
    mid: "8613S3X" as TableMid,
    name: "Burgermeister Mehringdamm (Tafel 1)",
    address: "Mehringdamm 39, 10961 Berlin",
    note: "Photographed table QR, 2026-09-30. MOLLIE checkout.",
    paymentEnabled: true,
  },
  {
    mid: "8329DHW" as TableMid,
    name: "Van der Valk Gent — Limoncello Take Away",
    address: "Akkerhage 10, 9000 Gent, Belgium",
    note: "Venue-published QR page (verified 2026-10-02: Pizza Margherita 20.50 EUR). ADYEN checkout.",
  },
  {
    mid: "5960PM3" as TableMid,
    name: "Van der Valk Gent — Roomservice Cocotte",
    address: "Akkerhage 10, 9000 Gent, Belgium",
    note: "Venue-published QR page (verified 2026-10-02: Whisky Sour 13.00 EUR). Room-charge mode, ADYEN.",
  },
  {
    mid: "4577SVC" as TableMid,
    name: "van der Valk Gilze-Tilburg — Toekan To Go",
    address: "Gilze-Tilburg, Netherlands",
    note: "Venue-published QR page (verified 2026-10-02: Burrata 13.25 EUR). ADYEN checkout.",
  },
  {
    mid: "6442UFX" as TableMid,
    name: "Summio Parc Heihaas — Webshop Snackbar",
    address: "Voorthuizerstraat 75, 3881 SE Putten, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Pizza Margherita 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "7540MAK" as TableMid,
    name: "Jumbo Koornneef Monster — Webshop",
    address: "Monster, Zuid-Holland, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Goat cheese salad 5.75 EUR). MOLLIE checkout.",
  },
  {
    mid: "8114MKM" as TableMid,
    name: "Søgaard Bryghus takeaway",
    address: "C.W. Obels Plads 1, 9000 Aalborg, Denmark",
    note: "Google-indexed QR page (verified 2026-10-02: Bun with butter 2GO 17.00 DKK). MOLLIE checkout. First DKK venue.",
  },
  {
    mid: "6399J53" as TableMid,
    name: "Jumbo Foodmarkt Koornneef Westland (Naaldwijk) — Webshop",
    address: "Naaldwijk, Zuid-Holland, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Breakfast deal 3.99 EUR). MOLLIE checkout.",
  },
  {
    mid: "8325JY4" as TableMid,
    name: "Dickenz — Webshop (QR Design)",
    address: "Scharendijke, Zeeland, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: frappuccino 5.95 EUR). MOLLIE checkout.",
  },
  {
    mid: "7541HE2" as TableMid,
    name: "Jumbo Koornneef Aan de Haven (Scheveningen) — Webshop",
    address: "Scheveningen, Den Haag, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Breakfast deal 3.99 EUR). MOLLIE checkout.",
  },
  {
    mid: "7991NQZ" as TableMid,
    name: "PAPAVESS — Webshop",
    address: "Mannenberg 228, 3270 Scherpenheuvel, Belgium",
    note: "Google-indexed QR page (verified 2026-10-02: Poke Bowl Medium 12.50 EUR, matches the venue's own menu PDF). MOLLIE checkout.",
  },
  {
    mid: "84608JJ" as TableMid,
    name: "Omami Ulricehamn — Webshop (Leading)",
    address: "Ulricehamn, Sweden",
    note: "Google-indexed QR page (verified 2026-10-02: Sushi Pop California Roll 169.00 SEK). MOLLIE checkout. First SEK venue.",
  },
  {
    mid: "487MVV" as TableMid,
    name: "Anne&Max Utrecht Domkwartier — Afhalen V5",
    address: "Utrecht Domkwartier, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "489URT" as TableMid,
    name: "Anne&Max Leidschendam — Webshop afhalen",
    address: "Liguster 62, 2262 Leidschendam, Netherlands",
    note: "Google-indexed jamezz.app/dl redirect page (verified 2026-10-02: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "5664DQG" as TableMid,
    name: "De Griekse Frituur O Geros — CATALOG",
    address: "Vennestraat 1, 3600 Genk, Belgium",
    note: "Google-indexed QR page (verified 2026-10-02: Normal Fries 5.90 EUR; menu cross-checked against the family venue's press coverage). CM checkout.",
  },
  {
    mid: "4239RHK" as TableMid,
    name: "ORCHIDEE THAI BV",
    address: "Almere, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Yam Khung Wunsen 18.00 EUR). PAYNL checkout.",
  },
  {
    mid: "7774HRA" as TableMid,
    name: "Mazzeltov Webshop",
    address: "De Stok 4, 4703 SZ Roosendaal, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Clubsandwich Chicken 18.00 EUR). MOLLIE checkout.",
  },
  {
    mid: "326HS2" as TableMid,
    name: "WIM FRIET — Webshop (Tafel 1)",
    address: "Dokter Jules Persynplein, 9185 Wachtebeke, Belgium",
    note: "Google-indexed QR page (verified 2026-10-02: Small Fries 3.55 EUR; venue's own site advertises Jamezz QR at every table). PAYNL checkout.",
  },
  {
    mid: "7378ZVM" as TableMid,
    name: "Omami Varberg — Webshop",
    address: "Varberg, Sweden",
    note: "Google-indexed QR page (verified 2026-10-02: Chicken Bibimbap 95.00 SEK). MOLLIE checkout.",
  },
  {
    mid: "1881RKN" as TableMid,
    name: "Il Mercato — Afhalen",
    address: "Netherlands (branch of the Papendrecht / Hendrik-ido Ambacht / Berkel en Rodenrijs chain, not identified in platform data)",
    note: "jamezz.app/dl links on the venue's indexed Jamezz session page (verified 2026-10-02: Panuozzo Tuscan 16.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "87674F" as TableMid,
    name: "Il Mercato — Bezorgen",
    address: "Netherlands (branch of the Papendrecht / Hendrik-ido Ambacht / Berkel en Rodenrijs chain, not identified in platform data)",
    note: "jamezz.app/dl link on the venue's indexed Jamezz session page (verified 2026-10-02: Panuozzo Tuscan 16.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "476WWU" as TableMid,
    name: "Anne&Max Amsterdam Zuid — Webshop afhalen V5",
    address: "Amsterdam Zuid, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "81497N3" as TableMid,
    name: "Anne&Max Eindhoven Strijp-S — Afhalen",
    address: "Eindhoven Strijp-S, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "2029G5T" as TableMid,
    name: "Schnitzel / Lunchkoning — Menukaart",
    address: "Tiel, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Luxury Sandwich Chefs Special 12.95 EUR; ordering offline at read time). CM checkout.",
  },
  {
    mid: "8570ZSY" as TableMid,
    name: "TasToe — Bedrijven",
    address: "Marktplein 14, 's-Gravenzande, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Basic Lunch Box 69.50 EUR; business-catering channel). MOLLIE checkout.",
  },
  {
    mid: "8402YDM" as TableMid,
    name: "Krakeel Hoogeveen — Vectron Webshop",
    address: "Hoogeveen, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: fries 2.40 EUR; POS named in the venue title). MOLLIE checkout.",
  },
  {
    mid: "6395VGP" as TableMid,
    name: "Friethuis Pruis — Webshop afhaal",
    address: "Netherlands (city not confirmed)",
    note: "Google-indexed QR page (verified 2026-10-02: family fries bag 2.25 EUR). MOLLIE checkout.",
  },
  {
    mid: "5750FMD" as TableMid,
    name: "Smokey Blinders — Webshop Afhalen",
    address: "Rapportstraat 3, 5504 BN Zeelst (Veldhoven), Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Tommy Shelby 13.95 EUR). CM checkout.",
  },
  {
    mid: "56699YH" as TableMid,
    name: "La Place Efteling — QR (Tafel 227)",
    address: "Efteling, Kaatsheuvel, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Oriental pastry platter for two 17.55 EUR; table QR, ordering offline at read time). OMNIKASSA checkout.",
  },
  {
    mid: "7229MSB" as TableMid,
    name: "Burger Bar Prinsengracht — QR boatmenu",
    address: "Prinsengracht, Amsterdam, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Pornstar Martini 12.95 EUR; table QR). MOLLIE checkout.",
  },
  {
    mid: "5779SPH" as TableMid,
    name: "Smakers — Twijnstraat & Oude Gracht",
    address: "Utrecht, Netherlands",
    note: "Google-indexed QR page (verified 2026-10-02: Fries 3.75 EUR; ordering offline at read time). CM checkout.",
  },
  {
    mid: "6983CS7" as TableMid,
    name: "Snackhoek — Webshop afhaal",
    address: "Netherlands (city not confirmed)",
    note: "Google-indexed QR page (verified 2026-10-02: Fries 2.90 EUR). MOLLIE checkout.",
  },
  {
    mid: "3500EUN" as TableMid,
    name: "Anne&Max Den Bosch — Afhalen V5",
    address: "Den Bosch, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). CM checkout.",
  },
  {
    mid: "40306FP" as TableMid,
    name: "Anne&Max Den Haag Hoytema — Afhalen V5",
    address: "Den Haag, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "412FBF" as TableMid,
    name: "Anne&Max Alkmaar — Bezorgen V5",
    address: "Alkmaar, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "41853R" as TableMid,
    name: "Anne&Max Bakkerstraat Arnhem — Bezorgen V5",
    address: "Arnhem, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Chia Acai Bowl 11.00 EUR (delivery menu)). MOLLIE checkout.",
  },
  {
    mid: "423U5F" as TableMid,
    name: "Anne&Max Eindhoven — Bezorgen V5",
    address: "Eindhoven, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Chia Acai Bowl 11.00 EUR (delivery menu)). MOLLIE checkout.",
  },
  {
    mid: "4481969" as TableMid,
    name: "Anne&Max Groningen — Afhalen V5",
    address: "Groningen, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "471X1A" as TableMid,
    name: "Anne&Max Alkmaar — Afhalen V5",
    address: "Alkmaar, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "472S8X" as TableMid,
    name: "Anne&Max Bakkerstraat Arnhem — Afhalen V5",
    address: "Arnhem, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "475TXS" as TableMid,
    name: "Anne&Max Amsterdam Zeeburg — Afhalen V5",
    address: "Amsterdam, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "4771UEG" as TableMid,
    name: "Anne&Max Delft — Afhalen V5",
    address: "Delft, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "477FY3" as TableMid,
    name: "Anne&Max Apeldoorn — Webshop afhalen",
    address: "Apeldoorn, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "47811U" as TableMid,
    name: "Anne&Max Breda Wilhelminastraat — Webshop afhalen",
    address: "Breda, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "479C5N" as TableMid,
    name: "Anne&Max Den Haag Fahrenheit — Afhalen V5",
    address: "Den Haag, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "480GFN" as TableMid,
    name: "Anne&Max Den Haag Fred — Afhalen V5",
    address: "Den Haag, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "481EF9" as TableMid,
    name: "Anne&Max Den Haag Kerkplein — Afhalen V5",
    address: "Den Haag, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "482WSP" as TableMid,
    name: "Anne&Max Eindhoven — Afhalen V5",
    address: "Eindhoven, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "483S4C" as TableMid,
    name: "Anne&Max Haarlem — Webshop afhalen",
    address: "Haarlem, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "484ZS8" as TableMid,
    name: "Anne&Max Leiden — Afhalen V5",
    address: "Leiden, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "485RTW" as TableMid,
    name: "Anne&Max Rotterdam — Webshop afhalen V5",
    address: "Rotterdam, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "4868RD" as TableMid,
    name: "Anne&Max Utrecht Burgemeester Reiger — Afhalen V5",
    address: "Utrecht, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "488QYG" as TableMid,
    name: "Anne&Max Zwolle — Afhalen V5",
    address: "Zwolle, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "5449JAA" as TableMid,
    name: "Anne&Max Oostenburg — Afhalen V5",
    address: "Amsterdam, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "5555VVY" as TableMid,
    name: "Anne&Max Tilburg — Webshop afhalen",
    address: "Tilburg, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "6746ST3" as TableMid,
    name: "Anne&Max Nijmegen — Webshop afhalen",
    address: "Nijmegen, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "7396EHR" as TableMid,
    name: "Anne&Max Breda Veemarktstraat — Webshop afhalen",
    address: "Breda, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Chia Acai Bowl 11.00 EUR). MOLLIE checkout.",
  },
  {
    mid: "7745CED" as TableMid,
    name: "Anne&Max Leeuwarden — Afhaal",
    address: "Leeuwarden, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "81476E9" as TableMid,
    name: "Anne&Max Arnhem Steenstraat — Afhalen",
    address: "Arnhem, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "8924NWV" as TableMid,
    name: "Anne&Max Maastricht — Webshop (take-away)",
    address: "Maastricht, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Pastrami Sandwich 12.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "9511X1R" as TableMid,
    name: "Anne&Max Eindhoven Strijp-S — Catering webshop",
    address: "Eindhoven, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Bottle of energy juice 15.00 EUR (catering menu)). MOLLIE checkout.",
  },
  {
    mid: "9512JZC" as TableMid,
    name: "Anne&Max Apeldoorn — Catering webshop",
    address: "Apeldoorn, Netherlands",
    note: "Venue-published webshop link on annemax.nl/vestigingen/ (verified 2026-10-03: Bottle of energy juice 15.00 EUR (catering menu)). MOLLIE checkout.",
  },
  {
    mid: "73819BK" as TableMid,
    name: "Omami Johanneberg — Webshop (Leading)",
    address: "Johanneberg, Jönköping, Sweden",
    note: "Venue-published link on omami.se (verified 2026-10-03: Sushi Pop California Roll 169.00 SEK). MOLLIE checkout.",
  },
  {
    mid: "7384ZPR" as TableMid,
    name: "Omami Brämhult — Webshop",
    address: "Brämhult, Borås, Sweden",
    note: "Venue-published link on omami.se (verified 2026-10-03: Sushi Pop California Roll 169.00 SEK). MOLLIE checkout.",
  },
  {
    mid: "8316ADD" as TableMid,
    name: "Omami Linne — Webshop",
    address: "Sweden (city not confirmed)",
    note: "Venue-published link on omami.se (verified 2026-10-03: Sushi Pop California Roll 169.00 SEK). MOLLIE checkout.",
  },
  {
    mid: "8810PKE" as TableMid,
    name: "Omami Central — Webshop (Leading)",
    address: "Sweden (city not confirmed)",
    note: "Venue-published link on omami.se (verified 2026-10-03: Salmon Poké 185.00 SEK). MOLLIE checkout.",
  },
  {
    mid: "6905NCW" as TableMid,
    name: "Klein Paramaribo — Afhaal",
    address: "Netherlands (city not confirmed)",
    note: "DuckDuckGo-indexed qrv5 page (verified 2026-10-03: Br. Bakkeljauw 8.15 EUR). MOLLIE checkout.",
  },
  {
    mid: "59357VD" as TableMid,
    name: "Eetcafé de Maaspoort V5",
    address: "Grave, Netherlands",
    note: "Venue-published link on maaspoort-grave.nl (verified 2026-10-03: Coffee 3.25 EUR). MOLLIE checkout.",
  },
  {
    mid: "8823T2W" as TableMid,
    name: "Het Friethuys Herpen — Afhalen",
    address: "Herpen, Netherlands",
    note: "Indexed qrv5 page (verified 2026-10-03: Bamischijf vega 3.30 EUR). CM checkout.",
  },
  {
    mid: "7775CMQ" as TableMid,
    name: "DHKMP — Webshop Bezorgen (De Heikamp, Ruurlo)",
    address: "Ruurlo, Netherlands",
    note: "Indexed qrv5 page (verified 2026-10-03: gnome hat 2.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "2578ZD4" as TableMid,
    name: "DHKMP — Webshop Afhalen (De Heikamp, Ruurlo)",
    address: "Ruurlo, Netherlands",
    note: "Venue-published link on heikamp.nl (verified 2026-10-03: gnome hat 2.50 EUR). MOLLIE checkout.",
  },
  {
    mid: "4249H44" as TableMid,
    name: "Snackbistro de Toren — Delivery",
    address: "Netherlands (city not confirmed)",
    note: "Indexed jamezz.app/dl page (verified 2026-10-03: Cup of fries 2.90 EUR). CM checkout.",
  },
  {
    mid: "1116SDA" as TableMid,
    name: "Kop van de Haven IJmuiden — Webshop Afhalen (V3)",
    address: "IJmuiden, Netherlands",
    note: "Indexed jamezz.app/dl page (verified 2026-10-03: shrimp croquette sandwich 5.00 EUR; V3 platform generation). MOLLIE checkout.",
  },
  {
    mid: "4486ZZK" as TableMid,
    name: "Lorenzo IJssalon — Webshop Afhalen",
    address: "Rijnlaan 29, 3522 BB Utrecht, Netherlands",
    note: "Venue-published link on lorenzos.nl (verified 2026-10-03: 1 Scoop 2.00 EUR; ordering offline at read time). MOLLIE checkout.",
  },
  {
    mid: "6275KFA" as TableMid,
    name: "EuroParcs De Zanding — Snackbar",
    address: "EuroParcs De Zanding, Netherlands",
    note: "Venue-published link on europarcsdezanding.nl/faciliteiten/snackbar (verified 2026-10-03: Coffee 3.50 EUR). MOLLIE checkout.",
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
