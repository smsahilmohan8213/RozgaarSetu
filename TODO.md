# TODO

## Locale architecture migration (Step 1 only)
- [x] Create dedicated locales structure under artifacts/mobile/locales/
  - [x] locales/types.ts
  - [x] locales/dictionary.ts
  - [x] locales/index.ts
- [x] Migrate artifacts/mobile/hooks/useTranslation.ts to consume locales/dictionary
- [ ] Fix remaining TypeScript errors from profile screen (user.language references)
- [ ] Run TypeScript validation


