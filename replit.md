# RozgaarSetu

A premium hyperlocal hiring platform for India — connecting job seekers and employers in North Delhi localities like Rohini, Pitampura, Azadpur, and more.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm --filter @workspace/mobile run dev` — run the Expo mobile app
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- Required env: `DATABASE_URL` — Postgres connection string (if backend features added)

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo (React Native), Expo Router (file-based navigation)
- State: React Context + AsyncStorage (frontend-only, no backend required)
- API: Express 5 (pre-configured, for future use)
- DB: PostgreSQL + Drizzle ORM (pre-configured, for future use)
- Fonts: Inter (400/500/600/700)
- Icons: @expo/vector-icons (Ionicons, MaterialCommunityIcons)
- Animation: react-native-reanimated

## Where things live

- `artifacts/mobile/` — Expo mobile app
  - `app/(tabs)/` — 5 tab screens: Home, Jobs, Nearby, Saved, Profile
  - `app/job/[id].tsx` — Job detail screen
  - `app/apply/[id].tsx` — Apply confirmation flow
  - `app/auth/index.tsx` — OTP + role authentication
  - `data/jobs.ts` — 22+ realistic demo jobs
  - `context/AppContext.tsx` — Global state (auth, saved jobs, applications)
  - `components/` — JobCard, SkeletonCard, SearchHeader
  - `constants/colors.ts` — Light + dark theme tokens

## Architecture decisions

- Frontend-only for first build: all state persisted via AsyncStorage (no backend calls yet)
- AsyncStorage keys: `@rozgaar_user`, `@rozgaar_saved`, `@rozgaar_applied`
- OTP flow is simulated (any 4-digit OTP accepted) — ready for real SMS integration
- GPS location for Nearby tab uses expo-location; falls back to Rohini coordinates if denied
- WhatsApp apply uses `wa.me` deep link with a prefilled message

## Product

RozgaarSetu is a hyperlocal job marketplace for North Delhi. Users can:
- Browse 22+ realistic Indian jobs across 10 categories
- Filter by locality (Rohini, Pitampura, Azadpur, etc.) and category
- Apply in one tap or via WhatsApp
- Save jobs with bookmark icon
- View nearby jobs sorted by GPS distance
- Create a profile with role selection (Job Seeker / Employer)
- Track applied jobs in the Saved tab

## User preferences

- App name: RozgaarSetu
- Target market: North Delhi hyperlocal workers
- Color scheme: Blue gradient (#2563EB primary), light + dark mode
- Mobile-first, no backend in first build

## Gotchas

- Do not change `expo.slug` in app.json — breaks bundle routing
- Always run `pnpm --filter @workspace/api-spec run codegen` after OpenAPI changes
- expo-location requires Platform.OS check for web (use navigator.geolocation instead)
- uuid package is NOT compatible with Expo Go — use Date.now() + Math.random() instead
