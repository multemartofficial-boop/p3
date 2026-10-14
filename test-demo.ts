// Node smoke test for the demo API — stub browser globals then exercise the
// same calls the frontend makes.
const ls = new Map<string, string>();
(globalThis as Record<string, unknown>)["localStorage"] = {
  getItem: (k: string) => ls.get(k) ?? null,
  setItem: (k: string, v: string) => void ls.set(k, String(v)),
  removeItem: (k: string) => void ls.delete(k),
};
(globalThis as Record<string, unknown>)["window"] = {
  localStorage: (globalThis as Record<string, unknown>)["localStorage"],
};
(globalThis as Record<string, unknown>)["btoa"] = (s: string) => Buffer.from(s).toString("base64");
(globalThis as Record<string, unknown>)["atob"] = (s: string) =>
  Buffer.from(s, "base64").toString();

const { demoApi, demoCsv } = await import("./src/lib/demo-api");

let pass = 0,
  fail = 0;
const ok = (cond: boolean, label: string) => {
  cond ? pass++ : (fail++, console.log("FAIL:", label));
};
const T = async (label: string, fn: () => Promise<void> | void) => {
  try {
    await fn();
  } catch (e) {
    fail++;
    console.log("FAIL:", label, e);
  }
};

let token = "";
await T("login admin", async () => {
  const r = await demoApi(
    "POST",
    "/auth/login",
    { email: "admin@demo.io", password: "admin123" },
    null,
  );
  ok(r.user.role === "ADMIN" && r.user.name === "Admin", "admin user shape");
  token = r.token;
});
await T("login wrong pw", async () => {
  try {
    await demoApi("POST", "/auth/login", { email: "admin@demo.io", password: "nope" }, null);
    ok(false, "should 401");
  } catch (e) {
    ok((e as { status: number }).status === 401, "401 on bad creds");
  }
});
const authed = `Bearer ${token}`;

await T("auth required", async () => {
  try {
    await demoApi("GET", "/buyers", null, null);
    ok(false, "should 401");
  } catch (e) {
    ok((e as { status: number }).status === 401, "401 no token");
  }
});

await T("lists", async () => {
  ok((await demoApi("GET", "/buyers", null, authed)).length === 6, "buyers");
  ok((await demoApi("GET", "/suppliers", null, authed)).length === 3, "suppliers");
  ok((await demoApi("GET", "/products", null, authed)).length === 8, "products");
  ok(
    (await demoApi("GET", "/warehouses", null, authed))[0]._count.stockBalances > 0,
    "warehouse counts",
  );
  ok((await demoApi("GET", "/categories", null, authed))[0]._count.products > 0, "category counts");
  ok((await demoApi("GET", "/units", null, authed)).length === 4, "units");
  ok((await demoApi("GET", "/vat/rates", null, authed)).length === 3, "tax rates");
  ok((await demoApi("GET", "/cash-bank/accounts", null, authed)).length === 4, "accounts");
  ok((await demoApi("GET", "/cash-bank/transactions", null, authed)).length === 4, "txns");
  ok((await demoApi("GET", "/inventory/stock", null, authed)).length === 10, "stock");
  ok((await demoApi("GET", "/inventory/movements", null, authed)).length === 13, "movements");
  ok((await demoApi("GET", "/purchase/orders", null, authed)).length === 3, "POs");
  ok((await demoApi("GET", "/purchase/invoices", null, authed)).length === 3, "PIs");
  ok((await demoApi("GET", "/sales/orders", null, authed)).length === 2, "SOs");
  ok((await demoApi("GET", "/sales/invoices", null, authed)).length === 3, "SIs");
  ok((await demoApi("GET", "/sales/chalans", null, authed)).length === 1, "chalans");
  ok((await demoApi("GET", "/sales/collections", null, authed)).length === 2, "collections");
  ok((await demoApi("GET", "/sales/returns", null, authed)).length === 1, "returns");
  ok((await demoApi("GET", "/approvals", null, authed)).length === 3, "approvals");
  ok(
    (await demoApi("GET", "/approvals?status=AWAITING_APPROVAL", null, authed)).length === 2,
    "pending approvals",
  );
  ok((await demoApi("GET", "/audit-log", null, authed)).length === 6, "audit");
  ok((await demoApi("GET", "/settings/sequences", null, authed)).length === 14, "sequences");
  ok((await demoApi("GET", "/settings/users", null, authed)).length === 3, "users");
});

