import type { Menu, MenuCategory, MenuItem, TableMid } from "./types.js";

export interface RawProduct {
  readonly id?: string;
  readonly naam?: string;
  readonly omschrijving?: string | null;
  readonly price?: number;
  readonly not_available?: boolean;
  readonly translations?: string;
}

export interface RawMenukaart {
  readonly id?: string;
  readonly naam?: string;
  readonly blocked?: number;
  readonly showInCategoryMenu?: number;
  readonly sortkey?: number;
  readonly translations?: string;
}

export interface RawLink {
  readonly menukaart_id?: number | string;
  readonly product_id?: number | string;
}

export interface RawMenuPayload {
  readonly data?: {
    readonly menukaarts?: readonly RawMenukaart[];
    readonly menukaart_products?: readonly RawLink[];
    readonly products?: readonly RawProduct[];
  };
}

export interface RawSalesarea {
  readonly data?: {
    readonly salesarea?: {
      readonly systeemNaam?: string;
      readonly valuta?: string;
      readonly systemOnline?: number;
      readonly payProvider?: string;
      readonly minOrderValue?: string;
      readonly maxOrderValue?: string;
    };
  };
}

export function translated(raw: string | undefined, field: string, fallback: string): string {
  if (raw === undefined || raw === "") return fallback;
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed !== null && typeof parsed === "object" && "en" in parsed) {
      const english = (parsed as Record<string, Record<string, unknown>>)["en"];
      const value = english?.[field];
      if (typeof value === "string" && value !== "") return value;
    }
  } catch {
    return fallback;
  }
  return fallback;
}

export function displayPrice(product: RawProduct, products: readonly RawProduct[]): number {
  if ((product.price ?? 0) > 0) return product.price ?? 0;
  const sibling = products.find(
    (candidate) =>
      candidate !== product &&
      (candidate.naam ?? "").startsWith(product.naam ?? "\u0000") &&
      (candidate.price ?? 0) > 0,
  );
  return sibling?.price ?? product.price ?? 0;
}

export function menuFromPayload(
  table: TableMid,
  sales: RawSalesarea | null,
  data: RawMenuPayload | null,
  now: Date,
): Menu | null {
  const salesarea = sales?.data?.salesarea;
  const currency = salesarea?.valuta ?? "EUR";
  const products = data?.data?.products ?? [];
  const byId = new Map<string, RawProduct>();
  for (const product of products) {
    if (product.id !== undefined) byId.set(product.id, product);
  }

  const categories: MenuCategory[] = [];
  const boards = [...(data?.data?.menukaarts ?? [])].sort((left, right) => (left.sortkey ?? 0) - (right.sortkey ?? 0));
  for (const board of boards) {
    if (board.id === undefined || (board.blocked ?? 0) === 1 || (board.showInCategoryMenu ?? 1) === 0) continue;
    const categoryName = translated(board.translations, "naam", board.naam ?? board.id);
    const items: MenuItem[] = [];
    for (const link of data?.data?.menukaart_products ?? []) {
      if (String(link.menukaart_id) !== board.id) continue;
      const product = byId.get(String(link.product_id));
      if (product === undefined || product.not_available === true) continue;
      items.push({
        id: String(product.id ?? link.product_id ?? ""),
        name: translated(product.translations, "naam", product.naam ?? product.id ?? ""),
        description: product.omschrijving
          ? translated(product.translations, "omschrijving", product.omschrijving)
          : null,
        price: displayPrice(product, products),
        currency,
        category: categoryName,
        available: true,
      });
    }
    if (items.length > 0) categories.push({ name: categoryName, items });
  }
  if (categories.length === 0) return null;
  return {
    venueId: table,
    venueName: salesarea?.systeemNaam?.trim() || table,
    currency,
    categories,
    updatedAt: now.toISOString(),
  };
}
