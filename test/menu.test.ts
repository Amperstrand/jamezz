import { describe, expect, it } from "vitest";
import { displayPrice, menuFromPayload, translated } from "../src/menu.js";
import { tableMid } from "../src/types.js";

const sales = {
  data: { salesarea: { systeemNaam: "Demo Table - QR", valuta: "EUR", systemOnline: 1 } },
};

const data = {
  data: {
    menukaarts: [
      { id: "10", naam: "Burger", sortkey: 2, showInCategoryMenu: 1, translations: JSON.stringify({ en: { naam: "Burgers" } }) },
      { id: "9", naam: "Hidden", sortkey: 1, showInCategoryMenu: 0 },
    ],
    menukaart_products: [
      { menukaart_id: 10, product_id: 100 },
      { menukaart_id: 10, product_id: 101 },
      { menukaart_id: 9, product_id: 199 },
    ],
    products: [
      {
        id: "100",
        naam: "Cheeseburger",
        omschrijving: "Hausbeschreibung",
        price: 6.4,
        translations: JSON.stringify({ en: { naam: "Cheeseburger", omschrijving: "Fresh beef patty" } }),
      },
      { id: "101", naam: "Milkshake Vanilla", price: 0 },
      { id: "101-size", naam: "Milkshake Vanilla 0,2l", price: 3.4 },
      { id: "199", naam: "Secret item", price: 1 },
    ],
  },
};

describe("menuFromPayload", () => {
  it("keeps visible categories and resolves a zero parent price from its sized sibling", () => {
    const menu = menuFromPayload(tableMid("TABLE1"), sales, data, new Date("2026-10-01T00:00:00.000Z"));
    expect(menu?.venueName).toBe("Demo Table - QR");
    expect(menu?.categories.map((category) => category.name)).toEqual(["Burgers"]);
    expect(menu?.categories[0]?.items.find((item) => item.id === "100")).toMatchObject({
      name: "Cheeseburger",
      description: "Fresh beef patty",
      price: 6.4,
    });
    expect(menu?.categories[0]?.items.find((item) => item.id === "101")?.price).toBe(3.4);
    expect(menu?.categories.flatMap((category) => category.items).some((item) => item.id === "199")).toBe(false);
  });

  it("falls back when a translation is missing", () => {
    expect(translated(undefined, "naam", "fallback")).toBe("fallback");
    expect(translated("{not json", "naam", "fallback")).toBe("fallback");
    expect(displayPrice({ naam: "Fries", price: 2.5 }, [])).toBe(2.5);
  });
});
