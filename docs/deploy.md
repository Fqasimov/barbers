# Putting yazılnow online

You need three addresses on your domain. With `yazilnow.az`:

| Address | What it is | Comes from |
| --- | --- | --- |
| `https://yazilnow.az` | The website: landing page, salon map, `/help`, `/privacy`, `/terms` | `deploy/out/site` |
| `https://app.yazilnow.az` | The app in a browser: the **salon panel** (`/panel`), QR reviews (`/r/…`), salon pages (`/salon/…`) and the full client app | `deploy/out/app` |
| `https://api.yazilnow.az` | The server (Laravel): the API and the staff admin panel (`/admin`) | `backend/` |

The website forwards `yazilnow.az/r/<code>`, `/s/<salon>`, `/salon/<salon>` and `/panel` to the app address, so the QR codes salons print keep working whatever is installed. Once the phone apps are in the stores, the same links open the installed app instead (see "Phone apps open the links" below).

Two ways to host it. **A VPS is recommended:** the server needs a queue worker for emails, and shared hosting only approximates one.

---

## 1. DNS (at your domain registrar)

Point these at your server's IP address:

| Type | Name | Value |
| --- | --- | --- |
| A | `@` | your server IP |
| A | `www` | your server IP |
| A | `app` | your server IP |
| A | `api` | your server IP |

Email for `support@` and `no-reply@` comes from your mail provider. It gives you **MX, SPF (TXT), DKIM (TXT) and DMARC (TXT)** records; add all of them, or sign-up codes land in spam.

## 2. Build (on your computer, or on the server)

Needs Node.js 22 and this repository:

```bash
DOMAIN=yazilnow.az deploy/build.sh
```

This writes `deploy/out/site` and `deploy/out/app`, with `config.js` and `.htaccess` already pointing at your domain. Payments stay off (`PAYMENTS=off`) until a provider is connected. The script stops if the app bundle does not point at the real API.

---

## 3a. VPS (Ubuntu 24.04): recommended

Any VPS with 2 GB RAM works (Hetzner, DigitalOcean, a local Azerbaijani host).

```bash
# Software
sudo apt update && sudo apt install -y nginx mysql-server supervisor certbot python3-certbot-nginx unzip git \
  php8.3-fpm php8.3-cli php8.3-mysql php8.3-mbstring php8.3-xml php8.3-curl php8.3-gd php8.3-intl php8.3-zip php8.3-bcmath
curl -sS https://getcomposer.org/installer | sudo php -- --install-dir=/usr/local/bin --filename=composer

# Database
sudo mysql -e "CREATE DATABASE yazilnow CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  CREATE USER 'yazilnow'@'localhost' IDENTIFIED BY 'a-long-random-password';
  GRANT ALL ON yazilnow.* TO 'yazilnow'@'localhost';"

# Code
sudo mkdir -p /var/www/yazilnow && sudo chown $USER /var/www/yazilnow
git clone <your repository> /var/www/yazilnow/repo
cp -R /var/www/yazilnow/repo/backend /var/www/yazilnow/backend
# from your computer, after deploy/build.sh:
#   rsync -a deploy/out/site/ server:/var/www/yazilnow/site/
#   rsync -a deploy/out/app/  server:/var/www/yazilnow/app/

# API
cd /var/www/yazilnow/backend
cp /var/www/yazilnow/repo/deploy/backend.env.production .env   # then fill in every value marked ⟵
composer install --no-dev --optimize-autoloader
php artisan key:generate
php artisan migrate --force
php artisan storage:link
php artisan config:cache && php artisan route:cache && php artisan event:cache
sudo chown -R www-data:www-data storage bootstrap/cache
chmod 600 .env

# Web server and HTTPS
sudo cp /var/www/yazilnow/repo/deploy/nginx/yazilnow.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/yazilnow.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo certbot certonly --nginx -d yazilnow.az -d www.yazilnow.az -d app.yazilnow.az -d api.yazilnow.az
sudo nginx -t && sudo systemctl reload nginx

# Emails and pushes (queue) and the scheduler
sudo cp /var/www/yazilnow/repo/deploy/yazilnow-queue.conf /etc/supervisor/conf.d/
sudo supervisorctl reread && sudo supervisorctl update
sudo crontab -u www-data -e      # paste the first line of deploy/crontab.txt

# Firewall: only SSH and the web
sudo ufw allow OpenSSH && sudo ufw allow 'Nginx Full' && sudo ufw enable
```

