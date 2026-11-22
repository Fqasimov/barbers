<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;

/**
 * Called by the GitHub deploy workflow right after it uploads new code: runs the database
 * migrations and clears the caches, the two things FTP cannot do.
 * Off (404) unless DEPLOY_KEY is set; the key goes in the X-Deploy-Key header.
 */
class DeployController extends Controller
{
    public function __invoke(Request $request): JsonResponse
    {
        $key = (string) config('app.deploy_key');
        abort_if(strlen($key) < 32, 404);
        abort_unless(hash_equals($key, (string) $request->header('X-Deploy-Key')), 404);

        Artisan::call('migrate', ['--force' => true]);
        $migrate = Artisan::output();
        Artisan::call('optimize:clear');

        return response()->json(['ok' => true, 'migrate' => trim($migrate)]);
    }
}
