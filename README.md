# Global Pharmacy

Multi-location pharmacy management (Gudele and Hai Tijaniah) with offline-first
local databases that sync through the server.

## Setup

1. Copy `.env.example` to `.env.local` and fill in the Supabase URL, the service
   role key, and a `SESSION_SECRET` (32+ random characters).
2. In the Supabase SQL Editor, run `supabase/schema.sql` (fresh installs) and
   `supabase/migration.sql`, then `supabase/multi-location.sql`.
3. Set each staff member's PIN. Staff ids are in the `staff` table:

   ```bash
   STAFF_PINS='{"<staff-uuid>":"4821"}' node --env-file=.env.local scripts/seed-staff-pins.mjs
   ```

   The PINs are stored as salted hashes. Do not put PINs in the repo.
4. Assign pharmacists and cashiers to their location in `staff_locations`.
   Admins and general managers see every location.
5. `npm run dev`, or `npm run build && npm start` for production.

Access model: the browser never talks to Supabase directly. All reads and writes
go through `/api/*` routes, which check the signed session and the active
location on every request.

This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

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
