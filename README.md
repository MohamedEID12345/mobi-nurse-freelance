# MOBI-NURSE — web (Next.js 15 · Node.js · Supabase · Kashier)

See the full Arabic setup guide in `../README.md`.

```bash
npm install
cp .env.example .env.local
npm run dev        # http://localhost:3000
npm test           # pricing / commission / Kashier signature tests
npm run build      # production build (same as Vercel)
```

Database: run `supabase/01_schema.sql` then `supabase/02_seed.sql` in the Supabase SQL editor.
