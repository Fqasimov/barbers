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

---

# Salon owners ad (`SalonAd`)

A 51-second 9:16 ad aimed at barbershop, beauty salon and spa owners, in Azerbaijani.

```console
npx remotion render SalonAd out/usta-salon-ad.mp4
```

## Storyboard

| Time | Scene | On screen |
| --- | --- | --- |
| 0:00 | **Address** (dark) | *DƏYƏRLİ bərbərxana, gözəllik salonu və SPA klinika sahibləri,*. Each line lands with a heavy hit. |
| 0:05 | **Rivals** | Four booking-app icons on the left; *Onlayn rezervasiya xidmətlərindən istifadə edirdiniz?*. Then *Siz hər biriniz* — the icons crack — *aldadılmısınız.* and they shatter like glass. |
| 0:13 | **The bill** | *Hər əlavə usta, bərbər, işçi üçün əlavə ödəniş.* A receipt prints a charge for every new hire while the total climbs, then *Xidmətinizin qiyməti isə hər dəfə artırılırdı.* |
| 0:20 | **The cut** | Steel shears cross the frame and cut the bill in two. The halves fall away and open onto the brand. |
| 0:21 | **Reveal** (linen) | The *usta* wordmark is cut, *ustatap.az*, *Mobil tətbiqimiz və xidmətimiz bu problemi aradan qaldırır.* |
| 0:26 | **Team** | *Əlavə usta — əlavə ödəniş yox.* Twelve masters join one by one, each *+0 ₼*; the team count rises, the extra charge stays 0 ₼. |
| 0:32 | **Growth** | *Böyümək istəyirsiniz? Onlayn rezervasiya buna əngəl yox — artımınızın mühərriki olacaq.* A growth curve draws behind a phone playing a real recording: picking a plan and starting the free trial. |
| 0:39 | **Features** | *Müştərilər sizi tapır.* Map and search, 24/7 booking, reviews only after real visits. |
| 0:44 | **Call to action** | *30 gün pulsuz.* No card, cancel any time, *Salonunuzu qeydiyyatdan keçirin*, the wordmark, *ustatap.az*. |

Scene timings and every sound cue live in `src/ad/timeline.ts` and `src/ad/sound.tsx`.

## Sound

- **Effects** (heavy hits, glass shatter, till rings, shears, whooshes, pops, a low drone under the problem half) are synthesized by `scripts/sfx.py` into `public/sfx/`, so the project has no third-party audio. Regenerate with `python3 scripts/sfx.py public/sfx`.
- **Music** isn't included. Put a licensed track at `public/audio/music.mp3` and render again: it plays quietly under the dark half and swells when the brand appears. Change where the song starts with `MUSIC_START_SEC` in `src/ad/sound.tsx`.
- **Voice-over** is optional: `public/audio/voiceover.mp3` plays from 0:00, and the music ducks under it. The script, with timings, is below.

## Voice-over script

Deep, slow and serious until 0:20; warm and confident after the cut.

| Start | Line |
| --- | --- |
| 0:00 | Dəyərli bərbərxana, gözəllik salonu və SPA klinika sahibləri… |
| 0:05 | Onlayn rezervasiya xidmətlərindən istifadə edirdiniz? |
| 0:08 | Siz hər biriniz… aldadılmısınız. |
| 0:13 | Hər əlavə usta, bərbər, işçi üçün sizdən əlavə ödəniş alınırdı. Xidmətinizin qiyməti isə hər dəfə artırılırdı. |
| 0:21 | Usta tap — ustatap.az. Mobil tətbiqimiz və xidmətimiz bu problemi aradan qaldırır. |
| 0:26 | Əlavə usta — əlavə ödəniş yox. Bir qiymət, bütün komanda daxildir. |
| 0:32 | Böyümək istəyirsiniz? Onlayn rezervasiya artıq buna əngəl yox, artımınızın mühərriki olacaq. |
| 0:39 | Müştərilər sizi xəritədə tapır, 7/24 növbə tutur, rəyləri isə yalnız real ziyarətdən sonra yazılır. |
| 0:44 | İlk 30 gün pulsuz. Salonunuzu bu gün qeydiyyatdan keçirin. ustatap.az |

## Before it runs

- **Competitor logos.** The shattering icons are unbranded on purpose. Showing real competitors' logos next to "you were deceived" is a trademark and unfair-advertising risk; swap them in only with legal sign-off (`RIVALS` in `src/ad/SalonAd.tsx`).
- **The bill** is illustrative (49 ₼ plus 15 ₼ per hire), not any company's price list.
