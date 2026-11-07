yazılnow on cPanel: step by step (one domain, no subdomains)
============================================================

Everything runs on yazilnow.az:

  https://yazilnow.az            the website
  https://yazilnow.az/app        the app in a browser: salon panel (/app/panel), QR reviews, client app
  https://yazilnow.az/api        the server (the app talks to it)
  https://yazilnow.az/admin      the staff admin panel

This zip has two folders:

  public_html/      the website and the app (public files)
  yazilnow-api/     the server: code and settings, kept OUTSIDE public_html so nobody can download them

In the steps below, CPANELUSER is your cPanel username (yazilmaf on your account).
You do NOT need any subdomains.


1. PHP 8.3            (done)
------------------
Also check cPanel → Select PHP Version → Extensions. These must be ticked:
  pdo_mysql, mbstring, intl, gd, fileinfo, exif, curl, zip, bcmath, openssl, tokenizer, xml


2. Upload
---------
cPanel → File Manager → Settings (top right) → tick "Show Hidden Files" → Save.
Open your home folder (/home/CPANELUSER, the folder that CONTAINS public_html).
If public_html has a default index.html or index.php from the host, delete it.
Upload this zip into the home folder → right-click it → Extract → Extract Files.
The website goes straight into public_html, and yazilnow-api appears next to it.
Delete the zip afterwards.


3. Connect the server (once)
----------------------------
cPanel → Terminal. Paste this line and press Enter:

  ln -s ~/yazilnow-api/public ~/public_html/server && ls -la ~/public_html | grep server

It should print:  server -> /home/CPANELUSER/yazilnow-api/public
(If you don't see Terminal in cPanel, ask Hostinq support to enable "Terminal / SSH access".)


4. Database
-----------
cPanel → Manage My Databases (or "MySQL Database Wizard"):
  · Create a database named   yazilnow   → it becomes CPANELUSER_yazilnow
  · Create a user named       yazilnow   → CPANELUSER_yazilnow, with a strong password (save it)
  · Add the user to the database with ALL PRIVILEGES.


5. Email for sign-up codes
--------------------------
cPanel → Email Accounts → Create:  no-reply@yazilnow.az  with a strong password (save it).
Also create support@yazilnow.az (salons and clients write to it).
cPanel → Email Deliverability → yazilnow.az → "Repair" anything not green (SPF and DKIM).
Without this, codes land in spam.


6. Settings file
----------------
File Manager → yazilnow-api → .env → right-click → Edit. Change only these lines:
  DB_DATABASE=CPANELUSER_yazilnow
  DB_USERNAME=CPANELUSER_yazilnow
  DB_PASSWORD=the database password from step 4
  MAIL_PASSWORD=the no-reply mailbox password from step 5
Everything else is already filled in. APP_KEY is generated: never change or share it.
Payments are off (PAYMENTS_ENABLED=false) until a payment provider is connected.


7. Create the tables and your staff login (once)
------------------------------------------------
cPanel → Terminal:

  cd ~/yazilnow-api
  PHP=/opt/cpanel/ea-php83/root/usr/bin/php
  $PHP artisan migrate --force
  $PHP artisan storage:link
  $PHP artisan usta:create-admin

The last one creates YOUR staff login for https://yazilnow.az/admin. It asks for an
email, a name and a password (12+ characters), then prints a key: add it to Google
Authenticator (or any authenticator app). You'll need a code from it every time you sign in.
If "migrate" asks "Do you really wish to run this command?", type yes.


8. Cron jobs (keep these forever)
---------------------------------
cPanel → Cron Jobs → Common Settings: "Once Per Minute (* * * * *)". Add two jobs:

  cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan schedule:run >> /dev/null 2>&1

  cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan queue:work --max-time=55 --sleep=1 --tries=3 >> /dev/null 2>&1

The first sends reminders and handles trials. The second sends emails (sign-up codes)
within a few seconds.


9. HTTPS
--------
cPanel → SSL/TLS Status → tick yazilnow.az and www.yazilnow.az → Run AutoSSL.
Wait until both are green. Then cPanel → Domains → Force HTTPS Redirect → On.


10. Check it works
------------------
  · https://yazilnow.az/up           → a page saying the application is up
  · https://yazilnow.az              → the website
  · https://yazilnow.az/app/panel    → register a test salon; the code arrives by email
  · https://yazilnow.az/admin        → sign in (step 7), Salons → approve it
  · In the panel: Review QR → scan it with your phone → the review page opens

If something shows "500 Server Error": File Manager → yazilnow-api/storage/logs →
open the newest laravel-*.log and send the last lines.

Backups: cPanel → Backup → download a full backup weekly, or turn on the host's
automatic backups (database + yazilnow-api/storage).


Updating later
--------------
Update zips contain no .env and no uploaded photos, so extracting them over the old
folders keeps your settings and salon photos. Never delete yazilnow-api/.env,
yazilnow-api/storage or the public_html/server link. Then in Terminal:
  cd ~/yazilnow-api && /opt/cpanel/ea-php83/root/usr/bin/php artisan migrate --force
