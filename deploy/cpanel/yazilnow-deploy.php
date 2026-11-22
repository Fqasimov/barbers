<?php

/**
 * Unpacks a deploy that GitHub uploaded as one zip, then runs the database migrations.
 *
 * The deploy workflow uploads this file to ~/public_html/yazilnow-deploy.php and the build to
 * ~/yazilnow-deploy.zip (one file: uploading thousands of small files made the host drop the
 * connection), then POSTs here with the X-Deploy-Key header.
 *
 * The key must match DEPLOY_KEY in ~/yazilnow-api/.env. Without it every request gets a 404.
 * The zip never holds .env, photos or logs, so those stay as they are.
 */

declare(strict_types=1);

$home = dirname(__DIR__);
$zipPath = $home.'/yazilnow-deploy.zip';
$api = $home.'/yazilnow-api';

function deploy_fail(int $code, string $message): never
{
    http_response_code($code);
    header('Content-Type: text/plain; charset=utf-8');
    echo $message, "\n";
    exit;
}

function deploy_key(string $envFile): string
{
    if (! is_readable($envFile)) {
        return '';
    }
    foreach (file($envFile, FILE_IGNORE_NEW_LINES) ?: [] as $line) {
        if (preg_match('/^\s*DEPLOY_KEY\s*=\s*(.*)$/', $line, $m)) {
            return trim(trim($m[1]), "\"'");
        }
    }

    return '';
}

$key = deploy_key($api.'/.env');
$given = (string) ($_SERVER['HTTP_X_DEPLOY_KEY'] ?? '');
if ($_SERVER['REQUEST_METHOD'] !== 'POST' || strlen($key) < 32 || ! hash_equals($key, $given)) {
    deploy_fail(404, 'Not found');
}

set_time_limit(0);
ignore_user_abort(true);
header('Content-Type: text/plain; charset=utf-8');

if (! is_file($zipPath)) {
    deploy_fail(400, 'No upload at ~/yazilnow-deploy.zip');
}
if (! class_exists(ZipArchive::class)) {
    deploy_fail(500, 'PHP has no zip extension');
}

$zip = new ZipArchive;
if ($zip->open($zipPath) !== true) {
    deploy_fail(500, 'The upload is not a readable zip');
}
// Only the two folders the deploy owns; anything else in the zip is ignored.
$names = [];
for ($i = 0; $i < $zip->numFiles; $i++) {
    $name = (string) $zip->getNameIndex($i);
    if (str_contains($name, '..')) {
        continue;
    }
    if (str_starts_with($name, 'public_html/') || str_starts_with($name, 'yazilnow-api/')) {
        $names[] = $name;
    }
}
if (! $zip->extractTo($home, $names)) {
    deploy_fail(500, 'Unpacking failed');
}
$zip->close();
@unlink($zipPath);
// Left by the file-by-file uploads this replaced.
@unlink($home.'/public_html/.ftp-deploy-sync-state.json');
@unlink($api.'/.ftp-deploy-sync-state.json');
echo 'Unpacked ', count($names), " files\n";

if (function_exists('opcache_reset')) {
    @opcache_reset();
}

// Migrations and a cache clear, in this process: no shell needed.
chdir($api);
require $api.'/vendor/autoload.php';
$app = require $api.'/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$output = new Symfony\Component\Console\Output\BufferedOutput;
$status = $kernel->call('migrate', ['--force' => true], $output);
$kernel->call('optimize:clear', [], $output);
echo $output->fetch();

if ($status !== 0) {
    deploy_fail(500, 'Migrations failed');
}
echo "OK\n";
