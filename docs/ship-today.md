# Shipping yazılnow to the App Store and Google Play

Everything you can do **today**: build both apps, fill in both stores, submit. Approval itself is the stores' part:
- **Apple** usually reviews in 1–3 days.
- **Google** reviews in 1–7 days.
- **A personal Google Play developer account** created after November 2023 must first run a **closed test with at least 12 testers for 14 days** before it can publish to everyone. An **organisation** account (with a D-U-N-S number) skips this.

Run the builds from **your computer**, where the live code is. Start by pulling this branch (`git pull origin claude/usta-booking-app`) and merging it. It adds these store fixes:
- the app is called **yazılnow** on the phone's home screen in AZ/RU/EN; it said "Usta" before
- the permission pop-ups say yazılnow
- a Google button that can't sign in is hidden in store builds
- a new **`yazilnow.az/delete-account/`** page, which Google Play requires; upload it to `public_html/delete-account/`
- the store texts in `docs/store-listing.md` are rebranded and corrected

---

## 0. The server first (App Review uses the live site)

Apple and Google reviewers sign in and book for real. Before submitting:

- [ ] **Sign in with Apple:** in `~/yazilnow-api/.env`, set `APPLE_CLIENT_IDS=az.yazilnow.app`, then run `php artisan config:clear`. Without this, Apple sign-in fails during review, which means a rejection.
- [ ] **Google sign-in:** either set it up fully (§ 5) or leave it out. The store build hides the Google button when the app has no Google keys.
- [ ] **A review account:** in Terminal, `cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan usta:create-user`. Use an email like `review@yazilnow.az` with a strong password. You'll paste these into both stores.
- [ ] **At least one live salon**, approved in `/admin`, with services, masters, hours and photos, so reviewers can actually book. Your demo "Faiq Barbershop" works.
- [ ] **Email works:** a test sign-up code arrives. Reviewers will sign up.
- [ ] **Upload `delete-account/`** from `web/public/` to `public_html/delete-account/`, then check that `https://yazilnow.az/delete-account/` opens.

## 1. Once: Expo account and project

```bash
npm install
npx eas-cli@latest login            # your expo.dev account
npx eas-cli@latest init             # creates the "yazilnow" project, prints an ID
```

Put the ID in `app.json` under `"expo"`: `"extra": { "eas": { "projectId": "…" } }`. Commit it.

Every build profile in `eas.json` already points the app at `https://yazilnow.az` with payments off.

## 2. Android

**Before the store build:** the map screen on Android needs a Google Maps key. iPhone uses Apple Maps and needs none.
1. In Google Cloud Console → APIs → enable **Maps SDK for Android** → Credentials → create an API key.
2. Restrict the key to Android apps, package `az.yazilnow.app`, and the SHA-1 shown by `npx eas-cli credentials -p android` (run it after the first build).
3. Save the key, then build:
   ```bash
   npx eas-cli@latest env:create --environment production --name GOOGLE_MAPS_ANDROID_KEY --value <key> --visibility sensitive
   npx eas-cli@latest build -p android --profile production
   ```
   EAS creates the signing key on the first build; answer **Yes**. It produces an `.aab` file.

**Play Console** (play.google.com/console):
1. **Create app:** name `yazılnow: Bərbər və Salon`, default language Azerbaijani, App, Free.
2. **Store listing:** texts from `docs/store-listing.md`, the 512×512 icon (`assets/images/icon.png` resized), the 1024×500 feature graphic, and at least 2 phone screenshots.
3. **App content:**
   - **Privacy policy:** `https://yazilnow.az/privacy/`
   - **App access:** "All or some functionality is restricted", plus the review account email and password.
   - **Ads:** No.
   - **Content rating:** fill the questionnaire. No violence and so on, so the rating comes out "Everyone".
   - **Target audience:** 18+.
   - **Data safety:** collects name, email, phone, date of birth, gender, approximate location (in use only, not shared), photos (salons only) and app interactions. Data is encrypted in transit, and users can request deletion.
   - **Data deletion URL:** `https://yazilnow.az/delete-account/`
4. **Testing → Internal testing → Create release:** upload the `.aab` and add your own email as a tester. Install it from the opt-in link and check it works.
5. **Personal account:** move to **Closed testing**, add 12+ testers (friends, partner salons), and keep it running for 14 days. Then apply for **Production**.
   **Organisation account:** go straight to **Production → Create release**.

Later releases: `npx eas-cli@latest build -p android --profile production`, then `npx eas-cli@latest submit -p android --latest`. That needs a Google service-account key in the Expo dashboard. The first `.aab` must be uploaded by hand.

## 3. iPhone

```bash
npx eas-cli@latest build -p ios --profile production     # asks for your Apple ID; answer Yes to create certificates and the push key
npx eas-cli@latest submit -p ios --latest                # creates the app in App Store Connect and uploads the build
```

**App Store Connect** (appstoreconnect.apple.com) → My Apps → yazılnow:
1. **App information:** subtitle and category (Lifestyle) from `docs/store-listing.md`, and privacy URL `https://yazilnow.az/privacy/`.
2. **Pricing:** Free. **Availability:** Azerbaijan, or all countries.
3. **App Privacy:** same answers as Google's Data safety. Data linked to the user: name, email, phone, date of birth, gender. Location is not linked. **No tracking.**
4. **Version 1.0:** screenshots for **6.9"** (1320×2868) and **6.5"** (1284×2778) iPhones, the description, keywords, support URL `https://yazilnow.az/help/`, and the build.
5. **App Review information:** the review account email and password, plus this note:
   > yazılnow lists barbershops and salons in Baku. Clients book for free; salons subscribe outside the app. On iOS the app shows plan status only, with no prices or purchase. Sign in with the account above; the salon "Faiq Barbershop" can be booked.
6. **Age rating:** fill the questionnaire; it comes out 4+.
7. Click **Add for Review**, then **Submit**.

Already set in the code:
- export compliance ("no non-exempt encryption")
- iPhone only, no iPad
- Sign in with Apple
- account deletion in the app (Profile → Delete account), which Apple requires

## 4. After approval

- Put the store links in the website's `public_html/config.js` (`appStoreUrl`, `playStoreUrl`). The "Coming soon" buttons become download buttons.
- For QR codes to open the installed app, re-run the website build with `APPLE_TEAM_ID` and `ANDROID_SHA256`, and upload `public_html/.well-known/` (`docs/deploy.md` § 5).
- To ship fixes to screens or texts without a store review: `npx eas-cli@latest update --channel production`.

## 5. Google sign-in (optional, can come later)

1. In Google Cloud Console → Credentials, create OAuth clients:
   - **iOS:** bundle `az.yazilnow.app`
   - **Android:** package `az.yazilnow.app` plus the SHA-1 from `eas credentials`
   - **Web**
2. Save them in EAS (`env:create`, production): `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID`, `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.
3. On the server, set `GOOGLE_CLIENT_IDS=<ios id>,<android id>,<web id>`.
4. Rebuild the apps.
