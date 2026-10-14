/*
 * Demo backend — replaces the Express/Prisma/MySQL API entirely in this
 * showcase build. Everything below is fictional seed data held in memory and
 * persisted to localStorage, so edits survive reloads. Clear site data to
 * reset. Response shapes mirror server/src/routes/*.ts output.
 */

export class DemoApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

/* ── demo JWT (padded base64 so strict browser atob decodes it) ─────────── */
const b64 = (s: string) => btoa(s);
const issueToken = (payload: Record<string, unknown>) =>
  `${b64(JSON.stringify({ alg: "none", typ: "JWT" }))}.${b64(
    JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24 * 30 }),
  )}.${b64("demo")}`;

const parseToken = (
  auth: string | null,
): { id: number; email: string; name: string; role: string } | null => {
  const raw = auth?.startsWith("Bearer ") ? auth.slice(7) : auth;
  if (!raw) return null;
  try {
    const seg = raw.split(".")[1]!.replace(/-/g, "+").replace(/_/g, "/");
    const p = JSON.parse(atob(seg + "=".repeat((4 - (seg.length % 4)) % 4)));
    if (typeof p.exp === "number" && p.exp * 1000 < Date.now()) return null;
    return p;
  } catch {
    return null;
  }
};

/* ── dates ──────────────────────────────────────────────────────────────── */
const iso = (d: Date) => d.toISOString();
const daysAgo = (n: number) => iso(new Date(Date.now() - n * 864e5));
const dstr = (n: number) => daysAgo(n).slice(0, 10);
const now = () => iso(new Date());
const num = (v: unknown) => Number(v ?? 0);

/* ── store ──────────────────────────────────────────────────────────────── */
const LS_KEY = "gt.demo.v1";
const hasLS = typeof window !== "undefined" && !!window.localStorage;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Row = any;
type DB = ReturnType<typeof seedDb>;
let db: DB | null = null;

const save = () => {
  if (!hasLS || !db) return;
  try {
    localStorage.setItem(LS_KEY, JSON.stringify(db));
  } catch {
    /* quota — fine for a demo */
  }
};

const store = (): DB => {
  if (db) return db;
  if (hasLS) {
    try {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        db = JSON.parse(raw) as DB;
        return db!;
      }
    } catch {
      /* reseed */
    }
  }
  db = seedDb();
  return db!;
};

