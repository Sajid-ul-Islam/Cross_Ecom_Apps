import test from "node:test";
import assert from "node:assert/strict";

/* ------------------------------------------------------------------ */
/*  Pricing & Campaign Rules Unit Tests                               */
/* ------------------------------------------------------------------ */

function calculateCashback(subtotal: number): { amount: number; tier: number; nextTierAt: number | null } {
  if (subtotal >= 3000) return { amount: 700, tier: 2, nextTierAt: null };
  if (subtotal >= 2500) return { amount: 500, tier: 1, nextTierAt: 3000 };
  return { amount: 0, tier: 0, nextTierAt: 2500 };
}

function calculateBogo(lines: { category?: string; unit: number; qty?: number }[]): {
  discount: number;
  freeIndexes: number[];
} {
  const byCat = new Map<string, number[]>();
  lines.forEach((l, i) => {
    const cat = l.category || "OTHER";
    if (!byCat.has(cat)) byCat.set(cat, []);
    byCat.get(cat)!.push(i);
  });
  let discount = 0;
  const freeIndexes: number[] = [];
  for (const idxs of byCat.values()) {
    if (idxs.length < 2) continue; // need 2+ in the same category
    let cheapest = idxs[0];
    for (const i of idxs) if (lines[i].unit < lines[cheapest].unit) cheapest = i;
    const qty = lines[cheapest].qty ?? 1;
    discount += lines[cheapest].unit * qty;
    freeIndexes.push(cheapest);
  }
  return { discount, freeIndexes };
}

function normalizePhone(raw: string): string | null {
  let digits = String(raw ?? "").replace(/[^0-9]/g, "");
  if (digits.startsWith("880") && digits.length === 13) {
    digits = digits.slice(2);
  }
  if (digits.length !== 11 || !digits.startsWith("0") || !/^01[3-9]\d{8}$/.test(digits)) {
    return null;
  }
  return digits;
}

test("Cashback: Subtotal below ৳2500 receives ৳0 cashback", () => {
  const res = calculateCashback(2400);
  assert.equal(res.amount, 0);
  assert.equal(res.tier, 0);
  assert.equal(res.nextTierAt, 2500);
});

test("Cashback: Subtotal ৳2500-৳2999 receives ৳500 cashback", () => {
  const res = calculateCashback(2500);
  assert.equal(res.amount, 500);
  assert.equal(res.tier, 1);
  assert.equal(res.nextTierAt, 3000);

  const res2 = calculateCashback(2999);
  assert.equal(res2.amount, 500);
});

test("Cashback: Subtotal ৳3000+ receives ৳700 cashback", () => {
  const res = calculateCashback(3200);
  assert.equal(res.amount, 700);
  assert.equal(res.tier, 2);
  assert.equal(res.nextTierAt, null);
});

test("BOGO: Single item in category gives ৳0 discount", () => {
  const lines = [{ category: "JEANS", unit: 2200, qty: 1 }];
  const res = calculateBogo(lines);
  assert.equal(res.discount, 0);
  assert.equal(res.freeIndexes.length, 0);
});

test("BOGO: Two jeans in cart discounts the lowest priced jean", () => {
  const lines = [
    { category: "JEANS", unit: 2400, qty: 1 },
    { category: "JEANS", unit: 1800, qty: 1 },
  ];
  const res = calculateBogo(lines);
  assert.equal(res.discount, 1800);
  assert.deepEqual(res.freeIndexes, [1]);
});

test("BOGO: Cross-category items (1 Jean + 1 Shirt) do not trigger BOGO", () => {
  const lines = [
    { category: "JEANS", unit: 2400, qty: 1 },
    { category: "SHIRT", unit: 1400, qty: 1 },
  ];
  const res = calculateBogo(lines);
  assert.equal(res.discount, 0);
});

test("Phone validation: accepts clean 017XXXXXXXX format", () => {
  assert.equal(normalizePhone("01712345678"), "01712345678");
});

test("Phone validation: strips country code 880", () => {
  assert.equal(normalizePhone("+8801812345678"), "01812345678");
  assert.equal(normalizePhone("8801912345678"), "01912345678");
});

test("Phone validation: rejects invalid numbers", () => {
  assert.equal(normalizePhone("01212345678"), null); // 012 invalid prefix in BD
  assert.equal(normalizePhone("1712345678"), null);  // missing 0
  assert.equal(normalizePhone("017123456"), null);   // too short
});

function calculateDynamicCashback(subtotal: number, enabled: boolean): { amount: number; tier: number; nextTierAt: number | null } {
  if (!enabled) return { amount: 0, tier: 0, nextTierAt: null };
  if (subtotal >= 3000) return { amount: 700, tier: 2, nextTierAt: null };
  if (subtotal >= 2500) return { amount: 500, tier: 1, nextTierAt: 3000 };
  return { amount: 0, tier: 0, nextTierAt: 2500 };
}

test("Campaign: Cashback returns ৳0 when cashback offer is toggled off", () => {
  const res = calculateDynamicCashback(3500, false);
  assert.equal(res.amount, 0);
  assert.equal(res.tier, 0);
  assert.equal(res.nextTierAt, null);
});

test("Campaign: Cashback applies when cashback offer is toggled on", () => {
  const res = calculateDynamicCashback(3500, true);
  assert.equal(res.amount, 700);
  assert.equal(res.tier, 2);
});
