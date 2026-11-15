<?php

namespace App\Console\Commands;

use App\Support\Traffic;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

/**
 * Reads new lines of the web server's access log into the admin's Traffic page. Remembers how
 * far it got; starts over when the log is rotated. Old visitor hashes are removed after 60 days.
 */
class IngestTraffic extends Command
{
    protected $signature = 'usta:ingest-traffic {--file= : Access log to read (default: config usta.traffic_log)}';

    protected $description = 'Read website visits and suspicious requests from the access log';

    public function handle(): int
    {
        $file = $this->option('file') ?: (string) config('usta.traffic_log');
        if ($file === '' || ! is_readable($file)) {
            $this->warn("No readable access log at {$file}.");

            return self::SUCCESS;
        }

        $state = storage_path('app/traffic-offset.json');
        $saved = is_file($state) ? (array) json_decode((string) file_get_contents($state), true) : [];
        $size = filesize($file) ?: 0;
        $inode = fileinode($file) ?: 0;
        $offset = ($saved['inode'] ?? null) === $inode && ($saved['offset'] ?? 0) <= $size ? (int) $saved['offset'] : 0;

        $traffic = new Traffic;
        $h = fopen($file, 'r');
        fseek($h, $offset);
        $n = 0;
        while (($line = fgets($h)) !== false) {
            if (! str_ends_with($line, "\n")) {
                break; // Still being written; read it next time.
            }
            $offset += strlen($line);
            $traffic->line($line);
            if (++$n % 5000 === 0) {
                $traffic->save();
            }
        }
        fclose($h);
        $traffic->save();
        file_put_contents($state, json_encode(['inode' => $inode, 'offset' => $offset]));

        $cutoff = now('Asia/Baku')->subDays(60)->toDateString();
        DB::table('traffic_visitors')->where('day', '<', $cutoff)->delete();
        DB::table('traffic_counts')->where('day', '<', $cutoff)->delete();
        // Ordinary addresses that stopped being suspicious long ago aren't kept forever.
        DB::table('traffic_ips')->where('last_seen', '<', now()->subDays(90))->delete();
        $this->info("Read {$n} lines.");

        return self::SUCCESS;
    }
}
