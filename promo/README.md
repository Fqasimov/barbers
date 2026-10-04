# Usta promo (Remotion)

A 9:16, 1080×1920, 30 fps promo with Azerbaijani captions. Everything inside the phone is a **real recording of the app**: real animations, taps, data and transitions.

```console
npm i
npm run dev                                  # Remotion Studio
npx remotion render Promo out/usta-promo.mp4
```

## Storyboard

1. **Opener.** The 3D steel shears snip twice on linen. On the third snip, the *usta* wordmark is cut.
2. **The phone rises**, a titanium phone with a contact shadow and a slow camera turn. Each beat has a caption above the phone:
   - *Bakının ən yaxşı ustaları.*: Discover, scrolling.
   - *Boş vaxtı bütün şəhərdə tap.*: Find a free slot (tomorrow, morning).
   - *Xidmət, usta, vaxt.*: the venue, then **Book** (the sheet covers it), then two services, Rauf, Wednesday 15:30, confirmed.
   - *Büdcənə uyğun, sənə yaxın.*: the map, with a price range and nearest first.
   - *Yan-yana müqayisə et.*: three barbershops compared.
   - *Rəy yalnız real ziyarətdən sonra.*: a past visit, then a verified review.
3. **Outro.** The shears snip, the wordmark is cut, then *Ustanı seç. Vaxtını tut.*

There's a light film grain and vignette over everything, so the video reads as footage rather than a vector animation.

## How the recordings are made

`scripts/record.js` drives the Expo web build in Chromium with Playwright and **fakes the page clock**. Each captured frame advances time by exactly 1/30 s, so Reanimated transitions, press feedback and scrolling play back at true speed with no dropped frames. It also gives the page real iPhone safe-area insets (47 pt top, 34 pt bottom), so the phone frame's status bar and home indicator sit where iOS puts them. Every tap is logged and drawn as an iOS-style touch circle.

```console
# from the repo root, with `npx expo start --web --port 8081` running
node promo/scripts/record.js /tmp/rec home find salon book map compare past review
# then, per take:
npx remotion ffmpeg -framerate 30 -i /tmp/rec/home/%04d.jpg -c:v libx264 -crf 17 -pix_fmt yuv420p public/rec/home.mp4
cp /tmp/rec/home/events.json public/rec/home.json
```

The shears frames in `public/shears/` come from `../tools/shears`.