await T("party detail", async () => {
  const b = await demoApi("GET", "/buyers/1", null, authed);
  ok(b.name === "Aurora Apparels Ltd." && Number(b.openInvoices) === 1, "buyer detail");
  ok(Number(b.netSales) === 135240, "netSales computed");
  const led = await demoApi("GET", "/buyers/1/ledger", null, authed);
  ok(led.length === 3 && led[0].balanceAfter !== undefined, "ledger");
  const hist = await demoApi("GET", "/buyers/1/history", null, authed);
  ok(hist.length === 1 && hist[0].items.length === 2, "history");
  const pays = await demoApi("GET", "/buyers/1/payments", null, authed);
  ok(pays.length === 1, "payments");
});

await T("dashboard", async () => {
  const dd = await demoApi("GET", "/dashboard?period=month", null, authed);
  ok(Number(dd.sales) === 379890, "sales total");
  ok(dd.chart.length > 0 && dd.topBuyers.length > 0 && dd.lowStock.length > 0, "dashboard parts");
  ok(Number(dd.receivable) === 55240 + 152250, "receivable");
});

await T("documents", async () => {
  const src = await demoApi("GET", "/documents/sources", null, authed);
  ok(src.invoices.length === 3 && src.chalans.length === 1, "sources");
  const inv = await demoApi("GET", "/documents/invoice/1", null, authed);
  ok(inv.invoice.invNo === "INV-2026-001" && inv.invoice.items[0].product.name, "invoice doc");
  const ch = await demoApi("GET", "/documents/chalan/1", null, authed);
  ok(ch.chalan.dcNo === "DC-2026-001" && ch.chalan.items.length === 2, "chalan doc");
});

await T("reports", async () => {
  const tb = await demoApi("GET", "/reports/trial-balance", null, authed);
  ok(Number(tb.totalDebit) === Number(tb.totalCredit), "trial balance balances");
  const pnl = await demoApi("GET", "/reports/pnl", null, authed);
  ok(Number(pnl.revenue) === 361800 && Number(pnl.cogs) === 270000, "pnl");
  const bs = await demoApi("GET", "/reports/balance-sheet", null, authed);
  ok(
    Math.abs(Number(bs.totalAssets) - Number(bs.totalLiabilitiesEquity)) < 1,
    "balance sheet balances",
  );
  const gl = await demoApi("GET", "/reports/general-ledger", null, authed);
  ok(gl.length === 35 && gl[0].entry.entryNo, "general ledger");
  const ar = await demoApi("GET", "/reports/aging/receivable", null, authed);
  ok(
    ar.rows.length === 2 &&
      Number(ar.buckets.current) +
        Number(ar.buckets.d30) +
        Number(ar.buckets.d60) +
        Number(ar.buckets.d90plus) ===
        207490,
    "aging receivable",
  );
  const ap = await demoApi("GET", "/reports/aging/payable", null, authed);
  ok(ap.rows.length === 2, "aging payable");
});

