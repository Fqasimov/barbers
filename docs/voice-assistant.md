# Voice assistant add-on (ElevenLabs)

An optional paid add-on for barbershops on Fərdi, Start or Pro. When the barber doesn't pick up, the call forwards to an ElevenLabs agent. The agent:
1. greets the caller in the barbershop's name;
2. asks for the service, the day and the time;
3. checks the time on yazılnow;
4. says whether it's free, or offers the nearest free times;
5. asks the caller to **press 1** to confirm;
6. books the visit.

The booking lands in the barber's calendar like any other, marked "Səsli köməkçi ilə telefonla bron".

## 1. Server

1. **Merge and migrate.** Merge this branch, then run `php artisan migrate --force`. This adds the voice columns on `businesses` and the `voice_calls` table.
2. **Set the secret.** In `~/yazilnow-api/.env`, set a long random secret (for example from `openssl rand -hex 32`), then run `php artisan config:clear`:
   ```
   VOICE_TOOL_SECRET=<long random string>
   ```
3. **Turn it on for a barbershop** once it has paid for a pack:
   ```bash
   php artisan usta:voice <salon id> --minutes=100 --agent=<ElevenLabs agent id> --days=30
   php artisan usta:voice <salon id> --off
   ```
   `--minutes` takes 100, 250 or 500, and the command prints the barbershop's tool addresses.

## Packs, extra minutes and the cap

| Pack | Price a month | Stops at (the 1.5× cap) |
| --- | --- | --- |
| 100 min | 39 ₼ | 150 min |
| 250 min | 89 ₼ | 375 min |
| 500 min | 169 ₼ | 750 min |

- **Counting.** Each barbershop's minutes are counted from ElevenLabs' report after every call; all its branches share one count.
- **Extra minutes.** Past the pack, the assistant keeps going. Each extra minute costs **0.35 ₼**, billed at the month's end.
- **The cap.** At 1.5× the pack, the assistant stops booking: it tells the caller the barber will call back.
- **New month.** The count starts from zero on the 1st (Baku time).
- **Dashboard.** The barbershop sees this month's minutes, any extra minutes and what they cost.

Prices are in `config/usta.php` → `voice.packs`. The extra-minute price is `VOICE_EXTRA_PRICE` in `.env`.

**The month's bill:**
```bash
php artisan usta:voice-report                  # this month
php artisan usta:voice-report --month=2026-11
```
It lists each barbershop's pack, minutes used, extra minutes, extra ₼ and total to charge.

**Post-call webhook.** This is what counts the minutes. In ElevenLabs → Agents settings → Webhooks (post-call), set the URL to:
```
https://yazilnow.az/api/voice/calls?secret=<VOICE_TOOL_SECRET>
```
The salon is found by its agent id, so give each barbershop its own agent and register it with `--agent`. Also set a monthly **spending limit** on your ElevenLabs account.

## 2. The agent in ElevenLabs (one per barbershop)

Agents → **Create agent**:
- **Language:** Azerbaijani.
- **Voice:** a natural Azerbaijani-speaking voice.
- **First message:** `Salam! {Barbershop name}, yazılnow səsli köməkçisi danışır. Hansı xidmət və hansı vaxt üçün yazılmaq istəyirsiniz?`
- **System prompt:**
  ```
  Sən {Barbershop name} bərbərxanasının səsli köməkçisisən. Qısa, nəzakətli, Azərbaycan dilində danış.
  Zəngin əvvəlində get_salon_info alətini çağır: xidmətləri, ustaları və iş saatlarını oradan bil.
  Müştəridən xidməti, günü və saatı soruş (istəsə, ustanı da). "Sabah", "cümə" kimi günləri bu günün
  tarixinə görə YYYY-MM-DD formatına çevir; saatı HH:MM formatında ver.
  check_time alətini çağır. Cavabdakı "say" mətnini müştəriyə oxu.
  Vaxt boşdursa, müştərinin adını soruş və təsdiq üçün telefonda 1 düyməsini basmağını xahiş et.
  Müştəri 1-i basandan sonra book_time alətini confirm_digit = "1" ilə çağır və cavabdakı "say"-ı oxu.
  Vaxt dolu olsa, təklif olunan vaxtları de və yenisini soruş.
  Qiymət, ünvan və iş saatı suallarına get_salon_info məlumatı ilə cavab ver. Bilmədiyin şeyi uydurma:
  "Usta sizə geri zəng edəcək" de.
  Zəngin əvvəlində özünü səsli köməkçi kimi təqdim et.
  ```

**Tools** (Tools → Add tool → **Webhook**). All three:
- **Method:** POST
- **Header:** `X-Voice-Secret: <the secret from .env>` (save it as a secret in ElevenLabs)

| Name | URL | Body parameters |
| --- | --- | --- |
| `get_salon_info` | `https://yazilnow.az/api/voice/<salon id>/info` | none |
| `check_time` | `https://yazilnow.az/api/voice/<salon id>/check` | `service` (string, service name as the caller said it), `date` (YYYY-MM-DD), `time` (HH:MM), `master` (string, optional) |
| `book_time` | `https://yazilnow.az/api/voice/<salon id>/book` | the same four, plus `client_name` (string), `caller_phone` (string, the caller's number), `confirm_digit` (string, the key the caller pressed) |

**Caller's number:** set `caller_phone` to the call's caller-id system variable, so the barber can call back.

**Pressing 1:** the server books only when `confirm_digit` is `"1"`. In the agent settings, turn on keypad (DTMF) input for phone calls if your ElevenLabs plan and phone setup offer it, then test it on a real call. If keypad presses don't reach the agent, change the prompt so the caller says "bir" or "bəli" instead, and the agent sends `"1"` after hearing it.

## 3. Phone number and forwarding

1. **Connect a number.** In ElevenLabs → Phone numbers, connect a number through Twilio or a SIP trunk from a local operator. Ask Azercell, Bakcell or Nar about SIP.
2. **Forward missed calls.** The barbershop keeps its own number and turns on **call forwarding when unanswered** to the agent's number.

## 4. Costs

- **ElevenLabs:** pay as you go, about $0.083 a minute (voice $0.08 + Gemini 2.5 Flash $0.0029).
- **SIP line:** about 0.02 ₼ a minute plus about 2 ₼ a month per number (ask the operator).

At those rates each pack keeps about 50% profit, and extra minutes at 0.35 ₼ keep about 54%.
