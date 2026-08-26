# Opryn deployment configuration

Opryn keeps every OpenAI credential and model setting server-side. Configure
these variables in Vercel for Production, Preview, and Development:

```env
OPENAI_API_KEY=<secret>
OPENAI_TEXT_MODEL=gpt-5.6-luna
OPENAI_TRANSCRIPTION_MODEL=gpt-transcribe
OPENAI_EMBEDDING_MODEL=text-embedding-3-small
```

`OPENAI_TEXT_MODEL` is used for structured process extraction, company Q&A,
reusable owner rules, and starting-plan recommendations.

`OPENAI_TRANSCRIPTION_MODEL` receives audio only. Uploaded video is converted
to a temporary MP3 audio track inside the server function before transcription.
The temporary files are deleted after each request.

`OPENAI_EMBEDDING_MODEL` remains separate because pgvector retrieval requires
embedding vectors rather than generated text.

Never prefix these variables with `NEXT_PUBLIC_`. After changing a production
model variable, redeploy the application so every server function uses the new
configuration.

## Team invitation emails

Opryn sends employee invitations through Supabase Auth magic links. Add these
URLs to Supabase Authentication → URL Configuration → Redirect URLs:

```text
https://www.opryn.app/invite/**
http://localhost:3000/invite/**
```

For reliable production delivery, configure custom SMTP in Supabase. If email
delivery is unavailable or rate limited, Opryn still returns a one-time secure
link that an owner can copy and send manually.

## Stripe billing

Create recurring monthly Prices for Opryn Core ($99) and Opryn Premium ($249),
then configure these server-side Vercel variables:

```env
STRIPE_SECRET_KEY=<secret>
STRIPE_WEBHOOK_SECRET=<secret>
STRIPE_CORE_MONTHLY_PRICE_ID=price_...
STRIPE_PREMIUM_MONTHLY_PRICE_ID=price_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_...
NEXT_PUBLIC_SITE_URL=https://www.opryn.app
SUPABASE_SERVICE_ROLE_KEY=<secret>
```

Annual checkout stays hidden unless both annual Price IDs are configured:

```env
STRIPE_CORE_ANNUAL_PRICE_ID=price_...
STRIPE_PREMIUM_ANNUAL_PRICE_ID=price_...
```

Register `https://www.opryn.app/api/billing/webhook` as a Stripe webhook and
subscribe it to `checkout.session.completed`, `customer.subscription.created`,
`customer.subscription.updated`, and `customer.subscription.deleted`.
Subscription access is updated only by verified webhook events; returning from
Checkout does not unlock Premium by itself. Configure the Stripe Customer
Portal for payment methods, invoices, cancellation, and supported plan changes.