await T("analytics", async () => {
  ok(
    (await demoApi("GET", "/analytics/sales-by-user", null, authed)).length === 2,
    "sales-by-user",
  );
  ok(
    (await demoApi("GET", "/analytics/sales-by-buyer", null, authed)).length === 3,
    "sales-by-buyer",
  );
  ok(
    (await demoApi("GET", "/analytics/stock-movement", null, authed)).length === 8,
    "stock-movement",
  );
  const v = await demoApi("GET", "/analytics/inventory-valuation", null, authed);
  ok(v.rows.length === 10 && Number(v.total) > 0, "valuation");
  ok(
    (await demoApi("GET", "/analytics/purchase-by-supplier", null, authed)).length === 3,
    "purchase-by-supplier",
  );
  ok(
    (await demoApi("GET", "/analytics/product-profitability", null, authed)).length === 5,
    "profitability",
  );
  ok(
    (await demoApi("GET", "/analytics/warehouse-movement", null, authed)).length === 2,
    "warehouse-movement",
  );
  ls.set("gt_token", token);
  const csv = await demoCsv("/analytics/sales-by-buyer");
  ok(csv.split("\n").length === 4 && csv.includes("buyer"), "csv export");
});

await T("vat report", async () => {
  const v = await demoApi("GET", "/vat/report", null, authed);
  ok(Array.isArray(v) && v.length > 0 && v[0].period, "vat periods");
});

await T("mutations", async () => {
  // create product
  const p = await demoApi(
    "POST",
    "/products",
    {
      sku: "TEST-1",
      name: "Test Item",
      categoryId: 1,
      unitId: 1,
      purchasePrice: "5",
      salesPrice: "7",
      minStock: "10",
    },
    authed,
  );
  ok(p.id > 1000 && p.category.name === "Buttons", "create product");
  // sales order above threshold → needs approval
  const so = await demoApi(
    "POST",
    "/sales/orders",
    { buyerId: 2, items: [{ productId: 7, quantity: 5000, rate: 42 }] },
    authed,
  );
  ok(so.approvalStatus === "AWAITING_APPROVAL" && so.soNo.startsWith("SO-"), "SO needs approval");
  const ap2 = await demoApi("GET", "/approvals?status=AWAITING_APPROVAL", null, authed);
  ok(ap2.length === 3, "approval queued");
  const appr = await demoApi("POST", `/approvals/${ap2[0].id}/approve`, null, authed);
  ok(appr.status === "APPROVED", "approve");
  const soAfter = (await demoApi("GET", "/sales/orders", null, authed)).find(
    (o: { id: number }) => o.id === so.id,
  );
  ok(soAfter.approvalStatus === "APPROVED", "entity approvalStatus updated");
  // invoice posts ledger
  const inv = await demoApi(
    "POST",
    "/sales/invoices",
    { buyerId: 2, items: [{ productId: 5, quantity: 100, rate: 11 }] },
    authed,
  );
  ok(inv.status === "UNPAID" && Number(inv.total) === 1155, "invoice totals");
  // collection updates invoice + account + ledger
  await demoApi(
    "POST",
    "/sales/collections",
    { buyerId: 2, invoiceId: inv.id, accountId: 3, amount: 1155, method: "Cash" },
    authed,
  );
  const inv2 = (await demoApi("GET", "/sales/invoices", null, authed)).find(
    (i: { id: number }) => i.id === inv.id,
  );
  ok(inv2.status === "PAID", "invoice paid via collection");
  // stock adjust
  const before = (await demoApi("GET", "/inventory/stock", null, authed)).find(
    (b: { productId: number; warehouseId: number }) => b.productId === 2 && b.warehouse.id === 1,
  );
  await demoApi(
    "POST",
    "/inventory/adjustments",
    { productId: 2, warehouseId: 1, type: "IN", quantity: 50, reason: "Cycle count" },
    authed,
  );
  const after = (await demoApi("GET", "/inventory/stock", null, authed)).find(
    (b: { productId: number; warehouseId: number }) => b.productId === 2 && b.warehouse.id === 1,
  );
  ok(Number(after.quantity) === Number(before.quantity) + 50, "stock adjust");
  // settings
  await demoApi("PUT", "/settings", { currency: "USD" }, authed);
  ok((await demoApi("GET", "/settings", null, authed)).currency === "USD", "settings save");
  // backup
  const bk = await demoApi("GET", "/system/backup", null, authed);
  ok(bk.demo === true && bk.data.products.length === 9, "backup");
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