If certbot can't start because nginx refuses the config without certificates, comment out the three `server { listen 443 … }` blocks, run certbot, then put them back.

**Updates later:** `git pull`, copy `backend/` again (keep `.env` and `storage/`), `composer install --no-dev -o`, `php artisan migrate --force`, `php artisan config:cache route:cache`, `sudo supervisorctl restart yazilnow-queue`. Re-run `deploy/build.sh` and upload `site/` and `app/` for website or app changes.

## 3b. Shared hosting (cPanel): what yazilnow.az uses

Nothing to install on your computer. One zip holds the website, the app, and the server with its dependencies and a production `.env`:

```bash
DOMAIN=yazilnow.az deploy/package-cpanel.sh          # → deploy/out/yazilnow-cpanel.zip
UPDATE=1 DOMAIN=yazilnow.az deploy/package-cpanel.sh # later updates: same zip without .env
```

Upload it in File Manager and extract it in your home folder. Then follow `README-FIRST.txt` inside it (also in [deploy/cpanel/README-FIRST.txt](../deploy/cpanel/README-FIRST.txt)):
1. Set PHP 8.3.
2. Create the subdomains (the API's document root is `yazilnow-api/public`).
3. Create the MySQL database and the `no-reply@` mailbox (cPanel's own mail server, with SPF/DKIM via Email Deliverability).
4. Fill in four lines of `.env`.
5. In Terminal, run `migrate` and `usta:create-admin`.
6. Add two cron jobs: the scheduler, and the queue worker, which sends emails within seconds.
7. Run AutoSSL.

---

## 4. First run checklist

- [ ] `https://api.yazilnow.az/up` answers 200.
- [ ] `https://yazilnow.az` shows the website, and the map shows real salons (or an empty state before you have any).
- [ ] **Sign-up works:** at `https://app.yazilnow.az/panel`, register a salon. The code arrives by email, not in spam.
- [ ] **Staff:** create staff with `php artisan usta:create-admin` and sign in at `https://api.yazilnow.az/admin`. Approve the salon there.
- [ ] **QR reviews:** in the panel, open Review QR and scan it with a phone. It opens the review page.
- [ ] **Security headers:** check `https://securityheaders.com/?q=yazilnow.az`. Expect an A grade.
- [ ] **Backups:** take a daily `mysqldump` of the database plus `backend/storage/app/public` (salon photos), kept off the server.

## 5. Phone apps open the links

When the iOS and Android apps are built (see [launch.md](launch.md)), re-run the build with:

```bash
DOMAIN=yazilnow.az APPLE_TEAM_ID=XXXXXXXXXX ANDROID_SHA256=AA:BB:…:FF deploy/build.sh
```

- `APPLE_TEAM_ID` comes from developer.apple.com → Membership.
- `ANDROID_SHA256` is the app signing certificate fingerprint, from Play Console → App integrity, or `eas credentials`.

This adds `/.well-known/apple-app-site-association` and `/.well-known/assetlinks.json` to the website, so a scanned QR opens the installed app straight away. The app side is already configured (`app.config.ts`).

## 6. Turning payments on later

1. Implement `backend/app/Payments/ProviderGateway.php` for your provider. The TODOs in it say exactly what goes where.
2. In `.env`, set `PAYMENTS_ENABLED=true` and the `PAYMENT_*` keys, then run `php artisan config:cache`.
3. Rebuild with `PAYMENTS=on deploy/build.sh` and upload `app/`. Rebuild the phone apps with `EXPO_PUBLIC_PAYMENTS` unset.