function seedDb() {
  const units: Row[] = [
    { id: 1, name: "Piece", code: "PCS" },
    { id: 2, name: "Meter", code: "MTR" },
    { id: 3, name: "Roll", code: "ROLL" },
    { id: 4, name: "Gross", code: "GRS" },
  ];
  const taxRates: Row[] = [
    {
      id: 1,
      name: "Standard VAT",
      code: "VAT-STD",
      ratePercent: "5",
      type: "BOTH",
      effectiveFrom: "2026-01-01",
      status: "ACTIVE",
    },
    {
      id: 2,
      name: "Zero-rated export",
      code: "VAT-ZERO",
      ratePercent: "0",
      type: "OUTPUT",
      effectiveFrom: "2026-01-01",
      status: "ACTIVE",
    },
    {
      id: 3,
      name: "Withholding tax",
      code: "TAX-WHT",
      ratePercent: "3",
      type: "DEDUCTION",
      effectiveFrom: "2026-01-01",
      status: "ACTIVE",
    },
  ];
  const categories: Row[] = [
    { id: 1, name: "Buttons", code: "BTN", description: "Shell, polyester and metal buttons" },
    { id: 2, name: "Zippers", code: "ZIP", description: "Nylon, metal and invisible zippers" },
    { id: 3, name: "Labels", code: "LBL", description: "Woven, care and printed labels" },
    { id: 4, name: "Elastic", code: "ELA", description: "Woven and braided elastic" },
    { id: 5, name: "Tapes", code: "TAP", description: "Twill, herringbone and bias tapes" },
  ];
  const products: Row[] = [
    {
      id: 1,
      sku: "BTN-SHL-18-WHT",
      name: "Shell Button 18L · White",
      categoryId: 1,
      unitId: 1,
      color: "White",
      size: "18L",
      purchasePrice: "2.1",
      salesPrice: "2.8",
      minStock: "20000",
      taxRateId: 1,
      status: "ACTIVE",
    },
    {
      id: 2,
      sku: "ZIP-NYL-09-BLK",
      name: "Nylon Zipper 9in · Black",
      categoryId: 2,
      unitId: 1,
      color: "Black",
      size: "9 inch",
      purchasePrice: "18",
      salesPrice: "24",
      minStock: "5000",
      taxRateId: 1,
      status: "ACTIVE",
    },
    {
      id: 3,
      sku: "LBL-WVN-40",
      name: "Woven Main Label 40mm",
      categoryId: 3,
      unitId: 1,
      color: "Navy",
      size: "40mm",
      purchasePrice: "1.8",
      salesPrice: "2.5",
      minStock: "30000",
      taxRateId: 1,
      status: "ACTIVE",
    },
    {
      id: 4,
      sku: "ELA-WOV-25",
      name: "Woven Elastic 25mm",
      categoryId: 4,
      unitId: 2,
      color: "Natural",
      size: "25mm",
      purchasePrice: "12",
      salesPrice: "16",
      minStock: "2000",
      taxRateId: 1,
      status: "ACTIVE",
    },
    {
      id: 5,
      sku: "TAP-TWL-15",
      name: "Cotton Twill Tape 15mm",
      categoryId: 5,
      unitId: 2,
      color: "Ecru",
      size: "15mm",
      purchasePrice: "8",
      salesPrice: "11",
      minStock: "1500",
      taxRateId: 1,
      status: "ACTIVE",
    },
    {
      id: 6,
      sku: "BTN-PLS-24-NVY",
      name: "Polyester Button 24L · Navy",
      categoryId: 1,
      unitId: 1,
      color: "Navy",
      size: "24L",
      purchasePrice: "1.5",
      salesPrice: "2.2",
      minStock: "25000",
      taxRateId: 1,
      status: "ACTIVE",
    },
    {
      id: 7,
      sku: "ZIP-MTL-07-BRS",
      name: "Metal Zipper 7in · Brass",
      categoryId: 2,
      unitId: 1,
      color: "Brass",
      size: "7 inch",
      purchasePrice: "32",
      salesPrice: "42",
      minStock: "3000",
      taxRateId: 1,
      status: "ACTIVE",
    },
    {
      id: 8,
      sku: "LBL-CR-15",
      name: "Care Label 15mm Satin",
      categoryId: 3,
      unitId: 3,
      color: "White",
      size: "15mm",
      purchasePrice: "240",
      salesPrice: "310",
      minStock: "200",
      taxRateId: 1,
      status: "ACTIVE",
    },
  ];
  const warehouses: Row[] = [
    {
      id: 1,
      code: "WH-01",
      name: "Tejgaon",
      location: "Dhaka",
      manager: "Arif Hasan",
      status: "ACTIVE",
    },
    {
      id: 2,
      code: "WH-02",
      name: "Gazipur",
      location: "Gazipur",
      manager: "Maliha Islam",
      status: "ACTIVE",
    },
    {
      id: 3,
      code: "WH-03",
      name: "Narayanganj",
      location: "Narayanganj",
      manager: "Rafi Ahmed",
      status: "ACTIVE",
    },
  ];
  const buyers: Row[] = [
    {
      id: 1,
      code: "BUY-001",
      name: "Aurora Apparels Ltd.",
      contactPerson: "Samira Hossain",
      phone: "+880 1700 010101",
      email: "accounts@aurora.example",
      address: "Gazipur, Dhaka",
      paymentTerms: "30 days",
      creditLimit: "2500000",
      status: "ACTIVE",
    },
    {
      id: 2,
      code: "BUY-002",
      name: "Northern Knitwear",
      contactPerson: "Fahim Chowdhury",
      phone: "+880 1700 010102",
      email: "orders@northern.example",
      address: "Narayanganj",
      paymentTerms: "45 days",
      creditLimit: "1800000",
      status: "ACTIVE",
    },
    {
      id: 3,
      code: "BUY-003",
      name: "Metro Fashions",
      contactPerson: "Tasnim Alam",
      phone: "+880 1700 010103",
      email: "buy@metro.example",
      address: "Dhaka",
      paymentTerms: "30 days",
      creditLimit: "3000000",
      status: "ACTIVE",
    },
    {
      id: 4,
      code: "BUY-004",
      name: "Bengal Stitch Works",
      contactPerson: "Ruhul Amin",
      phone: "+880 1700 010104",
      email: "ruhul@bengal.example",
      address: "Chattogram",
      paymentTerms: "Cash",
      creditLimit: "900000",
      status: "ACTIVE",
    },
    {
      id: 5,
      code: "BUY-005",
      name: "Eastern Denim Co.",
      contactPerson: "Sharif Uddin",
      phone: "+880 1700 010105",
      email: "sharif@eastern.example",
      address: "Dhaka",
      paymentTerms: "30 days",
      creditLimit: "1500000",
      status: "ACTIVE",
    },
    {
      id: 6,
      code: "BUY-006",
      name: "Riviera Garments",
      contactPerson: "Nusrat Jahan",
      phone: "+880 1700 010106",
      email: "nusrat@riviera.example",
      address: "Ashulia",
      paymentTerms: "15 days",
      creditLimit: "2000000",
      status: "INACTIVE",
    },
  ];
  const suppliers: Row[] = [
    {
      id: 1,
      code: "SUP-011",
      name: "YKK Bangladesh",
      contactPerson: "Rashed Karim",
      phone: "+880 2 5500011",
      email: "sales@ykk-demo.example",
      paymentTerms: "30 days",
      status: "ACTIVE",
    },
    {
      id: 2,
      code: "SUP-018",
      name: "Delta Button Industries",
      contactPerson: "Imran Haque",
      phone: "+880 2 7700018",
      email: "imran@deltabtn.example",
      paymentTerms: "Cash",
      status: "ACTIVE",
    },
    {
      id: 3,
      code: "SUP-024",
      name: "Prime Label Works",
      contactPerson: "Nusrat Jahan",
      phone: "+880 2 9900024",
      email: "orders@primelabel.example",
      paymentTerms: "45 days",
      status: "ACTIVE",
    },
  ];
  const cashAccounts: Row[] = [
    {
      id: 1,
      name: "City Bank · Current",
      type: "BANK",
      bankName: "City Bank",
      accountNo: "1102003344556",
      balance: "2184000",
      status: "ACTIVE",
    },
    {
      id: 2,
      name: "BRAC Bank · Current",
      type: "BANK",
      bankName: "BRAC Bank",
      accountNo: "1501209988776",
      balance: "1206000",
      status: "ACTIVE",
    },
    {
      id: 3,
      name: "Head office cash",
      type: "CASH",
      bankName: null,
      accountNo: null,
      balance: "375000",
      status: "ACTIVE",
    },
    {
      id: 4,
      name: "Petty cash",
      type: "CASH",
      bankName: null,
      accountNo: null,
      balance: "110000",
      status: "ACTIVE",
    },
  ];
  const stockBalances: Row[] = [
    { id: 1, productId: 1, warehouseId: 1, quantity: "40000", reserved: "10000" },
    { id: 2, productId: 2, warehouseId: 1, quantity: "4200", reserved: "4200" },
    { id: 3, productId: 3, warehouseId: 1, quantity: "30000", reserved: "50000" },
    { id: 4, productId: 4, warehouseId: 1, quantity: "250", reserved: "1250" },
    { id: 5, productId: 5, warehouseId: 1, quantity: "800", reserved: "0" },
    { id: 6, productId: 1, warehouseId: 2, quantity: "50000", reserved: "0" },
    { id: 7, productId: 6, warehouseId: 2, quantity: "25000", reserved: "0" },
    { id: 8, productId: 7, warehouseId: 2, quantity: "1200", reserved: "0" },
    { id: 9, productId: 2, warehouseId: 3, quantity: "1800", reserved: "0" },
    { id: 10, productId: 8, warehouseId: 1, quantity: "90", reserved: "0" },
  ];
  const stockMovements: Row[] = [
    {
      id: 1,
      productId: 1,
      warehouseId: 2,
      type: "IN",
      quantity: "50000",
      qtyAfter: "50000",
      refNo: "PI-2026-002",
      reason: "Purchase receipt",
      createdAt: daysAgo(38),
    },
    {
      id: 2,
      productId: 6,
      warehouseId: 2,
      type: "IN",
      quantity: "25000",
      qtyAfter: "25000",
      refNo: "PI-2026-002",
      reason: "Purchase receipt",
      createdAt: daysAgo(38),
    },
    {
      id: 3,
      productId: 2,
      warehouseId: 1,
      type: "IN",
      quantity: "4200",
      qtyAfter: "4200",
      refNo: "PI-2026-001",
      reason: "Purchase receipt",
      createdAt: daysAgo(36),
    },
    {
      id: 4,
      productId: 7,
      warehouseId: 1,
      type: "IN",
      quantity: "1200",
      qtyAfter: "1200",
      refNo: "PI-2026-001",
      reason: "Purchase receipt",
      createdAt: daysAgo(36),
    },
    {
      id: 5,
      productId: 3,
      warehouseId: 1,
      type: "IN",
      quantity: "80000",
      qtyAfter: "80000",
      refNo: "PI-2026-003",
      reason: "Purchase receipt",
      createdAt: daysAgo(40),
    },
    {
      id: 6,
      productId: 4,
      warehouseId: 1,
      type: "IN",
      quantity: "1500",
      qtyAfter: "1500",
      refNo: "PI-2026-003",
      reason: "Purchase receipt",
      createdAt: daysAgo(40),
    },
    {
      id: 7,
      productId: 5,
      warehouseId: 1,
      type: "IN",
      quantity: "800",
      qtyAfter: "800",
      refNo: "PI-2026-003",
      reason: "Purchase receipt",
      createdAt: daysAgo(40),
    },
    {
      id: 8,
      productId: 1,
      warehouseId: 1,
      type: "OUT",
      quantity: "10000",
      qtyAfter: "40000",
      refNo: "DC-2026-001",
      reason: "Delivery chalan",
      createdAt: daysAgo(35),
    },
    {
      id: 9,
      productId: 2,
      warehouseId: 1,
      type: "OUT",
      quantity: "4200",
      qtyAfter: "0",
      refNo: "DC-2026-001",
      reason: "Delivery chalan",
      createdAt: daysAgo(35),
    },
    {
      id: 10,
      productId: 3,
      warehouseId: 1,
      type: "OUT",
      quantity: "50000",
      qtyAfter: "30000",
      refNo: "INV-2026-002",
      reason: "Direct sale",
      createdAt: daysAgo(33),
    },
    {
      id: 11,
      productId: 4,
      warehouseId: 1,
      type: "OUT",
      quantity: "1250",
      qtyAfter: "250",
      refNo: "INV-2026-002",
      reason: "Direct sale",
      createdAt: daysAgo(33),
    },
    {
      id: 12,
      productId: 7,
      warehouseId: 2,
      type: "TRANSFER_OUT",
      quantity: "600",
      qtyAfter: "600",
      refNo: "TRF-2026-001",
      reason: "Inter-warehouse transfer",
      createdAt: daysAgo(20),
    },
    {
      id: 13,
      productId: 7,
      warehouseId: 1,
      type: "TRANSFER_IN",
      quantity: "600",
      qtyAfter: "1800",
      refNo: "TRF-2026-001",
      reason: "Inter-warehouse transfer",
      createdAt: daysAgo(20),
    },
  ];
  const purchaseOrders: Row[] = [
    {
      id: 1,
      poNo: "PO-2026-001",
      supplierId: 1,
      orderDate: daysAgo(38),
      expectedDate: dstr(-31),
      status: "RECEIVED",
      approvalStatus: "APPROVED",
      approvedById: 1,
      notes: null,
      total: "99540",
      createdById: 1,
      createdAt: daysAgo(38),
      items: [
        {
          productId: 2,
          quantity: "4200",
          rate: "18",
          taxRateId: 1,
          taxAmount: "3780",
          total: "79380",
        },
        {
          productId: 7,
          quantity: "600",
          rate: "32",
          taxRateId: 1,
          taxAmount: "960",
          total: "20160",
        },
      ],
    },
    {
      id: 2,
      poNo: "PO-2026-002",
      supplierId: 2,
      orderDate: daysAgo(40),
      expectedDate: dstr(-33),
      status: "RECEIVED",
      approvalStatus: "APPROVED",
      approvedById: 1,
      notes: null,
      total: "149625",
      createdById: 1,
      createdAt: daysAgo(40),
      items: [
        {
          productId: 1,
          quantity: "50000",
          rate: "2.1",
          taxRateId: 1,
          taxAmount: "5250",
          total: "110250",
        },
        {
          productId: 6,
          quantity: "25000",
          rate: "1.5",
          taxRateId: 1,
          taxAmount: "1875",
          total: "39375",
        },
      ],
    },
    {
      id: 3,
      poNo: "PO-2026-003",
      supplierId: 3,
      orderDate: daysAgo(6),
      expectedDate: dstr(-8),
      status: "SUBMITTED",
      approvalStatus: "AWAITING_APPROVAL",
      approvedById: null,
      notes: "Quarterly label reorder",
      total: "196875",
      createdById: 3,
      createdAt: daysAgo(6),
      items: [
        {
          productId: 3,
          quantity: "75000",
          rate: "1.8",
          taxRateId: 1,
          taxAmount: "6750",
          total: "141750",
        },
        {
          productId: 8,
          quantity: "200",
          rate: "240",
          taxRateId: 1,
          taxAmount: "2400",
          total: "50400",
        },
      ],
    },
  ];
  const purchaseInvoices: Row[] = [
    {
      id: 1,
      invNo: "PI-2026-001",
      orderId: 1,
      supplierId: 1,
      warehouseId: 1,
      invoiceDate: daysAgo(36),
      status: "PARTIAL",
      subtotal: "94560",
      taxTotal: "4980",
      discount: "0",
      total: "99540",
      paidAmount: "50000",
      notes: null,
      createdById: 1,
      createdAt: daysAgo(36),
      items: purchaseOrders[0]!.items,
    },
    {
      id: 2,
      invNo: "PI-2026-002",
      orderId: 2,
      supplierId: 2,
      warehouseId: 2,
      invoiceDate: daysAgo(38),
      status: "UNPAID",
      subtotal: "142500",
      taxTotal: "7125",
      discount: "0",
      total: "149625",
      paidAmount: "0",
      notes: null,
      createdById: 1,
      createdAt: daysAgo(38),
      items: purchaseOrders[1]!.items,
    },
    {
      id: 3,
      invNo: "PI-2026-003",
      orderId: null,
      supplierId: 3,
      warehouseId: 1,
      invoiceDate: daysAgo(40),
      status: "PAID",
      subtotal: "170900",
      taxTotal: "8420",
      discount: "2500",
      total: "176820",
      paidAmount: "176820",
      notes: null,
      createdById: 1,
      createdAt: daysAgo(40),
      items: [
        {
          productId: 3,
          quantity: "80000",
          rate: "1.8",
          taxRateId: 1,
          taxAmount: "7200",
          total: "151200",
        },
        {
          productId: 4,
          quantity: "1500",
          rate: "12",
          taxRateId: 1,
          taxAmount: "900",
          total: "18900",
        },
        { productId: 5, quantity: "800", rate: "8", taxRateId: 1, taxAmount: "320", total: "6720" },
      ],
    },
  ];
  const supplierPayments: Row[] = [
    {
      id: 1,
      paymentNo: "PAY-2026-001",
      supplierId: 1,
      invoiceId: 1,
      accountId: 1,
      date: daysAgo(34),
      amount: "50000",
      method: "Bank transfer",
      reference: "CTX-88412",
      notes: null,
      createdById: 1,
    },
  ];
  const salesOrders: Row[] = [
    {
      id: 1,
      soNo: "SO-2026-001",
      buyerId: 1,
      orderDate: daysAgo(37),
      dueDate: dstr(-30),
      status: "INVOICED",
      approvalStatus: "APPROVED",
      approvedById: 1,
      discount: "0",
      notes: null,
      total: "141981",
      createdById: 1,
      createdAt: daysAgo(37),
      items: [
        {
          productId: 1,
          quantity: "10000",
          rate: "2.8",
          taxRateId: 1,
          taxAmount: "1400",
          total: "29400",
        },
        {
          productId: 2,
          quantity: "4200",
          rate: "24",
          taxRateId: 1,
          taxAmount: "5040",
          total: "105840",
        },
      ],
    },
    {
      id: 2,
      soNo: "SO-2026-002",
      buyerId: 5,
      orderDate: daysAgo(3),
      dueDate: dstr(-20),
      status: "CONFIRMED",
      approvalStatus: "AWAITING_APPROVAL",
      approvedById: null,
      discount: "0",
      notes: "Repeat order — denim line",
      total: "294000",
      createdById: 3,
      createdAt: daysAgo(3),
      items: [
        {
          productId: 7,
          quantity: "6000",
          rate: "42",
          taxRateId: 1,
          taxAmount: "12600",
          total: "264600",
        },
        {
          productId: 1,
          quantity: "10000",
          rate: "2.8",
          taxRateId: 1,
          taxAmount: "1400",
          total: "29400",
        },
      ],
    },
  ];
  const salesInvoices: Row[] = [
    {
      id: 1,
      invNo: "INV-2026-001",
      salesOrderId: 1,
      buyerId: 1,
      invoiceDate: daysAgo(35),
      dueDate: dstr(-5),
      status: "PARTIAL",
      subtotal: "126000",
      taxTotal: "6440",
      discount: "0",
      total: "135240",
      paidAmount: "80000",
      vatMode: "EXCLUSIVE",
      brand: "Aurora SS26",
      grossWeight: null,
      notes: null,
      createdById: 1,
      createdAt: daysAgo(35),
      items: salesOrders[0]!.items,
    },
    {
      id: 2,
      invNo: "INV-2026-002",
      salesOrderId: null,
      buyerId: 3,
      invoiceDate: daysAgo(33),
      dueDate: dstr(-3),
      status: "UNPAID",
      subtotal: "145000",
      taxTotal: "7250",
      discount: "0",
      total: "152250",
      paidAmount: "0",
      vatMode: "EXCLUSIVE",
      brand: null,
      grossWeight: null,
      notes: null,
      createdById: 3,
      createdAt: daysAgo(33),
      items: [
        {
          productId: 3,
          quantity: "50000",
          rate: "2.5",
          taxRateId: 1,
          taxAmount: "6250",
          total: "131250",
        },
        {
          productId: 4,
          quantity: "1250",
          rate: "16",
          taxRateId: 1,
          taxAmount: "1000",
          total: "21000",
        },
      ],
    },
    {
      id: 3,
      invNo: "INV-2026-003",
      salesOrderId: null,
      buyerId: 4,
      invoiceDate: daysAgo(70),
      dueDate: dstr(70),
      status: "PAID",
      subtotal: "88000",
      taxTotal: "4400",
      discount: "0",
      total: "92400",
      paidAmount: "92400",
      vatMode: "EXCLUSIVE",
      brand: null,
      grossWeight: null,
      notes: null,
      createdById: 1,
      createdAt: daysAgo(70),
      items: [
        {
          productId: 5,
          quantity: "8000",
          rate: "11",
          taxRateId: 1,
          taxAmount: "4400",
          total: "92400",
        },
      ],
    },
  ];
  const deliveryChalans: Row[] = [
    {
      id: 1,
      dcNo: "DC-2026-001",
      salesOrderId: 1,
      buyerId: 1,
      warehouseId: 1,
      date: daysAgo(35),
      driverName: "Kamal Uddin",
      vehicleNo: "DHA-GA-11-2233",
      styleNo: "AUR-SS26-04",
      erpNo: null,
      notes: null,
      createdById: 1,
      items: [
        { productId: 1, quantity: "10000" },
        { productId: 2, quantity: "4200" },
      ],
    },
  ];
  const paymentCollections: Row[] = [
    {
      id: 1,
      paymentNo: "RCV-2026-001",
      buyerId: 1,
      invoiceId: 1,
      accountId: 1,
      date: daysAgo(32),
      amount: "80000",
      method: "Bank transfer",
      reference: "RTGS-22110",
      notes: null,
      createdById: 1,
    },
    {
      id: 2,
      paymentNo: "RCV-2026-002",
      buyerId: 4,
      invoiceId: 3,
      accountId: 3,
      date: daysAgo(65),
      amount: "92400",
      method: "Cash",
      reference: null,
      notes: null,
      createdById: 1,
    },
  ];
  const salesReturns: Row[] = [
    {
      id: 1,
      returnNo: "SR-2026-001",
      invoiceId: 1,
      buyerId: 1,
      date: daysAgo(20),
      reason: "Color mismatch on 200 pcs buttons",
      status: "POSTED",
      refundAmount: "588",
      createdById: 1,
      items: [{ productId: 1, quantity: "200", rate: "2.8" }],
    },
  ];
  const cashTransactions: Row[] = [
    {
      id: 1,
      txnNo: "TXN-2026-001",
      accountId: 1,
      type: "RECEIPT",
      amount: "80000",
      date: daysAgo(32),
      particulars: "Collection RCV-2026-001 — Aurora Apparels",
      reference: "RTGS-22110",
      balanceAfter: "2264000",
    },
    {
      id: 2,
      txnNo: "TXN-2026-002",
      accountId: 1,
      type: "PAYMENT",
      amount: "50000",
      date: daysAgo(34),
      particulars: "Supplier payment PAY-2026-001 — YKK Bangladesh",
      reference: "CTX-88412",
      balanceAfter: "2184000",
    },
    {
      id: 3,
      txnNo: "TXN-2026-003",
      accountId: 3,
      type: "RECEIPT",
      amount: "92400",
      date: daysAgo(65),
      particulars: "Collection RCV-2026-002 — Bengal Stitch Works",
      reference: null,
      balanceAfter: "375000",
    },
    {
      id: 4,
      txnNo: "TXN-2026-004",
      accountId: 4,
      type: "PAYMENT",
      amount: "8500",
      date: daysAgo(10),
      particulars: "Office supplies & courier",
      reference: null,
      balanceAfter: "110000",
    },
  ];
  const accounts: Row[] = [
    { id: 1, code: "1000", name: "Cash & cash equivalents", category: "ASSET", isSystem: true },
    { id: 2, code: "1100", name: "Bank accounts", category: "ASSET", isSystem: true },
    { id: 3, code: "1200", name: "Accounts receivable", category: "ASSET", isSystem: true },
    { id: 4, code: "1300", name: "Inventory", category: "ASSET", isSystem: true },
    { id: 5, code: "2000", name: "Accounts payable", category: "LIABILITY", isSystem: true },
    { id: 6, code: "2100", name: "VAT payable", category: "LIABILITY", isSystem: true },
    { id: 7, code: "3000", name: "Owner's equity", category: "EQUITY", isSystem: true },
    { id: 8, code: "3100", name: "Retained earnings", category: "EQUITY", isSystem: true },
    { id: 9, code: "4100", name: "Sales revenue", category: "INCOME", isSystem: true },
    { id: 10, code: "4900", name: "Other income", category: "INCOME", isSystem: true },
    { id: 11, code: "5100", name: "Cost of goods sold", category: "EXPENSE", isSystem: true },
    { id: 12, code: "5200", name: "Sales returns", category: "EXPENSE", isSystem: true },
    { id: 13, code: "5300", name: "Operating expense", category: "EXPENSE", isSystem: true },
  ];
  // Journal lines — enough for trial balance / GL / P&L to look real.
  const jl = (
    entryNo: string,
    date: string,
    accountCode: number,
    debit: number,
    credit: number,
    memo: string,
  ) => ({
    entryId: entryNo,
    entryNo,
    date,
    accountId: accountCode,
    debit: String(debit),
    credit: String(credit),
    memo,
  });
  const journalLines: Row[] = [
    jl("JE-2026-001", dstr(40), 1300, 176820, 0, "Purchase PI-2026-003"),
    jl("JE-2026-001", dstr(40), 2000, 0, 176820, "Purchase PI-2026-003"),
    jl("JE-2026-002", dstr(38), 1300, 149625, 0, "Purchase PI-2026-002"),
    jl("JE-2026-002", dstr(38), 2000, 0, 149625, "Purchase PI-2026-002"),
    jl("JE-2026-003", dstr(36), 1300, 99540, 0, "Purchase PI-2026-001"),
    jl("JE-2026-003", dstr(36), 2000, 0, 99540, "Purchase PI-2026-001"),
    jl("JE-2026-004", dstr(35), 1200, 135240, 0, "Invoice INV-2026-001"),
    jl("JE-2026-004", dstr(35), 4100, 0, 128800, "Invoice INV-2026-001"),
    jl("JE-2026-004", dstr(35), 2100, 0, 6440, "VAT out"),
    jl("JE-2026-005", dstr(33), 1200, 152250, 0, "Invoice INV-2026-002"),
    jl("JE-2026-005", dstr(33), 4100, 0, 145000, "Invoice INV-2026-002"),
    jl("JE-2026-005", dstr(33), 2100, 0, 7250, "VAT out"),
    jl("JE-2026-006", dstr(70), 1200, 92400, 0, "Invoice INV-2026-003"),
    jl("JE-2026-006", dstr(70), 4100, 0, 88000, "Invoice INV-2026-003"),
    jl("JE-2026-006", dstr(70), 2100, 0, 4400, "VAT out"),
    jl("JE-2026-007", dstr(34), 2000, 50000, 0, "Payment PAY-2026-001"),
    jl("JE-2026-007", dstr(34), 1100, 0, 50000, "Payment PAY-2026-001"),
    jl("JE-2026-008", dstr(32), 1100, 80000, 0, "Collection RCV-2026-001"),
    jl("JE-2026-008", dstr(32), 1200, 0, 80000, "Collection RCV-2026-001"),
    jl("JE-2026-009", dstr(65), 1000, 92400, 0, "Collection RCV-2026-002"),
    jl("JE-2026-009", dstr(65), 1200, 0, 92400, "Collection RCV-2026-002"),
    jl("JE-2026-010", dstr(10), 5300, 8500, 0, "Office supplies"),
    jl("JE-2026-010", dstr(10), 1000, 0, 8500, "Office supplies"),
    jl("JE-2026-011", dstr(35), 5100, 101000, 0, "COGS INV-2026-001"),
    jl("JE-2026-011", dstr(35), 1300, 0, 101000, "COGS INV-2026-001"),
    jl("JE-2026-012", dstr(33), 5100, 105000, 0, "COGS INV-2026-002"),
    jl("JE-2026-012", dstr(33), 1300, 0, 105000, "COGS INV-2026-002"),
    jl("JE-2026-013", dstr(70), 5100, 64000, 0, "COGS INV-2026-003"),
    jl("JE-2026-013", dstr(70), 1300, 0, 64000, "COGS INV-2026-003"),
    jl("JE-2026-014", dstr(20), 5200, 588, 0, "Return SR-2026-001"),
    jl("JE-2026-014", dstr(20), 1200, 0, 588, "Return SR-2026-001"),
    jl("JE-2026-015", dstr(200), 3000, 0, 3500000, "Opening capital"),
    jl("JE-2026-015", dstr(200), 1100, 3500000, 0, "Opening capital"),
    jl("JE-2026-016", dstr(40), 2000, 176820, 0, "Payment for PI-2026-003"),
    jl("JE-2026-016", dstr(40), 1100, 0, 176820, "Payment for PI-2026-003"),
  ];
  const sequences: Row[] = [
    { docType: "buyer_code", prefix: "BUY", lastNumber: 6, padding: 3, yearInfix: false },
    { docType: "supplier_code", prefix: "SUP", lastNumber: 24, padding: 3, yearInfix: false },
    { docType: "purchase_order", prefix: "PO", lastNumber: 3, padding: 3, yearInfix: true },
    { docType: "purchase_invoice", prefix: "PI", lastNumber: 3, padding: 3, yearInfix: true },
    { docType: "sales_order", prefix: "SO", lastNumber: 2, padding: 3, yearInfix: true },
    { docType: "sales_invoice", prefix: "INV", lastNumber: 3, padding: 3, yearInfix: true },
    { docType: "delivery_chalan", prefix: "DC", lastNumber: 1, padding: 3, yearInfix: true },
    { docType: "supplier_payment", prefix: "PAY", lastNumber: 1, padding: 3, yearInfix: true },
    { docType: "payment_collection", prefix: "RCV", lastNumber: 2, padding: 3, yearInfix: true },
    { docType: "sales_return", prefix: "SR", lastNumber: 1, padding: 3, yearInfix: true },
    { docType: "stock_adjustment", prefix: "ADJ", lastNumber: 0, padding: 3, yearInfix: true },
    { docType: "stock_transfer", prefix: "TRF", lastNumber: 1, padding: 3, yearInfix: true },
    { docType: "cash_transaction", prefix: "TXN", lastNumber: 4, padding: 3, yearInfix: true },
    { docType: "journal_entry", prefix: "JE", lastNumber: 16, padding: 3, yearInfix: true },
  ];
  const approvalRequests: Row[] = [
    {
      id: 1,
      entityType: "purchase_order",
      entityId: 3,
      entityRef: "PO-2026-003",
      amount: "196875",
      reason: "Above approval threshold",
      status: "AWAITING_APPROVAL",
      requestedById: 3,
      createdAt: daysAgo(6),
    },
    {
      id: 2,
      entityType: "sales_order",
      entityId: 2,
      entityRef: "SO-2026-002",
      amount: "294000",
      reason: "Above approval threshold",
      status: "AWAITING_APPROVAL",
      requestedById: 3,
      createdAt: daysAgo(3),
    },
    {
      id: 3,
      entityType: "sales_return",
      entityId: 1,
      entityRef: "SR-2026-001",
      amount: "588",
      reason: "Customer return approval",
      status: "APPROVED",
      requestedById: 3,
      createdAt: daysAgo(20),
      decidedAt: daysAgo(19),
    },
  ];
  const auditLogs: Row[] = [
    {
      id: 1,
      action: "LOGIN",
      module: "Auth",
      recordId: "admin@demo.io",
      userId: 1,
      ipAddress: "203.0.113.10",
      createdAt: daysAgo(0),
    },
    {
      id: 2,
      action: "CREATE",
      module: "Purchase",
      recordId: "PO-2026-003",
      userId: 3,
      ipAddress: "203.0.113.11",
      createdAt: daysAgo(6),
    },
    {
      id: 3,
      action: "CREATE",
      module: "Sales",
      recordId: "SO-2026-002",
      userId: 3,
      ipAddress: "203.0.113.11",
      createdAt: daysAgo(3),
    },
    {
      id: 4,
      action: "POST",
      module: "Purchase",
      recordId: "PI-2026-003",
      userId: 1,
      ipAddress: "203.0.113.10",
      createdAt: daysAgo(40),
    },
    {
      id: 5,
      action: "APPROVE",
      module: "Approvals",
      recordId: "SR-2026-001",
      userId: 1,
      ipAddress: "203.0.113.10",
      createdAt: daysAgo(19),
    },
  ];
  const buyerLedger: Row[] = [
    {
      id: 1,
      buyerId: 1,
      date: daysAgo(35),
      refType: "INVOICE",
      refNo: "INV-2026-001",
      description: "Sales invoice",
      debit: "135240",
      credit: "0",
      balanceAfter: "135240",
    },
    {
      id: 2,
      buyerId: 1,
      date: daysAgo(32),
      refType: "PAYMENT",
      refNo: "RCV-2026-001",
      description: "Payment received",
      debit: "0",
      credit: "80000",
      balanceAfter: "55240",
    },
    {
      id: 3,
      buyerId: 1,
      date: daysAgo(20),
      refType: "RETURN",
      refNo: "SR-2026-001",
      description: "Sales return",
      debit: "0",
      credit: "588",
      balanceAfter: "54652",
    },
    {
      id: 4,
      buyerId: 3,
      date: daysAgo(33),
      refType: "INVOICE",
      refNo: "INV-2026-002",
      description: "Sales invoice",
      debit: "152250",
      credit: "0",
      balanceAfter: "152250",
    },
    {
      id: 5,
      buyerId: 4,
      date: daysAgo(70),
      refType: "INVOICE",
      refNo: "INV-2026-003",
      description: "Sales invoice",
      debit: "92400",
      credit: "0",
      balanceAfter: "92400",
    },
    {
      id: 6,
      buyerId: 4,
      date: daysAgo(65),
      refType: "PAYMENT",
      refNo: "RCV-2026-002",
      description: "Payment received",
      debit: "0",
      credit: "92400",
      balanceAfter: "0",
    },
  ];
  const supplierLedger: Row[] = [
    {
      id: 1,
      supplierId: 1,
      date: daysAgo(36),
      refType: "INVOICE",
      refNo: "PI-2026-001",
      description: "Purchase invoice",
      debit: "0",
      credit: "99540",
      balanceAfter: "99540",
    },
    {
      id: 2,
      supplierId: 1,
      date: daysAgo(34),
      refType: "PAYMENT",
      refNo: "PAY-2026-001",
      description: "Payment made",
      debit: "50000",
      credit: "0",
      balanceAfter: "49540",
    },
    {
      id: 3,
      supplierId: 2,
      date: daysAgo(38),
      refType: "INVOICE",
      refNo: "PI-2026-002",
      description: "Purchase invoice",
      debit: "0",
      credit: "149625",
      balanceAfter: "149625",
    },
    {
      id: 4,
      supplierId: 3,
      date: daysAgo(40),
      refType: "INVOICE",
      refNo: "PI-2026-003",
      description: "Purchase invoice",
      debit: "0",
      credit: "176820",
      balanceAfter: "176820",
    },
    {
      id: 5,
      supplierId: 3,
      date: daysAgo(40),
      refType: "PAYMENT",
      refNo: "PAY-2026-000",
      description: "Opening payment",
      debit: "176820",
      credit: "0",
      balanceAfter: "0",
    },
  ];

  return {
    users: [
      {
        id: 1,
        name: "Admin",
        email: "admin@demo.io",
        role: "ADMIN",
        location: "Dhaka",
        status: "ACTIVE",
        password: "admin123",
      },
      {
        id: 2,
        name: "Nadia Rahman",
        email: "manager@demo.io",
        role: "MANAGER",
        location: "Dhaka",
        status: "ACTIVE",
        password: "manager123",
      },
      {
        id: 3,
        name: "Tanvir Hasan",
        email: "staff@demo.io",
        role: "STAFF",
        location: "Gazipur",
        status: "ACTIVE",
        password: "staff123",
      },
    ],
    company: {
      id: 1,
      name: "GarmentTrade Accessories Ltd",
      legalName: "GarmentTrade Accessories Ltd",
      address: "House 12, Road 5, Tejgaon Industrial Area, Dhaka 1208",
      phone: "+880 2 0000000",
      email: "info@demo.io",
      website: "https://demo.example.com",
      vatRegNo: "004567890-0101",
      tradeLicenseNo: "TRAD/DEMO/012345",
      logoUrl: null,
    },
    settings: {
      currency: "BDT",
      vat_mode: "EXCLUSIVE",
      approval_threshold: "100000",
      notify_low_stock: "true",
      notify_approvals: "true",
      doc_invoice_terms:
        "1. Payment due within the agreed terms.\n2. Please include the invoice number on your cheque.",
      doc_invoice_footer: "Thank you for your business!",
      doc_chalan_notes: "Received the above goods in good order and condition.",
      doc_chalan_type: "Delivery",
      bank_name: "City Bank",
      bank_account_name: "GarmentTrade Accessories Ltd",
      bank_account_no: "1102003344556",
      bank_branch: "Tejgaon Branch",
      bank_address: "Dhaka",
    },
    sequences,
    units,
    taxRates,
    categories,
    products,
    warehouses,
    buyers,
    suppliers,
    cashAccounts,
    cashTransactions,
    stockBalances,
    stockMovements,
    purchaseOrders,
    purchaseInvoices,
    supplierPayments,
    salesOrders,
    salesInvoices,
    deliveryChalans,
    paymentCollections,
    salesReturns,
    accounts,
    journalLines,
    approvalRequests,
    auditLogs,
    buyerLedger,
    supplierLedger,
    counters: { id: 1000 },
  };
}

