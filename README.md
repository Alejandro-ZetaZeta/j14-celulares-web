This is a [Next.js](https://nextjs.org) project using InsForge authentication.

## Local environment

Copy `.env.example` to `.env.local` and fill in the InsForge URL and anon key. Keep `.env.local` local.

InsForge sends signup verification emails through its configured auth email provider. SMTP credentials do not belong in this app. The signup flow sends the built-in 6-digit OTP, and `/cliente/verificar-otp` verifies it with `auth.verifyEmail()`.

## Dataweb Sandbox

Checkout usa Dataweb/Datafast COPYandPAY. Configura `DATAWEB_ENTITY_ID`, `DATAWEB_AUTH_TOKEN`, `DATAWEB_MID` y `DATAWEB_TID` en `.env.local`. Sandbox usa `DATAWEB_ENVIRONMENT=sandbox`; producción usa `DATAWEB_BASE_URL=https://eu-prod.oppwa.com` y `DATAWEB_ENVIRONMENT=production`.

Restart Next.js after changing environment variables. For safer iframe and browser-cookie behavior, run local checkout over HTTPS:

```bash
npm run dev:https
```

Open `https://localhost:3000` and accept Next.js self-signed certificate warning. If using HTTPS for auth redirects too, set `NEXT_PUBLIC_APP_URL=https://localhost:3000` in `.env.local` and restart the server. No deployment is required.

Dataweb integration files:

- `src/app/(public)/checkout/CheckoutClient.tsx`: customer data and checkout trigger.
- `src/app/api/payments/payment-callback/route.ts`: validates approved responses and creates orders.
- `migrations/20260828000000_remove-pagoplux.sql`: removes legacy PagoPlux data and schema.
- `.env.example`: documented sandbox configuration template.
- `.env.local`: active local sandbox configuration; ignored by Git.

Sandbox may log Kount/Kaptcha CORS errors from `tst.kaptcha.com`. Those requests originate inside Dataweb and are not controlled by this app. Treat them as a separate vendor issue unless they prevent the iframe from loading.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
