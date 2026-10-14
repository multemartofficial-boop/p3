# GarmentTrade — Accessories Trading ERP (Demo Build)

A portfolio/demo build of an internal ERP for a garments accessories trading
company — buyers, suppliers, products, purchase, sales, inventory, warehouses,
cash & bank, approvals, VAT and financial reports.

**This build has no backend.** The original Express + Prisma + MySQL API has
been replaced with an in-browser demo API (`src/lib/demo-api.ts`) that serves
fictional seed data and persists mutations to `localStorage`. Nothing in this
repo connects to a real database or contains real client data.

## Run

```sh
npm install
npm run dev     # http://localhost:8080
npm run build   # production build
```

## Demo accounts

| Email | Password | Role |
| --- | --- | --- |
| `admin@demo.io` | `admin123` | Admin |
| `manager@demo.io` | `manager123` | Manager |
| `staff@demo.io` | `staff123` | Staff |

The login screen has click-to-fill demo account cards.

## Deploy (Vercel)

Import the repo and deploy — zero config. `vite.config.ts` automatically emits
the Vercel nitro preset (`.vercel/output`) when `VERCEL=1` is present.

## Notes

- Data resets when you clear site data (localStorage).
- Report/CSV export and database backup generate files in-browser.
- Private demo — `robots.txt` disallows crawling.
