# Garb Consignment Boutique

The new garb.ca: an online shop and consignment platform for Garb, the designer consignment boutique at 1046 Queen St W, Toronto.

- **Shoppers** browse women's and men's designer pieces, filter by designer, size and price, and check out by card (Stripe) or Interac e-Transfer, with shipping in Canada or free in-store pickup.
- **Sellers (consignors)** book appointments online and follow their pieces, sales, earnings and payouts in a seller account.
- **Staff** run everything from the Medusa admin: products, orders, consignors, payouts, appointments and designers.

## Stack

| Part | Tech | Folder |
| --- | --- | --- |
| Backend and admin | Medusa 2.22, PostgreSQL, Redis | `apps/backend` |
| Storefront | Next.js 16 (App Router), Tailwind CSS 3, based on the Medusa Next.js starter | `apps/storefront` |

It's a Turborepo workspace using npm.

## Run it locally

You need Node 22 or later, PostgreSQL 15 or later, and (recommended) Redis.

1. Install dependencies from the repo root:

   ```bash
   npm install
   ```

2. Create the database and backend env file:

   ```bash
   createdb garb
   cp apps/backend/.env.template apps/backend/.env
   ```

   Then edit `DATABASE_URL`, and set a long random `JWT_SECRET`, `COOKIE_SECRET`, `AUTH_MFA_ENCRYPTION_KEY` and `REVALIDATE_SECRET`.

3. Run migrations. On an empty database this also loads the Garb store setup and a demo catalogue of 164 real pieces:

   ```bash
   cd apps/backend && npx medusa db:migrate
   ```

   Copy the publishable key printed at the end (`[garb] Done. Publishable key: pk_...`).

4. Create an admin login:

   ```bash
   cd apps/backend && npx medusa user -e you@garb.ca -p a-strong-password
   ```

5. Set up the storefront env:

   ```bash
   cp apps/storefront/.env.template apps/storefront/.env.local
   ```

   Paste the publishable key into `NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY`, and use the same `REVALIDATE_SECRET` as the backend.

6. Start both apps from the repo root:

   ```bash
   npm run dev
   ```

   - Shop: http://localhost:8000
   - Admin: http://localhost:9000/app

**Demo seller login** (from the seed): `seller@garb.test` / `garbseller1` at http://localhost:8000/seller

## What the seed sets up

- Store in **CAD**, one **Canada** region, prices before tax.
- **Sales tax** by province (Ontario 13% HST, Quebec GST+QST, BC GST+PST, and so on), picked from the shipping address.
- **Delivery**: Canada Post Expedited ($20), Xpresspost ($35), and free pickup at the shop.
- **Payments**: Interac e-Transfer (Medusa's manual provider), plus Stripe when a key is set.
- Categories for Women and Men, 97 designers, 164 pieces (one of each), a Sale price list, 6 consignors, sales history and payouts for the demo seller, and 2 appointment requests.

Catalogue photos are in `apps/backend/static/catalog` and are served by the backend.

## How consignment works in the system

| Rule | Where |
| --- | --- |
| Seller gets 50% of the sale price (editable per seller) | `consignment` module, `split_rate` |
| Pieces show for 90 days; bags and pieces over $1,500 for 180 | `apps/backend/src/lib/garb.ts` |
| When an order is placed, its pieces are marked sold, the seller's share is recorded, and the piece leaves the shop | `subscribers/order-placed.ts` |
| Cancelled order: pieces go back on sale | `subscribers/order-canceled.ts` |
| Every morning: overdue pieces come off the shop, the seller is emailed to collect within 7 days; uncollected pieces become Garb's | `jobs/consignment-expiry.ts` |
| On the 5th: last month's sales are grouped into one payout per seller, collectable from the 15th | `jobs/monthly-payouts.ts` |
| Hourly: e-Transfer orders unpaid after 72 hours are cancelled and the pieces return to sale | `jobs/cancel-unpaid-orders.ts` |

### Day-to-day in the admin

- **Add a piece**: create the product as usual (one variant, stock 1, SKU `GARB-<item code>`), then fill in **Garb details** on the right of the product page: designer, consignor, intake date, size, condition, original retail price and measurements.
- **e-Transfer arrived**: open the order and **Capture** the payment. The customer is emailed that payment was received.
- **Consignment** page: what's on the floor, what's ending soon, what's waiting for pickup. Use the `…` menu to extend, relist, or mark picked up.
- **Consignors**: add sellers, edit their split, and **Send invite** so they can open a seller account (the link can also be copied and texted).
- **Payouts**: grouped automatically on the 5th. Use **Group sales** for any month, and **Mark paid** when the seller collects.
- **Appointments**: requests from the website. Set a time and status **Confirmed** to email the client.
- **Designers**: add designers and choose which are featured on the home page.

Run the daily jobs by hand at any time:

```bash
cd apps/backend && npx medusa exec ./src/scripts/run-garb-jobs.ts
```

## Card payments (Stripe)

1. Add `STRIPE_API_KEY` and `STRIPE_WEBHOOK_SECRET` to `apps/backend/.env` and restart the backend.
2. Turn Stripe on for Canada:

   ```bash
   cd apps/backend && npx medusa exec ./src/scripts/enable-stripe.ts
   ```

3. Add `NEXT_PUBLIC_STRIPE_KEY` (publishable key) to `apps/storefront/.env.local` and restart.
4. In Stripe, send webhooks to `https://<backend>/hooks/payment/stripe_stripe`.

Card payments are captured when the order is placed.

## Emails

Emails (order confirmation with e-Transfer instructions, payment received, unpaid cancellation, appointment received and confirmed, seller invite, pickup reminder, password reset) go through Medusa's Notification Module. In development they're printed in the backend log. For production, replace the local provider in `apps/backend/medusa-config.ts` with an email provider such as `@medusajs/medusa/notification-sendgrid`.

## Going live checklist

- Host the backend with Postgres and Redis, and set `MEDUSA_BACKEND_URL` and `STOREFRONT_URL` to the public URLs.
- Use S3 (or similar) for uploads instead of local files, and move the catalogue photos there.
- Set strong secrets and the CORS variables for the real domains.
- Connect an email provider and Stripe.
- In the storefront, set `NEXT_PUBLIC_MEDUSA_BACKEND_URL` and `NEXT_PUBLIC_BASE_URL`.

## Useful commands

```bash
npm run dev                                   # both apps
npm run build                                 # production build
cd apps/backend && npx medusa lint            # backend checks
cd apps/storefront && npx tsc --noEmit        # storefront type check
```
