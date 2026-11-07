yazılnow on cPanel: step by step
================================

This zip has three folders:

  public_html/        the website          → https://yazilnow.az
  app.yazilnow.az/    the app in a browser  → https://app.yazilnow.az  (salon panel, QR reviews)
  yazilnow-api/       the server            → https://api.yazilnow.az  (API + staff admin)

In the steps below, CPANELUSER is your cPanel username (shown top-right in cPanel).
It takes about 30 minutes.


1. Point the domain at the hosting
----------------------------------
At the company where you bought yazilnow.az, set the nameservers to the ones your
hosting gave you (in the welcome email). Wait until https://yazilnow.az shows the
host's default page. That can take a few hours.


2. PHP 8.3
----------
cPanel → MultiPHP Manager → tick yazilnow.az → PHP Version: PHP 8.3 → Apply.
cPanel → Select PHP Version (or "PHP Extensions"): make sure these are ticked:
  pdo_mysql, mbstring, intl, gd, fileinfo, exif, curl, zip, bcmath, openssl, tokenizer, xml


3. The two subdomains
---------------------
cPanel → Domains → Create A New Domain:
  a) Domain: app.yazilnow.az  → leave "Share document root" UNticked and accept the
     suggested document root  /public_html/app.yazilnow.az  → Submit
  b) Domain: api.yazilnow.az  → same: UNticked, accept  /public_html/api.yazilnow.az  → Submit
(This host keeps every domain inside public_html. Step 4 connects them to the right files.)


4. Upload
---------
cPanel → File Manager → your home folder (/home/CPANELUSER, NOT public_html) →
Upload this zip → right-click it → Extract.
  · Settings (top right) → tick "Show Hidden Files" (the .htaccess and .env files are hidden).
  · Extracting puts the website straight into your existing public_html. If the host
    left a default index.html or index.php there, delete it first.
  · The app.yazilnow.az and yazilnow-api folders end up next to public_html.

Then cPanel → Terminal, and paste these three lines (they move the app into its
subdomain folder, and link the API subdomain to the server's public folder, so the
server's code and passwords stay outside public_html):

  rm -rf ~/public_html/app.yazilnow.az && mv ~/app.yazilnow.az ~/public_html/app.yazilnow.az
  rm -rf ~/public_html/api.yazilnow.az && ln -s ~/yazilnow-api/public ~/public_html/api.yazilnow.az
  ls -la ~/public_html | grep yazilnow

The last line should show  app.yazilnow.az  as a folder and
api.yazilnow.az -> /home/CPANELUSER/yazilnow-api/public  as a link.
Delete the zip afterwards.


5. Database
-----------
cPanel → Manage My Databases (or "MySQL Database Wizard"):
  · Create a database named   yazilnow   → it becomes CPANELUSER_yazilnow
  · Create a user named       yazilnow   → CPANELUSER_yazilnow, with a strong password (save it)
  · Add the user to the database with ALL PRIVILEGES.


6. Email for sign-up codes
--------------------------
cPanel → Email Accounts → Create:  no-reply@yazilnow.az  with a strong password (save it).
Also create support@yazilnow.az (salons and clients write to it).
cPanel → Email Deliverability → yazilnow.az → "Repair" anything not green (SPF and DKIM).
Without this, codes land in spam.


7. Settings file
----------------
File Manager → yazilnow-api → .env → Edit. Change only these lines:
  DB_DATABASE=CPANELUSER_yazilnow
  DB_USERNAME=CPANELUSER_yazilnow
  DB_PASSWORD=the database password from step 5
  MAIL_PASSWORD=the no-reply mailbox password from step 6
Everything else is already filled in. APP_KEY is generated: never change or share it.
Payments are off (PAYMENTS_ENABLED=false) until a payment provider is connected.


8. Create the tables (once)
---------------------------
cPanel → Terminal (if you don't see it, ask the host to enable "SSH / Terminal access"):

  cd ~/yazilnow-api
  PHP=/opt/cpanel/ea-php83/root/usr/bin/php
  $PHP artisan migrate --force
  $PHP artisan storage:link
  $PHP artisan usta:create-admin

The last one creates YOUR staff login for https://api.yazilnow.az/admin. It asks for an
email, a name and a password, then prints a key: add it to Google Authenticator
(or any authenticator app). You'll need a code from that app every time you sign in.

No Terminal at all? cPanel → Cron Jobs → add, once, "Once Per Minute", the command
  cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan migrate --force && /opt/cpanel/ea-php83/root/usr/bin/php artisan storage:link
wait two minutes, then delete that cron job. (The staff login needs the Terminal.)


9. Cron jobs (keep these forever)
---------------------------------
cPanel → Cron Jobs → Common Settings: "Once Per Minute (* * * * *)". Add two jobs:

  cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan schedule:run >> /dev/null 2>&1

  cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan queue:work --max-time=55 --sleep=1 --tries=3 >> /dev/null 2>&1

The first sends reminders and handles trials. The second sends emails (sign-up codes)
within a few seconds.


10. HTTPS
---------
cPanel → SSL/TLS Status → tick yazilnow.az, www.yazilnow.az, app.yazilnow.az,
api.yazilnow.az → Run AutoSSL. Wait until all are green.


11. Check it works
------------------
  · https://api.yazilnow.az/up             → a page saying the application is up
  · https://yazilnow.az                    → the website
  · https://app.yazilnow.az/panel          → register a test salon; the code arrives by email
  · https://api.yazilnow.az/admin          → sign in (step 8), Salons → approve it
  · In the panel: Review QR → scan it with your phone → the review page opens

If something shows "500 Server Error": File Manager → yazilnow-api/storage/logs →
open the newest laravel-*.log and send me the last lines.

Backups: cPanel → Backup → download a full backup weekly, or turn on the host's
automatic backups (database + yazilnow-api/storage).


Updating later
--------------
Update zips contain no .env and no uploaded photos, so extracting them over the old
folders keeps your settings and salon photos. Never delete yazilnow-api/.env or
yazilnow-api/storage. Then in Terminal:
  cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan migrate --force
