export type TableMid = string & { readonly __brand: "TableMid" };

export function tableMid(value: string): TableMid {
  const trimmed = value.trim();
  if (!/^[A-Za-z0-9]{4,16}$/.test(trimmed)) {
    throw new Error(`invalid table mid: ${value}`);
  }
  return trimmed as TableMid;
}

export interface VenueQuery {
  readonly search?: string;
}

export interface Venue {
  readonly id: TableMid;
  readonly name: string;
  readonly currency: string;
  readonly payProvider: string;
  readonly orderingEnabled: boolean;
  readonly website: string;
  readonly address?: string;
}

export interface MenuItem {
  readonly id: string;
  readonly name: string;
  readonly description: string | null;
  readonly price: number;
  readonly currency: string;
  readonly category: string;
  readonly available: boolean;
}

export interface MenuCategory {
  readonly name: string;
  readonly items: readonly MenuItem[];
}

export interface Menu {
  readonly venueId: TableMid;
  readonly venueName: string;
  readonly currency: string;
  readonly categories: readonly MenuCategory[];
  readonly updatedAt: string;
}

export interface CartLine {
  readonly productId: string;
  readonly name: string;
  readonly unitPrice: number;
  readonly quantity: number;
  readonly optionProductIds: readonly string[];
}

export type Fulfillment = "eat-in" | "take-away";

export interface OrderDraft {
  readonly table: TableMid;
  readonly lines: readonly CartLine[];
  readonly fulfillment: Fulfillment;
  readonly email: string;
  readonly cartUuid: string;
  readonly payMethod: "creditcard";
}

export interface PreparedOrder {
  readonly draft: OrderDraft;
  readonly total: number;
  readonly currency: string;
  readonly endpoint: string;
  readonly body: Readonly<Record<string, unknown>>;
}

export interface PaymentHandoff {
  readonly orderId: string;
  readonly checkoutUrl: string;
  readonly note: string;
}

export interface CashuEmailAccount {
  readonly host: "https://cashu.email";
  readonly address: string;
  readonly secretKeyHex: string;
}
