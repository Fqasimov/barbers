# Building the iPhone and Android apps

The builds run on Expo's servers (EAS) under your Expo account, started from your computer.

What is already set in the repository:
- **App ID:** `az.yazilnow.app` on both platforms.
- **Name:** yazılnow.
- **Server:** every build profile in `eas.json` uses `https://yazilnow.az`, with payments off.
- **QR links:** they open the app (`app.config.ts`).

You need:
- Node 22
- The repo pulled (`git pull`), then `npm install`
- An Expo account (expo.dev)
- An Apple Developer account
- A Google Play Console account

## 1. Once: connect the project to your Expo account

```bash
npx eas-cli@latest login          # your Expo account
npx eas-cli@latest init           # creates the "yazilnow" project and prints its ID
```

`app.config.ts` is dynamic, so `init` can't write the ID itself. Copy the printed ID into `app.json` under `"expo"`:

```json
"extra": { "eas": { "projectId": "PASTE-THE-ID" } }
```

Commit that change; it isn't a secret.

## 2. Test before publishing

**Fastest: Expo Go** (no build).

```bash
EXPO_PUBLIC_API_URL=https://yazilnow.az EXPO_PUBLIC_SITE_URL=https://yazilnow.az EXPO_PUBLIC_PAYMENTS=off npx expo start
```

Scan the QR code with the Expo Go app; it must match SDK 57. This tests the screens against the live server. Push notifications and Google/Apple sign-in don't work in Expo Go.

**A real test build:** the same app people will download.

- **Android.** Build an APK you install directly from the link EAS gives you:
  ```bash
  npx eas-cli@latest build -p android --profile preview
  ```
  EAS creates the Android signing key the first time; answer **Yes**.
- **iPhone.** Go through TestFlight; it's the easiest way to test on your phone and your team's:
  ```bash
  npx eas-cli@latest build -p ios --profile production
  npx eas-cli@latest submit -p ios --latest
  ```
  1. EAS asks for your Apple ID login and creates the certificates; answer **Yes** to each.
  2. `submit` creates the app in App Store Connect and uploads it.
  3. After about 15–30 minutes of processing, add testers in App Store Connect → TestFlight.

## 3. Publish

**iPhone:**
1. Use the TestFlight build above.
2. In App Store Connect, fill in the listing. The texts are in `docs/store-listing.md`, the privacy answers in `docs/launch.md` § 5.
3. Add the review account: `usta:create-user` on the server creates one.
4. Choose the build, then Submit for Review.

**Android:**
1. Build the store bundle:
   ```bash
   npx eas-cli@latest build -p android --profile production   # .aab for the store
   ```
2. **The first upload to Google Play must be manual:**
   1. In Play Console, create the app.
   2. Go to Testing → Internal testing → Create release.
   3. Upload the `.aab` downloaded from the EAS build page.
3. Later releases can use `npx eas-cli@latest submit -p android --latest`. That needs a Google service-account key; see Expo's "Submit to Google Play" guide.

## Before the store builds (Android map and push)

- **Google Maps on Android.** Without a key, the map screen is blank on Android; iPhone uses Apple Maps and needs no key.
  1. In Google Cloud Console, create a "Maps SDK for Android" key.
  2. Restrict it to package `az.yazilnow.app` and the SHA-1 shown by `npx eas-cli credentials -p android`.
  3. Save it, then rebuild:
     ```bash
     npx eas-cli@latest env:create --environment production --name GOOGLE_MAPS_ANDROID_KEY --value <key> --visibility sensitive
     ```
     Repeat with `--environment preview` for test APKs.
- **Push notifications on Android:**
  1. In Firebase, add an Android app with package `az.yazilnow.app` and download `google-services.json`.
  2. Run `npx eas-cli@latest env:create --environment production --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json`.
  3. Upload the FCM V1 service-account key in the Expo dashboard → Credentials.
- **Push notifications on iPhone:** EAS sets up the push key during the first iOS build. Say yes when asked.
- **Universal links.** These let a scanned QR open the installed app. After the first builds, re-run the website build with `APPLE_TEAM_ID` (developer.apple.com → Membership) and `ANDROID_SHA256` (from `eas credentials`), and upload `public_html/.well-known/`. See `docs/deploy.md` § 5.

## Updates later

- Changes to screens or texts only (no new native library) go out without store review:
  ```bash
  npx eas-cli@latest update --channel production
  ```
  This works once the project ID is in `app.json` (step 1).
- Anything else needs a new build and a store release. Version numbers go up automatically (`autoIncrement` in `eas.json`).
