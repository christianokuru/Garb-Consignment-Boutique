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

You need **Node 22** or later and **PostgreSQL 15** or later running on your computer. Redis is optional.

```bash
npm install
npm run setup
npm run dev
```

`npm run setup` asks a few questions (press Enter to accept each default), then:

- creates `apps/backend/.env` and `apps/storefront/.env.local` with fresh secret keys,
- creates the database if it doesn't exist,
- builds the tables and loads the demo shop (164 real pieces, designers, sellers, payouts),
- creates an admin login (default `admin@garb.test` / `garbadmin1`),
- connects the shop to the backend.

It's safe to run again. Use `npm run setup -- --yes` to skip the questions.

After that, `npm run dev` is all you need each time.

- Shop: http://localhost:8000
- Admin: http://localhost:9000/app
- Demo seller: `seller@garb.test` / `garbseller1` at http://localhost:8000/seller

## Show it to someone (free share link)

```bash
npm run demo
```

This runs the fast (production) version of the shop and prints a public link like `https://something.trycloudflare.com` that anyone can open on their phone or computer. Checkout, booking and seller login all work through it.

- It needs Cloudflare's free tunnel tool, installed once: `brew install cloudflared` (Mac) or `winget install --id Cloudflare.cloudflared` (Windows). No account needed.
- The link works only while your computer is on and `npm run demo` is running, and it changes each time.
- Show the admin on your own screen (http://localhost:9000/app). It isn't shared.
- Press Ctrl+C to stop. Use `npm run demo -- --no-tunnel` to run without a link.

Using a different tunnel (ngrok, etc.)? ngrok links work already. For any other address, add it to `ALLOWED_ORIGINS` in `apps/storefront/.env.local` (for example `ALLOWED_ORIGINS=demo.example.com`), or the shop's forms will be refused.

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
npm run setup                                 # first-time setup
npm run dev                                   # both apps
npm run demo                                  # fast version + share link
npm run build                                 # production build
cd apps/backend && npx medusa lint            # backend checks
cd apps/storefront && npx tsc --noEmit        # storefront type check
```
