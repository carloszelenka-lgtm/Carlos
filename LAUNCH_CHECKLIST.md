# StreakOS Launch Checklist

This document outlines everything you need to deploy StreakOS to production.

## Quick Start (Demo Mode)

The app runs fully functional in **demo mode** using local storage:

```bash
npm install
npm run dev
```

Open http://localhost:5173 - no backend needed!

---

## Production Deployment

### 1. Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

#### Required for Cloud Mode

```env
# Supabase (database + auth)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

#### Optional Services

```env
# Stripe (for Pro subscriptions)
VITE_STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx

# AI (for personalized quests - Pro only)
OPENAI_API_KEY=sk-xxx
# OR
ANTHROPIC_API_KEY=sk-ant-xxx
```

---

### 2. Supabase Setup

#### Create Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project URL and anon key

#### Run Database Migration

1. Go to SQL Editor in Supabase Dashboard
2. Copy contents of `supabase/migrations/001_initial_schema.sql`
3. Run the migration

#### Configure Authentication

1. Go to Authentication > Providers
2. Enable Email/Password
3. (Optional) Enable Google OAuth
4. Set redirect URLs:
   - `http://localhost:5173` (dev)
   - `https://your-domain.com` (prod)

#### Configure Storage (for proof photos)

1. Go to Storage
2. Create bucket named `proofs`
3. Set policy to allow authenticated users to upload

#### Create First Admin User

1. Sign up through the app
2. In Supabase SQL Editor, run:

```sql
UPDATE users_profile
SET role = 'admin'
WHERE username = 'your_username';
```

---

### 3. Stripe Setup (Optional)

If you want Pro subscriptions:

1. Create account at [stripe.com](https://stripe.com)
2. Create products:
   - **StreakOS Pro Monthly** - $4.99/month
   - **StreakOS Pro Yearly** - $39.99/year
3. Get API keys from Dashboard > Developers
4. Set up webhook endpoint:
   - URL: `https://your-domain.com/api/webhooks/stripe`
   - Events: `checkout.session.completed`, `customer.subscription.updated`, `customer.subscription.deleted`

---

### 4. Build & Deploy

#### Build for Production

```bash
npm run build
```

This creates optimized files in `dist/` folder.

#### Deployment Options

**Vercel (Recommended)**
```bash
npm i -g vercel
vercel
```

**Netlify**
```bash
npm i -g netlify-cli
netlify deploy --prod --dir=dist
```

**Docker**
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
RUN npm i -g serve
EXPOSE 3000
CMD ["serve", "-s", "dist", "-l", "3000"]
```

---

### 5. PWA Icons

Replace placeholder icons in `public/icons/` with your branded icons:

| File | Size |
|------|------|
| icon-72x72.png | 72x72 |
| icon-96x96.png | 96x96 |
| icon-128x128.png | 128x128 |
| icon-144x144.png | 144x144 |
| icon-152x152.png | 152x152 |
| icon-192x192.png | 192x192 |
| icon-384x384.png | 384x384 |
| icon-512x512.png | 512x512 |

Use a tool like [favicon.io](https://favicon.io) or [realfavicongenerator.net](https://realfavicongenerator.net).

---

### 6. Daily Quest Generation (Optional)

For automatic daily quest generation, set up a cron job:

**Vercel Cron**

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/generate-quests",
    "schedule": "0 5 * * *"
  }]
}
```

**Alternative: Client-side Generation**

The app already generates quests on-demand when users visit the home page. No cron needed for basic functionality.

---

### 7. Post-Launch Checklist

- [ ] Test signup/login flow
- [ ] Test track creation with all intents
- [ ] Complete a quest end-to-end
- [ ] Test MVP completion with shield
- [ ] Verify streak tracking
- [ ] Test weekly recap card generation
- [ ] Create and join a community
- [ ] Test chat functionality
- [ ] Verify admin dashboard access
- [ ] Test PWA installation on mobile
- [ ] Check offline functionality
- [ ] Monitor error logs

---

## Feature Flags

Control features via admin dashboard at `/admin`:

| Flag | Default | Description |
|------|---------|-------------|
| `ai_enabled` | `true` | Enable AI quest personalization |
| `max_free_tracks` | `3` | Track limit for free users |
| `weekly_shields` | `2` | Shields reset weekly |
| `community_enabled` | `true` | Enable community features |

---

## Security Notes

- All user data is isolated via Row Level Security (RLS)
- Fitness track constraints are filtered for unsafe content
- File uploads are restricted to images under 5MB
- Rate limiting should be added for production (consider Upstash)

---

## Support

For issues or feature requests:
- GitHub Issues: [your-repo-url]/issues
- Documentation: [your-docs-url]

---

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS
- **State**: Zustand (local), Supabase (cloud)
- **PWA**: vite-plugin-pwa
- **Charts**: Chart.js + react-chartjs-2
- **Animations**: Framer Motion
- **Notifications**: react-hot-toast
- **Share Cards**: html-to-image

---

**Built with love for habit builders everywhere. 🔥**
