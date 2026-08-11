This is a [Next.js](https://nextjs.org) project using InsForge authentication.

## Local environment

Copy `.env.example` to `.env.local` and fill in the InsForge URL and anon key. Keep `.env.local` local.

InsForge sends signup verification emails through its configured auth email provider. SMTP credentials do not belong in this app. The signup flow sends the built-in 6-digit OTP, and `/cliente/verificar-otp` verifies it with `auth.verifyEmail()`.

## Pagomedios V2

Pagomedios creates a hosted payment request through its V2 API and redirects customers to `data.url`. The documented API host is `https://api.abitmedia.cloud/pagomedios/v2`; credentials and environment are controlled by Pagomedios account configuration.

Required local values in `.env.local`:

```env
PAGOMEDIOS_API_TOKEN=your_bearer_token
PAGOMEDIOS_NOTIFY_URL=https://your-domain.example/api/payments/pagomedios-notify
PAGOMEDIOS_NOTIFY_SECRET=your_private_callback_secret
PAGOMEDIOS_GENERATE_INVOICE=1
```

Restart Next.js after changing environment variables. Pagomedios sends payment notifications to `PAGOMEDIOS_NOTIFY_URL`, so deployed HTTPS is required for end-to-end callbacks. For local testing, expose the callback route through an HTTPS tunnel:

```bash
npm run dev:https
```

Open `https://localhost:3000` and accept Next.js self-signed certificate warning. If using HTTPS for auth redirects too, set `NEXT_PUBLIC_APP_URL=https://localhost:3000` in `.env.local` and restart the server. A public HTTPS tunnel is still required for Pagomedios to reach the notification route.

Pagomedios integration files:

- `src/lib/pagomedios.ts`: server-side request creation and payment verification.
- `src/app/(public)/checkout/CheckoutClient.tsx`: customer data and hosted-payment redirect.
- `src/app/api/payments/pagomedios-request/route.ts`: validates cart and creates pending orders.
- `src/app/api/payments/pagomedios-notify/route.ts`: verifies callbacks and authorizes orders.
- `migrations/20260810120000_add-pagomedios-payment-fields.sql`: Pagomedios token and payload fields.
- `.env.example`: documented Pagomedios configuration template.
- `.env.local`: local credentials and callback configuration; ignored by Git.

The original PagoPlux columns remain in the database schema for experimentation and rollback. They are not used by this integration.

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