/* ── helpers ────────────────────────────────────────────────────────────── */
const nextId = () => ++store().counters["id"];
const nextDoc = (docType: string) => {
  const s = store().sequences.find((x) => x.docType === docType);
  if (!s) return `${docType.toUpperCase()}-${Date.now()}`;
  s.lastNumber += 1;
  return s.yearInfix
    ? `${s.prefix}-${new Date().getFullYear()}-${String(s.lastNumber).padStart(s.padding, "0")}`
    : `${s.prefix}-${String(s.lastNumber).padStart(s.padding, "0")}`;
};
const log = (action: string, module: string, recordId: string | number | null, userId = 1) => {
  store().auditLogs.unshift({
    id: nextId(),
    action,
    module,
    recordId: String(recordId ?? ""),
    userId,
    ipAddress: "203.0.113.10",
    createdAt: now(),
  });
};

const userOf = (d: DB, id: number | null | undefined) =>
  d.users.find((u: Row) => u.id === id) ?? null;
const prod = (d: DB, id: number) => d.products.find((p: Row) => p.id === Number(id));
const wh = (d: DB, id: number | null) => d.warehouses.find((w: Row) => w.id === Number(id)) ?? null;
const buyer = (d: DB, id: number | null) => d.buyers.find((b: Row) => b.id === Number(id)) ?? null;
const supplier = (d: DB, id: number | null) =>
  d.suppliers.find((s: Row) => s.id === Number(id)) ?? null;
