# ShopMart — Multi-Vendor E-Commerce Platform

A full-stack multi-vendor marketplace: customers browse and buy, sellers register
and manage their own storefront, and admins oversee the whole platform.

- **Backend:** Node.js, Express 5, MongoDB/Mongoose, JWT auth, Stripe, Google OAuth
- **Frontend:** React 19 + Vite, single-page app with customer/seller/admin workspaces

## Requirements

- Node.js 18+ and npm
- A MongoDB database (local `mongod` or a hosted cluster, e.g. MongoDB Atlas)
- A Stripe account (for card checkout) — optional if you only need COD
- A Google Cloud OAuth client (for "Sign in with Google") — optional

## 1. Backend setup

```bash
cd Backend
npm install
```

Create a `Backend/.env` file (never commit this file):

```env
PORT=5000
NODE_ENV=development

# MongoDB connection string
MONGO_URI=mongodb://127.0.0.1:27017/shopmart

# Used to sign/verify JWT auth tokens - use a long random string
JWT_SECRET=replace-with-a-long-random-secret

# The frontend's URL, used for Stripe redirect links
FRONTEND_URL=http://localhost:5173

# Google OAuth (optional - required only for Google login)
GOOGLE_CLIENT_ID=your-google-oauth-client-id

# Stripe (optional - required only for card checkout)
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_signing_secret

# Email delivery for password-reset codes (optional - if unset,
# a reset code is still generated but cannot be emailed)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
SMTP_FROM=no-reply@yourdomain.com
```

Run it:

```bash
npm run dev     # with nodemon (auto-restart on changes)
# or
npm start       # plain node
```

The API listens on `http://localhost:5000` by default.

## 2. Frontend setup

```bash
cd Frontend
npm install
```

Create a `Frontend/.env` file if your backend isn't on the default URL:

```env
VITE_API_URL=http://localhost:5000
```

Run it:

```bash
npm run dev       # development server (Vite)
npm run build      # production build -> Frontend/dist
npm run preview    # preview the production build locally
npm run lint       # oxlint
```

## 3. MongoDB

Any MongoDB 5+ instance works. For local development:

```bash
mongod --dbpath /path/to/your/data
```

Or use a free MongoDB Atlas cluster and put its connection string in `MONGO_URI`.

## 4. Stripe configuration

Card checkout uses Stripe Checkout Sessions:

1. Get your test keys from the [Stripe Dashboard](https://dashboard.stripe.com/test/apikeys).
2. Set `STRIPE_SECRET_KEY` in `Backend/.env`.
3. For the webhook (`POST /api/payments/webhook`), either:
   - Use the [Stripe CLI](https://stripe.com/docs/stripe-cli) locally:
     `stripe listen --forward-to localhost:5000/api/payments/webhook`
     and copy the printed signing secret into `STRIPE_WEBHOOK_SECRET`, or
   - Add a webhook endpoint in the Stripe Dashboard pointing at your deployed
     `/api/payments/webhook` URL and copy its signing secret.

**How it works:** Stripe checkout sessions are verified server-side (via the
webhook, with a polling fallback on the success page) before an Order is ever
created — the frontend reporting "success" is never trusted on its own. COD
(cash on delivery) checkout does not require Stripe at all.

## 5. Google OAuth configuration

1. Create an OAuth 2.0 Client ID in the [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
2. Add your frontend origin (e.g. `http://localhost:5173`) to "Authorized JavaScript origins".
3. Set `GOOGLE_CLIENT_ID` in `Backend/.env` to that client ID.

## 6. Production notes

- **Never commit `.env` files or secrets.** `.gitignore` already excludes them.
- Set `NODE_ENV=production` and use a properly generated, high-entropy `JWT_SECRET`.
- Serve the frontend's `Frontend/dist` build behind a CDN/static host, or behind
  the same reverse proxy as the API.
- The `Backend/uploads/` directory stores seller CNIC document uploads and is
  served at `/uploads/...` — on most hosts this needs to be a persistent volume
  (uploads are lost on redeploy otherwise) or swapped for object storage (S3, etc.).
- Admin accounts are created by directly setting a user's `role` to `"admin"`
  in the database — there is no self-service admin signup.
- Rate limiting, Helmet security headers, and CORS are already configured in
  `Backend/src/server.js`; review and adjust the allowed origins for your
  deployed frontend URL(s).
