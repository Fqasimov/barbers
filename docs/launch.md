# Launch checklist

What's left before the App Store and Google Play. The code is ready; these steps need your accounts, domain or decisions. Do them roughly in this order.

The product side (business rules to decide, content, operations, a test week) is in [go-live.md](go-live.md). Store texts are in [store-listing.md](store-listing.md).

## 1. Decide now (hard to change later)

- [ ] **Bundle ID / package name.** Currently `app.usta.booking` in `app.json`. After the first store upload it can never change. If you want it to match the domain, say `az.ustatap.app`, change it before step 3.
- [ ] **Payment provider.** Tell the backend which Azerbaijani provider you use. Then fill in `backend/app/Payments/ProviderGateway.php`; the TODOs in it say exactly what goes where.
- [ ] **Plan prices.** The server reads `PLAN_PRICE_START`, `PLAN_PRICE_PRO` and `PLAN_PRICE_STUDIO`; the defaults are 29, 59 and 99 ₼.

## 2. Server (when hosting and the domain are ready)

Follow the production checklist in `backend/README.md`.

- [ ] DNS: `api.<domain>` for the API, `<domain>` for the website.
- [ ] PHP 8.3 with the GD extension, MySQL 8 or Postgres, Redis (recommended), HTTPS.
- [ ] Copy `backend/.env.example` to `.env` and set every production value.
  - `APP_ENV=production`, `APP_DEBUG=false`
  - mail, database
  - `GOOGLE_CLIENT_IDS`, `APPLE_CLIENT_IDS`
  - payment keys
- [ ] `php artisan migrate --force`, `php artisan storage:link`, a queue worker (supervisor) and a cron entry for `schedule:run`.
- [ ] Email: a sending service plus **SPF, DKIM and DMARC** on the domain, so codes don't land in spam.
- [ ] Create the demo account: `php artisan usta:create-user` (faiq.farid0604@gmail.com).
- [ ] Approve each new salon with `php artisan usta:approve-business <id>`.

## 3. Builds (EAS)

1. [ ] `npx eas-cli@latest login`, then `npx eas-cli@latest init`, then save the project ID as `EAS_PROJECT_ID`.
2. [ ] Environment variables, per environment (`npx eas-cli@latest env:create --environment production …`):
   - `EXPO_PUBLIC_API_URL=https://api.<domain>` (no `/api`; production builds refuse to start without it)
   - `EXPO_PUBLIC_SITE_URL=https://<domain>`, `EXPO_PUBLIC_SUPPORT_EMAIL=support@<domain>`
   - `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`
   - `GOOGLE_MAPS_ANDROID_KEY` (restrict it to the Android package and its SHA-1)
   - `GOOGLE_SERVICES_JSON`: a *file* variable holding `google-services.json` from Firebase, for Android push
3. [ ] Push credentials:
   - **iOS:** `eas credentials` creates the APNs key.
   - **Android:** upload the FCM V1 service-account key in the Expo dashboard.
4. [ ] Internal test builds:
   - `npx eas-cli@latest build --profile development --platform all` for a dev client on your phones.
   - `--profile preview` for testers: an APK, and an ad-hoc iOS build.
5. [ ] Store builds: `npx eas-cli@latest build --profile production --platform all`, then `npx eas-cli@latest submit --profile production`.
6. [ ] Later fixes that don't touch native code: `npx eas-cli@latest update --channel production`.

## 4. Sign in with Google / Apple

- [ ] **Google Cloud:**
  - Create OAuth client IDs:
    - iOS: the bundle ID
    - Android: the package plus the SHA-1 from `eas credentials`
    - Web
  - Verify the consent screen on your domain.
  - The same IDs go to the app (step 3) and the server (`GOOGLE_CLIENT_IDS`).
- [ ] **Apple:**
  - Turn on *Sign in with Apple* for the App ID.
  - Set the server's `APPLE_CLIENT_IDS` to the bundle ID.

## 5. Store listings

- [ ] **Website:** publish `docs/legal/privacy-policy.md` at `/privacy` and `docs/legal/terms.md` at `/terms`, after a lawyer has checked them. The app already links to both.
- [ ] **App Store Connect:**
  - Privacy details: name, email, phone, date of birth, gender, location (only while in use, not linked to the user), purchases (salons).
  - Age rating, support URL, privacy URL.
  - Screenshots: iPhone only, since iPad is turned off.
  - Give App Review the demo account. In the review notes, explain that salons pay outside the app and that iOS shows no price or buy button.
- [ ] **Google Play:**
  - Data safety form with the same answers.
  - The account-deletion URL. In-app deletion is at Profile → Delete account; the website also needs a deletion page or form.
  - Content rating, the 1024×500 feature graphic, screenshots.
  - Start on the internal track; `eas.json` submits there as a draft.

## 6. Before you press Publish

- [ ] Run the security check (codex-security) on the app and `backend/`.
- [ ] Test on real phones: sign-up email, Google/Apple sign-in, booking, push on both platforms, salon photo upload, and the payment round trip.
- [ ] Onboard the first real salons and approve them.