const account = (d: DB, id: number | null) =>
  d.cashAccounts.find((a: Row) => a.id === Number(id)) ?? null;
const productTotalStock = (d: DB, productId: number) =>
  d.stockBalances
    .filter((b: Row) => b.productId === productId)
    .reduce((s: number, b: Row) => s + num(b.quantity), 0);

const partyOut = (d: DB, p: Row, kind: "buyer" | "supplier") => {
  const invs = (kind === "buyer" ? d.salesInvoices : d.purchaseInvoices).filter(
    (i: Row) => (kind === "buyer" ? i.buyerId : i.supplierId) === p.id,
  );
  const open = invs.filter((i: Row) => ["UNPAID", "PARTIAL"].includes(i.status));
  const pays = (kind === "buyer" ? d.paymentCollections : d.supplierPayments).filter(
    (x: Row) => (kind === "buyer" ? x.buyerId : x.supplierId) === p.id,
  );
  const last = pays.sort((a: Row, b: Row) => String(b.date).localeCompare(String(a.date)))[0];
  return {
    ...p,
    outstanding:
      kind === "buyer"
        ? String(open.reduce((s: number, i: Row) => s + num(i.total) - num(i.paidAmount), 0))
        : undefined,
    payable:
      kind === "supplier"
        ? String(open.reduce((s: number, i: Row) => s + num(i.total) - num(i.paidAmount), 0))
        : undefined,
    openInvoices: open.length,
    lastPayment: last ? { date: last.date, amount: last.amount } : null,
    netSales:
      kind === "buyer"
        ? String(invs.reduce((s: number, i: Row) => s + num(i.total), 0))
        : undefined,
    netPurchases:
      kind === "supplier"
        ? String(invs.reduce((s: number, i: Row) => s + num(i.total), 0))
        : undefined,
  };
};

const stockOut = (d: DB, b: Row) => {
  const p = prod(d, b.productId);
  const w = wh(d, b.warehouseId);
  return {
    id: b.id,
    productId: b.productId,
    quantity: b.quantity,
    reserved: b.reserved,
    status: num(b.quantity) <= 0 ? "EMPTY" : "ACTIVE",
    product: p && {
      id: p.id,
      sku: p.sku,
      name: p.name,
      minStock: p.minStock,
      purchasePrice: p.purchasePrice,
      unit: unitOf(d, p.unitId),
      category: catOf(d, p.categoryId),
    },
    warehouse: w && { id: w.id, name: w.name },
  };
};
const unitOf = (d: DB, id: number) => {
  const u = d.units.find((x: Row) => x.id === id);
  return u ? { id: u.id, name: u.name, code: u.code } : null;
};
const catOf = (d: DB, id: number) => {
  const c = d.categories.find((x: Row) => x.id === id);
  return c ? { id: c.id, name: c.name } : null;
};
const productOut = (d: DB, p: Row) => ({
  ...p,
  totalStock: String(productTotalStock(d, p.id)),
  category: catOf(d, p.categoryId),
  unit: unitOf(d, p.unitId),
});
const poOut = (d: DB, o: Row) => ({
  ...o,
  supplier: supplier(d, o.supplierId) && {
    id: o.supplierId,
    name: supplier(d, o.supplierId)!.name,
  },
});
const piOut = (d: DB, i: Row) => ({
  ...i,
  supplier: supplier(d, i.supplierId) && { name: supplier(d, i.supplierId)!.name },
});
const soOut = (d: DB, o: Row) => ({
  ...o,
  buyer: buyer(d, o.buyerId) && { id: o.buyerId, name: buyer(d, o.buyerId)!.name },
});
const siOut = (d: DB, i: Row) => ({
  ...i,
  buyer: buyer(d, i.buyerId) && { id: i.buyerId, name: buyer(d, i.buyerId)!.name },
});
const moveOut = (d: DB, m: Row) => {
  const p = prod(d, m.productId);
  const w = wh(d, m.warehouseId);
  return { ...m, product: p && { name: p.name, sku: p.sku }, warehouse: w && { name: w.name } };
};
const txnOut = (d: DB, t: Row) => ({
  ...t,
  account: account(d, t.accountId) && { name: account(d, t.accountId)!.name },
});
const payOut = (d: DB, p: Row) => ({
  ...p,
  supplier: supplier(d, p.supplierId) && { name: supplier(d, p.supplierId)!.name },
  account: account(d, p.accountId) && { name: account(d, p.accountId)!.name },
});
const trfOut = (d: DB, t: Row) => {
  const p = prod(d, t.productId);
  const fw = wh(d, t.fromWarehouseId);
  const tw = wh(d, t.toWarehouseId);
  return {
    ...t,
    product: p && { name: p.name, sku: p.sku },
    fromWarehouse: fw && { name: fw.name },
    toWarehouse: tw && { name: tw.name },
  };
};
const approvalOut = (d: DB, a: Row) => ({
  ...a,
  requestedBy: userOf(d, a.requestedById) && { name: userOf(d, a.requestedById)!.name },
  entity: entityOf(d, a.entityType, a.entityId),
});
const entityOf = (d: DB, type: string, id: number) => {
  const src =
    type === "purchase_order"
      ? d.purchaseOrders
      : type === "sales_order"
        ? d.salesOrders
        : type === "sales_return"
          ? d.salesReturns
          : [];
  const e = src.find((x: Row) => x.id === id);
  return e ? { ...e, items: undefined } : null;
};
const auditOut = (d: DB, a: Row) => ({
  ...a,
  user: userOf(d, a.userId) && { name: userOf(d, a.userId)!.name },
});

/* line-item math: subtotal → per-line VAT → discount → total */
const buildItems = (d: DB, items: Row[]) =>
  (items ?? []).map((i: Row) => {
    const p = prod(d, i.productId);
    const rate = num(i.rate ?? p?.salesPrice);
    const qty = num(i.quantity);
    const taxRate = d.taxRates.find((t: Row) => t.id === (i.taxRateId ?? p?.taxRateId));
    const line = qty * rate;
    const taxAmount = taxRate ? Math.round(line * num(taxRate.ratePercent)) / 100 : 0;
    return {
      productId: Number(i.productId),
      quantity: String(qty),
      rate: String(rate),
      taxRateId: taxRate?.id ?? null,
      taxAmount: String(taxAmount),
      total: String(Math.round((line + taxAmount) * 100) / 100),
    };
  });
const itemTotals = (items: Row[]) => ({
  subtotal: items.reduce((s: number, i: Row) => s + num(i.total) - num(i.taxAmount), 0),
  taxTotal: items.reduce((s: number, i: Row) => s + num(i.taxAmount), 0),
  total: items.reduce((s: number, i: Row) => s + num(i.total), 0),
});

const adjustStock = (
  d: DB,
  productId: number,
  warehouseId: number,
  delta: number,
  type: string,
  refNo: string,
  reason: string,
) => {
  let bal = d.stockBalances.find(
    (b: Row) => b.productId === productId && b.warehouseId === warehouseId,
  );
  if (!bal) {
    bal = { id: nextId(), productId, warehouseId, quantity: "0", reserved: "0" };
    d.stockBalances.push(bal);
  }
  const after = num(bal.quantity) + delta;
  bal.quantity = String(Math.max(0, after));
  d.stockMovements.unshift({
    id: nextId(),
    productId,
    warehouseId,
    type,
    quantity: String(Math.abs(delta)),
    qtyAfter: bal.quantity,
    refNo,
    reason,
    createdAt: now(),
  });
};

const addLedger = (
  list: Row[],
  partyField: string,
  partyId: number,
  refType: string,
  refNo: string,
  description: string,
  debit: number,
  credit: number,
) => {
  const prev = list.filter((l: Row) => num(l[partyField]) === partyId);
  const bal = prev.length ? num(prev[prev.length - 1].balanceAfter) : 0;
  list.push({
    id: nextId(),
    [partyField]: partyId,
    date: now(),
    refType,
    refNo,
    description,
    debit: String(debit),
    credit: String(credit),
    balanceAfter: String(bal + debit - credit),
  });
};

/* aging buckets shared by receivable/payable reports */
const ageBuckets = (items: { party: string; date: string; due: string | null; open: number }[]) => {
  const buckets = { current: "0", d30: "0", d60: "0", d90plus: "0" };
  const sums: Record<string, number> = { current: 0, d30: 0, d60: 0, d90plus: 0 };
  const rows = items.map((i) => {
    const age = Math.floor((Date.now() - new Date(i.due ?? i.date).getTime()) / 864e5);
    const bucket = age <= 30 ? "current" : age <= 60 ? "d30" : age <= 90 ? "d60" : "d90plus";
    sums[bucket] = (sums[bucket] ?? 0) + i.open;
    return { ...i, open: String(i.open), ageDays: age, bucket };
  });
  (Object.keys(buckets) as (keyof typeof buckets)[]).forEach((k) => (buckets[k] = String(sums[k])));
  return { rows, buckets };
};

/* report helpers over journalLines */
const acctTotals = (d: DB) => {
  const map = new Map<number, { account: Row; debit: number; credit: number }>();
  for (const l of d.journalLines) {
    const a = d.accounts.find((x: Row) => x.code === String(l.accountId));
    const e = map.get(Number(l.accountId)) ?? { account: a, debit: 0, credit: 0 };
    e.debit += num(l.debit);
    e.credit += num(l.credit);
    map.set(Number(l.accountId), e);
  }
  return map;
};

/* ── CSV export ─────────────────────────────────────────────────────────── */
const toCsv = (rows: Row[]) => {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: unknown) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  return [headers.join(","), ...rows.map((r) => headers.map((h) => esc(r[h])).join(","))].join(
    "\n",
  );
};

/* ── router ─────────────────────────────────────────────────────────────── */
export async function demoApi(
  method: string,
  rawPath: string,
  body: Row,
  auth: string | null,
): Promise<Row> {
  const d = store();
  const [pathOnly, qs] = rawPath.split("?");
  const path = pathOnly!.replace(/^\/api/, "") || "/";
  const q = new URLSearchParams(qs ?? "");
  const seg = (re: RegExp) => path.match(re);
  method = method.toUpperCase();
  const user = parseToken(auth);

  /* auth */
  if (seg(/^\/auth\/login$/) && method === "POST") {
    const u = d.users.find(
      (x: Row) => x.email === String(body?.email ?? "").toLowerCase() && x.status === "ACTIVE",
    );
    if (!u || u.password !== body?.password) throw new DemoApiError(401, "Invalid credentials");
    log("LOGIN", "Auth", u.email, u.id);
    const authUser = { id: u.id, name: u.name, email: u.email, role: u.role };
    return { token: issueToken(authUser), user: authUser };
  }
  if (seg(/^\/auth\/me$/) && method === "GET") {
    if (!user) throw new DemoApiError(401, "Session expired");
    return { user };
  }

  if (!user) throw new DemoApiError(401, "Session expired — please sign in again");

  /* parties */
  for (const [route, coll, kind] of [
    ["buyers", "buyers", "buyer"],
    ["suppliers", "suppliers", "supplier"],
  ] as const) {
    if (seg(new RegExp(`^\\/${route}$`)) && method === "GET") {
      const search = q.get("q")?.toLowerCase();
      let rows = (d as Row)[coll].map((p: Row) => partyOut(d, p, kind));
      if (search)
        rows = rows.filter((p: Row) =>
          `${p.code} ${p.name} ${p.contactPerson ?? ""}`.toLowerCase().includes(search),
        );
      return rows.sort((a: Row, b: Row) => String(a.name).localeCompare(String(b.name)));
    }
    if (seg(new RegExp(`^\\/${route}$`)) && method === "POST") {
      const code = nextDoc(`${kind}_code`);
      const row = {
        id: nextId(),
        code,
        ...body,
        creditLimit: String(body?.creditLimit ?? 0),
        status: "ACTIVE",
      };
      (d as Row)[coll].push(row);
      log("CREATE", kind === "buyer" ? "Buyers" : "Suppliers", code);
      save();
      return row;
    }
    const pm = seg(new RegExp(`^\\/${route}\\/(\\d+)(\\/(ledger|history|payments))?$`));
    if (pm) {
      const p = (d as Row)[coll].find((x: Row) => x.id === Number(pm[1]));
      if (!p) throw new DemoApiError(404, `${kind === "buyer" ? "Buyer" : "Supplier"} not found`);
      const sub = pm[3];
      if (!sub && method === "GET") return partyOut(d, p, kind);
      if (!sub && method === "PUT") {
        Object.assign(p, body);
        save();
        return p;
      }
      if (!sub && method === "DELETE") {
        (d as Row)[coll] = (d as Row)[coll].filter((x: Row) => x.id !== p.id);
        log("DELETE", kind === "buyer" ? "Buyers" : "Suppliers", p.code);
        save();
        return { ok: true };
      }
      if (sub === "ledger")
        return (kind === "buyer" ? d.buyerLedger : d.supplierLedger)
          .filter((l: Row) => num(l[kind === "buyer" ? "buyerId" : "supplierId"]) === p.id)
          .sort((a: Row, b: Row) => String(b.date).localeCompare(String(a.date)));
      if (sub === "history") {
        const invs = (kind === "buyer" ? d.salesInvoices : d.purchaseInvoices).filter(
          (i: Row) => (kind === "buyer" ? i.buyerId : i.supplierId) === p.id,
        );
        return invs.map((i: Row) => ({
          ...i,
          items: (i.items ?? []).map((it: Row) => ({ ...it, product: prod(d, it.productId) })),
        }));
      }
      if (sub === "payments")
        return (kind === "buyer" ? d.paymentCollections : d.supplierPayments).filter(
          (x: Row) => (kind === "buyer" ? x.buyerId : x.supplierId) === p.id,
        );
    }
  }

  /* products / categories / units */
  if (seg(/^\/products$/) && method === "GET") return d.products.map((p: Row) => productOut(d, p));
  if (seg(/^\/products$/) && method === "POST") {
    const row = {
      id: nextId(),
      sku: body?.sku ?? `SKU-${nextId()}`,
      status: "ACTIVE",
      taxRateId: body?.taxRateId ?? 1,
      ...body,
    };
    d.products.push(row);
    log("CREATE", "Products", row.sku);
    save();
    return productOut(d, row);
  }
  const prm = seg(/^\/products\/(\d+)$/);
  if (prm) {
    const p = prod(d, Number(prm[1]));
    if (!p) throw new DemoApiError(404, "Product not found");
    if (method === "PUT") {
      Object.assign(p, body);
      save();
      return productOut(d, p);
    }
    if (method === "DELETE") {
      d.products = d.products.filter((x: Row) => x.id !== p.id);
      save();
      return { ok: true };
    }
  }
  if (seg(/^\/categories$/) && method === "GET")
    return d.categories.map((c: Row) => ({
      ...c,
      _count: { products: d.products.filter((p: Row) => p.categoryId === c.id).length },
    }));
  if (seg(/^\/categories$/) && method === "POST") {
    const row = {
      id: nextId(),
      name: body?.name,
      code:
        body?.code ??
        String(body?.name ?? "")
          .slice(0, 3)
          .toUpperCase(),
      description: body?.description ?? null,
      taxRateId: body?.taxRateId ?? null,
    };
    d.categories.push(row);
    save();
    return row;
  }
  if (seg(/^\/units$/) && method === "GET") return d.units;
  if (seg(/^\/units$/) && method === "POST") {
    const row = { id: nextId(), name: body?.name, code: body?.code };
    d.units.push(row);
    save();
    return row;
  }

  /* warehouses */
  if (seg(/^\/warehouses$/) && method === "GET")
    return d.warehouses.map((w: Row) => ({
      ...w,
      _count: { stockBalances: d.stockBalances.filter((b: Row) => b.warehouseId === w.id).length },
    }));
  if (seg(/^\/warehouses$/) && method === "POST") {
    const row = {
      id: nextId(),
      code: body?.code ?? `WH-${String(d.warehouses.length + 1).padStart(2, "0")}`,
      status: "ACTIVE",
      ...body,
    };
    d.warehouses.push(row);
    log("CREATE", "Warehouses", row.code);
    save();
    return row;
  }
  if (seg(/^\/warehouses\/transfers$/) && method === "POST") {
    const refNo = nextDoc("stock_transfer");
    adjustStock(
      d,
      num(body?.productId),
      num(body?.fromWarehouseId),
      -num(body?.quantity),
      "TRANSFER_OUT",
      refNo,
      "Inter-warehouse transfer",
    );
    adjustStock(
      d,
      num(body?.productId),
      num(body?.toWarehouseId),
      num(body?.quantity),
      "TRANSFER_IN",
      refNo,
      "Inter-warehouse transfer",
    );
    const t = {
      id: nextId(),
      transferNo: refNo,
      productId: num(body?.productId),
      quantity: String(body?.quantity),
      fromWarehouseId: num(body?.fromWarehouseId),
      toWarehouseId: num(body?.toWarehouseId),
      transferDate: body?.date ?? now(),
      status: "COMPLETED",
      notes: body?.notes ?? null,
    };
    (d as Row).transfers = (d as Row).transfers ?? [];
    (d as Row).transfers.push(t);
    log("CREATE", "Warehouses", refNo);
    save();
    return trfOut(d, t);
  }
  if (seg(/^\/warehouses\/transfers\/list$/) && method === "GET")
    return ((d as Row).transfers ?? []).map((t: Row) => trfOut(d, t));
  const wm = seg(/^\/warehouses\/(\d+)$/);
  if (wm) {
    const w = wh(d, Number(wm[1]));
    if (!w) throw new DemoApiError(404, "Warehouse not found");
    if (method === "PUT") {
      Object.assign(w, body);
      save();
      return w;
    }
    if (method === "DELETE") {
      d.warehouses = d.warehouses.filter((x: Row) => x.id !== w.id);
      save();
      return { ok: true };
    }
  }

  /* inventory */
  if (seg(/^\/inventory\/stock$/) && method === "GET") {
    let rows = d.stockBalances.map((b: Row) => stockOut(d, b));
    const wid = q.get("warehouseId");
    if (wid) rows = rows.filter((r: Row) => num(r.warehouse?.id) === num(wid));
    return rows;
  }
  if (seg(/^\/inventory\/movements$/) && method === "GET")
    return d.stockMovements.map((m: Row) => moveOut(d, m));
  if (seg(/^\/inventory\/low-stock$/) && method === "GET")
    return d.products
      .map((p: Row) => ({
        ...productOut(d, p),
        balances: d.stockBalances
          .filter((b: Row) => b.productId === p.id)
          .map((b: Row) => ({
            warehouse: { name: wh(d, b.warehouseId)?.name },
            quantity: b.quantity,
          })),
      }))
      .filter((p: Row) => num(p.totalStock) < num(p.minStock));
  if (seg(/^\/inventory\/adjustments$/) && method === "POST") {
    const refNo = nextDoc("stock_adjustment");
    const delta = body?.type === "OUT" ? -num(body?.quantity) : num(body?.quantity);
    adjustStock(
      d,
      num(body?.productId),
      num(body?.warehouseId),
      delta,
      body?.type === "OUT" ? "OUT" : "IN",
      refNo,
      body?.reason ?? "Manual adjustment",
    );
    log("CREATE", "Inventory", refNo);
    save();
    return { id: nextId(), adjustmentNo: refNo };
  }

  /* purchase */
  if (seg(/^\/purchase\/orders$/) && method === "GET")
    return d.purchaseOrders.map((o: Row) => poOut(d, o));
  if (seg(/^\/purchase\/orders\/pending$/) && method === "GET")
    return d.purchaseOrders
      .filter((o: Row) => o.status !== "RECEIVED" && o.status !== "CANCELLED")
      .map((o: Row) => poOut(d, o));
  if (seg(/^\/purchase\/orders$/) && method === "POST") {
    const items = buildItems(d, body?.items);
    const t = itemTotals(items);
    const needsApproval = t.total > num(d.settings["approval_threshold"]);
    const o = {
      id: nextId(),
      poNo: nextDoc("purchase_order"),
      supplierId: num(body?.supplierId),
      orderDate: body?.orderDate ?? now(),
      expectedDate: body?.expectedDate ?? null,
      status: "SUBMITTED",
      approvalStatus: needsApproval ? "AWAITING_APPROVAL" : "APPROVED",
      approvedById: needsApproval ? null : user.id,
      notes: body?.notes ?? null,
      total: String(t.total),
      createdById: user.id,
      createdAt: now(),
      items,
    };
    d.purchaseOrders.unshift(o);
    if (needsApproval)
      d.approvalRequests.unshift({
        id: nextId(),
        entityType: "purchase_order",
        entityId: o.id,
        entityRef: o.poNo,
        amount: o.total,
        reason: "Above approval threshold",
        status: "AWAITING_APPROVAL",
        requestedById: user.id,
        createdAt: now(),
      });
    log("CREATE", "Purchase", o.poNo);
    save();
    return poOut(d, o);
  }
  const pom = seg(/^\/purchase\/orders\/(\d+)$/);
  if (pom && method === "DELETE") {
    d.purchaseOrders = d.purchaseOrders.filter((o: Row) => o.id !== Number(pom[1]));
    save();
    return { ok: true };
  }
  if (seg(/^\/purchase\/invoices$/) && method === "GET")
    return d.purchaseInvoices.map((i: Row) => piOut(d, i));
  if (seg(/^\/purchase\/invoices$/) && method === "POST") {
    const items = buildItems(d, body?.items);
    const t = itemTotals(items);
    const inv = {
      id: nextId(),
      invNo: nextDoc("purchase_invoice"),
      orderId: body?.orderId ?? null,
      supplierId: num(body?.supplierId),
      warehouseId: num(body?.warehouseId),
      invoiceDate: body?.invoiceDate ?? now(),
      status: "UNPAID",
      subtotal: String(t.subtotal),
      taxTotal: String(t.taxTotal),
      discount: "0",
      total: String(t.total),
      paidAmount: "0",
      notes: body?.notes ?? null,
      createdById: user.id,
      createdAt: now(),
      items,
    };
    d.purchaseInvoices.unshift(inv);
    items.forEach((i: Row) =>
      adjustStock(
        d,
        i.productId,
        num(body?.warehouseId),
        num(i.quantity),
        "IN",
        inv.invNo,
        "Purchase receipt",
      ),
    );
    addLedger(
      d.supplierLedger,
      "supplierId",
      num(body?.supplierId),
      "INVOICE",
      inv.invNo,
      "Purchase invoice",
      0,
      t.total,
    );
    if (body?.orderId) {
      const o = d.purchaseOrders.find((x: Row) => x.id === num(body.orderId));
      if (o) o.status = "RECEIVED";
    }
    log("POST", "Purchase", inv.invNo);
    save();
    return piOut(d, inv);
  }
  if (seg(/^\/purchase\/payments$/) && method === "GET")
    return d.supplierPayments.map((p: Row) => payOut(d, p));
  if (seg(/^\/purchase\/payments$/) && method === "POST") {
    const pay = {
      id: nextId(),
      paymentNo: nextDoc("supplier_payment"),
      supplierId: num(body?.supplierId),
      invoiceId: body?.invoiceId ? num(body.invoiceId) : null,
      accountId: num(body?.accountId),
      date: body?.date ?? now(),
      amount: String(num(body?.amount)),
      method: body?.method ?? null,
      reference: body?.reference ?? null,
      notes: body?.notes ?? null,
      createdById: user.id,
    };
    d.supplierPayments.unshift(pay);
    const acc = account(d, pay.accountId);
    if (acc) acc.balance = String(num(acc.balance) - num(pay.amount));
    if (pay.invoiceId) {
      const inv = d.purchaseInvoices.find((i: Row) => i.id === pay.invoiceId);
      if (inv) {
        inv.paidAmount = String(num(inv.paidAmount) + num(pay.amount));
        inv.status = num(inv.paidAmount) >= num(inv.total) ? "PAID" : "PARTIAL";
      }
    }
    addLedger(
      d.supplierLedger,
      "supplierId",
      pay.supplierId,
      "PAYMENT",
      pay.paymentNo,
      "Payment made",
      num(pay.amount),
      0,
    );
    log("CREATE", "Purchase", pay.paymentNo);
    save();
    return payOut(d, pay);
  }

  /* sales */
  if (seg(/^\/sales\/orders$/) && method === "GET")
    return d.salesOrders.map((o: Row) => soOut(d, o));
  if (seg(/^\/sales\/orders$/) && method === "POST") {
    const items = buildItems(d, body?.items);
    const t = itemTotals(items);
    const discount = num(body?.discount);
    const total = Math.max(0, t.total - discount);
    const needsApproval = total > num(d.settings["approval_threshold"]);
    const o = {
      id: nextId(),
      soNo: nextDoc("sales_order"),
      buyerId: num(body?.buyerId),
      orderDate: body?.orderDate ?? now(),
      dueDate: body?.dueDate ?? null,
      status: "CONFIRMED",
      approvalStatus: needsApproval ? "AWAITING_APPROVAL" : "APPROVED",
      approvedById: needsApproval ? null : user.id,
      discount: String(discount),
      notes: body?.notes ?? null,
      total: String(total),
      createdById: user.id,
      createdAt: now(),
      items,
    };
    d.salesOrders.unshift(o);
    if (needsApproval)
      d.approvalRequests.unshift({
        id: nextId(),
        entityType: "sales_order",
        entityId: o.id,
        entityRef: o.soNo,
        amount: o.total,
        reason: "Above approval threshold",
        status: "AWAITING_APPROVAL",
        requestedById: user.id,
        createdAt: now(),
      });
    log("CREATE", "Sales", o.soNo);
    save();
    return soOut(d, o);
  }
  const som = seg(/^\/sales\/orders\/(\d+)$/);
  if (som && method === "DELETE") {
    d.salesOrders = d.salesOrders.filter((o: Row) => o.id !== Number(som[1]));
    save();
    return { ok: true };
  }
  if (seg(/^\/sales\/invoices$/) && method === "GET")
    return d.salesInvoices.map((i: Row) => siOut(d, i));
  if (seg(/^\/sales\/invoices$/) && method === "POST") {
    const items = buildItems(d, body?.items);
    const t = itemTotals(items);
    const discount = num(body?.discount);
    const total = Math.max(0, t.total - discount);
    const inv = {
      id: nextId(),
      invNo: nextDoc("sales_invoice"),
      salesOrderId: body?.salesOrderId ?? null,
      buyerId: num(body?.buyerId),
      invoiceDate: body?.invoiceDate ?? now(),
      dueDate: body?.dueDate ?? null,
      status: "UNPAID",
      subtotal: String(t.subtotal),
      taxTotal: String(t.taxTotal),
      discount: String(discount),
      total: String(total),
      paidAmount: "0",
      vatMode: body?.vatMode ?? d.settings["vat_mode"],
      brand: body?.brand ?? null,
      grossWeight: body?.grossWeight ?? null,
      notes: body?.notes ?? null,
      createdById: user.id,
      createdAt: now(),
      items,
    };
    d.salesInvoices.unshift(inv);
    addLedger(
      d.buyerLedger,
      "buyerId",
      num(body?.buyerId),
      "INVOICE",
      inv.invNo,
      "Sales invoice",
      total,
      0,
    );
    if (body?.salesOrderId) {
      const o = d.salesOrders.find((x: Row) => x.id === num(body.salesOrderId));
      if (o) o.status = "INVOICED";
    }
    log("POST", "Sales", inv.invNo);
    save();
    return siOut(d, inv);
  }
  const sim = seg(/^\/sales\/invoices\/(\d+)$/);
  if (sim && method === "PUT") {
    const inv = d.salesInvoices.find((i: Row) => i.id === Number(sim[1]));
    if (!inv) throw new DemoApiError(404, "Invoice not found");
    Object.assign(inv, body);
    save();
    return siOut(d, inv);
  }
  if (seg(/^\/sales\/chalans$/) && method === "GET")
    return d.deliveryChalans.map((c: Row) => ({
      ...c,
      buyer: buyer(d, c.buyerId) && { name: buyer(d, c.buyerId)!.name },
      warehouse: wh(d, c.warehouseId) && { name: wh(d, c.warehouseId)!.name },
    }));
  if (seg(/^\/sales\/chalans$/) && method === "POST") {
    const c = {
      id: nextId(),
      dcNo: nextDoc("delivery_chalan"),
      salesOrderId: body?.salesOrderId ?? null,
      buyerId: num(body?.buyerId),
      warehouseId: num(body?.warehouseId),
      date: body?.date ?? now(),
      driverName: body?.driverName ?? null,
      vehicleNo: body?.vehicleNo ?? null,
      styleNo: body?.styleNo ?? null,
      erpNo: body?.erpNo ?? null,
      notes: body?.notes ?? null,
      createdById: user.id,
      items: (body?.items ?? []).map((i: Row) => ({
        productId: num(i.productId),
        quantity: String(num(i.quantity)),
      })),
    };
    d.deliveryChalans.unshift(c);
    c.items.forEach((i: Row) =>
      adjustStock(
        d,
        i.productId,
        num(body?.warehouseId),
        -num(i.quantity),
        "OUT",
        c.dcNo,
        "Delivery chalan",
      ),
    );
    if (body?.salesOrderId) {
      const o = d.salesOrders.find((x: Row) => x.id === num(body.salesOrderId));
      if (o) o.status = "DELIVERED";
    }
    log("POST", "Sales", c.dcNo);
    save();
    return c;
  }
  const dcm = seg(/^\/sales\/chalans\/(\d+)$/);
  if (dcm && method === "PUT") {
    const c = d.deliveryChalans.find((x: Row) => x.id === Number(dcm[1]));
    if (!c) throw new DemoApiError(404, "Chalan not found");
    Object.assign(c, body);
    save();
    return c;
  }
  if (seg(/^\/sales\/collections$/) && method === "GET")
    return d.paymentCollections.map((p: Row) => ({
      ...p,
      buyer: buyer(d, p.buyerId) && { name: buyer(d, p.buyerId)!.name },
      account: account(d, p.accountId) && { name: account(d, p.accountId)!.name },
    }));
  if (seg(/^\/sales\/collections$/) && method === "POST") {
    const pay = {
      id: nextId(),
      paymentNo: nextDoc("payment_collection"),
      buyerId: num(body?.buyerId),
      invoiceId: body?.invoiceId ? num(body.invoiceId) : null,
      accountId: num(body?.accountId),
      date: body?.date ?? now(),
      amount: String(num(body?.amount)),
      method: body?.method ?? null,
      reference: body?.reference ?? null,
      notes: body?.notes ?? null,
      createdById: user.id,
    };
    d.paymentCollections.unshift(pay);
    const acc = account(d, pay.accountId);
    if (acc) acc.balance = String(num(acc.balance) + num(pay.amount));
    if (pay.invoiceId) {
      const inv = d.salesInvoices.find((i: Row) => i.id === pay.invoiceId);
      if (inv) {
        inv.paidAmount = String(num(inv.paidAmount) + num(pay.amount));
        inv.status = num(inv.paidAmount) >= num(inv.total) ? "PAID" : "PARTIAL";
      }
    }
    addLedger(
      d.buyerLedger,
      "buyerId",
      pay.buyerId,
      "PAYMENT",
      pay.paymentNo,
      "Payment received",
      0,
      num(pay.amount),
    );
    d.cashTransactions.unshift({
      id: nextId(),
      txnNo: pay.paymentNo,
      accountId: pay.accountId,
      type: "RECEIPT",
      amount: pay.amount,
      date: pay.date,
      particulars: `Collection ${pay.paymentNo} — ${buyer(d, pay.buyerId)?.name ?? ""}`,
      reference: pay.reference,
      balanceAfter: acc?.balance ?? "0",
    });
    log("CREATE", "Sales", pay.paymentNo);
    save();
    return pay;
  }
  if (seg(/^\/sales\/returns$/) && method === "GET")
    return d.salesReturns.map((r: Row) => {
      const b = buyer(d, r.buyerId);
      const inv = d.salesInvoices.find((i: Row) => i.id === r.invoiceId);
      return { ...r, buyer: b && { name: b.name }, invoice: inv && { invNo: inv.invNo } };
    });
  if (seg(/^\/sales\/returns$/) && method === "POST") {
    const amt = (body?.items ?? []).reduce(
      (s: number, i: Row) => s + num(i.quantity) * num(i.rate ?? prod(d, i.productId)?.salesPrice),
      0,
    );
    const r = {
      id: nextId(),
      returnNo: nextDoc("sales_return"),
      invoiceId: body?.invoiceId ? num(body.invoiceId) : null,
      buyerId: num(body?.buyerId),
      date: body?.date ?? now(),
      reason: body?.reason ?? null,
      status: "POSTED",
      refundAmount: String(amt),
      createdById: user.id,
      items: body?.items ?? [],
    };
    d.salesReturns.unshift(r);
    log("CREATE", "Sales", r.returnNo);
    save();
    return r;
  }

  /* cash & bank */
  if (seg(/^\/cash-bank\/accounts$/) && method === "GET") return d.cashAccounts;
  if (seg(/^\/cash-bank\/accounts$/) && method === "POST") {
    const a = {
      id: nextId(),
      type: "CASH",
      bankName: null,
      accountNo: null,
      status: "ACTIVE",
      ...body,
      balance: String(body?.openingBalance ?? body?.balance ?? 0),
    };
    d.cashAccounts.push(a);
    log("CREATE", "Cash & Bank", a.name);
    save();
    return a;
  }
  const cam = seg(/^\/cash-bank\/accounts\/(\d+)$/);
  if (cam) {
    const a = account(d, Number(cam[1]));
    if (!a) throw new DemoApiError(404, "Account not found");
    if (method === "PUT") {
      Object.assign(a, body);
      save();
      return a;
    }
    if (method === "DELETE") {
      d.cashAccounts = d.cashAccounts.filter((x: Row) => x.id !== a.id);
      save();
      return { ok: true };
    }
  }
  if (seg(/^\/cash-bank\/transactions$/) && method === "GET")
    return d.cashTransactions.map((t: Row) => txnOut(d, t));
  if (seg(/^\/cash-bank\/transactions$/) && method === "POST") {
    const type = String(body?.type ?? "RECEIPT");
    const amt = num(body?.amount);
    const txnNo = nextDoc("cash_transaction");
    const mk = (accId: number, t: string, amount: number, particulars: string) => {
      const acc = account(d, accId);
      if (!acc) return;
      acc.balance = String(
        num(acc.balance) + (t === "RECEIPT" || t === "TRANSFER_IN" ? amount : -amount),
      );
      d.cashTransactions.unshift({
        id: nextId(),
        txnNo,
        accountId: accId,
        type: t,
        amount: String(amount),
        date: body?.date ?? now(),
        particulars,
        reference: body?.reference ?? null,
        balanceAfter: acc.balance,
      });
    };
    if (type === "TRANSFER") {
      mk(num(body?.fromAccountId), "TRANSFER_OUT", amt, body?.particulars ?? "Account transfer");
      mk(num(body?.toAccountId), "TRANSFER_IN", amt, body?.particulars ?? "Account transfer");
    } else {
      mk(
        num(body?.accountId),
        type,
        amt,
        body?.particulars ?? (type === "RECEIPT" ? "Receipt" : "Payment"),
      );
    }
    log("CREATE", "Cash & Bank", txnNo);
    save();
    return { txnNo };
  }

  /* approvals */
  if (seg(/^\/approvals$/) && method === "GET") {
    let rows = d.approvalRequests.map((a: Row) => approvalOut(d, a));
    const st = q.get("status");
    if (st) rows = rows.filter((r: Row) => r.status === st);
    return rows;
  }
  const apm = seg(/^\/approvals\/(\d+)\/(approve|reject)$/);
  if (apm && method === "POST") {
    const a = d.approvalRequests.find((x: Row) => x.id === Number(apm[1]));
    if (!a) throw new DemoApiError(404, "Request not found");
    a.status = apm[2] === "approve" ? "APPROVED" : "REJECTED";
    a.decidedAt = now();
    a.decidedById = user.id;
    const entity = entityOf(d, a.entityType, a.entityId);
    if (entity && "approvalStatus" in entity) entity.approvalStatus = a.status;
    // re-fetch entity from store so the status sticks
    const list =
      a.entityType === "purchase_order"
        ? d.purchaseOrders
        : a.entityType === "sales_order"
          ? d.salesOrders
          : d.salesReturns;
    const e = list.find((x: Row) => x.id === a.entityId);
    if (e) e.approvalStatus = a.status;
    log(apm[2]!.toUpperCase(), "Approvals", a.entityRef);
    save();
    return approvalOut(d, a);
  }

  /* audit */
  if (seg(/^\/audit-log$/) && method === "GET") {
    let rows = d.auditLogs.map((a: Row) => auditOut(d, a));
    const mod = q.get("module");
    if (mod && mod !== "all") rows = rows.filter((r: Row) => r.module === mod);
    const from = q.get("from");
    if (from) rows = rows.filter((r: Row) => String(r.createdAt) >= from);
    const to = q.get("to");
    if (to) rows = rows.filter((r: Row) => String(r.createdAt) <= to + "T23:59:59");
    return rows;
  }

  /* settings */
  if (seg(/^\/settings$/) && method === "GET") return { ...d.settings };
  if (seg(/^\/settings$/) && method === "PUT") {
    Object.assign(d.settings, body ?? {});
    save();
    return { ...d.settings };
  }
  if (seg(/^\/settings\/company$/) && method === "GET") return d.company;
  if (seg(/^\/settings\/company$/) && method === "PUT") {
    Object.assign(d.company, body ?? {});
    save();
    return d.company;
  }
  if (seg(/^\/settings\/sequences$/) && method === "GET") return d.sequences;
  if (seg(/^\/settings\/users$/) && method === "GET")
    return d.users.map((u: Row) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      location: u.location,
      status: u.status,
    }));
  if (seg(/^\/settings\/users$/) && method === "POST") {
    const u = { id: nextId(), status: "ACTIVE", password: body?.password ?? "demo1234", ...body };
    d.users.push(u);
    log("CREATE", "Settings", u.email);
    save();
    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: u.role,
      location: u.location,
      status: u.status,
    };
  }
  const sum2 = seg(/^\/settings\/users\/(\d+)$/);
  if (sum2) {
    const u = d.users.find((x: Row) => x.id === Number(sum2[1]));
    if (!u) throw new DemoApiError(404, "User not found");
    if (method === "PUT") {
      Object.assign(u, body);
      save();
      return {
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        location: u.location,
        status: u.status,
      };
    }
    if (method === "DELETE") {
      d.users = d.users.filter((x: Row) => x.id !== u.id);
      save();
      return { ok: true };
    }
  }

  /* vat */
  if (seg(/^\/vat\/rates$/) && method === "GET") return d.taxRates;
  if (seg(/^\/vat\/rates$/) && method === "POST") {
    const r = {
      id: nextId(),
      status: "ACTIVE",
      effectiveFrom: now().slice(0, 10),
      ...body,
      ratePercent: String(body?.ratePercent ?? 0),
    };
    d.taxRates.push(r);
    save();
    return r;
  }
  const vrm = seg(/^\/vat\/rates\/(\d+)$/);
  if (vrm && method === "PUT") {
    const r = d.taxRates.find((x: Row) => x.id === Number(vrm[1]));
    if (!r) throw new DemoApiError(404, "Tax rate not found");
    Object.assign(r, body);
    save();
    return r;
  }
  if (seg(/^\/vat\/report$/) && method === "GET") {
    // Group sales/purchase tax totals by invoice month.
    const periods = new Map<string, Row>();
    const use = (date: string) => String(date).slice(0, 7);
    const bump = (key: string, field: string, v: number) => {
      const p = periods.get(key) ?? {
        period: key,
        taxableSales: 0,
        outputVat: 0,
        taxablePurchase: 0,
        inputVat: 0,
      };
      (p as Row)[field] += v;
      periods.set(key, p);
    };
    d.salesInvoices.forEach((i: Row) => {
      const k = use(i.invoiceDate);
      bump(k, "taxableSales", num(i.subtotal));
      bump(k, "outputVat", num(i.taxTotal));
    });
    d.purchaseInvoices.forEach((i: Row) => {
      const k = use(i.invoiceDate);
      bump(k, "taxablePurchase", num(i.subtotal));
      bump(k, "inputVat", num(i.taxTotal));
    });
    return [...periods.values()]
      .sort((a: Row, b: Row) => String(b.period).localeCompare(String(a.period)))
      .map((p: Row) => ({
        ...p,
        taxableSales: String(p.taxableSales),
        outputVat: String(p.outputVat),
        taxablePurchase: String(p.taxablePurchase),
        inputVat: String(p.inputVat),
        netPayable: String(Math.max(0, p.outputVat - p.inputVat)),
      }));
  }

  /* dashboard */
  if (seg(/^\/dashboard$/) && method === "GET") {
    const sales = d.salesInvoices.reduce((s: number, i: Row) => s + num(i.total), 0);
    const purchase = d.purchaseInvoices.reduce((s: number, i: Row) => s + num(i.total), 0);
    const receivable = d.salesInvoices
      .filter((i: Row) => ["UNPAID", "PARTIAL"].includes(i.status))
      .reduce((s: number, i: Row) => s + num(i.total) - num(i.paidAmount), 0);
    const payable = d.purchaseInvoices
      .filter((i: Row) => ["UNPAID", "PARTIAL"].includes(i.status))
      .reduce((s: number, i: Row) => s + num(i.total) - num(i.paidAmount), 0);
    const overdue = d.salesInvoices
      .filter((i: Row) => i.status !== "PAID" && i.dueDate && String(i.dueDate) < now())
      .reduce((s: number, i: Row) => s + num(i.total) - num(i.paidAmount), 0);
    const cogs = d.journalLines
      .filter((l: Row) => l.accountId === 5100)
      .reduce((s: number, l: Row) => s + num(l.debit) - num(l.credit), 0);
    const byMonth = new Map<string, { sales: number; purchase: number }>();
    const mo = (date: string) => String(date).slice(0, 7);
    d.salesInvoices.forEach((i: Row) => {
      const k = mo(i.invoiceDate);
      const e = byMonth.get(k) ?? { sales: 0, purchase: 0 };
      e.sales += num(i.total);
      byMonth.set(k, e);
    });
    d.purchaseInvoices.forEach((i: Row) => {
      const k = mo(i.invoiceDate);
      const e = byMonth.get(k) ?? { sales: 0, purchase: 0 };
      e.purchase += num(i.total);
      byMonth.set(k, e);
    });
    const topB = new Map<number, { orders: number; sales: number }>();
    d.salesInvoices.forEach((i: Row) => {
      const e = topB.get(i.buyerId) ?? { orders: 0, sales: 0 };
      e.orders += 1;
      e.sales += num(i.total);
      topB.set(i.buyerId, e);
    });
    const topP = new Map<number, number>();
    d.salesInvoices.forEach((i: Row) =>
      (i.items ?? []).forEach((it: Row) =>
        topP.set(it.productId, (topP.get(it.productId) ?? 0) + num(it.quantity)),
      ),
    );
    return {
      sales: String(sales),
      purchase: String(purchase),
      receivable: String(receivable),
      payable: String(payable),
      cashAndBank: String(d.cashAccounts.reduce((s: number, a: Row) => s + num(a.balance), 0)),
      stockValue: String(
        d.stockBalances.reduce(
          (s: number, b: Row) => s + num(b.quantity) * num(prod(d, b.productId)?.purchasePrice),
          0,
        ),
      ),
      grossMarginPct: String(sales ? Math.round(((sales - cogs) / sales) * 1000) / 10 : 0),
      overdueReceivable: String(overdue),
      lowStock: d.products
        .map((p: Row) => ({
          ...productOut(d, p),
          balances: d.stockBalances
            .filter((b: Row) => b.productId === p.id)
            .map((b: Row) => ({ warehouse: { name: wh(d, b.warehouseId)?.name } })),
        }))
        .filter((p: Row) => num(p.totalStock) < num(p.minStock))
        .slice(0, 6),
      topBuyers: [...topB.entries()]
        .map(([id, e]) => ({
          name: buyer(d, id)?.name ?? `#${id}`,
          orders: e.orders,
          sales: String(e.sales),
        }))
        .sort((a: Row, b: Row) => num(b.sales) - num(a.sales))
        .slice(0, 5),
      topProducts: [...topP.entries()]
        .map(([id, qty]) => ({
          sku: prod(d, id)?.sku ?? "",
          product: prod(d, id)?.name ?? "",
          qty: String(qty),
        }))
        .sort((a: Row, b: Row) => num(b.qty) - num(a.qty))
        .slice(0, 5),
      chart: [...byMonth.entries()]
        .sort()
        .map(([k, e]) => ({ month: k, sales: String(e.sales), purchase: String(e.purchase) })),
    };
  }

  /* documents */
  if (seg(/^\/documents\/sources$/) && method === "GET")
    return {
      invoices: d.salesInvoices.map((i: Row) => ({ id: i.id, invNo: i.invNo })),
      chalans: d.deliveryChalans.map((c: Row) => ({ id: c.id, dcNo: c.dcNo })),
    };
  const dim = seg(/^\/documents\/invoice\/(\d+)$/);
  if (dim && method === "GET") {
    const i = d.salesInvoices.find((x: Row) => x.id === Number(dim[1]));
    if (!i) throw new DemoApiError(404, "Invoice not found");
    const b = buyer(d, i.buyerId);
    return {
      type: "invoice",
      company: d.company,
      invoice: {
        ...i,
        buyer: b && { name: b.name, code: b.code, address: b.address, phone: b.phone },
        salesOrder: i.salesOrderId
          ? { soNo: d.salesOrders.find((o: Row) => o.id === i.salesOrderId)?.soNo }
          : null,
        items: (i.items ?? []).map((it: Row) => ({
          ...it,
          product: (() => {
            const p = prod(d, it.productId);
            return p && { name: p.name, sku: p.sku, unit: unitOf(d, p.unitId) };
          })(),
        })),
      },
    };
  }
  const chm = seg(/^\/documents\/chalan\/(\d+)$/);
  if (chm && method === "GET") {
    const c = d.deliveryChalans.find((x: Row) => x.id === Number(chm[1]));
    if (!c) throw new DemoApiError(404, "Chalan not found");
    const b = buyer(d, c.buyerId);
    return {
      type: "chalan",
      company: d.company,
      chalan: {
        ...c,
        buyer: b && { name: b.name, code: b.code, address: b.address, phone: b.phone },
        warehouse: wh(d, c.warehouseId) && { name: wh(d, c.warehouseId)!.name },
        salesOrder: c.salesOrderId
          ? { soNo: d.salesOrders.find((o: Row) => o.id === c.salesOrderId)?.soNo }
          : null,
        items: (c.items ?? []).map((it: Row) => ({
          ...it,
          product: (() => {
            const p = prod(d, it.productId);
            return p && { name: p.name, sku: p.sku, unit: unitOf(d, p.unitId) };
          })(),
        })),
      },
    };
  }

  /* analytics */
  const inRange = (date: string) => {
    const from = q.get("from");
    const to = q.get("to");
    return (!from || String(date) >= from) && (!to || String(date).slice(0, 10) <= to);
  };
  if (seg(/^\/analytics\/sales-by-user$/) && method === "GET") {
    const g = new Map<string, { invoices: number; total: number }>();
    d.salesInvoices
      .filter((i: Row) => inRange(i.invoiceDate))
      .forEach((i: Row) => {
        const name = userOf(d, i.createdById)?.name ?? "System";
        const e = g.get(name) ?? { invoices: 0, total: 0 };
        e.invoices += 1;
        e.total += num(i.total);
        g.set(name, e);
      });
    return [...g.entries()].map(([u, e]) => ({
      user: u,
      invoices: e.invoices,
      total: String(e.total),
    }));
  }
  if (seg(/^\/analytics\/sales-by-buyer$/) && method === "GET") {
    const g = new Map<number, { invoices: number; vat: number; total: number }>();
    d.salesInvoices
      .filter((i: Row) => inRange(i.invoiceDate))
      .forEach((i: Row) => {
        const e = g.get(i.buyerId) ?? { invoices: 0, vat: 0, total: 0 };
        e.invoices += 1;
        e.vat += num(i.taxTotal);
        e.total += num(i.total);
        g.set(i.buyerId, e);
      });
    return [...g.entries()].map(([id, e]) => ({
      buyer: buyer(d, id)?.name ?? `#${id}`,
      invoices: e.invoices,
      vat: String(e.vat),
      total: String(e.total),
    }));
  }
  if (seg(/^\/analytics\/stock-movement$/) && method === "GET")
    return d.products.map((p: Row) => {
      const stock = productTotalStock(d, p.id);
      const moved = d.stockMovements
        .filter(
          (m: Row) =>
            m.productId === p.id &&
            ["OUT", "TRANSFER_OUT"].includes(m.type) &&
            inRange(m.createdAt),
        )
        .reduce((s: number, m: Row) => s + Math.abs(num(m.quantity)), 0);
      return {
        sku: p.sku,
        product: p.name,
        stock: String(stock),
        movedInPeriod: String(moved),
        velocity: moved === 0 ? "DEAD" : moved > (stock + moved) / 4 ? "FAST" : "SLOW",
      };
    });
  if (seg(/^\/analytics\/inventory-valuation$/) && method === "GET") {
    const rows = d.stockBalances.map((b: Row) => {
      const p = prod(d, b.productId);
      return {
        sku: p?.sku,
        product: p?.name,
        warehouse: wh(d, b.warehouseId)?.name,
        unit: p ? unitOf(d, p.unitId)?.code : undefined,
        quantity: String(b.quantity),
        rate: p?.purchasePrice,
        value: String(num(b.quantity) * num(p?.purchasePrice)),
      };
    });
    return { rows, total: String(rows.reduce((s: number, r: Row) => s + num(r.value), 0)) };
  }
  if (seg(/^\/analytics\/purchase-by-supplier$/) && method === "GET") {
    const g = new Map<number, { invoices: number; vat: number; total: number }>();
    d.purchaseInvoices
      .filter((i: Row) => inRange(i.invoiceDate))
      .forEach((i: Row) => {
        const e = g.get(i.supplierId) ?? { invoices: 0, vat: 0, total: 0 };
        e.invoices += 1;
        e.vat += num(i.taxTotal);
        e.total += num(i.total);
        g.set(i.supplierId, e);
      });
    return [...g.entries()].map(([id, e]) => ({
      supplier: supplier(d, id)?.name ?? `#${id}`,
      invoices: e.invoices,
      vat: String(e.vat),
      total: String(e.total),
    }));
  }
  if (seg(/^\/analytics\/product-profitability$/) && method === "GET") {
    const g = new Map<number, { qty: number; revenue: number }>();
    d.salesInvoices
      .filter((i: Row) => inRange(i.invoiceDate))
      .forEach((i: Row) =>
        (i.items ?? []).forEach((it: Row) => {
          const e = g.get(it.productId) ?? { qty: 0, revenue: 0 };
          e.qty += num(it.quantity);
          e.revenue += num(it.total);
          g.set(it.productId, e);
        }),
      );
    return [...g.entries()].map(([id, e]) => {
      const p = prod(d, id);
      const cost = e.qty * num(p?.purchasePrice);
      return {
        sku: p?.sku,
        product: p?.name,
        qtySold: String(e.qty),
        revenue: String(e.revenue),
        cogs: String(cost),
        margin: String(e.revenue - cost),
        marginPct: e.revenue
          ? String(Math.round(((e.revenue - cost) / e.revenue) * 1000) / 10)
          : "0",
      };
    });
  }
  if (seg(/^\/analytics\/warehouse-movement$/) && method === "GET") {
    const g = new Map<number, { inbound: number; outbound: number; adjustments: number }>();
    d.stockMovements
      .filter((m: Row) => inRange(m.createdAt))
      .forEach((m: Row) => {
        const e = g.get(m.warehouseId) ?? { inbound: 0, outbound: 0, adjustments: 0 };
        if (["IN", "TRANSFER_IN"].includes(m.type)) e.inbound += num(m.quantity);
        else if (["OUT", "TRANSFER_OUT"].includes(m.type)) e.outbound += num(m.quantity);
        else e.adjustments += num(m.quantity);
        g.set(m.warehouseId, e);
      });
    return [...g.entries()].map(([id, e]) => ({
      warehouse: wh(d, id)?.name ?? `#${id}`,
      inbound: String(e.inbound),
      outbound: String(e.outbound),
      adjustments: String(e.adjustments),
    }));
  }

  /* financial reports */
  if (seg(/^\/reports\/pnl$/) && method === "GET") {
    const totals = acctTotals(d);
    const rows = [...totals.values()]
      .filter((t) => ["INCOME", "EXPENSE"].includes(t.account.category))
      .map((t) => ({
        code: t.account.code,
        account: t.account.name,
        category: t.account.category,
        debit: String(t.debit),
        credit: String(t.credit),
        net: String(t.account.category === "INCOME" ? t.credit - t.debit : t.debit - t.credit),
      }));
    const revenue = rows.filter((r) => r.category === "INCOME").reduce((s, r) => s + num(r.net), 0);
    const expenses = rows
      .filter((r) => r.category === "EXPENSE")
      .reduce((s, r) => s + num(r.net), 0);
    const cogs = num(totals.get(5100)?.debit) - num(totals.get(5100)?.credit);
    return {
      from: q.get("from"),
      to: q.get("to"),
      rows,
      revenue: String(revenue),
      expenses: String(expenses),
      cogs: String(cogs),
      grossProfit: String(revenue - cogs),
      netProfit: String(revenue - expenses),
    };
  }
  if (seg(/^\/reports\/trial-balance$/) && method === "GET") {
    const rows = [...acctTotals(d).values()].map((t) => ({
      code: t.account.code,
      account: t.account.name,
      category: t.account.category,
      debit: String(t.debit),
      credit: String(t.credit),
      balance: String(t.debit - t.credit),
    }));
    return {
      rows,
      totalDebit: String(rows.reduce((s, r) => s + num(r.debit), 0)),
      totalCredit: String(rows.reduce((s, r) => s + num(r.credit), 0)),
    };
  }
  if (seg(/^\/reports\/general-ledger$/) && method === "GET") {
    const accountId = q.get("accountId") ? num(q.get("accountId")) : null;
    return d.journalLines
      .filter((l: Row) => !accountId || l.accountId === accountId)
      .map((l: Row) => ({
        id: l.entryId + "-" + l.accountId,
        entryId: l.entryId,
        entry: { entryNo: l.entryNo, date: l.date, memo: l.memo },
        account: (() => {
          const a = d.accounts.find((x: Row) => x.code === String(l.accountId));
          return a && { code: a.code, name: a.name };
        })(),
        debit: l.debit,
        credit: l.credit,
      }));
  }
  if (seg(/^\/reports\/accounts$/) && method === "GET") return d.accounts;
  if (seg(/^\/reports\/balance-sheet$/) && method === "GET") {
    const rows = [...acctTotals(d).values()].map((t) => ({
      code: t.account.code,
      account: t.account.name,
      category: t.account.category,
      balance: String(
        ["LIABILITY", "EQUITY", "INCOME"].includes(t.account.category)
          ? t.credit - t.debit
          : t.debit - t.credit,
      ),
    }));
    const sum = (cat: string) =>
      rows.filter((r) => r.category === cat).reduce((s, r) => s + num(r.balance), 0);
    const netProfit = sum("INCOME") - sum("EXPENSE");
    const equity = [
      ...rows.filter((r) => r.category === "EQUITY"),
      {
        code: "3900",
        account: "Current period earnings",
        category: "EQUITY",
        balance: String(netProfit),
      },
    ];
    return {
      to: q.get("to"),
      assets: rows.filter((r) => r.category === "ASSET"),
      liabilities: rows.filter((r) => r.category === "LIABILITY"),
      equity,
      netProfit: String(netProfit),
      totalAssets: String(sum("ASSET")),
      totalLiabilitiesEquity: String(sum("LIABILITY") + sum("EQUITY") + netProfit),
    };
  }
  if (seg(/^\/reports\/aging\/receivable$/) && method === "GET")
    return ageBuckets(
      d.salesInvoices
        .filter((i: Row) => ["UNPAID", "PARTIAL"].includes(i.status))
        .map((i: Row) => ({
          party: buyer(d, i.buyerId)?.name ?? "",
          date: i.invoiceDate,
          due: i.dueDate,
          open: num(i.total) - num(i.paidAmount),
        })),
    );
  if (seg(/^\/reports\/aging\/payable$/) && method === "GET")
    return ageBuckets(
      d.purchaseInvoices
        .filter((i: Row) => ["UNPAID", "PARTIAL"].includes(i.status))
        .map((i: Row) => ({
          party: supplier(d, i.supplierId)?.name ?? "",
          date: i.invoiceDate,
          due: null,
          open: num(i.total) - num(i.paidAmount),
        })),
    );

  /* system */
  if (seg(/^\/system\/backup$/) && method === "GET")
    return { exportedAt: now(), demo: true, data: d };
  if (seg(/^\/system\/health$/) && method === "GET") return { ok: true };

  throw new DemoApiError(404, `Unknown demo endpoint: ${method} ${rawPath}`);
}

/* CSV download for analytics/reports exports — mirrors ?format=csv */
export async function demoCsv(path: string): Promise<string> {
  const data = await demoApi(
    "GET",
    path.split("&format=csv")[0]!.replace("format=csv&", ""),
    null,
    localStorage.getItem("gt_token") ? `Bearer ${localStorage.getItem("gt_token")}` : null,
  );
  const rows = Array.isArray(data) ? data : (data?.rows ?? []);
  return toCsv(
    rows.map((r: Row) => {
      const flat: Row = {};
      for (const [k, v] of Object.entries(r))
        flat[k] = v && typeof v === "object" ? ((v as Row).name ?? JSON.stringify(v)) : v;
      return flat;
    }),
  );
}
